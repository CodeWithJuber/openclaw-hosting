# Multi-stage build for API
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/db/package*.json ./packages/db/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm --filter db build
RUN pnpm --filter shared build
RUN pnpm --filter api build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/packages/db/dist ./node_modules/@openclaw/db/dist
COPY --from=builder /app/packages/shared/dist ./node_modules/@openclaw/shared/dist

# Install production dependencies
RUN pnpm install --prod

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:2222/health || exit 1

EXPOSE 2222

CMD ["node", "dist/index.js"]
