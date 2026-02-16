# Agent 4 — Infrastructure & DevOps

> **Focus:** cloud-init, Docker, CI/CD, Monitoring  
> **Branch Prefix:** `feature/infra-*`  
> **Location:** `scripts/`, `.github/`, `docker-compose.yml`  
> **Can Start:** Immediately ✅  
> **Peak:** Weeks 3-6

---

## Setup Commands

```bash
# Install tools
brew install hcloud ansible docker-compose
npm install -g pm2

# Setup Hetzner CLI
hcloud context create production

# Docker setup (if not installed)
curl -fsSL https://get.docker.com | sh
```

---

## Task List

### Phase 1: Week 1-2 — cloud-init Provisioning

#### Task 4.1: cloud-init.yaml Template

**Branch:** `feature/infra-cloud-init`

```yaml
# scripts/cloud-init.yaml
#cloud-config

hostname: openclaw-{{SUBDOMAIN}}
manage_etc_hosts: true

users:
  - name: openclaw
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    home: /home/openclaw
    ssh_authorized_keys:
      - {{SSH_PUBLIC_KEY}}

packages:
  - curl
  - wget
  - git
  - nginx
  - ufw
  - fail2ban
  - certbot
  - python3-certbot-nginx
  - node_exporter

package_update: true
package_upgrade: true

write_files:
  # OpenClaw systemd service
  - path: /etc/systemd/system/openclaw.service
    content: |
      [Unit]
      Description=OpenClaw Gateway
      After=network.target

      [Service]
      Type=simple
      User=openclaw
      WorkingDirectory=/home/openclaw
      Environment="OPENCLAW_PORT={{GATEWAY_PORT}}"
      Environment="OPENCLAW_CALLBACK_URL={{CALLBACK_URL}}"
      Environment="OPENCLAW_CALLBACK_TOKEN={{CALLBACK_TOKEN}}"
      ExecStart=/usr/bin/openclaw gateway start
      Restart=always
      RestartSec=10

      [Install]
      WantedBy=multi-user.target
    permissions: '0644'

  # Nginx reverse proxy config
  - path: /etc/nginx/sites-available/openclaw
    content: |
      server {
          listen 80;
          listen [::]:80;
          server_name {{SUBDOMAIN}}.{{DOMAIN}};
          
          location /.well-known/acme-challenge/ {
              root /var/www/certbot;
          }
          
          location / {
              return 301 https://$server_name$request_uri;
          }
      }

      server {
          listen 443 ssl http2;
          listen [::]:443 ssl http2;
          server_name {{SUBDOMAIN}}.{{DOMAIN}};

          ssl_certificate /etc/letsencrypt/live/{{SUBDOMAIN}}.{{DOMAIN}}/fullchain.pem;
          ssl_certificate_key /etc/letsencrypt/live/{{SUBDOMAIN}}.{{DOMAIN}}/privkey.pem;
          
          ssl_protocols TLSv1.2 TLSv1.3;
          ssl_ciphers HIGH:!aNULL:!MD5;
          ssl_prefer_server_ciphers on;

          location / {
              proxy_pass http://127.0.0.1:{{GATEWAY_PORT}};
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection 'upgrade';
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
              proxy_cache_bypass $http_upgrade;
          }
      }
    permissions: '0644'

  # OpenClaw config
  - path: /home/openclaw/.openclaw/openclaw.json
    content: |
      {
        "gateway": {
          "http": {
            "port": {{GATEWAY_PORT}}
          }
        },
        "channels": {
          "telegram": { "enabled": false },
          "discord": { "enabled": false },
          "whatsapp": { "enabled": false },
          "slack": { "enabled": false }
        }
      }
    permissions: '0600'
    owner: openclaw:openclaw

  # Health check script
  - path: /usr/local/bin/health-check.sh
    content: |
      #!/bin/bash
      # Health check and callback script
      
      GATEWAY_URL="http://127.0.0.1:{{GATEWAY_PORT}}/health"
      CALLBACK_URL="{{CALLBACK_URL}}"
      CALLBACK_TOKEN="{{CALLBACK_TOKEN}}"
      
      # Check if OpenClaw is running
      if curl -sf "$GATEWAY_URL" > /dev/null; then
          echo "OpenClaw is healthy"
          
          # Send ready callback (only once)
          if [ ! -f /var/lib/openclaw/callback-sent ]; then
              VERSION=$(openclaw --version 2>/dev/null || echo "unknown")
              
              curl -sf -X POST "$CALLBACK_URL" \
                  -H "Content-Type: application/json" \
                  -H "X-Callback-Token: $CALLBACK_TOKEN" \
                  -d "{\"openclaw_version\": \"$VERSION\", \"gateway_port\": {{GATEWAY_PORT}}}" \
                  && touch /var/lib/openclaw/callback-sent
          fi
      else
          echo "OpenClaw is not responding"
          exit 1
      fi
    permissions: '0755'

  # Node exporter config for metrics
  - path: /etc/default/prometheus-node-exporter
    content: |
      ARGS="--web.listen-address=:9100 --web.telemetry-path=/metrics"
    permissions: '0644'

runcmd:
  # Create necessary directories
  - mkdir -p /var/www/certbot /var/lib/openclaw /home/openclaw/.openclaw
  - chown -R openclaw:openclaw /home/openclaw

  # Install Node.js 22
  - curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  - apt-get install -y nodejs

  # Install OpenClaw globally
  - npm install -g openclaw@latest

  # Enable and start node_exporter
  - systemctl enable prometheus-node-exporter
  - systemctl start prometheus-node-exporter

  # Configure Nginx
  - ln -sf /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/
  - rm -f /etc/nginx/sites-enabled/default
  - nginx -t && systemctl reload nginx

  # Configure firewall
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow ssh
  - ufw allow 'Nginx Full'
  - ufw allow from {{API_SERVER_IP}} to any port 9100  # Metrics only from API
  - ufw --force enable

  # Security hardening
  - sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
  - sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  - systemctl restart sshd

  # Kernel hardening
  - |
    cat >> /etc/sysctl.conf << 'EOF'
    net.ipv4.tcp_syncookies = 1
    net.ipv4.conf.all.rp_filter = 1
    net.ipv4.conf.default.rp_filter = 1
    net.ipv4.conf.all.accept_redirects = 0
    net.ipv4.conf.all.send_redirects = 0
    kernel.randomize_va_space = 2
    EOF
    sysctl -p

  # Auto security updates
  - apt-get install -y unattended-upgrades
  - dpkg-reconfigure -plow unattended-upgrades

  # Enable fail2ban
  - systemctl enable fail2ban
  - systemctl start fail2ban

  # Get SSL certificate
  - certbot certonly --nginx --non-interactive --agree-tos -m admin@{{DOMAIN}} -d {{SUBDOMAIN}}.{{DOMAIN}} || true

  # Enable and start OpenClaw
  - systemctl daemon-reload
  - systemctl enable openclaw
  - systemctl start openclaw

  # Setup cron for health checks
  - echo "*/2 * * * * root /usr/local/bin/health-check.sh >> /var/log/openclaw-health.log 2>&1" > /etc/cron.d/openclaw-health

  # Final callback attempt
  - /usr/local/bin/health-check.sh || true

final_message: "OpenClaw instance setup complete!"
```

