// apps/api/src/services/cloudinit.ts

export interface CloudInitParams {
  subdomain: string;
  callbackToken: string;
  callbackUrl: string;
  aiPreset?: string;
  openclawVersion?: string;
}

export function renderCloudInit(params: CloudInitParams): string {
  const version = params.openclawVersion || "latest";
  
  return `#cloud-config
# OpenClaw Instance Provisioning
# Generated for: ${params.subdomain}

package_update: true
package_upgrade: true

packages:
  - curl
  - wget
  - git
  - nginx
  - certbot
  - python3-certbot-nginx
  - docker.io
  - docker-compose
  - fail2ban
  - ufw
  - node_exporter

# Create openclaw user
users:
  - name: openclaw
    groups: docker
    shell: /bin/bash
    home: /home/openclaw
    sudo: ALL=(ALL) NOPASSWD:ALL

# Write environment file
write_files:
  - path: /etc/openclaw/environment
    content: |
      OPENCLAW_SUBDOMAIN=${params.subdomain}
      OPENCLAW_CALLBACK_TOKEN=${params.callbackToken}
      OPENCLAW_CALLBACK_URL=${params.callbackUrl}
      OPENCLAW_VERSION=${version}
      OPENCLAW_AI_PRESET=${params.aiPreset || "anthropic"}
      NODE_ENV=production
    permissions: '0600'
    owner: root:root

  - path: /etc/systemd/system/openclaw-gateway.service
    content: |
      [Unit]
      Description=OpenClaw Gateway
      After=docker.service
      Requires=docker.service

      [Service]
      Type=simple
      User=openclaw
      WorkingDirectory=/opt/openclaw
      ExecStart=/usr/bin/docker-compose up
      ExecStop=/usr/bin/docker-compose down
      Restart=always
      RestartSec=10

      [Install]
      WantedBy=multi-user.target

  - path: /opt/openclaw/install.sh
    content: |
      #!/bin/bash
      set -e
      
      echo "[OpenClaw] Starting installation..."
      
      # Create directories
      mkdir -p /opt/openclaw
      cd /opt/openclaw
      
      # Download OpenClaw release
      curl -fsSL "https://github.com/openclaw/hosted/releases/download/${version}/openclaw-${version}.tar.gz" | tar xz
      
      # Set up environment
      cp /etc/openclaw/environment .env
      
      # Pull and start services
      docker-compose pull
      docker-compose up -d
      
      # Wait for gateway to be ready
      sleep 30
      
      # Get gateway port from config
      GATEWAY_PORT=$(docker-compose exec -T gateway printenv GATEWAY_PORT 2>/dev/null || echo "18789")
      
      # Send ready callback
      curl -X POST "${params.callbackUrl}" \\
        -H "Content-Type: application/json" \\
        -H "X-Callback-Token: ${params.callbackToken}" \\
        -d "{\\"openclaw_version\\":\\"${version}\\",\\"gateway_port\\":${GATEWAY_PORT}}" \\
        --retry 5 --retry-delay 5
      
      echo "[OpenClaw] Installation complete!"
    permissions: '0755'
    owner: root:root

  - path: /etc/nginx/sites-available/openclaw
    content: |
      server {
          listen 80;
          server_name ${params.subdomain}.*;
          
          location / {
              proxy_pass http://localhost:18789;
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

runcmd:
  # Configure firewall
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow ssh
  - ufw allow http
  - ufw allow https
  - ufw --force enable

  # Configure fail2ban
  - systemctl enable fail2ban
  - systemctl start fail2ban

  # Configure nginx
  - ln -sf /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/
  - rm -f /etc/nginx/sites-enabled/default
  - nginx -t && systemctl restart nginx
  - systemctl enable nginx

  # Configure node_exporter for metrics
  - systemctl enable node_exporter
  - systemctl start node_exporter

  # Run OpenClaw installation
  - /opt/openclaw/install.sh

  # Set up log rotation
  - |
    cat > /etc/logrotate.d/openclaw << 'EOF'
    /var/log/openclaw/*.log {
        daily
        rotate 7
        compress
        delaycompress
        missingok
        notifempty
        create 0640 openclaw openclaw
    }
    EOF

final_message: "OpenClaw instance setup complete"
`;
}
