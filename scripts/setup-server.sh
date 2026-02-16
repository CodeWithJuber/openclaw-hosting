#!/bin/bash
# Setup script for OpenClaw API Server
# Run on: 45.56.108.136

set -e

echo "=== OpenClaw Server Setup ==="

# Update system
echo "[1/10] Updating system..."
apt-get update && apt-get upgrade -y

# Install essential packages
echo "[2/10] Installing essential packages..."
apt-get install -y curl wget git nginx ufw fail2ban certbot python3-certbot-nginx

# Install Docker
echo "[3/10] Installing Docker..."
curl -fsSL https://get.docker.com | sh
usermod -aG docker root
systemctl enable docker
systemctl start docker

# Install Docker Compose
echo "[4/10] Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js 22
echo "[5/10] Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pnpm pm2

# Install PostgreSQL 16
echo "[6/10] Installing PostgreSQL 16..."
apt-get install -y postgresql-16 postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE openclawhost;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER openclaw WITH PASSWORD 'openclaw2025';" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE openclawhost TO openclaw;" 2>/dev/null || true

# Configure Firewall
echo "[7/10] Configuring UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 2222/tcp  # API port
ufw allow 5173/tcp  # Dev dashboard
ufw --force enable

# Configure fail2ban
echo "[8/10] Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Setup app directory
echo "[9/10] Setting up application directory..."
mkdir -p /opt/openclaw-hosting
cd /opt/openclaw-hosting

# Create environment file template
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://openclaw:openclaw2025@localhost:5432/openclawhost

# API
API_PORT=2222
API_URL=https://api.yourdomain.com
DASHBOARD_URL=https://dash.yourdomain.com
NODE_ENV=production

# Secrets (CHANGE THESE!)
JWT_SECRET=change-me-to-32-char-random-string
WHMCS_API_KEY=change-me
WHMCS_HMAC_SECRET=change-me
ENCRYPTION_KEY=change-me-to-32-char-random-string

# Cloud Providers
HETZNER_API_TOKEN=your-hetzner-token
CLOUDFLARE_API_TOKEN=your-cf-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_DOMAIN=yourdomain.com

# Email
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@yourdomain.com
EOF

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'openclaw-api',
    cwd: '/opt/openclaw-hosting/apps/api',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/openclaw-api/error.log',
    out_file: '/var/log/openclaw-api/out.log',
    log_file: '/var/log/openclaw-api/combined.log',
    time: true
  }]
};
EOF

mkdir -p /var/log/openclaw-api

# Security hardening
echo "[10/10] Security hardening..."
sed -i 's/^PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config  # Keep yes for now, change later
sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

echo ""
echo "=== Setup Complete ==="
echo "Server IP: 45.56.108.136"
echo ""
echo "Next steps:"
echo "1. Clone the repository: git clone https://github.com/CodeWithJuber/openclaw-hosting.git /opt/openclaw-hosting"
echo "2. Copy .env.example to .env and configure"
echo "3. Run: cd /opt/openclaw-hosting && pnpm install && pnpm build"
echo "4. Run: pnpm --filter db migrate"
echo "5. Start with: pm2 start ecosystem.config.js"
echo ""
echo "PostgreSQL:"
echo "  Database: openclawhost"
echo "  User: openclaw"
echo "  Password: openclaw2025"
