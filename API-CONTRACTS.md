# API Contracts — Single Source of Truth

> **RULE:** Any agent changing these contracts MUST update this file FIRST and notify all other agents.  
> All request/response types live in `packages/shared/src/types.ts`.

---

## Authentication

### WHMCS → API (Server-to-Server)

```
Header: X-API-Key: <WHMCS_API_KEY>
Header: X-Timestamp: <unix-timestamp>
Header: X-Signature: HMAC-SHA256(body + timestamp, WHMCS_HMAC_SECRET)
```

### Dashboard → API (Client)

```
Header: Authorization: Bearer <JWT>
JWT Payload: { sub: user_id, role: "client"|"admin", instance_id?: string }
```

### WHMCS SSO → Dashboard

```
GET /auth/sso?token=<HMAC-signed-payload>&ts=<timestamp>
Payload: { client_id, service_id, email }
Signed with: WHMCS_HMAC_SECRET
Expiry: 5 minutes
```

---

## Endpoints

### POST /api/instances

**Auth:** WHMCS API Key  
**Called by:** Agent 1 (WHMCS CreateAccount)  
**Handled by:** Agent 2 (API)

```typescript
// Request
interface CreateInstanceRequest {
  whmcs_service_id: number;
  whmcs_client_id: number;
  plan: "starter" | "professional" | "enterprise";
  region: "us-east" | "us-west" | "eu-frankfurt" | "eu-helsinki" | "sg-singapore" | "jp-tokyo";
  email: string;
  hostname?: string; // custom subdomain
  ssh_key_ids?: string[];
  ai_preset?: "anthropic" | "openai" | "ollama" | "multi";
}

// Response 201
interface CreateInstanceResponse {
  id: string; // UUID
  status: "provisioning";
  subdomain: string; // e.g., "abc1234"
  url: string; // e.g., "https://abc1234.yourdomain.com"
  estimated_ready: number; // seconds until ready (~120)
}

// Response 400/500
interface ErrorResponse {
  error: string;
  code: string; // e.g., "INVALID_PLAN", "REGION_UNAVAILABLE"
  details?: Record<string, string>;
}
```

### GET /api/instances/:id

**Auth:** JWT or WHMCS API Key  
**Called by:** Agent 1 (WHMCS), Agent 3 (Dashboard)

```typescript
interface InstanceResponse {
  id: string;
  status: "provisioning" | "active" | "suspended" | "terminated" | "error";
  plan: string;
  region: string;
  ip_address: string | null;
  subdomain: string;
  url: string;
  openclaw_version: string | null;
  created_at: string; // ISO 8601
  updated_at: string;
  whmcs_service_id: number;
  
  server: {
    hetzner_id: number;
    server_type: string;
    datacenter: string;
  };
  
  dns: {
    subdomain: string;
    cloudflare_record_id: string;
  };
  
  health: {
    last_check: string;
    gateway_status: "up" | "down" | "unknown";
    uptime_percent: number;
  };
}
```

### POST /api/instances/:id/suspend

**Auth:** WHMCS API Key  
**Called by:** Agent 1 (WHMCS SuspendAccount)

```typescript
// Request: empty body

// Response 200
{
  id: string;
  status: "suspended";
  suspended_at: string;
}
```

### POST /api/instances/:id/unsuspend

**Auth:** WHMCS API Key  
**Called by:** Agent 1 (WHMCS UnsuspendAccount)

```typescript
// Request: empty body

// Response 200
{
  id: string;
  status: "active";
  unsuspended_at: string;
}
```

### DELETE /api/instances/:id

**Auth:** WHMCS API Key  
**Called by:** Agent 1 (WHMCS TerminateAccount)

```typescript
// Request: empty body

// Response 200
{
  id: string;
  status: "terminated";
  terminated_at: string;
  data_deleted: boolean;
}
```

### POST /api/instances/:id/reboot

**Auth:** JWT  
**Called by:** Agent 3 (Dashboard)

```typescript
// Response 200
{
  id: string;
  status: "rebooting";
  estimated_ready: number;
}
```

### POST /api/instances/:id/resize

**Auth:** WHMCS API Key  
**Called by:** Agent 1 (WHMCS ChangePackage)

