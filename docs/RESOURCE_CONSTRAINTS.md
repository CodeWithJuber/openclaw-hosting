# Resource Constraints & Optimization Strategy

**Date**: 2026-02-16  
**Constraint**: Limited RAM availability  
**Status**: Adjusting architecture for lightweight deployment

---

## Current Constraints

### Hardware Limitations
- **RAM**: Limited (exact amount TBD)
- **CPU**: Standard VPS (Linode CPX21 - 4 vCPUs, 8GB RAM)
- **Storage**: 160GB NVMe

### Implications
- Cannot run large models locally
- Must optimize for memory efficiency
- Focus on lightweight services
- Avoid memory-heavy features for now

---

## Optimization Strategy

### 1. Services to Optimize

#### PostgreSQL
```yaml
# Optimized for low memory
postgres:
  command:
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"      # Reduced from 2GB
    - "-c"
    - "effective_cache_size=512MB"
    - "-c"
    - "work_mem=16MB"
    - "-c"
    - "maintenance_work_mem=64MB"
    - "-c"
    - "max_connections=50"          # Reduced from 100
```

#### Redis
```yaml
# Memory-optimized Redis
redis:
  command: redis-server
    --maxmemory 128mb
    --maxmemory-policy allkeys-lru
    --appendonly no                  # Disable AOF for memory savings
```

#### API Server
```typescript
// Use worker threads for CPU-intensive tasks
// Implement request caching
// Use connection pooling
```

### 2. Features to Defer (High RAM)

| Feature | RAM Required | Status |
|---------|--------------|--------|
| Code Graph (ts-morph) | ~2GB | ❌ Deferred |
| Local LLM (Ollama) | ~4-8GB | ❌ Deferred |
| Vector Database | ~1GB | ❌ Deferred |
| ML Models | ~2-4GB | ❌ Deferred |
| Multi-machine mesh | Variable | ❌ Deferred |

### 3. Lightweight Alternatives

#### Instead of Code Graph
- Use simple file tree visualization
- Basic dependency listing
- Git history analysis

#### Instead of Local LLM
- Use API-based models (OpenAI, Anthropic)
- Implement caching for common queries
- Rate limiting to control costs

#### Instead of Vector DB
- Use PostgreSQL full-text search
- Simple keyword matching
- Redis for caching

---

## Immediate Actions (Low RAM)

### 1. Deploy Core Services Only
```yaml
# Minimal docker-compose.yml
services:
  postgres:     # Optimized settings
  redis:        # Optimized settings
  api:          # Node.js with clustering
  dashboard:    # Static files (nginx)
```

### 2. Disable Non-Essential Features
- [ ] Code graph analyzer (ts-morph)
- [ ] Local AI model hosting
- [ ] Complex ML algorithms
- [ ] Vector search

### 3. Implement Caching
```typescript
// Aggressive caching strategy
const cache = new Map();

// Cache API responses
// Cache database queries
// Cache static assets
```

### 4. Use External APIs
```typescript
// Instead of local processing
const result = await openai.chat.completions.create({
  model: 'gpt-4o-mini',  // Cheapest option
  messages: [{ role: 'user', content: prompt }],
});
```

---

## Memory-Efficient Architecture

### Current Stack (Optimized)
```
Linode CPX21 (4 vCPU, 8GB RAM)
├── PostgreSQL (256MB shared_buffers)
├── Redis (128MB maxmemory)
├── API (Node.js, 2 workers)
├── Dashboard (Static, nginx)
└── ~6GB free for OS + buffer
```

### Resource Allocation
| Service | RAM | CPU | Priority |
|---------|-----|-----|----------|
| PostgreSQL | 512MB | 1 core | High |
| Redis | 256MB | 0.5 core | High |
| API | 1GB | 2 cores | High |
| Dashboard | 256MB | 0.5 core | Medium |
| OS/Buffer | 5GB+ | 1 core | - |

---

## Future Scaling Path

### Phase 1: Current (8GB RAM)
- Core services only
- External APIs
- Basic features

### Phase 2: Upgrade (16GB RAM)
- Add code graph (ts-morph)
- Enable vector search
- More caching

### Phase 3: Scale (32GB+ RAM)
- Local LLM support (Ollama)
- ML models
- Multi-machine mesh

---

## Cost-Effective Model Strategy

### API-Based (Current)
| Model | Cost | Use Case |
|-------|------|----------|
| GPT-4o-mini | $0.15/M tokens | Default |
| Claude 3 Haiku | $0.25/M tokens | Fallback |
| Kimi K2.5 | $0.50/M tokens | Complex tasks |

### Local (Future - High RAM)
| Model | RAM | Use Case |
|-------|-----|----------|
| Llama 3.1 8B | 8GB | General |
| Qwen 2.5 7B | 7GB | Code |
| DeepSeek Coder | 8GB | Programming |

---

## Monitoring

### Track Memory Usage
```bash
# Docker stats
docker stats --no-stream

# PostgreSQL
docker exec postgres psql -U openclaw -c "SELECT pg_size_pretty(pg_total_memory_usage());"

# Redis
docker exec redis redis-cli INFO memory
```

### Alerts
- RAM usage > 80%: Warning
- RAM usage > 90%: Critical
- Swap usage > 0%: Performance issue

---

## Conclusion

**Strategy**: Build lightweight core first, add heavy features later when RAM available.

**Current Focus**:
- ✅ Core VPS provisioning
- ✅ WHMCS integration
- ✅ Basic dashboard
- ✅ Security features
- ✅ API with external AI

**Deferred**:
- ❌ Code graph
- ❌ Local LLMs
- ❌ ML models
- ❌ Vector DB

**Next**: Optimize current deployment for 8GB RAM, scale when resources available.

---

**Note**: All high-RAM features documented but marked as "future enhancements".
