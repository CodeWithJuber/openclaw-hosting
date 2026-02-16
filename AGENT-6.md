# Agent 6 — Security & Production Deployment

> **Skills:** Security hardening, SSL, OWASP, penetration testing, production ops  
> **Branch Prefix:** `feature/security-*`  
> **Location:** Cross-cutting (all directories)  
> **Starts Active:** Week 5 (security review), Peak: Weeks 9-14  
> **Depends On:** All agents (reviews their work)

---

## Setup Commands

```bash
# Install security tools
brew install nmap nikto
pip install sqlmap
npm install -g snyk
docker pull owasp/zap2docker-stable

# Install deployment tools
npm install -g pm2
brew install hcloud
pip install ansible  # optional: for multi-server deployment
```

---

## Task List

### Phase 1: Week 5-6 — Security Architecture Review

#### Task 6.1: Threat Model Document

**Branch:** `feature/security-threat-model`

Create `docs/SECURITY-THREAT-MODEL.md`:

```markdown
## Threat Model

### Assets to Protect
1. Customer AI API keys (Anthropic, OpenAI) — HIGH
2. Customer data on VPS instances — HIGH
3. WHMCS billing data — HIGH
4. Orchestration API credentials — HIGH
5. Customer messaging channel credentials — MEDIUM
6. Platform admin access — CRITICAL

### Threat Actors
1. External attackers (internet-facing services)
2. Malicious customers (privilege escalation)
3. Compromised VPS instances (lateral movement)
4. MITM attacks on API communication
5. Supply chain attacks (npm/composer dependencies)

### Attack Surfaces
1. Orchestration API (public HTTPS)
2. Dashboard (public HTTPS)
3. WHMCS installation (public HTTPS)
4. Customer VPS instances (SSH + HTTPS)
5. cloud-init script execution
6. Webhook endpoints

### Mitigations (by priority)
1. HMAC-signed API communication (no plain API keys in transit)
2. Instance isolation (dedicated VPS, not containers)
3. Encrypted secrets at rest (AES-256-GCM)
4. Network segmentation (UFW, 127.0.0.1 binding)
5. Audit logging (all admin actions)
6. Dependency scanning (Snyk + npm audit)
7. Rate limiting (all endpoints)
8. Input validation (Zod schemas, parameterized queries)
```

#### Task 6.2: Security Headers & CORS

**Branch:** `feature/security-headers`

```typescript
// apps/api/src/middleware/security.ts
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";

export function applySecurityMiddleware(app: Hono) {
  // Security headers
  app.use("*", secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.API_URL!],
      frameSrc: ["'none'"],
    },
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=63072000; includeSubDomains; preload",
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  }));

  // CORS — only allow dashboard origin
  app.use("*", cors({
    origin: [process.env.DASHBOARD_URL!],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Timestamp", "X-Signature"],
    maxAge: 86400,
    credentials: true,
  }));
}
```

#### Task 6.3: API Key Encryption at Rest

**Branch:** `feature/security-encryption`

```typescript
// apps/api/src/utils/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = scryptSync(process.env.ENCRYPTION_KEY!, "salt", 32);

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

// Usage: storing customer AI API keys
// const encryptedKey = encrypt("sk-ant-api03-...");
// Store encryptedKey in database
// const originalKey = decrypt(encryptedKey);
```

#### Task 6.4: Input Validation Layer

**Branch:** `feature/security-validation`

```typescript
// apps/api/src/utils/validators.ts
import { z } from "zod";

export const createInstanceSchema = z.object({
  whmcs_service_id: z.number().int().positive(),
  whmcs_client_id: z.number().int().positive(),
  plan: z.enum(["starter", "professional", "enterprise"]),
  region: z.enum(["us-east", "us-west", "eu-frankfurt", "eu-helsinki", "sg-singapore", "jp-tokyo"]),
  email: z.string().email().max(255),
  hostname: z.string().regex(/^[a-z0-9-]{3,30}$/).optional(),
  ssh_key_ids: z.array(z.string().uuid()).max(5).optional(),
  ai_preset: z.enum(["anthropic", "openai", "ollama", "multi"]).optional(),
});

export const updateConfigSchema = z.object({
  agent: z.object({
    model: z.string().max(100).regex(/^[a-z0-9\/ -]+$/),
  }).optional(),
  api_keys: z.record(z.string().max(200)).optional(),
  channels: z.record(z.object({
    enabled: z.boolean(),
    bot_token: z.string().max(200).optional(),
  })).optional(),
}).strict(); // Reject unknown fields

// Middleware
export function validate(schema: z.ZodType) {
  return async (c: any, next: any) => {
    try {
      const body = await c.req.json();
      c.set("validatedBody", schema.parse(body));
      await next();
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: "Validation failed", details: e.errors }, 400);
      }
      throw e;
    }
  };
}
```

---

### Phase 2: Week 7-8 — Hardening

#### Task 6.5: Rate Limiting