```typescript
// Request
{
  new_plan: "starter" | "professional" | "enterprise";
}

// Response 200
{
  id: string;
  old_plan: string;
  new_plan: string;
  status: "resizing";
}
```

### GET /api/instances/:id/metrics

**Auth:** JWT  
**Called by:** Agent 3 (Dashboard Analytics)

```typescript
interface MetricsResponse {
  current: {
    cpu_percent: number;
    ram_used_mb: number;
    ram_total_mb: number;
    disk_used_gb: number;
    disk_total_gb: number;
    bandwidth_used_gb: number;
    bandwidth_total_gb: number;
  };
  history: {
    timestamps: string[]; // ISO 8601 array
    cpu: number[];
    ram: number[];
    disk: number[];
    network_in: number[];
    network_out: number[];
  };
  period: "1h" | "24h" | "7d" | "30d";
}
```

### GET /api/instances/:id/logs

**Auth:** JWT  
**Called by:** Agent 3 (Dashboard)

```typescript
// Query params: ?lines=100&since=<ISO>&level=info|warn|error

interface LogsResponse {
  instance_id: string;
  logs: Array<{
    timestamp: string;
    level: "info" | "warn" | "error" | "debug";
    message: string;
    source: "openclaw" | "nginx" | "system";
  }>;
  has_more: boolean;
  next_cursor?: string;
}
```

### POST /api/instances/:id/config

**Auth:** JWT  
**Called by:** Agent 3 (Dashboard AI Settings)

```typescript
// Request
interface UpdateConfigRequest {
  agent?: {
    model?: string; // e.g., "anthropic/claude-sonnet-4-5-20250929"
  };
  api_keys?: {
    anthropic?: string;
    openai?: string;
    custom?: Record<string, string>;
  };
  channels?: {
    whatsapp?: { enabled: boolean };
    telegram?: { enabled: boolean; bot_token?: string };
    discord?: { enabled: boolean };
    slack?: { enabled: boolean };
  };
}

// Response 200
{
  id: string;
  config_updated: true;
  restart_required: boolean;
}
```

### GET /api/instances/:id/ai-usage

**Auth:** JWT  
**Called by:** Agent 3 (Dashboard)

```typescript
interface AIUsageResponse {
  instance_id: string;
  period: "today" | "7d" | "30d";
  total_cost_usd: number;
  total_tokens_in: number;
  total_tokens_out: number;
  by_model: Array<{
    model: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    request_count: number;
  }>;
  daily: Array<{
    date: string;
    cost_usd: number;
    tokens: number;
  }>;
}
```

### POST /api/auth/sso

**Auth:** HMAC Signature  
**Called by:** Agent 1 (WHMCS ServiceSingleSignOn)

```typescript
// Request
{
  client_id: number;
  service_id: number;
  email: string;
  timestamp: number;
  signature: string;
}

// Response 200
{
  token: string;
  redirect_url: string;
  expires_in: number;
}
```

### POST /api/webhooks/whmcs

**Auth:** HMAC Signature  
**Called by:** WHMCS Hooks

```typescript
// Request
{
  event: string;
  service_id: number;
  client_id: number;
  data: Record<string, any>;
}

// Response 200
{
  received: true;
}
```

### GET /api/admin/instances

**Auth:** Admin JWT  
**Called by:** Agent 3 (Admin Dashboard)

```typescript
// Query: ?status=active&region=eu-frankfurt&page=1&limit=20&search=user@email.com

interface AdminInstancesResponse {
  instances: InstanceResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  summary: {
    total_active: number;
    total_suspended: number;
    total_provisioning: number;
    total_revenue_mrr: number;
  };
}
```

### GET /api/health

**Auth:** None  
**Called by:** Agent 1 (WHMCS TestConnection), monitoring

```typescript
// Response 200
{
  status: "ok";
  version: string;
  uptime: number;
  db: "connected";
  timestamp: string;
}
```

### POST /api/instances/:id/ready (Internal)

**Auth:** Instance callback token  
**Called by:** cloud-init script on VPS

```typescript
// Request
{
  openclaw_version: string;
  gateway_port: number;
}

// Response 200
{
  acknowledged: true;
}
```
