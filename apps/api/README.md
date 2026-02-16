# OpenClaw API

Hono.js-based REST API for OpenClaw hosting platform.

## Architecture

```
apps/api/
├── src/
│   ├── index.ts           # Main entry point
│   ├── middleware/
│   │   ├── auth.ts        # HMAC + JWT authentication
│   │   ├── error.ts       # Error handling
│   │   └── rateLimit.ts   # Rate limiting
│   ├── routes/
│   │   ├── instances.ts   # Instance CRUD
│   │   ├── auth.ts        # SSO authentication
│   │   ├── webhooks.ts    # WHMCS webhooks
│   │   ├── admin.ts       # Admin endpoints
│   │   └── health.ts      # Health checks
│   ├── services/
│   │   ├── provisioner.ts # Provisioning orchestrator
│   │   ├── hetzner.ts     # Hetzner Cloud API
│   │   ├── cloudflare.ts  # Cloudflare DNS API
│   │   └── cloudinit.ts   # Cloud-init templates
│   └── utils/
│       └── crypto.ts      # Cryptographic utilities
```

## Quick Start

1. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

2. Install dependencies:
```bash
pnpm install
```

3. Run database migrations:
```bash
pnpm db:push
```

4. Start development server:
```bash
pnpm dev:api
```

## API Endpoints

### Health
- `GET /api/health` - Health check

### Instances
- `POST /api/instances` - Create instance (WHMCS)
- `GET /api/instances/:id` - Get instance
- `POST /api/instances/:id/suspend` - Suspend instance
- `POST /api/instances/:id/unsuspend` - Unsuspend instance
- `DELETE /api/instances/:id` - Terminate instance
- `POST /api/instances/:id/reboot` - Reboot instance
- `POST /api/instances/:id/resize` - Resize instance
- `GET /api/instances/:id/metrics` - Get metrics
- `GET /api/instances/:id/logs` - Get logs
- `POST /api/instances/:id/config` - Update config
- `GET /api/instances/:id/ai-usage` - Get AI usage
- `POST /api/instances/:id/ready` - Instance ready callback

### Authentication
- `POST /api/auth/sso` - WHMCS SSO

### Webhooks
- `POST /api/webhooks/whmcs` - WHMCS webhooks

### Admin
- `GET /api/admin/instances` - List all instances
- `GET /api/admin/users` - List all users
- `GET /api/admin/stats` - Platform statistics

## Authentication

### WHMCS (Server-to-Server)
```
X-API-Key: <WHMCS_API_KEY>
X-Timestamp: <unix-timestamp>
X-Signature: HMAC-SHA256(body + timestamp, WHMCS_HMAC_SECRET)
```

### Dashboard (Client)
```
Authorization: Bearer <JWT>
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `HETZNER_API_TOKEN` | Hetzner Cloud API token |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID |
| `CLOUDFLARE_DOMAIN` | Base domain for instances |
| `JWT_SECRET` | JWT signing secret |
| `WHMCS_API_KEY` | WHMCS API key |
| `WHMCS_HMAC_SECRET` | WHMCS HMAC secret |

## Services

### HetznerService
Manages Hetzner Cloud servers:
- Create/delete servers
- Power on/off/reboot
- Resize instances
- SSH key management

### CloudflareService
Manages Cloudflare DNS:
- Create A/CNAME records
- Delete records
- Zone verification

### Provisioner
Orchestrates instance lifecycle:
- Provisioning workflow
- Suspend/unsuspend
- Termination with cleanup
- Rollback on failure
