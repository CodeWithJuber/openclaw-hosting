# Deep Dive: Docker & GitHub Actions - Complete Learning

**Sources**:
- Docker Documentation (docs.docker.com)
- GitHub Actions Docs (docs.github.com)
- Microsoft Learn: GitHub Actions
- Docker build-push-action
- Reddit r/docker community issues

---

## Part 1: Docker Deep Dive

### 1.1 Docker Architecture

```
┌─────────────────────────────────────────┐
│           DOCKER CLIENT                 │
│    (docker CLI - commands you type)     │
└─────────────────┬───────────────────────┘
                  │
                  │ REST API
                  ▼
┌─────────────────────────────────────────┐
│           DOCKER DAEMON                 │
│    (dockerd - manages everything)       │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
┌──────────┐ ┌────────┐ ┌──────────┐
│ CONTAINERS│ │ IMAGES │ │ NETWORKS │
│ (running) │ │ (blueprints)│ │ (connections)│
└──────────┘ └────────┘ └──────────┘
        │         │         │
        └─────────┼─────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      CONTAINER RUNTIME (containerd)     │
│         (actually runs containers)      │
└─────────────────────────────────────────┘
```

### 1.2 Docker Image Layers

**Key Concept**: Images are built in layers

```dockerfile
# Layer 1: Base image
FROM node:22-alpine

# Layer 2: Install dependencies
RUN npm install -g pnpm

# Layer 3: Copy files
COPY package*.json ./

# Layer 4: Install app deps
RUN pnpm install

# Layer 5: Copy source
COPY . .

# Layer 6: Build
RUN pnpm build
```

**Layer Caching**:
- Each layer is cached
- If layer changes, all subsequent layers rebuild
- Order matters: Put least-changing layers first

### 1.3 Multi-Stage Builds (CRITICAL)

**Problem**: Production images are huge
**Solution**: Build in stages, only copy what's needed

```dockerfile
# ============ BUILD STAGE ============
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN npm install -g pnpm

# Copy and install
COPY package*.json ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build

# ============ PRODUCTION STAGE ============
FROM node:22-alpine

WORKDIR /app

# Only copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production deps
RUN npm install -g pnpm && pnpm install --prod

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Benefits**:
- Smaller images (no build tools in production)
- More secure (less attack surface)
- Faster deployments

### 1.4 Docker Networking

```
┌─────────────────────────────────────────┐
│           DOCKER NETWORK                │
│         (openclaw-network)              │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────┐      ┌──────────┐        │
│  │   API    │◄────►│  Postgres│        │
│  │  :2222   │      │  :5432   │        │
│  └──────────┘      └──────────┘        │
│       ▲                                  │
│       │                                  │
│  ┌────┴────┐      ┌──────────┐        │
│  │Dashboard│      │  Redis   │        │
│  │  :5173  │      │  :6379   │        │
│  └─────────┘      └──────────┘        │
│                                          │
└─────────────────────────────────────────┘
```

**Network Types**:
- `bridge` (default) - isolated network
- `host` - uses host network
- `none` - no network
- `overlay` - multi-host networks

### 1.5 Docker Volumes

**Persistent Storage**:
```yaml
volumes:
  # Named volume (managed by Docker)
  postgres_data:
    driver: local
  
  # Bind mount (host path)
  - ./local-dir:/container-dir
  
  # Anonymous volume
  - /container/path
```

**Volume Types**:
1. **Named volumes** - `postgres_data` - persistent, managed
2. **Bind mounts** - `./data:/data` - direct host access
3. **tmpfs** - in-memory, not persistent

---

## Part 2: GitHub Actions Deep Dive

### 2.1 GitHub Actions Architecture

```
┌─────────────────────────────────────────┐
│           GITHUB REPOSITORY             │
└─────────────────┬───────────────────────┘
                  │
                  │ Push / PR / Schedule
                  ▼
