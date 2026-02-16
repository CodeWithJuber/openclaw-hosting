#!/bin/bash
# OpenClaw Hosting - Complete Setup Script
# Run this on the server via LISH console

set -e

echo "🚀 OpenClaw Hosting Setup Script"
echo "================================"

# 1. Add SSH key
echo "[1/5] Adding SSH key..."
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILWG7KDoelvmuXUxQ7YIAuJJG0R8zqjfFAv3UjwQvBq+ openclaw-deploy@hostlelo.com" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
echo "✅ SSH key added"

# 2. Update system
echo "[2/5] Updating system..."
apt-get update -qq
apt-get upgrade -y -qq
echo "✅ System updated"

# 3. Install dependencies
echo "[3/5] Installing dependencies..."
apt-get install -y -qq \
  docker.io \
  docker-compose \
  git \
  curl \
  wget \
  htop \
  nano \
  ufw
echo "✅ Dependencies installed"

# 4. Configure firewall
echo "[4/5] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 2222/tcp  # API port
ufw allow 5173/tcp  # Dashboard port
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo "✅ Firewall configured"

# 5. Setup Docker
echo "[5/5] Setting up Docker..."
systemctl enable docker
systemctl start docker
usermod -aG docker root
echo "✅ Docker ready"

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo "Server is ready for OpenClaw Hosting deployment"
echo ""
echo "Next steps:"
echo "1. Clone repository: git clone https://github.com/CodeWithJuber/openclaw-hosting.git"
echo "2. Run deployment: ./scripts/deploy-production.sh"
echo ""
echo "Server IP: 45.56.105.143"
echo "SSH Key: Added ✅"
