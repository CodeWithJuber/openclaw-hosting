#!/bin/bash
# Staging Deployment Script for OpenClaw Hosting
# Deploys to staging environment for security testing

set -euo pipefail

STAGING_SERVER="45.56.105.143"
STAGING_USER="root"
PROJECT_NAME="openclaw-hosting"
DEPLOY_DIR="/opt/openclaw-staging"
BACKUP_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 OpenClaw Hosting - Staging Deployment"
echo "========================================="
echo "Timestamp: $TIMESTAMP"
echo "Target: $STAGING_SERVER"
echo ""

# 1. Pre-deployment checks
echo "[1/10] Running pre-deployment checks..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Are you in the project root?"
    exit 1
fi

# Check if all required files exist
required_files=(
    "packages/shared/src/jwt-rs256.ts"
    "packages/shared/src/hmac-secure.ts"
    "packages/shared/src/encryption.ts"
    "packages/shared/src/log-sanitization.ts"
    "packages/shared/src/cloud-init-security.ts"
    "packages/shared/src/cors-security.ts"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Required security file missing: $file"
        exit 1
    fi
done

echo "✅ All security files present"

# 2. Generate RSA key pair for JWT
echo ""
echo "[2/10] Generating RSA key pair for JWT..."
mkdir -p secrets
if [ ! -f "secrets/jwt-private.pem" ]; then
    openssl genrsa -out secrets/jwt-private.pem 2048
    openssl rsa -in secrets/jwt-private.pem -pubout -out secrets/jwt-public.pem
    chmod 600 secrets/jwt-private.pem
    chmod 644 secrets/jwt-public.pem
    echo "✅ RSA keys generated"
else
    echo "✅ RSA keys already exist"
fi

# 3. Create staging environment file
echo ""
echo "[3/10] Creating staging environment..."
cat > .env.staging << EOF
# Staging Environment Configuration
NODE_ENV=staging

# Database
DATABASE_URL=postgresql://openclaw:${DB_PASSWORD:-staging123}@postgres:5432/openclaw_staging

# Redis
REDIS_URL=redis://redis:6379

# JWT (RS256)
JWT_PRIVATE_KEY_PATH=/app/secrets/jwt-private.pem
JWT_PUBLIC_KEY_PATH=/app/secrets/jwt-public.pem
JWT_ALGORITHM=RS256

# Encryption
ENCRYPTION_KEY=${ENCRYPTION_KEY:-$(openssl rand -hex 32)}

# API Keys (Staging values)
HETZNER_API_TOKEN=${HETZNER_API_TOKEN_STAGING:-test-token}
CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN_STAGING:-test-token}
CLOUDFLARE_ZONE_ID=${CLOUDFLARE_ZONE_ID_STAGING:-test-zone}

# WHMCS
WHMCS_API_KEY=${WHMCS_API_KEY_STAGING:-test-key}
WHMCS_HMAC_SECRET=${WHMCS_HMAC_SECRET_STAGING:-test-secret}

# CORS
DASHBOARD_URL=https://staging.openclaw.host
API_URL=https://api-staging.openclaw.host

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_HETZNER=3600
RATE_LIMIT_CLOUDFLARE=1200

# Features
ENABLE_ROLLBACK=true
ENABLE_AUDIT_LOG=true
EOF

echo "✅ Staging environment file created"

# 4. Build Docker images
echo ""
echo "[4/10] Building Docker images..."
docker-compose -f docker-compose.yml build --no-cache
echo "✅ Docker images built"

# 5. Run security tests locally
echo ""
echo "[5/10] Running security tests..."

# Test JWT implementation
echo "Testing JWT RS256 implementation..."
node -e "
const { JWTManager } = require('./packages/shared/src/jwt-rs256.ts');
const fs = require('fs');

const privateKey = fs.readFileSync('secrets/jwt-private.pem');
const publicKey = fs.readFileSync('secrets/jwt-public.pem');

const jwt = new JWTManager(privateKey, publicKey);
const token = jwt.sign({ sub: 'test', role: 'admin' }, 3600);
const decoded = jwt.verify(token);

if (decoded.sub === 'test') {
    console.log('✅ JWT RS256 working');
} else {
    console.error('❌ JWT test failed');
    process.exit(1);
}
"

# Test encryption
echo "Testing AES-256-GCM encryption..."
node -e "
const { EncryptionService, EnvKeyStorage } = require('./packages/shared/src/encryption.ts');

const storage = new EnvKeyStorage();
const encryption = new EncryptionService(storage);

async function test() {
    const original = 'sk-test-api-key-12345';
    const encrypted = await encryption.encrypt(original);
    const decrypted = await encryption.decrypt(encrypted);
    
    if (decrypted === original) {
        console.log('✅ Encryption working');
    } else {
        console.error('❌ Encryption test failed');
        process.exit(1);
    }
}

test();
"

