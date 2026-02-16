#!/bin/bash
# OpenClaw Hosting - Fully Automated Deployment
# Can be run via: curl | bash

set -e

REPO_URL="https://github.com/CodeWithJuber/openclaw-hosting.git"
INSTALL_DIR="/opt/openclaw-hosting"
LOG_FILE="/var/log/openclaw-deploy.log"

# Logging
exec > >(tee -a "$LOG_FILE") 2>&1

echo "╔════════════════════════════════════════════════════════╗"
echo "║     OpenClaw Hosting - Automated Deployment           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Started: $(date)"
echo "Server: $(hostname)"
echo "IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unknown')"
echo ""

# Function to print progress
progress() {
    echo ""
    echo "▶ $1"
    echo "─────────────────────────────────────────────────────────"
}

# 1. System Update
progress "[1/8] Updating System Packages"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq > /dev/null 2>&1 || true
apt-get install -y -qq curl wget git ufw fail2ban htop > /dev/null 2>&1
echo "✓ System updated"

# 2. Install Docker
progress "[2/8] Installing Docker"
if ! command -v docker > /dev/null 2>&1; then
    apt-get install -y -qq docker.io docker-compose > /dev/null 2>&1
    systemctl enable docker > /dev/null 2>&1
    systemctl start docker
    usermod -aG docker root
    echo "✓ Docker installed"
else
    echo "✓ Docker already installed"
fi

# 3. Configure Firewall
progress "[3/8] Configuring Firewall"
ufw default deny incoming > /dev/null 2>&1 || true
ufw default allow outgoing > /dev/null 2>&1 || true
ufw allow ssh > /dev/null 2>&1 || true
ufw allow 2222/tcp > /dev/null 2>&1 || true  # API
ufw allow 5173/tcp > /dev/null 2>&1 || true  # Dashboard
ufw allow 80/tcp > /dev/null 2>&1 || true   # HTTP
ufw allow 443/tcp > /dev/null 2>&1 || true  # HTTPS
ufw --force enable > /dev/null 2>&1 || true
echo "✓ Firewall configured"

# 4. Setup SSH Key
progress "[4/8] Setting up SSH Access"
mkdir -p /root/.ssh
chmod 700 /root/.ssh
if ! grep -q "openclaw-deploy" /root/.ssh/authorized_keys 2>/dev/null; then
    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILWG7KDoelvmuXUxQ7YIAuJJG0R8zqjfFAv3UjwQvBq+ openclaw-deploy@hostlelo.com" >> /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    echo "✓ SSH key added"
else
    echo "✓ SSH key already present"
fi

# 5. Clone Repository
progress "[5/8] Cloning OpenClaw Hosting Repository"
if [ -d "$INSTALL_DIR" ]; then
    echo "Directory exists, updating..."
    cd "$INSTALL_DIR"
    git pull origin master > /dev/null 2>&1 || true
else
    rm -rf "$INSTALL_DIR"
    git clone "$REPO_URL" "$INSTALL_DIR" > /dev/null 2>&1
    echo "✓ Repository cloned"
fi

# 6. Create Environment
progress "[6/8] Creating Production Environment"
cd "$INSTALL_DIR"

# Generate secure keys
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 16)

# Create production environment file
cat > .env.production << EOENV
# OpenClaw Hosting - Production Environment
NODE_ENV=production
PORT=2222
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://openclaw:${DB_PASSWORD}@postgres:5432/openclaw
POSTGRES_USER=openclaw
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=openclaw

# Redis
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# API Keys (to be configured)
# KIMI_API_KEY=
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=

# Features
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
LOG_LEVEL=info
EOENV

echo "✓ Environment configured"

# 7. Deploy with Docker
progress "[7/8] Deploying Services"
if [ -f "docker-compose.prod.yml" ]; then
    docker-compose -f docker-compose.prod.yml down > /dev/null 2>&1 || true
    docker-compose -f docker-compose.prod.yml pull > /dev/null 2>&1 || true
    docker-compose -f docker-compose.prod.yml up -d
    echo "✓ Services deployed"
else
    echo "⚠ docker-compose.prod.yml not found, using standard compose"
    docker-compose up -d
fi

# 8. Health Check
progress "[8/8] Running Health Checks"
sleep 10  # Wait for services to start

HEALTH_API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:2222/health 2>/dev/null || echo "000")
HEALTH_DASHBOARD=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "000")

if [ "$HEALTH_API" = "200" ]; then
    echo "✓ API is healthy (port 2222)"
else
    echo "⚠ API health check returned: $HEALTH_API"
fi

if [ "$HEALTH_DASHBOARD" = "200" ] || [ "$HEALTH_DASHBOARD" = "301" ] || [ "$HEALTH_DASHBOARD" = "302" ]; then
    echo "✓ Dashboard is accessible (port 5173)"
else
    echo "⚠ Dashboard check returned: $HEALTH_DASHBOARD"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              DEPLOYMENT COMPLETE                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Services Status:"
docker-compose ps 2>/dev/null || docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "🔗 Access URLs:"
echo "   API:       http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP'):2222"
echo "   Dashboard: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP'):5173"
echo ""
echo "📁 Installation Directory: $INSTALL_DIR"
echo "📝 Log File: $LOG_FILE"
echo ""
echo "Finished: $(date)"
echo ""
echo "Next Steps:"
echo "1. Configure API keys in $INSTALL_DIR/.env.production"
echo "2. Set up SSL with: certbot --nginx"
echo "3. Configure domain DNS to point to this server"
echo ""