---

#### Task 4.2: cloud-init Template Renderer

**Branch:** `feature/infra-cloud-init-renderer`

```typescript
// apps/api/src/services/cloudinit.ts
interface CloudInitParams {
  subdomain: string;
  domain: string;
  gatewayPort: number;
  callbackUrl: string;
  callbackToken: string;
  apiServerIp: string;
  sshPublicKey: string;
  aiPreset?: string;
}

export function renderCloudInit(params: CloudInitParams): string {
  const template = readFileSync("./scripts/cloud-init.yaml", "utf-8");
  
  return template
    .replace(/\{\{SUBDOMAIN\}\}/g, params.subdomain)
    .replace(/\{\{DOMAIN\}\}/g, params.domain)
    .replace(/\{\{GATEWAY_PORT\}\}/g, String(params.gatewayPort))
    .replace(/\{\{CALLBACK_URL\}\}/g, params.callbackUrl)
    .replace(/\{\{CALLBACK_TOKEN\}\}/g, params.callbackToken)
    .replace(/\{\{API_SERVER_IP\}\}/g, params.apiServerIp)
    .replace(/\{\{SSH_PUBLIC_KEY\}\}/g, params.sshPublicKey)
    .replace(/\{\{AI_PRESET\}\}/g, params.aiPreset || "anthropic");
}
```

