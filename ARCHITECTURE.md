# Architecture & System Design

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CUSTOMER FLOW                           │
│  Browse Plans → Select → Pay → Wait 90s → Dashboard Ready       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    WHMCS (Billing Layer)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────────────┐    │
│  │  Order Form  │ │ Invoice/Pay  │ │     Client Area       │    │
│  │ Plan Select  │ │ Stripe/PP    │ │ SSO → Dashboard       │    │
│  │ Region Pick  │ │ Recurring    │ │ Support Tickets       │    │
│  └──────┬───────┘ └──────┬───────┘ └───────────┬───────────┘    │
│         │                │                     │                │
│  ┌──────▼─────────────────▼─────────────────────▼───────────┐   │
│  │        openclawhost PHP Provisioning Module              │   │
│  │  CreateAccount() │ Suspend() │ Terminate() │ SSO()       │   │
│  └──────────────────────────┬────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ HTTPS + API Key
┌─────────────────────────────▼──────────────────────────────────┐
│              ORCHESTRATION API (Hono.js + Node.js)             │
│  ┌────────────┐ ┌──────────────┐ ┌──────────┐ ┌────────────┐    │
│  │ Instance   │ │   Auth/SSO   │ │ Metrics  │ │ Webhooks   │    │
│  │ Controller │ │  JWT + HMAC  │ │ Poller   │ │ Handler    │    │
│  └─────┬──────┘ └──────────────┘ └────┬─────┘ └────────────┘    │
│        │                              │                         │
│  ┌─────▼──────────────────────────────▼─────────────────────┐   │
│  │              PostgreSQL + Drizzle ORM                    │   │
│  │  users │ instances │ metrics │ ai_usage │ audit_log      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────┬───────────────────┬───────────────────┬───────────────┘
         │                   │                   │
   ┌─────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
   │ Hetzner   │      │ Cloudflare  │     │   Resend    │
   │ Cloud API │      │   DNS API   │     │   Email     │
   │ VPS Mgmt  │      │  A Records  │     │   Alerts    │
   └────┬──────┘      └─────────────┘     └─────────────┘
        │ cloud-init
   ┌────▼──────────────────────────────────────────────┐
   │           CUSTOMER VPS (Ubuntu 24.04)             │
   │  ┌──────────┐ ┌─────────┐ ┌──────────────────┐    │
   │  │ OpenClaw │ │  Nginx  │ │  node_exporter   │    │
   │  │ Gateway  │ │ Reverse │ │  Prometheus      │    │
   │  │ Port     │ │ Proxy   │ │  Metrics         │    │
   │  │ 18789    │ │ 443/80  │ │  Port 9100       │    │
   │  └──────────┘ └─────────┘ └──────────────────┘    │
   │  ┌──────────┐ ┌─────────┐ ┌──────────────────┐    │
   │  │ Certbot  │ │   UFW   │ │ Systemd Service  │    │
   │  │ SSL Auto │ │ Firewall│ │ Auto-restart     │    │
   │  └──────────┘ └─────────┘ └──────────────────┘    │
   └───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│              REACT DASHBOARD (apps/web)                       │