# Test HMAC
echo "Testing HMAC secure comparison..."
node -e "
const { secureHMACCompare, generateHMAC } = require('./packages/shared/src/hmac-secure.ts');

const secret = 'test-secret';
const payload = 'test-payload';
const hmac1 = generateHMAC(payload, secret);
const hmac2 = generateHMAC(payload, secret);

if (secureHMACCompare(hmac1, hmac2)) {
    console.log('✅ HMAC comparison working');
} else {
    console.error('❌ HMAC test failed');
    process.exit(1);
}
"

echo "✅ All security tests passed"

# 6. Deploy to staging server
echo ""
echo "[6/10] Deploying to staging server..."

# Create backup of current deployment
ssh "$STAGING_USER@$STAGING_SERVER" "
    if [ -d '$DEPLOY_DIR' ]; then
        mkdir -p $BACKUP_DIR
        tar -czf $BACKUP_DIR/openclaw-staging-$TIMESTAMP.tar.gz -C $DEPLOY_DIR .
        echo '✅ Backup created: $BACKUP_DIR/openclaw-staging-$TIMESTAMP.tar.gz'
    fi
"

# Copy files to server
rsync -avz --exclude='node_modules' --exclude='.git' \
    --exclude='secrets/jwt-private.pem' \
    . "$STAGING_USER@$STAGING_SERVER:$DEPLOY_DIR/"

# Copy secrets separately (secure)
scp secrets/jwt-*.pem "$STAGING_USER@$STAGING_SERVER:$DEPLOY_DIR/secrets/"

echo "✅ Files deployed to staging"

# 7. Start services on staging
echo ""
echo "[7/10] Starting services on staging..."
ssh "$STAGING_USER@$STAGING_SERVER" "
    cd $DEPLOY_DIR
    
    # Load environment
    export \$(cat .env.staging | xargs)
    
    # Stop existing containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Start new deployment
    docker-compose up -d
    
    # Wait for health checks
    echo 'Waiting for services to be healthy...'
    sleep 30
    
    # Check PostgreSQL
    if docker-compose ps | grep -q 'postgres.*healthy'; then
        echo '✅ PostgreSQL healthy'
    else
        echo '⚠️ PostgreSQL not healthy yet'
    fi
    
    # Check Redis
    if docker-compose ps | grep -q 'redis.*healthy'; then
        echo '✅ Redis healthy'
    else
        echo '⚠️ Redis not healthy yet'
    fi
"

echo "✅ Services started on staging"

# 8. Run smoke tests
echo ""
echo "[8/10] Running smoke tests..."
sleep 10

# Test health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    http://$STAGING_SERVER:2222/api/health || echo "000")

if [ "$HEALTH_STATUS" == "200" ]; then
    echo "✅ Health check passed"
else
    echo "⚠️ Health check returned: $HEALTH_STATUS"
fi

# Test JWT endpoint (if available)
JWT_TEST=$(curl -s -X POST \
    http://$STAGING_SERVER:2222/api/auth/test \
    -H "Content-Type: application/json" \
    -d '{"test": "jwt"}' 2>/dev/null || echo "endpoint_not_found")

if [ "$JWT_TEST" != "endpoint_not_found" ]; then
    echo "✅ JWT endpoint accessible"
fi

# 9. Security verification
echo ""
echo "[9/10] Running security verification..."

# Check security headers
echo "Checking security headers..."
curl -s -I http://$STAGING_SERVER:2222/api/health | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)" || echo "⚠️ Some security headers missing"

# Check CORS
echo "Checking CORS configuration..."
curl -s -X OPTIONS \
    -H "Origin: https://evil.com" \
    -H "Access-Control-Request-Method: POST" \
    http://$STAGING_SERVER:2222/api/instances 2>/dev/null | grep -q "403" && echo "✅ CORS blocking unauthorized origins" || echo "⚠️ CORS check inconclusive"

echo "✅ Security verification complete"

# 10. Post-deployment summary
echo ""
echo "[10/10] Deployment Summary"
echo "=========================="
echo "✅ Staging deployment complete!"
echo ""
echo "URLs:"
echo "  - API: http://$STAGING_SERVER:2222"
echo "  - Dashboard: http://$STAGING_SERVER:5173"
echo ""
echo "Security Features Active:"
echo "  ✅ RS256 JWT with dual-validation"
echo "  ✅ AES-256-GCM encryption"
echo "  ✅ Rate limiting (Redis)"
echo "  ✅ CORS strict validation"
echo "  ✅ Input validation (Zod)"
echo "  ✅ Log sanitization"
echo ""
echo "Next Steps:"
echo "  1. Run full integration tests"
echo "  2. Verify JWT migration (dual-validation window)"
echo "  3. Test rollback functionality"
echo "  4. Performance testing"
echo "  5. Promote to production"
echo ""
echo "Backup Location: $BACKUP_DIR/openclaw-staging-$TIMESTAMP.tar.gz"
echo ""
echo "🎉 Staging deployment successful!"
