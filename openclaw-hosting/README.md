# OpenClaw Hosting

Monorepo for OpenClaw Hosting platform - WHMCS-integrated VPS provisioning for OpenClaw instances.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  WHMCS (Billing)  →  API (Hono.js)  →  VPS (Hetzner Cloud)  │
└─────────────────────────────────────────────────────────────┘
                           ↓
              React Dashboard (Customer Portal)
```

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **API**: Hono.js + Node.js 22 + Drizzle ORM
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Database**: PostgreSQL 16
- **Cloud**: Hetzner Cloud API

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Start local development (Docker)
docker-compose up -d

# Or start services individually
pnpm dev
```

## Project Structure

```
openclaw-hosting/
├── apps/
│   ├── api/           # Hono.js backend (port 2222)
│   └── web/           # React dashboard (port 5173)
├── packages/
│   ├── db/            # Drizzle ORM + database schema
│   └── shared/        # Shared types + utilities
├── docker-compose.yml # Local dev environment
└── turbo.json         # Build pipeline config
```

## Scripts

```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm lint         # Lint all code
pnpm check-types  # Type check all packages
```

## Database

```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema changes (dev only)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

## Environment Variables

See `.env.example` for all required variables.

## License

MIT
