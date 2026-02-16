#!/bin/bash
# Automated Deployment Script for OpenClaw Hosting
# Uses SSH keys for authentication

set -euo pipefail

# Configuration
SERVER_IP="45.56.105.143"
SERVER_USER="root"
DEPLOY_DIR="/opt/openclaw-hosting"
BACKUP_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SSH_KEY="$HOME/.ssh/openclaw_deploy"

echo "🚀 OpenClaw Hosting - Automated Deployment"
echo "==========================================="
echo "Target: $SERVER_IP"
echo "Time: $TIMESTAMP"
echo ""

# Check SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    echo "Generate with: ssh-keygen -t ed25519 -f $SSH_KEY"
    exit 1
fi

# Test SSH connection
echo "[1/10] Testing SSH connection..."
if ! ssh -o StrictHostKeyChecking=no -o BatchMode=yes -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "echo 'SSH OK'" 2>/dev/null; then
    echo "❌ SSH connection failed"
    echo "Please add this public key to server's ~/.ssh/authorized_keys:"
    cat "${SSH_KEY}.pub"
    exit 1
fi
echo "✅ SSH connection successful"

# Create backup of existing deployment
echo ""
echo "[2/10] Creating backup..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "
    if [ -d '$DEPLOY_DIR' ]; then
        mkdir -p $BACKUP_DIR
        tar -czf $BACKUP_DIR/openclaw-$TIMESTAMP.tar.gz -C $DEPLOY_DIR . 2>/dev/null || true
        echo 'Backup created'
    fi
"

# Create deployment directory
echo ""
echo "[3/10] Creating deployment directory..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "
    mkdir -p $DEPLOY_DIR
    rm -rf $DEPLOY_DIR/*
"

# Copy files to server
echo ""
echo "[4/10] Copying files..."
rsync -avz --delete \
    -e "ssh -i $SSH_KEY" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    /root/.openclaw/workspace/ \
    "$SERVER_USER@$SERVER_IP:$DEPLOY_DIR/"

# Set up environment
echo ""
echo "[5/10] Setting up environment..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "
    cd $DEPLOY_DIR
    
    # Create .env file
    cat > .env <> ENVFILE
NODE_ENV=production
DATABASE_URL=postgresql://openclaw:secure_password@localhost:5432/openclaw
REDIS_URL=redis://localhost:6379
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
HETZNER_API_TOKEN=placeholder
CLOUDFLARE_API_TOKEN=placeholder
WHMCS_API_KEY=placeholder
API_URL=https://api.openclaw.host
DASHBOARD_URL=https://dashboard.openclaw.host
ENVFILE
    
    chmod 600 .env
"

# Install dependencies and build
echo ""
echo "[6/10] Installing dependencies..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "
    cd $DEPLOY_DIR
    
    # Install Node.js if not present
    if ! command -v node >/dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install pnpm
    npm install -g pnpm
    
    # Install dependencies
    pnpm install --frozen-lockfile
"

# Build application
echo ""
echo "[7/10] Building application..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "
    cd $DEPLOY_DIR
    pnpm build
"

# Set up database
echo ""
echo "[8/10] Setting up database..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "
    cd $DEPLOY_DIR
    
    # Install PostgreSQL if not present
    if ! command -v psql >/dev/null; then
        apt-get update
        apt-get install -y postgresql postgresql-contrib
        systemctl start postgresql
        systemctl enable postgresql
    fi
    
    # Create database and user
    sudo -u postgres psql <> SQL
CREATE USER openclaw WITH PASSWORD 'secure_password';
CREATE DATABASE openclaw OWNER openclaw;
GRANT ALL PRIVILEGES ON DATABASE openclaw TO openclaw;
SQL
    
    # Run migrations
    pnpm db:migrate
"

# Set up PM2
echo ""
echo "[9/10] Setting up PM2..."
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "
    cd $DEPLOY_DIR
    
    # Install PM2
    npm install -g pm2
    
    # Create ecosystem file
    cat > ecosystem.config.js <> ECOSYSTEM
module.exports = {
  apps: [{
    name: 'openclaw-api',
    script: './apps/api/dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/api-error.log',
    out_file: './logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }, {
    name: 'openclaw-dashboard',
    script: 'serve',
    args: '-s ./apps/web/dist -l 5173',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
ECOSYSTEM
    
    # Start/restart applications
    pm2 start ecosystem.config.js || pm2 reload ecosystem.config.js
    pm2 save
"

# Run health checks
echo ""
echo "[10/10] Running health checks..."
sleep 5

HEALTH_STATUS=$(ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "
    curl -s -o /dev/null -w '%{http_code}' http://localhost:2222/api/health 2>/dev/null || echo '000'
")

if [ "$HEALTH_STATUS" == "200" ]; then
    echo "✅ Health check passed"
else
    echo "⚠️ Health check returned: $HEALTH_STATUS"
    echo "Checking logs..."
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "pm2 logs --lines 20"
fi

# Deployment summary
echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "URLs:"
echo "  API:      http://$SERVER_IP:2222"
echo "  Dashboard: http://$SERVER_IP:5173"
echo ""
echo "Services:"
echo "  API:       pm2 status openclaw-api"
echo "  Dashboard: pm2 status openclaw-dashboard"
echo ""
echo "Logs:"
echo "  API:       pm2 logs openclaw-api"
echo "  Dashboard: pm2 logs openclaw-dashboard"
echo ""
echo "Backup: $BACKUP_DIR/openclaw-$TIMESTAMP.tar.gz"
echo ""
echo "🎉 OpenClaw Hosting is now live!"
