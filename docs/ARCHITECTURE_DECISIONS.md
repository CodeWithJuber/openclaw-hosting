# OpenClaw Hosting - Final Architecture Decisions

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | Self-hosted PostgreSQL | Full control, no vendor lock-in |
| **Agent Coordination** | Real-time | Smooth collaboration, instant updates |
| **Rollback** | Yes | Automatic recovery from failed provisions |
| **Rate Limiting** | Implemented | Handle Hetzner/Cloudflare limits gracefully |

---

## 1. Self-Hosted PostgreSQL on Linode

### Server Specs (Linode CPX21)
- **CPU**: 4 vCPUs (AMD EPYC)
- **RAM**: 8 GB
- **Storage**: 160 GB NVMe
- **Location**: Mumbai (ap-south)
- **IP**: 45.56.105.143

### PostgreSQL Setup
```yaml
# docker-compose.yml addition
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: openclaw
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: openclaw_hosting
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    command: 
      - "postgres"
      - "-c"
      - "max_connections=100"
      - "-c"
      - "shared_buffers=2GB"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U openclaw"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Backup Strategy
```bash
# Automated backups every 6 hours
0 */6 * * * docker exec postgres pg_dump -U openclaw openclaw_hosting > /backups/backup_$(date +\%Y\%m\%d_\%H\%M).sql

# Keep last 7 days of backups
find /backups -name "backup_*.sql" -mtime +7 -delete
```

---

## 2. Real-Time Agent Coordination

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Coordination Hub                    │
├─────────────────────────────────────────────────────────────┤
│  Redis Pub/Sub (Real-time messaging)                        │
│  ├── channel:agent-1-whmcs    (Agent 1 updates)            │
│  ├── channel:agent-2-api      (Agent 2 updates)            │
│  ├── channel:agent-3-dashboard (Agent 3 updates)           │
│  ├── channel:agent-4-infra    (Agent 4 updates)            │
│  ├── channel:provision-events (Provisioning status)        │
│  └── channel:system-alerts    (Errors, rollbacks)          │
└─────────────────────────────────────────────────────────────┘
```

### Real-Time Updates
```typescript
// Agent coordination service
import { createClient } from 'redis';

const redis = createClient({ url: 'redis://localhost:6379' });

// Agent publishes updates
async function publishUpdate(agentId: string, status: string, data: any) {
  await redis.publish(`agent:${agentId}`, JSON.stringify({
    timestamp: Date.now(),
    status,
    data,
    agent: agentId
  }));
}

// Other agents subscribe
redis.subscribe('agent:*', (message, channel) => {
  const update = JSON.parse(message);
  console.log(`[${update.agent}] ${update.status}:`, update.data);
});
```

### WebSocket for Dashboard
```typescript
// Real-time dashboard updates
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  // Subscribe to all agent channels
  redis.subscribe('agent:*', (message) => {
    ws.send(message);
  });
  
  // Subscribe to provisioning events
  redis.subscribe('provision:*', (message) => {
    ws.send(message);
  });
});
```

---

## 3. Rollback Strategy

### Rollback Levels

#### Level 1: Soft Rollback (Database Only)
```typescript
async function softRollback(instanceId: string) {
  // Mark instance as failed
  await db.update(instances)
    .set({ 
      status: 'failed',
      errorMessage: 'Provisioning failed - manual intervention required',
      updatedAt: new Date()
    })
    .where(eq(instances.id, instanceId));
  
  // Notify customer
  await sendFailureNotification(instanceId);
}
```

#### Level 2: Partial Rollback (VPS + DNS)
```typescript
async function partialRollback(instanceId: string, hetznerId: string) {
  const steps = [];
  
  try {
    // 1. Delete DNS record
    await cloudflare.deleteRecord(instanceId);
    steps.push('dns_deleted');
    
    // 2. Delete VPS (if created)
    if (hetznerId) {
      await hetzner.deleteServer(hetznerId);
      steps.push('vps_deleted');
    }
    
    // 3. Update database
    await db.update(instances)
      .set({ 
        status: 'rolled_back',
        hetznerId: null,
        ipAddress: null,
        steps: steps
      })
      .where(eq(instances.id, instanceId));
    
    return { success: true, steps };
  } catch (error) {
    // If rollback fails, escalate to manual
    await escalateToManualIntervention(instanceId, error);
    return { success: false, error };
  }
}
```

#### Level 3: Full Rollback (Everything)
```typescript
async function fullRollback(instanceId: string) {
  const transaction = await db.transaction();
  
  try {
    // 1. Get instance details
    const instance = await transaction.query.instances.findFirst({
      where: eq(instances.id, instanceId)
    });
    
    // 2. Delete external resources
    await Promise.all([
      hetzner.deleteServer(instance.hetznerId).catch(() => {}),
      cloudflare.deleteRecord(instance.subdomain).catch(() => {}),
      firebase.deleteUser(instance.customerId).catch(() => {})
    ]);
    
    // 3. Delete from database
    await transaction.delete(instances)
      .where(eq(instances.id, instanceId));
    
    // 4. Log rollback
    await transaction.insert(rollbackLogs).values({
      instanceId,
      reason: 'Full rollback executed',
      timestamp: new Date()
    });
    
    await transaction.commit();
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    await escalateToManualIntervention(instanceId, error);
    return { success: false, error };
  }
}
```

