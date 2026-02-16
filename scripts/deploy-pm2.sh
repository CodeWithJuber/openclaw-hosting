#!/bin/bash
# OpenClaw Hosting - PM2 Deployment Script
# Simpler alternative to Docker for faster deployment

set -e

echo "🚀 OpenClaw Hosting - PM2 Deployment"
echo "======================================"

APP_DIR="/opt/openclaw-hosting"
LOG_DIR="/var/log/openclaw"

# Create log directory
mkdir -p $LOG_DIR

# Install Node.js 22 if not present
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "22" ]; then
    echo "[1/6] Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

echo "✓ Node.js $(node -v)"

# Install pnpm and pm2
echo "[2/6] Installing pnpm and pm2..."
npm install -g pnpm pm2
echo "✓ pnpm and pm2 installed"

# Navigate to app
cd $APP_DIR

# Install dependencies
echo "[3/6] Installing dependencies..."
pnpm install --force 2>&1 | tail -5
echo "✓ Dependencies installed"

# Build packages
echo "[4/6] Building packages..."
pnpm --filter db build 2>&1 || true
pnpm --filter shared build 2>&1 || true
echo "✓ Packages built"

# Setup PostgreSQL
echo "[5/6] Setting up PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt-get install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
fi

# Create database
sudo -u postgres psql -c "CREATE USER openclaw WITH PASSWORD 'openclaw_secure_password';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE openclaw_hosting OWNER openclaw;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE openclaw_hosting TO openclaw;" 2>/dev/null || true
echo "✓ PostgreSQL configured"

# Setup Redis
echo "[6/6] Setting up Redis..."
if ! command -v redis-cli &> /dev/null; then
    apt-get install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
fi
echo "✓ Redis configured"

# Create environment file
cat > $APP_DIR/.env.production <> EOF
NODE_ENV=production
PORT=2222
HOST=0.0.0.0
DATABASE_URL=postgresql://openclaw:openclaw_secure_password@localhost:5432/openclaw_hosting
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
EOF

# Start with PM2
echo ""
echo "🚀 Starting services with PM2..."

# API Server
pm2 start "pnpm --filter api start" \
    --name openclaw-api \
    --cwd $APP_DIR \
    --log $LOG_DIR/api.log \
    --error $LOG_DIR/api-error.log \
    --restart-delay 5000 \
    --max-restarts 10

# Dashboard (build and serve)
cd $APP_DIR/apps/web
pnpm build 2>&1 | tail -3
pm2 start "pnpm preview --port 5173" \
    --name openclaw-dashboard \
    --cwd $APP_DIR/apps/web \
    --log $LOG_DIR/dashboard.log \
    --error $LOG_DIR/dashboard-error.log

# Save PM2 config
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo "API: http://$(curl -s ifconfig.me):2222"
echo "Dashboard: http://$(curl -s ifconfig.me):5173"
echo ""
echo "PM2 Commands:"
echo "  pm2 status          - Check status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart services"
echo "  pm2 stop all        - Stop services"
