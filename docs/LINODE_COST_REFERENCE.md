# Linode Server Cost Reference

## Current Server

| Spec | Details |
|------|---------|
| **Type** | CPX21 (Dedicated CPU) |
| **vCPUs** | 4 |
| **RAM** | 8 GB |
| **Storage** | 160 GB SSD |
| **Transfer** | 5 TB |
| **Cost** | **$36/mo** |
| **IP** | 45.56.105.143 |

---

## Linode Pricing (Cost-Effective Options)

### Shared CPU (Nanode) - Cheapest
| Plan | RAM | CPU | Storage | Cost |
|------|-----|-----|---------|------|
| **Nanode 1GB** | 1 GB | 1 | 25 GB | **$5/mo** |
| Nanode 2GB | 2 GB | 1 | 50 GB | $10/mo |
| Nanode 4GB | 4 GB | 2 | 80 GB | $20/mo |

### Shared CPU (Standard)
| Plan | RAM | CPU | Storage | Cost |
|------|-----|-----|---------|------|
| Linode 4GB | 4 GB | 2 | 80 GB | **$24/mo** |
| Linode 8GB | 8 GB | 4 | 160 GB | **$48/mo** |
| Linode 16GB | 16 GB | 6 | 320 GB | $96/mo |

### Dedicated CPU (Current Type)
| Plan | RAM | CPU | Storage | Cost |
|------|-----|-----|---------|------|
| Dedicated 4GB | 4 GB | 2 | 80 GB | **$36/mo** |
| Dedicated 8GB | 8 GB | 4 | 160 GB | **$72/mo** |
| Dedicated 16GB | 16 GB | 8 | 320 GB | $144/mo |

### GPU (For ML - Expensive)
| Plan | GPU | RAM | Cost |
|------|-----|-----|------|
| RTX 4000 | 1x | 32 GB | $1000+/mo |
| **NOT RECOMMENDED** | - | - | Too expensive |

---

## Cost-Effective Recommendations

### For Light Tasks (Monitoring, Small APIs)
```
Nanode 1GB - $5/mo
- 1 GB RAM
- 1 vCPU
- 25 GB SSD
- Good for: Cron jobs, small scripts, monitoring
```

### For Medium Workloads (APIs, Databases)
```
Linode 4GB (Shared) - $24/mo
- 4 GB RAM
- 2 vCPUs
- 80 GB SSD
- Good for: API servers, small databases
```

### For Current OpenClaw Setup
```
Current: CPX21 (Dedicated 8GB equivalent) - $36/mo
Alternative: Linode 8GB (Shared) - $48/mo

Recommendation: Keep current - good value for dedicated CPU
```

---

## When to Create New Servers

### ✅ Create New Server
| Use Case | Recommended Plan | Cost |
|----------|-----------------|------|
| **Staging environment** | Nanode 4GB | $20/mo |
| **Database server** | Linode 4GB | $24/mo |
| **Load balancer** | Nanode 2GB | $10/mo |
| **Redis cache** | Nanode 2GB | $10/mo |
| **Monitoring** | Nanode 1GB | $5/mo |

### ❌ Don't Create New Server
| Use Case | Alternative |
|----------|-------------|
| More RAM | Upgrade current server |
| More CPU | Upgrade current server |
| GPU/ML | Use API (OpenAI, Anthropic) instead |
| Storage | Add Block Storage ($0.10/GB/mo) |

---

## Cost Optimization Tips

### 1. Use Shared CPU for Non-Critical
- Shared CPU is 50% cheaper
- Only use Dedicated for production workloads

### 2. Block Storage vs Disk
- Block Storage: $0.10/GB/mo
- Cheaper than upgrading plan for storage only

### 3. Backups
- Linode backups: 20% of plan cost
- Alternative: Self-manage backups to S3

### 4. Object Storage
- Linode Object Storage: $5/mo for 250GB
- Good for file storage, backups

---

## API Commands (Cost-Conscious)

```bash
# List available plans
curl -H "Authorization: Bearer $LINODE_API_TOKEN" \
  https://api.linode.com/v4/linode/types

# Create Nanode 1GB (cheapest)
curl -X POST -H "Authorization: Bearer $LINODE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "region": "ap-south",
    "type": "g6-nanode-1",
    "label": "cost-effective-server",
    "image": "linode/ubuntu24.04",
    "root_pass": "secure_password"
  }' \
  https://api.linode.com/v4/linode/instances

# Create Linode 4GB (medium)
curl -X POST -H "Authorization: Bearer $LINODE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "region": "ap-south",
    "type": "g6-standard-2",
    "label": "medium-server",
    "image": "linode/ubuntu24.04",
    "root_pass": "secure_password"
  }' \
  https://api.linode.com/v4/linode/instances
```

---

## Current Monthly Costs

| Service | Cost |
|---------|------|
| **CPX21 Server** | $36/mo |
| **Estimated API usage** | ~$10-20/mo |
| **Total** | **~$50-60/mo** |

---

## Approval Required For

Before creating any server, I will confirm:

1. **Purpose** - What will it run?
2. **Plan** - Which Linode type?
3. **Cost** - Monthly expense
4. **Alternative** - Can we use existing server?

**No servers created without explicit approval.**