│              SSO from WHMCS or Magic Link Auth                │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Overview │ │  Instance  │ │ Channels │ │  AI Settings  │   │
│  │  Status  │ │ Management │ │  Wizard  │ │  Key Vault    │   │
│  └──────────┘ └────────────┘ └──────────┘ └───────────────┘   │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌───────────────┐   │
│  │  Skills  │ │ Analytics  │ │ Backups  │ │  Admin Panel  │   │
│  │  Market  │ │  Charts    │ │ Restore  │ │ All Instances │   │
│  └──────────┘ └────────────┘ └──────────┘ └───────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Monorepo** | Turborepo + pnpm | latest | Fast builds, workspace packages |
| **API** | Hono.js | 4.x | Ultra-fast, TypeScript-native |
| **Runtime** | Node.js | 22 LTS | Stable, long-term support |
| **Database** | PostgreSQL | 16 | Reliable, JSONB for flexible data |
| **ORM** | Drizzle | latest | Type-safe, zero overhead |
| **Frontend** | React | 18.x | Component ecosystem |
| **Build** | Vite | 6.x | Fast HMR, optimized builds |
| **UI Kit** | shadcn/ui + Radix | latest | Accessible, customizable |
| **CSS** | Tailwind CSS | 4.x | Utility-first, design system |
| **State** | Zustand | 5.x | Minimal, performant |
| **Data Fetching** | TanStack Query | 5.x | Cache, retry, real-time |
| **Charts** | Recharts | 2.x | React-native charting |
| **Auth** | Firebase Auth | latest | Passwordless, free tier |
| **Email** | Resend + React Email | latest | Beautiful templates |
| **WHMCS Module** | PHP | 8.1+ | WHMCS requirement |
| **Cloud** | Hetzner Cloud API | v1 | Best price/performance |
| **DNS** | Cloudflare API | v4 | Free DNS + CDN |
| **SSL** | Let's Encrypt + Certbot | latest | Free HTTPS |
| **CI/CD** | GitHub Actions | latest | Native Git integration |

## Monorepo Structure

```
openclaw-hosting/
├── apps/
│   ├── api/                          # Agent 2: Hono.js backend
│   │   ├── src/
│   │   │   ├── index.ts              # App entry point
│   │   │   ├── routes/
│   │   │   │   ├── instances.ts      # Instance CRUD
│   │   │   │   ├── auth.ts           # SSO + JWT
│   │   │   │   ├── metrics.ts        # Performance data
│   │   │   │   ├── webhooks.ts       # WHMCS webhook receiver
│   │   │   │   ├── admin.ts          # Admin-only routes
│   │   │   │   └── health.ts         # Health check
│   │   │   ├── services/
│   │   │   │   ├── hetzner.ts        # Hetzner Cloud API client
│   │   │   │   ├── cloudflare.ts     # DNS management
│   │   │   │   ├── provisioner.ts    # Orchestration logic
│   │   │   │   ├── metrics.ts        # Metrics collection
│   │   │   │   └── email.ts          # Email sending
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts           # JWT verification
│   │   │   │   ├── apiKey.ts         # WHMCS API key auth
│   │   │   │   ├── rateLimit.ts      # Rate limiting
│   │   │   │   └── logger.ts         # Request logging
│   │   │   └── utils/
│   │   │       ├── crypto.ts         # HMAC, encryption
│   │   │       └── validators.ts     # Zod schemas
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                          # Agent 3: React dashboard
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   │   ├── client/
│   │   │   │   │   ├── Overview.tsx
│   │   │   │   │   ├── Instance.tsx
│   │   │   │   │   ├── Channels.tsx
│   │   │   │   │   ├── AISettings.tsx
│   │   │   │   │   ├── Skills.tsx
│   │   │   │   │   └── Analytics.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── Dashboard.tsx
│   │   │   │       ├── Instances.tsx
│   │   │   │       ├── Provisioning.tsx
│   │   │   │       └── WHMCSSync.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── layout/
│   │   │   │   ├── charts/
│   │   │   │   ├── instance/
│   │   │   │   ├── channels/
│   │   │   │   └── admin/
│   │   │   ├── hooks/
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── lib/
│   │   │   │   ├── api.ts            # API client
│   │   │   │   └── utils.ts
│   │   │   └── styles/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── landing/                      # Marketing site
│       └── ...
│
├── modules/
│   └── whmcs/                        # Agent 1: WHMCS module
│       └── openclawhost/
│           ├── openclawhost.php      # Main module
│           ├── hooks.php             # Event hooks
│           ├── lib/
│           │   ├── ApiClient.php     # HTTP client
│           │   ├── Config.php
│           │   └── SSO.php           # SSO token generation
│           ├── templates/
│           │   ├── clientarea.tpl
│           │   └── admin.tpl
│           ├── tests/
│           │   └── OpenClawHostTest.php
│           └── logo.png
│
├── packages/
│   ├── shared/                       # Shared types + utilities
│   │   ├── src/
│   │   │   ├── types.ts              # ALL shared TypeScript types
│   │   │   ├── constants.ts          # Shared constants
│   │   │   ├── api-client.ts         # HTTP client utility
│   │   │   └── validators.ts         # Zod schemas
│   │   └── package.json
│   │
│   ├── db/                           # Database package
│   │   ├── src/
│   │   │   ├── schema.ts             # Drizzle schema
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   ├── email/                        # Email templates
│   │   ├── src/
│   │   │   ├── welcome.tsx
│   │   │   ├── suspended.tsx
│   │   │   ├── alert.tsx
│   │   │   └── provisioned.tsx
│   │   └── package.json
│   │
│   └── i18n/                         # Internationalization
│       └── ...
│
├── scripts/
│   ├── cloud-init.yaml               # Agent 4: VPS provisioning
│   ├── cloud-init-template.ts        # Template renderer
│   ├── deploy.sh                     # Production deployment
│   └── health-check.sh               # Instance health checker
│
├── tests/                            # Agent 5: Test suites
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── load/
│
├── .github/
│   └── workflows/                    # Agent 4: CI/CD
│       ├── ci.yml
│       ├── deploy-staging.yml
│       ├── deploy-production.yml
│       └── security-scan.yml
│
├── docker-compose.yml                # Local dev environment
├── turbo.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

## Data Flow: New Customer Order

```
1. Customer selects plan on WHMCS order form
2. Customer pays via Stripe/PayPal
3. WHMCS marks order as "Paid"
4. WHMCS calls openclawhost_CreateAccount()
5. PHP module POSTs to Orchestration API:
   POST /api/instances
   {
     "whmcs_service_id": 1234,
     "whmcs_client_id": 567,
     "plan": "professional",
     "region": "eu-frankfurt",
     "email": "user@example.com"
   }