**Branch:** `feature/security-rate-limit`

```typescript
// apps/api/src/middleware/rateLimit.ts
// Implement per-IP and per-API-key rate limiting
// Authenticated: 100 requests/minute
// Unauthenticated: 20 requests/minute
// Provisioning endpoints: 10 requests/minute (expensive operation)

import { rateLimiter } from "hono-rate-limiter";

export const apiRateLimit = rateLimiter({
  windowMs: 60_000,
  limit: 100,
  keyGenerator: (c) => c.req.header("X-API-Key") || c.req.header("CF-Connecting-IP") || "unknown",
  message: {
    error: "Rate limit exceeded",
    code: "RATE_LIMITED"
  },
});

export const provisionRateLimit = rateLimiter({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (c) => c.req.header("X-API-Key") || "unknown",
});
```

#### Task 6.6: Audit Logging

**Branch:** `feature/security-audit-log`

```typescript
// apps/api/src/services/audit.ts
export async function logAuditEvent(params: {
  userId?: string;
  instanceId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress: string;
}) {
  await db.insert(auditLog).values({
    user_id: params.userId,
    instance_id: params.instanceId,
    action: params.action,
    details: params.details,
    ip_address: params.ipAddress,
  });
}

// Critical actions that MUST be logged:
// - Instance created/suspended/terminated
// - Admin login
// - API key added/changed
// - Config changed
// - SSH key added/removed
// - Failed authentication attempts
// - Rate limit violations
```

#### Task 6.7: cloud-init Security Hardening

**Branch:** `feature/security-cloud-init`

Review and harden Agent 4's cloud-init.yaml:

```yaml
# Additional security measures to add:

runcmd:
  # Disable root SSH login
  - sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
  - sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
  - systemctl restart sshd

  # Restrict node_exporter to API server IP only
  - ufw allow from {{API_SERVER_IP}} to any port 9100

  # Set file permissions
  - chmod 600 /home/openclaw/.openclaw/openclaw.json
  - chmod 700 /home/openclaw/.openclaw/

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
```

#### Task 6.8: Dependency Security Scanning

**Branch:** `feature/security-deps`

```bash
# Add to CI pipeline:

# Node.js dependencies
pnpm audit --audit-level=high
npx snyk test

# PHP dependencies
cd modules/whmcs/openclawhost
composer audit

# Container scanning (if using Docker)
docker scout cves openclaw-api:latest
```

---

### Phase 3: Week 9-12 — Security Testing

#### Task 6.9: Penetration Testing Checklist

**Branch:** `feature/security-pentest`

```bash
# 1. Port scanning
nmap -sV -sC api.staging.yourdomain.com

# 2. SSL/TLS testing
testssl.sh https://api.staging.yourdomain.com

# 3. OWASP ZAP automated scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://api.staging.yourdomain.com

# 4. SQL injection testing
sqlmap -u "https://api.staging.yourdomain.com/api/admin/instances?search=test" \
  --headers="Authorization: Bearer <token>" --batch

# 5. API fuzzing
# Test all endpoints with invalid/malformed data
# Test boundary values for all numeric parameters
# Test Unicode/special characters in string fields
```

#### Task 6.10: OWASP Top 10 Verification

| # | Vulnerability | Status | Mitigation |
|---|---------------|--------|-----------|
| A01 | Broken Access Control | | Instance isolation, role-based JWT, ownership checks |
| A02 | Cryptographic Failures | | AES-256-GCM for API keys, TLS 1.3, bcrypt for passwords |
| A03 | Injection | | Zod validation, Drizzle ORM (parameterized), no raw SQL |
| A04 | Insecure Design | | Threat modeling, security architecture review |
| A05 | Security Misconfiguration | | Hardened cloud-init, security headers, CSP |
| A06 | Vulnerable Components | | Snyk + npm audit in CI, auto-updates |
| A07 | Auth Failures | | HMAC-signed API keys, JWT with expiry, rate limiting |
| A08 | Software/Data Integrity | | HMAC webhook verification, SRI for CDN resources |
| A09 | Security Logging | | Audit log for all actions, webhook log, failed auth log |
| A10 | SSRF | | Input validation, no user-controlled URLs in server-side requests |

---

### Phase 4: Week 13-14 — Production Deployment

#### Task 6.11: Production Deployment Checklist

**Branch:** `feature/security-production`

