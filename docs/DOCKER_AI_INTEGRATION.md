# Docker & AI Integration - Applied Learnings

**Sources**:
- Docker cagent (Docker's official AI agent builder)
- GitHub Topics: docker-ai
- GitHub Skills: Publish Docker Images

---

## Learning 1: Docker cagent - Declarative AI Agents

### What is Docker cagent?

Docker's official tool for building AI agents with:
- **YAML configuration** - Declarative, versionable
- **Multi-agent architecture** - Teams of specialized agents
- **Rich tool ecosystem** - MCP servers
- **AI provider agnostic** - OpenAI, Anthropic, Gemini, etc.
- **RAG built-in** - BM25, embeddings, hybrid search

### Key Features to Apply

#### 1. YAML-Based Agent Definition

**Docker cagent style**:
```yaml
# agent.yaml
agents:
  root:
    model: openai/gpt-5-mini
    description: A helpful AI assistant
    instruction: |
      You are a knowledgeable assistant that helps users.
    toolsets:
      - type: mcp
        ref: docker:duckduckgo
```

**Our Implementation**:
```yaml
# openclaw-agent.yaml
agents:
  api-agent:
    model: kimi-coding/k2p5
    description: API development specialist
    instruction: |
      You are an API development expert.
      Focus on Hono.js, security, and performance.
    tools:
      - type: mcp
        ref: github:code-review
      - type: mcp
        ref: docker:deployment
    memory:
      type: tiered
      tiers: [daily, short-term, long-term]
```

#### 2. Multi-Agent Orchestration

**Docker cagent approach**:
- Root agent delegates to specialists
- Automatic task routing
- Collaborative problem solving

**Our Enhancement**:
```yaml
# orchestration.yaml
orchestrator:
  type: aggregator
  agents:
    - name: whmcs-agent
      specialty: billing
      triggers: ["invoice", "payment", "subscription"]
    
    - name: api-agent
      specialty: backend
      triggers: ["endpoint", "api", "route"]
    
    - name: dashboard-agent
      specialty: frontend
      triggers: ["ui", "component", "page"]
    
    - name: infra-agent
      specialty: deployment
      triggers: ["deploy", "server", "docker"]
    
    - name: qa-agent
      specialty: testing
      triggers: ["test", "bug", "quality"]
    
    - name: security-agent
      specialty: security
      triggers: ["auth", "encrypt", "vulnerability"]
  
  routing:
    strategy: semantic
    fallback: api-agent
```

#### 3. MCP Tool Ecosystem

**Docker cagent uses MCP (Model Context Protocol)**:
```yaml
toolsets:
  - type: mcp
    ref: docker:duckduckgo
  - type: mcp
    ref: docker:filesystem
```

**Our MCP Integration**:
```yaml
# mcp-tools.yaml
mcp:
  servers:
    - name: github
      command: npx
      args: ["-y", "@modelcontextprotocol/server-github"]
      env:
        GITHUB_PERSONAL_ACCESS_TOKEN: ${GITHUB_TOKEN}
    
    - name: postgres
      command: npx
      args: ["-y", "@modelcontextprotocol/server-postgres"]
      env:
        DATABASE_URL: ${DATABASE_URL}
    
    - name: redis
      command: npx
      args: ["-y", "@modelcontextprotocol/server-redis"]
      env:
        REDIS_URL: ${REDIS_URL}
```

---

## Learning 2: Docker + AI Best Practices

### From docker-ai Topic

**Key Projects**:
1. **Kite** - Production-ready agentic AI framework
2. **AI Knowledge Assistant** - RAG with Docker AI local embeddings

**Best Practices**:

#### 1. Local Embeddings (Privacy)

**Don't**: Send data to external APIs for embeddings  
**Do**: Run embeddings locally in Docker

```dockerfile
# Local embeddings container
FROM python:3.11-slim

RUN pip install sentence-transformers

COPY embed.py /app/
WORKDIR /app

EXPOSE 8000
CMD ["python", "embed.py"]
```

```python
# embed.py
from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify

app = Flask(__name__)
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/embed', methods=['POST'])
def embed():
    texts = request.json['texts']
    embeddings = model.encode(texts)
    return jsonify({'embeddings': embeddings.tolist()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

#### 2. Multi-Stage Builds for AI Models

```dockerfile
# Build stage - download models
FROM python:3.11 as builder
WORKDIR /models
RUN pip install transformers torch
RUN python -c "from transformers import AutoModel; AutoModel.from_pretrained('bert-base')"

# Runtime stage - minimal image
FROM python:3.11-slim
COPY --from=builder /models /models
COPY app.py /app/
WORKDIR /app
CMD ["python", "app.py"]
```

#### 3. GPU Support

```dockerfile
# GPU-enabled AI container
FROM nvidia/cuda:12.0-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118

COPY . /app
WORKDIR /app

CMD ["python3", "gpu_inference.py"]
```

```yaml
# docker-compose.gpu.yml
services:
  ai-model:
    build: .
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

## Learning 3: GitHub Actions for Docker

### From GitHub Skills: Publish Docker Images

**Complete Workflow**:

```yaml
# .github/workflows/docker-publish.yml
name: Publish Docker Images

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
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
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
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
          platforms: linux/amd64,linux/arm64
```

### Advanced Features Applied

#### 1. Multi-Platform Builds

```yaml
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    platforms: linux/amd64,linux/arm64
```

#### 2. Build Cache

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

#### 3. Dynamic Tagging

```yaml
tags: |
  type=ref,event=branch
  type=semver,pattern={{version}}
  type=sha
```

---

## Applied to OpenClaw Hosting

### 1. Improved Docker Setup

**New Structure**:
```
docker/
├── api/
│   ├── Dockerfile
│   └── Dockerfile.gpu
├── web/
│   └── Dockerfile
├── embeddings/
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
└── docker-compose.gpu.yml
```

**API Dockerfile (Multi-stage)**:
```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter api build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
RUN npm install -g pnpm && pnpm install --prod
EXPOSE 2222
CMD ["node", "dist/index.js"]
```

### 2. Local Embeddings Service

```yaml
# docker-compose.yml
services:
  embeddings:
    build: ./docker/embeddings
    ports:
      - "8000:8000"
    environment:
      - MODEL_NAME=all-MiniLM-L6-v2
    volumes:
      - embeddings_cache:/root/.cache
    
  api:
    build: ./docker/api
    environment:
      - EMBEDDINGS_URL=http://embeddings:8000
```

### 3. GitHub Actions Workflow

```yaml
# .github/workflows/docker-publish.yml
name: Build and Publish Docker Images

on:
  push:
    branches: [main, master]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository }}

jobs:
  build-api:
    runs-on: ubuntu-latest
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4
      
      - uses: docker/setup-buildx-action@v3
      
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/api
      
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/api/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  build-web:
    runs-on: ubuntu-latest
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/web
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/web/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
```

### 4. Agent Configuration (cagent-style)

```yaml
# openclaw-agents.yaml
agents:
  orchestrator:
    model: kimi-coding/k2p5
    description: Main orchestrator agent
    instruction: |
      You coordinate specialized agents to complete tasks.
      Route requests to the appropriate specialist.
    
  api-specialist:
    model: kimi-coding/k2p5
    description: API development expert
    instruction: |
      You specialize in Hono.js API development.
      Focus on security, performance, and best practices.
    tools:
      - mcp:github
      - mcp:postgres
    memory:
      type: semantic
      consolidation: true
  
  deployment-specialist:
    model: kimi-coding/k2p5
    description: DevOps and deployment expert
    instruction: |
      You handle Docker, CI/CD, and infrastructure.
      Ensure reliable deployments and monitoring.
    tools:
      - mcp:docker
      - mcp:github-actions
    memory:
      type: procedural
      track_patterns: true
```

---

## Implementation Checklist

### Phase 1: Docker Improvements
- [ ] Multi-stage builds for all services
- [ ] Local embeddings container
- [ ] GPU support configuration
- [ ] Build cache optimization

### Phase 2: CI/CD Pipeline
- [ ] GitHub Actions workflow
- [ ] Multi-platform builds
- [ ] Automatic tagging
- [ ] Container registry push

### Phase 3: Agent Configuration
- [ ] YAML-based agent definitions
- [ ] MCP tool integration
- [ ] Multi-agent orchestration
- [ ] Memory system integration

### Phase 4: Documentation
- [ ] Docker setup guide
- [ ] CI/CD documentation
- [ ] Agent configuration guide
- [ ] Troubleshooting

---

## Benefits

### Performance
- ✅ Faster builds with caching
- ✅ Smaller images with multi-stage
- ✅ Local embeddings (no API latency)

### Reliability
- ✅ Consistent builds
- ✅ Versioned images
- ✅ Automated testing

### Security
- ✅ Local embeddings (privacy)
- ✅ No secrets in images
- ✅ Scanned containers

### Developer Experience
- ✅ One-command setup
- ✅ Hot reload in dev
- ✅ Easy debugging

---

**Sources**:
- Docker cagent (official Docker AI tool)
- GitHub Topics: docker-ai (2 repositories)
- GitHub Skills: Publish Docker Images

**Applied**: Multi-stage builds, local embeddings, GitHub Actions, MCP tools, YAML agent config
