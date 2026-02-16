# syntax=docker/dockerfile:1

# ============================================================================
# BUILD STAGE
# ============================================================================
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy package files first (for better caching)
COPY package*.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY packages/db/package*.json ./packages/db/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build packages in order
RUN pnpm --filter db build
RUN pnpm --filter shared build  
RUN pnpm --filter api build

# ============================================================================
# PRODUCTION STAGE
# ============================================================================
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/packages/db/dist ./node_modules/@openclaw/db/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/db/package*.json ./node_modules/@openclaw/db/
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./node_modules/@openclaw/shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/package*.json ./node_modules/@openclaw/shared/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 2222

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:2222/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["node", "dist/index.js"]