6. API creates DB record (status: "provisioning")
7. API calls Hetzner:
   POST /v1/servers
   - server_type: cpx31 (4vCPU/8GB)
   - location: fsn1
   - user_data: rendered cloud-init.yaml
8. Hetzner returns server IP within 30s
9. API calls Cloudflare:
   POST /zones/{id}/dns_records
   - type: A, name: abc1234, content: <IP>
10. cloud-init runs on VPS (60-90s):
    - Install Node.js 22
    - npm install -g openclaw@latest
    - Configure Nginx reverse proxy
    - Request Let's Encrypt SSL cert
    - Start OpenClaw systemd service
    - POST callback to API: /api/instances/{id}/ready
11. API updates status to "active"
12. API sends welcome email via Resend
13. API sends webhook to WHMCS: provisioning complete
14. Customer receives email with:
    - Dashboard URL: https://abc1234.yourdomain.com
    - Pairing code for messaging channels
```

## Environment Variables (Master List)

```env
# ─── Database ───
DATABASE_URL=postgresql://user:password@localhost:5432/openclawhost

# ─── Hetzner Cloud ───
HETZNER_API_TOKEN=your-hetzner-token

# ─── Cloudflare ───
CLOUDFLARE_API_TOKEN=your-cf-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_DOMAIN=yourdomain.com

# ─── Firebase Auth ───
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# ─── Resend Email ───
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com

# ─── WHMCS Integration ───
WHMCS_API_KEY=your-shared-secret-key
WHMCS_API_URL=https://your-whmcs.com/includes/api.php
WHMCS_HMAC_SECRET=your-hmac-secret

# ─── JWT ───
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRY=24h

# ─── App ───
API_PORT=2222
API_URL=https://api.yourdomain.com
DASHBOARD_URL=https://dash.yourdomain.com
NODE_ENV=production
```
