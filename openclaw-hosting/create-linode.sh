#!/bin/bash
# Linode Instance Creation Script
# Requires LINODE_API_TOKEN environment variable

set -e

# Configuration
LINODE_API_TOKEN="${LINODE_API_TOKEN:-}"
REGION="us-east"  # Newark
INSTANCE_TYPE="g6-standard-2"  # CPX21 equivalent (4GB RAM, 2 vCPU)
IMAGE="linode/ubuntu24.04"
LABEL="openclaw-hosting-dev"
ROOT_PASS="$(openssl rand -base64 24)"

if [ -z "$LINODE_API_TOKEN" ]; then
    echo "Error: LINODE_API_TOKEN environment variable is not set"
    echo "Please set it with: export LINODE_API_TOKEN='your-token-here'"
    exit 1
fi

echo "=== Creating Linode Instance ==="
echo "Region: $REGION"
echo "Type: $INSTANCE_TYPE (CPX21 - 4GB RAM, 2 vCPU)"
echo "Image: $IMAGE"
echo "Label: $LABEL"
echo ""

# Create the instance
RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $LINODE_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"region\": \"$REGION\",
        \"type\": \"$INSTANCE_TYPE\",
        \"image\": \"$IMAGE\",
        \"label\": \"$LABEL\",
        \"root_pass\": \"$ROOT_PASS\",
        \"booted\": true
    }" \
    https://api.linode.com/v4/linode/instances)

# Check for errors
if echo "$RESPONSE" | grep -q '"errors"'; then
    echo "Error creating instance:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Extract instance details
INSTANCE_ID=$(echo "$RESPONSE" | jq -r '.id')
INSTANCE_IP=$(echo "$RESPONSE" | jq -r '.ipv4[0]')
INSTANCE_STATUS=$(echo "$RESPONSE" | jq -r '.status')

echo "Instance created successfully!"
echo "  ID: $INSTANCE_ID"
echo "  IP: $INSTANCE_IP"
echo "  Status: $INSTANCE_STATUS"
echo ""

# Save credentials
cat > /root/.openclaw/workspace/openclaw-hosting/server-credentials.txt << EOF
=== OpenClaw Hosting Server Credentials ===
Created: $(date)
Instance ID: $INSTANCE_ID
Label: $LABEL
Region: $REGION

=== SSH Access ===
IP Address: $INSTANCE_IP
Username: root
Password: $ROOT_PASS

SSH Command:
  ssh root@$INSTANCE_IP

=== Server Configuration ===
- Ubuntu 24.04 LTS
- 4GB RAM, 2 vCPU (CPX21)
- Docker, Node.js 22, PostgreSQL 16, PM2
- Firewall: Ports 22, 80, 443, 2222, 5173 open

=== Next Steps ===
1. SSH into the server: ssh root@$INSTANCE_IP
2. The setup script should have run automatically via StackScript
   OR run: bash /root/setup-server.sh
3. Deploy your OpenClaw Hosting application to /opt/openclaw-hosting

EOF

echo "Credentials saved to: server-credentials.txt"
echo ""

# Wait for instance to be running
echo "Waiting for instance to be fully provisioned..."
for i in {1..30}; do
    STATUS=$(curl -s -H "Authorization: Bearer $LINODE_API_TOKEN" \
        https://api.linode.com/v4/linode/instances/$INSTANCE_ID | jq -r '.status')
    
    if [ "$STATUS" = "running" ]; then
        echo "Instance is running!"
        break
    fi
    
    echo "  Status: $STATUS (waiting...)"
    sleep 10
done

echo ""
echo "=== Server Ready ==="
echo "IP Address: $INSTANCE_IP"
echo "SSH: ssh root@$INSTANCE_IP"
echo "Password: $ROOT_PASS"
echo ""
echo "Waiting for SSH to be available..."

# Wait for SSH to be available
for i in {1..30}; do
    if nc -z -w5 "$INSTANCE_IP" 22 2>/dev/null; then
        echo "SSH is available!"
        break
    fi
    echo "  Waiting for SSH..."
    sleep 5
done

echo ""
echo "=== Copying Setup Script to Server ==="
# Copy the setup script to the server
sshpass -p "$ROOT_PASS" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    /root/.openclaw/workspace/openclaw-hosting/setup-server.sh \
    root@$INSTANCE_IP:/root/setup-server.sh

# Run the setup script remotely
echo "Running setup script on server..."
sshpass -p "$ROOT_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    root@$INSTANCE_IP "bash /root/setup-server.sh"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Server IP: $INSTANCE_IP"
echo "SSH User: root"
echo "SSH Password: $ROOT_PASS"
echo ""
echo "To connect: ssh root@$INSTANCE_IP"
