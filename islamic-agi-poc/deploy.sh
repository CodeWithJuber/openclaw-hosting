# Islamic AGI POC - Deployment Script

#!/bin/bash
set -e

echo "🚀 Deploying Islamic AGI POC to Linode..."

# Server configuration
SERVER_IP="45.56.105.143"
SERVER_USER="root"
PROJECT_NAME="islamic-agi-poc"
DEPLOY_DIR="/opt/${PROJECT_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Building project locally...${NC}"
npm install
npm run build

echo -e "${YELLOW}Step 2: Creating deployment archive...${NC}"
tar -czf deploy.tar.gz dist/ package.json .env.production

echo -e "${YELLOW}Step 3: Deploying to server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${DEPLOY_DIR}"
scp deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/

echo -e "${YELLOW}Step 4: Setting up server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << EOF
  cd ${DEPLOY_DIR}
  
  # Extract files
  tar -xzf deploy.tar.gz
  rm deploy.tar.gz
  
  # Install dependencies
  npm install --production
  
  # Setup PM2
  if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
  fi
  
  # Create ecosystem file
  cat > ecosystem.config.js << 'ECO'
module.exports = {
  apps: [{
    name: '${PROJECT_NAME}',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
ECO
  
  # Create logs directory
  mkdir -p logs
  
  # Start/Restart with PM2
  pm2 delete ${PROJECT_NAME} 2>/dev/null || true
  pm2 start ecosystem.config.js
  pm2 save
  
  # Setup Nginx reverse proxy if not exists
  if [ ! -f /etc/nginx/sites-available/${PROJECT_NAME} ]; then
    cat > /etc/nginx/sites-available/${PROJECT_NAME} << 'NGINX'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX
    
    ln -sf /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/
    nginx -t && systemctl restart nginx
  fi
  
  echo "✅ Deployment complete!"
  pm2 status
EOF

echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo ""
echo "API Endpoints:"
echo "  Health: http://${SERVER_IP}/health"
echo "  Process: http://${SERVER_IP}/process"
echo ""
echo "Test with:"
echo "  curl -X POST http://${SERVER_IP}/process \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"input\": \"What is the concept of Tawhid?\"}'"

# Cleanup
rm -f deploy.tar.gz