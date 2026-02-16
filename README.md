# OpenClaw Hosting Platform

> **One-command OpenClaw VPS provisioning** — WHMCS-integrated, API-driven, customer self-service.

[![CI](https://github.com/yourorg/openclaw-hosting/actions/workflows/ci.yml/badge.svg)](https://github.com/yourorg/openclaw-hosting/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/yourorg/openclaw-hosting.git
cd openclaw-hosting
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start local development
pnpm docker:up        # Starts PostgreSQL, Redis, Mailpit
pnpm db:migrate       # Run database migrations
pnpm dev              # Starts API + Dashboard

# 4. Open http://localhost:5173
```

## Project Structure

```
openclaw-hosting/
├── apps/
│   ├── api/              # Hono.js API (Agent 2)
│   ├── web/              # React Dashboard (Agent 3)
│   └── landing/          # Marketing site
├── modules/
│   └── whmcs/            # WHMCS Provisioning Module (Agent 1)
├── packages/
│   ├── shared/           # Shared types & utilities
│   ├── db/               # Drizzle ORM schema
│   └── email/            # React Email templates
├── scripts/
│   ├── cloud-init.yaml   # VPS provisioning (Agent 4)
│   └── deploy.sh         # Production deployment
├── tests/
│   ├── unit/             # Vitest + PHPUnit (Agent 5)
│   ├── integration/
│   ├── e2e/              # Playwright
│   └── load/             # k6
└── .github/workflows/    # CI/CD (Agent 4)
```

## 6-Agent Parallel Development

| Agent | Focus | Status | Branch Prefix |
|-------|-------|--------|---------------|
| **Agent 1** | WHMCS PHP Module | 🔄 Ready | `feature/whmcs-*` |
| **Agent 2** | Hono.js API | 🔄 Ready | `feature/api-*` |
| **Agent 3** | React Dashboard | 🔄 Ready | `feature/dashboard-*` |
| **Agent 4** | Infrastructure | 🔄 Ready | `feature/infra-*` |
| **Agent 5** | Testing | ⏳ Week 3 | `feature/test-*` |
| **Agent 6** | Security | ⏳ Week 5 | `feature/security-*` |

## Key Documents

| Document | Purpose | Owner |
|----------|---------|-------|
| [`API-CONTRACTS.md`](API-CONTRACTS.md) | API endpoints, auth, request/response types | Agent 2 |
| [`DATABASE.md`](DATABASE.md) | PostgreSQL schema, Drizzle ORM | Agent 2 |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System diagram, tech stack, data flow | All |
| [`AGENT-1.md`](AGENT-1.md) | WHMCS module tasks | Agent 1 |
| [`AGENT-2.md`](AGENT-2.md) | API backend tasks | Agent 2 |
| [`AGENT-3.md`](AGENT-3.md) | Dashboard tasks | Agent 3 |
| [`AGENT-4.md`](AGENT-4.md) | Infrastructure tasks | Agent 4 |
| [`AGENT-5.md`](AGENT-5.md) | Testing tasks | Agent 5 |
| [`AGENT-6.md`](AGENT-6.md) | Security tasks | Agent 6 |

## Development Workflow

### Branch Naming

```
feature/whmcs-metadata      # Agent 1
feature/api-auth            # Agent 2
feature/dashboard-overview  # Agent 3
feature/infra-cloud-init    # Agent 4
```

### Commit Convention

```
feat(whmcs): add ConfigOptions for plan selection
feat(api): implement HMAC authentication
fix(dashboard): dark mode toggle persistence
docs(architecture): update data flow diagram
test(api): add provisioner unit tests
```

### Pull Request Template

```markdown
## Agent
- [ ] Agent 1 — WHMCS
- [ ] Agent 2 — API
- [ ] Agent 3 — Dashboard
- [ ] Agent 4 — Infrastructure
- [ ] Agent 5 — Testing
- [ ] Agent 6 — Security

## Changes
<!-- What does this PR do? -->

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Breaking Changes
<!-- List any breaking changes -->
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/openclawhost

# Hetzner Cloud
HETZNER_API_TOKEN=your-hetzner-token

# Cloudflare
CLOUDFLARE_API_TOKEN=your-cf-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_DOMAIN=yourdomain.com

# Firebase Auth
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----

# WHMCS Integration
WHMCS_API_KEY=shared-secret
WHMCS_HMAC_SECRET=another-secret

# JWT
JWT_SECRET=random-32-char-string

# App
API_URL=https://api.yourdomain.com
DASHBOARD_URL=https://dash.yourdomain.com
```

## Commands

```bash
# Development
pnpm install            # Install all dependencies
pnpm dev                # Start API + Dashboard
pnpm docker:up          # Start PostgreSQL, Redis, Mailpit
pnpm docker:down        # Stop services

# Database
pnpm db:generate        # Generate Drizzle migrations
pnpm db:migrate         # Run migrations
pnpm db:studio          # Open Drizzle Studio

# Testing
pnpm test               # Run unit tests
pnpm test:integration   # Run integration tests
pnpm test:e2e           # Run Playwright tests
pnpm test:load          # Run k6 load tests

# Build
pnpm build              # Build all apps
pnpm build:api          # Build API only
pnpm build:web          # Build Dashboard only

# Lint
pnpm lint               # Run ESLint
pnpm lint:fix           # Fix ESLint issues
pnpm typecheck          # Run TypeScript checks

# Deployment
pnpm deploy:staging     # Deploy to staging
pnpm deploy:production  # Deploy to production
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/instances` | WHMCS | Create new instance |
| GET | `/api/instances/:id` | JWT | Get instance details |
| POST | `/api/instances/:id/suspend` | WHMCS | Suspend instance |
| POST | `/api/instances/:id/unsuspend` | WHMCS | Unsuspend instance |
| DELETE | `/api/instances/:id` | WHMCS | Terminate instance |
| POST | `/api/instances/:id/reboot` | JWT | Reboot instance |
| GET | `/api/instances/:id/metrics` | JWT | Get metrics |
| POST | `/api/auth/sso` | HMAC | SSO from WHMCS |
| POST | `/api/webhooks/whmcs` | HMAC | WHMCS webhooks |
| GET | `/api/health` | None | Health check |

See [`API-CONTRACTS.md`](API-CONTRACTS.md) for full details.

## Customer Flow

```
1. Customer visits WHMCS order form
2. Selects plan (starter/professional/enterprise)
3. Selects region (us-east/eu-frankfurt/etc)
4. Completes payment (Stripe/PayPal)
5. WHMCS calls API to provision instance (~90s)
6. Customer receives email with dashboard URL
7. Customer clicks SSO link → Auto-logged in
8. Customer configures channels (Telegram/Discord/etc)
9. OpenClaw is ready to use!
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **API** | Hono.js, Node.js 22, TypeScript |
| **Database** | PostgreSQL 16, Drizzle ORM |
| **Frontend** | React 18, Vite, TypeScript |
| **UI** | shadcn/ui, Tailwind CSS 4, Radix |
| **State** | Zustand, TanStack Query |
| **Charts** | Recharts |
| **Auth** | Firebase Auth, HMAC |
| **Cloud** | Hetzner Cloud API |
| **DNS** | Cloudflare API |
| **Email** | Resend, React Email |
| **WHMCS** | PHP 8.1 |
| **CI/CD** | GitHub Actions |
| **Testing** | Vitest, Playwright, k6, PHPUnit |

## Timeline

| Week | Milestone |
|------|-----------|
| 1-2 | API skeleton, database, auth |
| 3-4 | Provisioning service, WHMCS module |
| 5-6 | Dashboard UI, webhooks |
| 7-8 | Testing, security review |
| 9-10 | Load testing, hardening |
| 11-12 | Staging deployment, QA |
| 13-14 | Production launch |

## Contributing

1. Pick an agent file (AGENT-1.md through AGENT-6.md)
2. Create a branch: `feature/[agent-prefix]-[task]`
3. Follow the task list in the agent file
4. Submit PR with acceptance criteria checked
5. Request review from other agents for cross-cutting changes

## Support

- **Documentation:** See agent files for detailed specs
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

## License

MIT © OpenClaw Hosting