---

### Phase 2: Week 3-4 — Docker + Local Dev

#### Task 4.3: Docker Compose

**Branch:** `feature/infra-docker`

```yaml
# docker-compose.yml
version: "3.8"

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: openclaw
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: openclawhost
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U openclaw"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis (for caching/sessions if needed)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # API Server
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://openclaw:devpassword@postgres:5432/openclawhost
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
      API_PORT: 2222
    ports:
      - "2222:2222"
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages:/app/packages
    depends_on:
      postgres:
        condition: service_healthy
    command: pnpm --filter api dev

  # Dashboard
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      VITE_API_URL: http://localhost:2222
    ports:
      - "5173:5173"
    volumes:
      - ./apps/web:/app/apps/web
      - ./packages:/app/packages
    command: pnpm --filter web dev

  # Mailpit (email testing)
  mailpit:
    image: axllent/mailpit
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  postgres_data:
```

```dockerfile
# apps/api/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages
RUN pnpm --filter @openclaw/db build
RUN pnpm --filter @openclaw/shared build

EXPOSE 2222

CMD ["pnpm", "--filter", "api", "start"]
```

---

### Phase 3: Week 5-6 — CI/CD

#### Task 4.4: GitHub Actions CI

**Branch:** `feature/infra-ci`

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Test
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
      
      - name: Build
        run: pnpm build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=high
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to staging server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/openclaw-hosting
            git pull origin develop
            pnpm install --frozen-lockfile
            pnpm build
            pnpm --filter db migrate
            pm2 reload openclaw-api
```

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/openclaw-hosting
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm build
            pnpm --filter db migrate
            pm2 reload openclaw-api --update-env
```

---

### Phase 4: Week 7-8 — Monitoring

#### Task 4.5: Health Checks + Alerts

**Branch:** `feature/infra-monitoring`

```typescript
// apps/api/src/services/health.ts
import { db } from "@openclaw/db";

export async function checkInstanceHealth(instanceId: string) {
  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, instanceId),
  });
  
  if (!instance?.ip_address) return null;
  
  try {
    // Check OpenClaw gateway
    const gatewayRes = await fetch(
      `http://${instance.ip_address}:18789/health`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    // Check node_exporter
    const metricsRes = await fetch(
      `http://${instance.ip_address}:9100/metrics`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    const status = gatewayRes.ok && metricsRes.ok ? "up" : "degraded";
    
    await db.update(instances)
      .set({
        health_status: status,
        last_health_check: new Date(),
      })
      .where(eq(instances.id, instanceId));
    
    return status;
    
  } catch {
    await db.update(instances)
      .set({
        health_status: "down",
        last_health_check: new Date(),
      })
      .where(eq(instances.id, instanceId));
    
    return "down";
  }
}

// Cron job to check all instances
export async function runHealthChecks() {
  const activeInstances = await db.query.instances.findMany({
    where: eq(instances.status, "active"),
  });
  
  for (const instance of activeInstances) {
    await checkInstanceHealth(instance.id);
    // Small delay to avoid overwhelming
    await new Promise(r => setTimeout(r, 100));
  }
}
```

```bash
# scripts/health-checker.sh
#!/bin/bash
# Run from cron every minute

cd /opt/openclaw-hosting
pnpm --filter api exec tsx scripts/run-health-checks.ts
```

---

## Deliverables Checklist

- [ ] `scripts/cloud-init.yaml` — VPS provisioning template
- [ ] `scripts/cloud-init-template.ts` — Template renderer
- [ ] `docker-compose.yml` — Local development environment
- [ ] `apps/api/Dockerfile` — API container
- [ ] `apps/web/Dockerfile` — Dashboard container
- [ ] `.github/workflows/ci.yml` — Pull request checks
- [ ] `.github/workflows/deploy-staging.yml` — Staging deployment
- [ ] `.github/workflows/deploy-production.yml` — Production deployment
- [ ] `scripts/health-check.sh` — Instance health checker
- [ ] `scripts/deploy.sh` — Production deployment script
- [ ] Health check cron job
- [ ] Monitoring/alerting setup
- [ ] Backup automation
- [ ] Log rotation configuration