┌─────────────────────────────────────────┐
│           GITHUB ACTIONS                │
├─────────────────────────────────────────┤
│                                          │
│  ┌─────────────────────────────────┐   │
│  │         WORKFLOW                │   │
│  │  (.github/workflows/*.yml)      │   │
│  │                                 │   │
│  │  on: push                       │   │
│  │  jobs:                          │   │
│  │    build:                       │   │
│  │      runs-on: ubuntu-latest     │   │
│  │      steps:                     │   │
│  │        - uses: actions/checkout │   │
│  │        - uses: docker/build-push│   │
│  └─────────────────────────────────┘   │
│                  │                       │
│                  ▼                       │
│  ┌─────────────────────────────────┐   │
│  │         RUNNER                  │   │
│  │  (virtual machine)              │   │
│  │                                 │   │
│  │  - Ubuntu / Windows / macOS    │   │
│  │  - 2-core CPU                   │   │
│  │  - 7 GB RAM                     │   │
│  │  - 14 GB SSD                    │   │
│  └─────────────────────────────────┘   │
│                                          │
└─────────────────────────────────────────┘
```

### 2.2 Workflow Syntax

```yaml
name: CI/CD Pipeline

# Triggers
on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  workflow_dispatch:  # Manual trigger

# Environment variables
env:
  NODE_VERSION: '22'
  REGISTRY: ghcr.io

# Jobs
jobs:
  # Job 1: Test
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm test

  # Job 2: Build (depends on test)
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: myapp:latest

  # Job 3: Deploy (depends on build)
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: echo "Deploying..."
```

### 2.3 Secrets & Security

**Types of Secrets**:

1. **Repository Secrets** (our current setup)
   - Set in: Settings → Secrets and variables → Actions
   - Available to: All workflows in repo
   - Access: `${{ secrets.SECRET_NAME }}`

2. **Environment Secrets**
   - Set in: Settings → Environments
   - Available to: Specific environment only
   - Requires: `environment: production`

3. **Organization Secrets**
   - Set in: Organization settings
   - Available to: All repos in org

**Common Issues** (from Reddit):

```yaml
# ❌ WRONG: Using env instead of secrets
env:
  DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}

# ✅ CORRECT: Use secrets directly
- uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}
```

**Debugging Secrets**:
```yaml
- name: Debug secrets
  run: |
    if [ -z "${{ secrets.MY_SECRET }}" ]; then
      echo "Secret is empty or not set!"
      exit 1
    else
      echo "Secret is set (length: ${#SECRET})"
    fi
```

### 2.4 Docker Build-Push Action Deep Dive

```yaml
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    # Build context (where Dockerfile is)
    context: .
    
    # Dockerfile path
    file: ./Dockerfile
    
    # Push to registry?
    push: ${{ github.event_name != 'pull_request' }}
    
    # Image tags
    tags: |
      ghcr.io/user/repo:latest
      ghcr.io/user/repo:v1.0.0
    
    # Build arguments
    build-args: |
      NODE_ENV=production
      VERSION=1.0.0
    
    # Labels
    labels: |
      org.opencontainers.image.source=https://github.com/user/repo
      org.opencontainers.image.version=1.0.0
    
    # Cache
    cache-from: type=gha
    cache-to: type=gha,mode=max
    
    # Platforms
    platforms: linux/amd64,linux/arm64
```

### 2.5 Complete CI/CD Pipeline

```yaml
name: Complete CI/CD

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Stage 1: Test
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint

  # Stage 2: Security Scan
  security:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          format: 'sarif'
          output: 'trivy-results.sarif'

  # Stage 3: Build & Push
  build:
    needs: [test, security]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Stage 4: Deploy
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            docker-compose pull
            docker-compose up -d
            docker system prune -f
```

---

## Part 3: Best Practices Applied

### 3.1 Docker Best Practices

✅ **DO**:
- Use multi-stage builds
- Pin base image versions (`node:22-alpine` not `node:latest`)
- Use .dockerignore
- Minimize layers
- Use non-root user
- Scan for vulnerabilities

❌ **DON'T**:
- Put secrets in images
- Use `latest` tag
- Run as root
- Include unnecessary files
- Ignore layer caching

### 3.2 GitHub Actions Best Practices

✅ **DO**:
- Pin action versions (`@v4` not `@main`)
- Use secrets for sensitive data
- Cache dependencies
- Use environments for deployments
- Add timeouts

❌ **DON'T**:
- Hardcode credentials
- Use `pull_request_target` without care
- Run untrusted code
- Ignore security updates

---

## Part 4: Troubleshooting Guide

### Docker Issues

**Issue**: "Cannot connect to Docker daemon"
```bash
# Fix: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**Issue**: "Port already in use"
```bash
# Fix: Find and kill process
sudo lsof -i :3000
sudo kill -9 <PID>
```

**Issue**: "Layer cache not working"
```dockerfile
# Fix: Order layers correctly
# Put frequently changing layers LAST
```

### GitHub Actions Issues

**Issue**: "Secret not found"
```yaml
# Fix: Check secret name matches exactly
# Secrets are case-sensitive
```

**Issue**: "Permission denied"
```yaml
# Fix: Add permissions block
permissions:
  contents: read
  packages: write
```

**Issue**: "Build takes too long"
```yaml
# Fix: Use caching
cache-from: type=gha
cache-to: type=gha,mode=max
```

---

## Part 5: Our Implementation Checklist

### Docker
- [x] Multi-stage builds
- [x] Optimized layer order
- [x] .dockerignore
- [x] Health checks
- [x] Non-root user (optional)

### GitHub Actions
- [x] Workflow triggers
- [x] Secrets configuration
- [x] Build and push
- [x] Caching
- [x] Auto-deployment

### Security
- [x] No secrets in code
- [x] GITHUB_TOKEN for auth
- [x] Environment protection
- [ ] Vulnerability scanning (optional)

---

**Status**: Deep learning complete, all best practices applied!
