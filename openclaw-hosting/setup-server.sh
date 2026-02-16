#!/bin/bash
# Linode Server Setup Script for OpenClaw Hosting
# This script configures a fresh Ubuntu 24.04 LTS server

set -e

echo "=== OpenClaw Hosting Server Setup ==="
echo "Starting configuration..."

# Update system
echo "[1/8] Updating system packages..."
apt-get update
apt-get upgrade -y

# Install essential packages
echo "[2/8] Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    build-essential

# Install Docker
echo "[3/8] Installing Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group
usermod -aG docker ubuntu

# Install Node.js 22
echo "[4/8] Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PM2
echo "[5/8] Installing PM2..."
npm install -g pm2

# Install PostgreSQL 16
echo "[6/8] Installing PostgreSQL 16..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update
apt-get install -y postgresql-16 postgresql-client-16

# Start PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# Configure PostgreSQL (create openclaw user and database)
sudo -u postgres psql -c "CREATE USER openclaw WITH PASSWORD 'openclaw_dev_password' SUPERUSER;" 2>/dev/null || echo "User may already exist"
sudo -u postgres psql -c "CREATE DATABASE openclaw OWNER openclaw;" 2>/dev/null || echo "Database may already exist"

# Configure UFW Firewall
echo "[7/8] Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 2222/tcp  # OpenClaw API
ufw allow 5173/tcp  # Development server

# Enable UFW (non-interactive)
echo "y" | ufw enable

# Show UFW status
ufw status verbose

# Create app directory
echo "[8/8] Creating application directory..."
mkdir -p /opt/openclaw-hosting
chown ubuntu:ubuntu /opt/openclaw-hosting

# Create a basic environment file template
cat > /opt/openclaw-hosting/.env.example << 'EOF'
# OpenClaw Hosting Environment
NODE_ENV=production
PORT=2222
DATABASE_URL=postgresql://openclaw:openclaw_dev_password@localhost:5432/openclaw
JWT_SECRET=your-jwt-secret-here
EOF

echo ""
echo "=== Setup Complete ==="
echo "Server is configured and ready for OpenClaw Hosting deployment."
echo ""
echo "PostgreSQL:"
echo "  - User: openclaw"
echo "  - Database: openclaw"
echo "  - Password: openclaw_dev_password"
echo ""
echo "Firewall (UFW) configured for ports: 22, 80, 443, 2222, 5173"
echo ""
echo "Installed versions:"
echo "  - Docker: $(docker --version 2>/dev/null || echo 'N/A')"
echo "  - Node.js: $(node --version 2>/dev/null || echo 'N/A')"
echo "  - PM2: $(pm2 --version 2>/dev/null || echo 'N/A')"
echo "  - PostgreSQL: $(psql --version 2>/dev/null | head -1 || echo 'N/A')"