### Automatic Rollback Triggers
```typescript
// Rollback conditions
const ROLLBACK_TRIGGERS = {
  PROVISIONING_TIMEOUT: 300000,      // 5 minutes
  VPS_CREATION_FAILED: 'hetzner_error',
  DNS_PROPAGATION_FAILED: 60000,     // 1 minute
  HEALTH_CHECK_FAILED: 3,            // 3 attempts
  API_ERROR_5XX: true
};

// Monitor and auto-rollback
async function monitorProvisioning(instanceId: string) {
  const startTime = Date.now();
  
  const interval = setInterval(async () => {
    const instance = await getInstance(instanceId);
    
    // Check timeout
    if (Date.now() - startTime > ROLLBACK_TRIGGERS.PROVISIONING_TIMEOUT) {
      clearInterval(interval);
      await partialRollback(instanceId, instance.hetznerId);
      return;
    }
    
    // Check for failures
    if (instance.status === 'error') {
      clearInterval(interval);
      await partialRollback(instanceId, instance.hetznerId);
      return;
    }
    
    // Success - stop monitoring
    if (instance.status === 'active') {
      clearInterval(interval);
    }
  }, 10000); // Check every 10 seconds
}
```

---

## 4. API Rate Limit Handling

### Hetzner Cloud Rate Limits
```typescript
// Hetzner: 3600 requests/hour = 1 request/second
const HETZNER_RATE_LIMIT = {
  requestsPerHour: 3600,
  burstAllowance: 100,
  retryAfter: 3600 / 3600 // 1 second
};

// Rate limiter with token bucket
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private capacity: number,
    private refillRate: number // tokens per ms
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  async acquire(): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    
    // Wait for token
    const waitTime = (1 - this.tokens) / this.refillRate;
    await sleep(waitTime);
    return this.acquire();
  }
  
  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

const hetznerLimiter = new TokenBucket(100, 1 / 1000); // 1 token/sec
```

### Cloudflare Rate Limits
```typescript
// Cloudflare: 1200 requests/5 minutes = 4 requests/second
const CLOUDFLARE_RATE_LIMIT = {
  requestsPer5Minutes: 1200,
  burstAllowance: 200
};

const cloudflareLimiter = new TokenBucket(200, 4 / 1000); // 4 tokens/sec
```

### Exponential Backoff
```typescript
async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // Check if rate limited
      if (error.status === 429 || error.code === 'rate_limited') {
        const retryAfter = error.headers?.['retry-after'] || Math.pow(2, i);
        console.log(`Rate limited. Retrying after ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      // Don't retry on client errors
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Exponential backoff for server errors
      const backoff = Math.pow(2, i) * 1000;
      await sleep(backoff);
    }
  }
  
  throw lastError;
}
```

### Queue-Based Rate Limiting
```typescript
// Job queue with rate limiting
import Bull from 'bull';

const provisionQueue = new Bull('provisioning', {
  redis: { port: 6379, host: '127.0.0.1' },
  limiter: {
    max: 3600,        // 3600 jobs
    duration: 3600000 // per hour
  }
});

// Process jobs with rate limiting
provisionQueue.process(async (job) => {
  await hetznerLimiter.acquire();
  return await provisionVPS(job.data);
});

// Add job to queue
await provisionQueue.add({
  customerId,
  region,
  plan
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});
```

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Setup PostgreSQL on Linode
- [ ] Configure Redis for real-time coordination
- [ ] Implement rate limiters
- [ ] Create rollback infrastructure

### Week 2: API Development
- [ ] Hono.js API with Drizzle ORM
- [ ] Rate-limited Hetzner client
- [ ] Rate-limited Cloudflare client
- [ ] Rollback endpoints

### Week 3: WHMCS Integration
- [ ] WHMCS module with rollback support
- [ ] Real-time status updates
- [ ] Error handling and retries

### Week 4: Dashboard & Testing
- [ ] Real-time dashboard with WebSockets
- [ ] Rollback UI
- [ ] Load testing with rate limits

---

## Monitoring & Alerts

### Key Metrics
```typescript
// Metrics to track
const METRICS = {
  // Rate limiting
  apiCallsPerMinute: 'counter',
  rateLimitHits: 'counter',
  averageRetryCount: 'gauge',
  
  // Rollbacks
  rollbackCount: 'counter',
  rollbackDuration: 'histogram',
  rollbackSuccessRate: 'gauge',
  
  // Real-time
  websocketConnections: 'gauge',
  messageLatency: 'histogram',
  agentCoordinationLag: 'gauge'
};
```

### Alerts
- Rate limit approaching (80% of quota)
- Rollback rate > 5%
- WebSocket disconnections
- Database connection pool exhaustion