```markdown
## Pre-Launch Checklist

### Infrastructure
- [ ] API server: Hetzner CPX21, Ubuntu 24.04, hardened
- [ ] PostgreSQL: managed or dedicated, SSL required, daily backups
- [ ] Cloudflare: DNS zone configured, proxy enabled
- [ ] Hetzner API token: production project, separate from dev
- [ ] SSL certificates: Let's Encrypt with auto-renewal

### Security
- [ ] All secrets rotated from development values
- [ ] ENCRYPTION_KEY generated (32+ bytes, random)
- [ ] JWT_SECRET generated (32+ bytes, random)
- [ ] WHMCS_HMAC_SECRET generated and configured on both sides
- [ ] SSH keys: only production team authorized
- [ ] UFW enabled on API server
- [ ] fail2ban configured on API server
- [ ] Security headers verified (securityheaders.com grade A+)
- [ ] SSL grade verified (ssllabs.com grade A+)
- [ ] OWASP ZAP scan: 0 high/critical findings

### Application
- [ ] Database migrations run successfully
- [ ] Health endpoint returns 200
- [ ] WHMCS module installed and TestConnection succeeds
- [ ] SSO flow working end-to-end
- [ ] cloud-init provisioning tested with real Hetzner VPS
- [ ] DNS automation tested with real Cloudflare zone
- [ ] SSL automation tested with real Let's Encrypt
- [ ] Email sending tested via Resend

### Monitoring
- [ ] Health check cron running every 60s
- [ ] Dead instance alerts configured
- [ ] Disk space alerts at 80% and 90%
- [ ] Error rate alerting (>1% = alert)
- [ ] Response time alerting (p95 >3s = alert)

### Backup
- [ ] PostgreSQL daily backup to S3/R2
- [ ] Backup restoration tested
- [ ] cloud-init.yaml backed up in Git

### Documentation
- [ ] WHMCS admin setup guide
- [ ] Customer onboarding guide
- [ ] Incident response playbook
- [ ] Secret rotation procedure
```

#### Task 6.12: Production Deployment Script

**Branch:** `feature/security-deploy-script`

```bash
#!/bin/bash
# scripts/deploy.sh — Production Deployment

set -euo pipefail

echo "=== OpenClaw Hosting — Production Deploy ==="

# 1. Pre-flight checks
echo "[1/8] Pre-flight checks..."
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set"; exit 1
fi
if [ -z "${HETZNER_API_TOKEN:-}" ]; then
  echo "ERROR: HETZNER_API_TOKEN not set"; exit 1
fi

# 2. Pull latest code
echo "[2/8] Pulling latest code..."
git fetch origin main
git checkout main
git pull origin main

# 3. Install dependencies
echo "[3/8] Installing dependencies..."
pnpm install --frozen-lockfile

# 4. Build
echo "[4/8] Building..."
pnpm turbo build

# 5. Run migrations
echo "[5/8] Running database migrations..."
cd packages/db && pnpm drizzle-kit push && cd ../..

# 6. Deploy API (zero-downtime with PM2)
echo "[6/8] Deploying API..."
pm2 reload openclaw-api --update-env

# 7. Deploy dashboard
echo "[7/8] Deploying dashboard..."
# Copy apps/web/dist/ to static hosting or Nginx

# 8. Smoke tests
echo "[8/8] Running smoke tests..."
sleep 5
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/api/health)
if [ "$HEALTH" != "200" ]; then
  echo "CRITICAL: Health check failed! Rolling back..."
  pm2 reload openclaw-api --update-env  # rollback
  exit 1
fi

echo "=== Deployment complete ==="
```

#### Task 6.13: Incident Response Playbook

**Branch:** `feature/security-incident-playbook`

Create `docs/INCIDENT-RESPONSE.md`:

```markdown
## Incident Response

### Severity Levels
- **P1 Critical:** All instances down, data breach, billing failure
- **P2 High:** Single instance down, provisioning broken, SSO broken
- **P3 Medium:** Degraded performance, non-critical feature broken
- **P4 Low:** UI bug, documentation error

### Response Times
- P1: 15 minutes to acknowledge, 1 hour to mitigate
- P2: 1 hour to acknowledge, 4 hours to mitigate
- P3: 4 hours to acknowledge, 24 hours to mitigate
- P4: 24 hours to acknowledge, 1 week to resolve

### Runbooks
1. **Instance not provisioning:** Check Hetzner API status, cloud-init logs, callback endpoint
2. **SSL certificate expired:** SSH to VPS, run certbot renew, check systemd timer
3. **Database connection failure:** Check PostgreSQL status, connection pool, disk space
4. **WHMCS sync failure:** Check webhook log, API connectivity, HMAC secret match
5. **Customer VPS compromised:** Isolate (suspend), backup data, re-provision fresh
```

---

## Deliverables Checklist

- [ ] `docs/SECURITY-THREAT-MODEL.md`
- [ ] Security headers middleware implemented
- [ ] AES-256-GCM encryption for API keys
- [ ] Zod validation on all endpoints
- [ ] Rate limiting on all endpoints
- [ ] Audit logging for all critical actions
- [ ] cloud-init security hardening applied
- [ ] Dependency scanning in CI
- [ ] OWASP Top 10 verification completed
- [ ] Penetration testing executed
- [ ] Production deployment checklist verified
- [ ] `scripts/deploy.sh` tested
- [ ] `docs/INCIDENT-RESPONSE.md` created
- [ ] Secret rotation procedure documented
