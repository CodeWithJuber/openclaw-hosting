# Agent 2 — API Backend Developer

> **Framework:** Hono.js 4.x + Node.js 22 LTS  
> **Branch Prefix:** `feature/api-*`  
> **Location:** `apps/api/`  
> **Owns:** `API-CONTRACTS.md`, `DATABASE.md`  
> **Blocks:** Agent 1 (WHMCS), Agent 3 (Dashboard)  
> **Can Start:** Immediately ✅

---

## Setup Commands

```bash
# Initialize monorepo
mkdir -p openclaw-hosting && cd openclaw-hosting
pnpm init
pnpm add -D turbo

# Create workspace structure
mkdir -p apps/api apps/web packages/{db,shared,email} modules/whmcs

# Initialize API app
cd apps/api
pnpm init
pnpm add hono @hono/node-server drizzle-orm pg zod
pnpm add -D @types/node drizzle-kit typescript vitest

# Setup TypeScript
npx tsc --init --target ES2022 --module NodeNext --moduleResolution NodeNext

# Setup Drizzle
cd ../../packages/db
pnpm init
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit @types/pg
```

---

## Task List (Critical Path)

### Phase 1: Week 1-2 — Core API Skeleton

#### Task 2.1: Project Bootstrap

**Branch:** `feature/api-bootstrap`

```typescript
// apps/api/src/index.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { instanceRoutes } from "./routes/instances";
import { authRoutes } from "./routes/auth";
import { webhookRoutes } from "./routes/webhooks";
import { healthRoutes } from "./routes/health";
import { adminRoutes } from "./routes/admin";
import { errorHandler } from "./middleware/error";
import { rateLimit } from "./middleware/rateLimit";

const app = new Hono();

// Middleware
app.use(logger());
app.use("*", cors({
  origin: [process.env.DASHBOARD_URL || "http://localhost:5173"],
  credentials: true,
}));
app.use("*", secureHeaders());
app.use("/api/*", rateLimit);

// Routes
app.route("/api/instances", instanceRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/webhooks", webhookRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/health", healthRoutes);

// Error handling
app.onError(errorHandler);

// 404
app.notFound((c) => c.json({ error: "Not found" }, 404));

export default {
  port: parseInt(process.env.API_PORT || "2222"),
  fetch: app.fetch,
};
```

```typescript
// apps/api/src/middleware/error.ts
import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(err);
  
  if (err.name === "ZodError") {
    return c.json({ 
      error: "Validation failed", 
      details: err.errors 
    }, 400);
  }
  
  if (err.message?.includes("not found")) {
    return c.json({ error: err.message }, 404);
  }
  
  if (err.message?.includes("unauthorized")) {
    return c.json({ error: err.message }, 401);
  }
  
  return c.json({ 
    error: "Internal server error",
    code: "INTERNAL_ERROR"
  }, 500);
};
```

```typescript
// apps/api/src/middleware/rateLimit.ts
import { createMiddleware } from "hono/factory";

const requests = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = createMiddleware(async (c, next) => {
  const key = c.req.header("X-API-Key") || c.req.header("CF-Connecting-IP") || "anonymous";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = c.req.header("X-API-Key") ? 100 : 20;
  
  const record = requests.get(key);
  
  if (!record || now > record.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
  } else if (record.count >= maxRequests) {
    return c.json({ error: "Rate limit exceeded", code: "RATE_LIMITED" }, 429);
  } else {
    record.count++;
  }
  
  await next();
});
```

**Acceptance Criteria:**
- [ ] Server starts on port 2222
- [ ] Health endpoint returns 200
- [ ] CORS configured for dashboard origin
- [ ] Rate limiting active (100/min auth, 20/min unauth)
- [ ] Error handler returns proper JSON

---

#### Task 2.2: Database Schema & Connection

**Branch:** `feature/api-database`

```typescript
// packages/db/src/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
export * from "./schema";
```

```typescript
// packages/db/src/schema.ts (from DATABASE.md)
import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, real, pgEnum } from "drizzle-orm/pg-core";

export const instanceStatusEnum = pgEnum("instance_status", [
  "provisioning", "active", "suspended", "terminated", "error", "rebooting", "resizing"
]);

export const planEnum = pgEnum("plan", ["starter", "professional", "enterprise"]);
export const regionEnum = pgEnum("region", ["us-east", "us-west", "eu-frankfurt", "eu-helsinki", "sg-singapore", "jp-tokyo"]);
export const userRoleEnum = pgEnum("user_role", ["client", "admin", "reseller"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  whmcs_client_id: integer("whmcs_client_id").unique(),
  role: userRoleEnum("role").notNull().default("client"),
  firebase_uid: varchar("firebase_uid", { length: 128 }).unique(),
  display_name: varchar("display_name", { length: 255 }),
  avatar_url: text("avatar_url"),
  reseller_id: uuid("reseller_id").references(() => users.id),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const instances = pgTable("instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id),
  whmcs_service_id: integer("whmcs_service_id").unique(),
  status: instanceStatusEnum("status").notNull().default("provisioning"),
  plan: planEnum("plan").notNull(),
  region: regionEnum("region").notNull(),
  hetzner_server_id: integer("hetzner_server_id"),
  ip_address: varchar("ip_address", { length: 45 }),
  server_type: varchar("server_type", { length: 50 }),
  subdomain: varchar("subdomain", { length: 63 }).notNull().unique(),
  cloudflare_record_id: varchar("cloudflare_record_id", { length: 64 }),
  custom_domain: varchar("custom_domain", { length: 255 }),
  openclaw_version: varchar("openclaw_version", { length: 20 }),
  gateway_port: integer("gateway_port").default(18789),
  openclaw_config: jsonb("openclaw_config"),
  callback_token: varchar("callback_token", { length: 64 }),
  provision_started_at: timestamp("provision_started_at"),
  provision_completed_at: timestamp("provision_completed_at"),
  provision_error: text("provision_error"),
  suspended_at: timestamp("suspended_at"),
  terminated_at: timestamp("terminated_at"),
  last_health_check: timestamp("last_health_check"),
  health_status: varchar("health_status", { length: 20 }).default("unknown"),
  uptime_percent: real("uptime_percent").default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ... (sshKeys, dnsRecords, metrics, aiUsage, auditLog, webhookLog from DATABASE.md)
```

```typescript
// packages/db/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Run migrations:**
```bash
cd packages/db
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

---

#### Task 2.3: Authentication Middleware

**Branch:** `feature/api-auth`

```typescript
// apps/api/src/middleware/auth.ts
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { createHmac } from "crypto";

// WHMCS API Key Auth (HMAC)
export const whmcsAuth = createMiddleware(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  const timestamp = c.req.header("X-Timestamp");
  const signature = c.req.header("X-Signature");
  
  if (!apiKey || !timestamp || !signature) {
    return c.json({ error: "Missing authentication headers" }, 401);
  }
  
  // Check timestamp (5 min expiry)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return c.json({ error: "Request expired" }, 401);
  }
  
  // Verify API key
  if (apiKey !== process.env.WHMCS_API_KEY) {
    return c.json({ error: "Invalid API key" }, 401);
  }
  
  // Verify HMAC signature
  const body = await c.req.raw.text();
  const expectedSig = createHmac("sha256", process.env.WHMCS_HMAC_SECRET!)
    .update(body + timestamp)
    .digest("hex");
  
  if (signature !== expectedSig) {
    return c.json({ error: "Invalid signature" }, 401);
  }
  
  c.set("authType", "whmcs");
  await next();
});

// JWT Auth (Dashboard)
export const jwtAuth = createMiddleware(async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ error: "Missing token" }, 401);
  }
  
  const token = auth.slice(7);
  try {
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set("user", payload);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Admin only
export const adminOnly = createMiddleware(async (c, next) => {
  const user = c.get("user");
  if (user.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }
  await next();
});
```

---

#### Task 2.4: Instance Routes (CRUD)

**Branch:** `feature/api-instances`

```typescript
// apps/api/src/routes/instances.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, instances, users } from "@openclaw/db";
import { eq, and } from "drizzle-orm";
import { whmcsAuth, jwtAuth } from "../middleware/auth";
import { Provisioner } from "../services/provisioner";

const app = new Hono();

// POST /api/instances — Create (WHMCS)
app.post("/", whmcsAuth, zValidator("json", z.object({
  whmcs_service_id: z.number().int().positive(),
  whmcs_client_id: z.number().int().positive(),
  plan: z.enum(["starter", "professional", "enterprise"]),
  region: z.enum(["us-east", "us-west", "eu-frankfurt", "eu-helsinki", "sg-singapore", "jp-tokyo"]),
  email: z.string().email(),
  hostname: z.string().regex(/^[a-z0-9-]{3,30}$/).optional(),
  ssh_key_ids: z.array(z.string().uuid()).max(5).optional(),
  ai_preset: z.enum(["anthropic", "openai", "ollama", "multi"]).optional(),
})), async (c) => {
  const data = c.req.valid("json");
  
  // Get or create user
  let user = await db.query.users.findFirst({
    where: eq(users.whmcs_client_id, data.whmcs_client_id),
  });
  
  if (!user) {
    [user] = await db.insert(users).values({
      email: data.email,
      whmcs_client_id: data.whmcs_client_id,
    }).returning();
  }
  
  // Provision instance
  const provisioner = new Provisioner();
  const instance = await provisioner.provisionInstance({
    userId: user.id,
    ...data,
  });
  
  return c.json({
    id: instance.id,
    status: instance.status,
    subdomain: instance.subdomain,
    url: `https://${instance.subdomain}.${process.env.CLOUDFLARE_DOMAIN}`,
    estimated_ready: 120,
  }, 201);
});

// GET /api/instances/:id — Get instance
app.get("/:id", jwtAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  
  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, id),
  });
  
  if (!instance) return c.json({ error: "Instance not found" }, 404);
  
  // Check ownership
  if (user.role !== "admin" && instance.user_id !== user.sub) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  return c.json({
    id: instance.id,
    status: instance.status,
    plan: instance.plan,
    region: instance.region,
    ip_address: instance.ip_address,
    subdomain: instance.subdomain,
    url: `https://${instance.subdomain}.${process.env.CLOUDFLARE_DOMAIN}`,
    openclaw_version: instance.openclaw_version,
    created_at: instance.created_at,
    updated_at: instance.updated_at,
    whmcs_service_id: instance.whmcs_service_id,
    server: {
      hetzner_id: instance.hetzner_server_id,
      server_type: instance.server_type,
      datacenter: instance.region,
    },
    dns: {
      subdomain: instance.subdomain,
      cloudflare_record_id: instance.cloudflare_record_id,
    },
    health: {
      last_check: instance.last_health_check,
      gateway_status: instance.health_status,
      uptime_percent: instance.uptime_percent,
    },
  });
});

// POST /api/instances/:id/suspend
app.post("/:id/suspend", whmcsAuth, async (c) => {
  const id = c.req.param("id");
  const provisioner = new Provisioner();
  const result = await provisioner.suspendInstance(id);
  return c.json(result);
});

// POST /api/instances/:id/unsuspend
app.post("/:id/unsuspend", whmcsAuth, async (c) => {
  const id = c.req.param("id");
  const provisioner = new Provisioner();
  const result = await provisioner.unsuspendInstance(id);
  return c.json(result);
});

// DELETE /api/instances/:id
app.delete("/:id", whmcsAuth, async (c) => {
  const id = c.req.param("id");
  const provisioner = new Provisioner();
  const result = await provisioner.terminateInstance(id);
  return c.json(result);
});

// POST /api/instances/:id/reboot
app.post("/:id/reboot", jwtAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  
  // Verify ownership
  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, id),
  });
  
  if (!instance || (user.role !== "admin" && instance.user_id !== user.sub)) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  
  const provisioner = new Provisioner();
  await provisioner.rebootInstance(id);
  
  return c.json({ id, status: "rebooting", estimated_ready: 60 });
});

export const instanceRoutes = app;
```

---

### Phase 2: Week 3-4 — Provisioning Service

#### Task 2.5: Hetzner Service

**Branch:** `feature/api-hetzner`

```typescript
// apps/api/src/services/hetzner.ts
const HETZNER_API = "https://api.hetzner.cloud/v1";

export class HetznerService {
  private token: string;
  
  constructor(token: string) {
    this.token = token;
  }
  
  async createServer(params: {
    name: string;
    server_type: string;
    location: string;
    user_data: string;
    ssh_keys?: number[];
  }) {
    const res = await fetch(`${HETZNER_API}/servers`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Hetzner error: ${err.error?.message}`);
    }
    
    return res.json();
  }
  
  async deleteServer(id: number) {
    const res = await fetch(`${HETZNER_API}/servers/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${this.token}` },
    });
    return res.ok;
  }
  
  async powerOff(id: number) {
    const res = await fetch(`${HETZNER_API}/servers/${id}/actions/poweroff`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.token}` },
    });
    return res.json();
  }
  
  async powerOn(id: number) {
    const res = await fetch(`${HETZNER_API}/servers/${id}/actions/poweron`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.token}` },
    });
    return res.json();
  }
  
  async getServer(id: number) {
    const res = await fetch(`${HETZNER_API}/servers/${id}`, {
      headers: { "Authorization": `Bearer ${this.token}` },
    });
    return res.json();
  }
}

// Server type mapping by plan
export const PLAN_TO_SERVER_TYPE: Record<string, string> = {
  starter: "cpx21",      // 2 vCPU, 4 GB RAM, 80 GB NVMe
  professional: "cpx31", // 4 vCPU, 8 GB RAM, 160 GB NVMe
  enterprise: "cpx41",   // 8 vCPU, 16 GB RAM, 240 GB NVMe
};

// Region mapping
export const REGION_TO_LOCATION: Record<string, string> = {
  "us-east": "ash",      // Ashburn
  "us-west": "hil",      // Hillsboro
  "eu-frankfurt": "fsn1", // Falkenstein
  "eu-helsinki": "hel1",  // Helsinki
  "sg-singapore": "sin",  // Singapore
  "jp-tokyo": "nbg1",     // Nuremberg (fallback)
};
```

---

#### Task 2.6: Cloudflare DNS Service

**Branch:** `feature/api-cloudflare`

```typescript
// apps/api/src/services/cloudflare.ts
const CLOUDFLARE_API = "https://api.cloudflare.com/client/v4";

export class CloudflareService {
  private token: string;
  private zoneId: string;
  
  constructor(token: string, zoneId: string) {
    this.token = token;
    this.zoneId = zoneId;
  }
  
  async createARecord(name: string, content: string) {
    const res = await fetch(`${CLOUDFLARE_API}/zones/${this.zoneId}/dns_records`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "A",
        name,
        content,
        ttl: 300,
        proxied: false, // Don't proxy API traffic
      }),
    });
    
    const data = await res.json();
    if (!data.success) {
      throw new Error(`Cloudflare error: ${data.errors?.[0]?.message}`);
    }
    
    return data.result.id;
  }
  
  async deleteRecord(recordId: string) {
    const res = await fetch(
      `${CLOUDFLARE_API}/zones/${this.zoneId}/dns_records/${recordId}`,
      {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${this.token}` },
      }
    );
    return res.ok;
  }
}
```

---

#### Task 2.7: Provisioner Orchestrator

**Branch:** `feature/api-provisioner`

```typescript
// apps/api/src/services/provisioner.ts
import { db, instances, users } from "@openclaw/db";
import { eq } from "drizzle-orm";
import { HetznerService, PLAN_TO_SERVER_TYPE, REGION_TO_LOCATION } from "./hetzner";
import { CloudflareService } from "./cloudflare";
import { generateSubdomain } from "../utils/crypto";
import { renderCloudInit } from "./cloudinit";

export class Provisioner {
  private hetzner: HetznerService;
  private cloudflare: CloudflareService;
  
  constructor() {
    this.hetzner = new HetznerService(process.env.HETZNER_API_TOKEN!);
    this.cloudflare = new CloudflareService(
      process.env.CLOUDFLARE_API_TOKEN!,
      process.env.CLOUDFLARE_ZONE_ID!
    );
  }
  
  async provisionInstance(params: {
    userId: string;
    whmcs_service_id: number;
    plan: string;
    region: string;
    email: string;
    hostname?: string;
    ai_preset?: string;
  }) {
    const subdomain = params.hostname || generateSubdomain();
    const callbackToken = crypto.randomUUID();
    
    // Create DB record first
    const [instance] = await db.insert(instances).values({
      user_id: params.userId,
      whmcs_service_id: params.whmcs_service_id,
      plan: params.plan as any,
      region: params.region as any,
      subdomain,
      callback_token: callbackToken,
      provision_started_at: new Date(),
    }).returning();
    
    try {
      // Create Hetzner server
      const serverType = PLAN_TO_SERVER_TYPE[params.plan];
      const location = REGION_TO_LOCATION[params.region];
      
      const userData = renderCloudInit({
        subdomain,
        callbackToken,
        callbackUrl: `${process.env.API_URL}/api/instances/${instance.id}/ready`,
        aiPreset: params.ai_preset,
      });
      
      const server = await this.hetzner.createServer({
        name: `openclaw-${subdomain}`,
        server_type: serverType,
        location,
        user_data: userData,
      });
      
      // Create DNS record
      const ip = server.server.public_net.ipv4.ip;
      const cfRecordId = await this.cloudflare.createARecord(subdomain, ip);
      
      // Update DB with server info
      await db.update(instances)
        .set({
          hetzner_server_id: server.server.id,
          ip_address: ip,
          server_type,
          cloudflare_record_id: cfRecordId,
        })
        .where(eq(instances.id, instance.id));
      
      return instance;
      
    } catch (error) {
      // Rollback on failure
      await this.rollback(instance.id);
      throw error;
    }
  }
  
  async suspendInstance(instanceId: string) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });
    
    if (!instance) throw new Error("Instance not found");
    if (!instance.hetzner_server_id) throw new Error("Server not provisioned");
    
    await this.hetzner.powerOff(instance.hetzner_server_id);
    
    const [updated] = await db.update(instances)
      .set({ status: "suspended", suspended_at: new Date() })
      .where(eq(instances.id, instanceId))
      .returning();
    
    return { id: instanceId, status: "suspended", suspended_at: updated.suspended_at };
  }
  
  async unsuspendInstance(instanceId: string) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });
    
    if (!instance?.hetzner_server_id) throw new Error("Instance not found");
    
    await this.hetzner.powerOn(instance.hetzner_server_id);
    
    const [updated] = await db.update(instances)
      .set({ status: "active", suspended_at: null })
      .where(eq(instances.id, instanceId))
      .returning();
    
    return { id: instanceId, status: "active", unsuspended_at: new Date() };
  }
  
  async terminateInstance(instanceId: string) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });
    
    if (!instance) throw new Error("Instance not found");
    
    // Delete Hetzner server
    if (instance.hetzner_server_id) {
      await this.hetzner.deleteServer(instance.hetzner_server_id);
    }
    
    // Delete DNS record
    if (instance.cloudflare_record_id) {
      await this.cloudflare.deleteRecord(instance.cloudflare_record_id);
    }
    
    // Mark terminated
    const [updated] = await db.update(instances)
      .set({ status: "terminated", terminated_at: new Date() })
      .where(eq(instances.id, instanceId))
      .returning();
    
    return { 
      id: instanceId, 
      status: "terminated", 
      terminated_at: updated.terminated_at,
      data_deleted: true 
    };
  }
  
  async rebootInstance(instanceId: string) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });
    
    if (!instance?.hetzner_server_id) throw new Error("Instance not found");
    
    await this.hetzner.powerOff(instance.hetzner_server_id);
    await new Promise(r => setTimeout(r, 5000));
    await this.hetzner.powerOn(instance.hetzner_server_id);
    
    await db.update(instances)
      .set({ status: "rebooting" })
      .where(eq(instances.id, instanceId));
  }
  
  private async rollback(instanceId: string) {
    // Clean up partial resources
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });
    
    if (instance?.hetzner_server_id) {
      await this.hetzner.deleteServer(instance.hetzner_server_id).catch(() => {});
    }
    if (instance?.cloudflare_record_id) {
      await this.cloudflare.deleteRecord(instance.cloudflare_record_id).catch(() => {});
    }
    
    await db.update(instances)
      .set({ status: "error", provision_error: "Provisioning failed" })
      .where(eq(instances.id, instanceId));
  }
}
```

---

### Phase 3: Week 5-6 — Webhooks + Callbacks

#### Task 2.8: WHMCS Webhook Handler

**Branch:** `feature/api-webhooks`

```typescript
// apps/api/src/routes/webhooks.ts
import { Hono } from "hono";
import { db, webhookLog, instances } from "@openclaw/db";
import { eq } from "drizzle-orm";
import { createHmac } from "crypto";

const app = new Hono();

// POST /api/webhooks/whmcs
app.post("/whmcs", async (c) => {
  const body = await c.req.json();
  
  // Log webhook
  await db.insert(webhookLog).values({
    source: "whmcs",
    event: body.event,
    payload: body,
  });
  
  switch (body.event) {
    case "InvoicePaid":
      // Auto-unsuspend if applicable
      await handleInvoicePaid(body);
      break;
      
    case "ServiceCancelled":
      // Trigger termination workflow
      await handleServiceCancelled(body);
      break;
      
    case "ServiceUpgrade":
      // Handle plan changes
      await handleServiceUpgrade(body);
      break;
  }
  
  return c.json({ received: true });
});

// POST /api/instances/:id/ready — Instance callback
app.post("/instances/:id/ready", async (c) => {
  const id = c.req.param("id");
  const token = c.req.header("X-Callback-Token");
  const body = await c.req.json();
  
  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, id),
  });
  
  if (!instance || instance.callback_token !== token) {
    return c.json({ error: "Invalid token" }, 401);
  }
  
  await db.update(instances)
    .set({
      status: "active",
      openclaw_version: body.openclaw_version,
      gateway_port: body.gateway_port,
      provision_completed_at: new Date(),
    })
    .where(eq(instances.id, id));
  
  // Send welcome email
  // await sendWelcomeEmail(instance.user_id, instance.subdomain);
  
  return c.json({ acknowledged: true });
});

async function handleInvoicePaid(data: any) {
  // Implementation
}

async function handleServiceCancelled(data: any) {
  // Implementation
}

async function handleServiceUpgrade(data: any) {
  // Implementation
}

export const webhookRoutes = app;
```

---

### Phase 4: Week 7-8 — Metrics + Admin

#### Task 2.9: Metrics Collection

**Branch:** `feature/api-metrics`

```typescript
// apps/api/src/services/metrics.ts
import { db, metrics } from "@openclaw/db";

export async function collectMetrics(instanceId: string) {
  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, instanceId),
  });
  
  if (!instance?.ip_address) return;
  
  try {
    // Fetch from node_exporter
    const res = await fetch(`http://${instance.ip_address}:9100/metrics`, {
      signal: AbortSignal.timeout(5000),
    });
    
    const text = await res.text();
    
    // Parse Prometheus format
    const cpu = parseMetric(text, 'node_cpu_seconds_total{mode="idle"}');
    const ramUsed = parseMetric(text, 'node_memory_MemAvailable_bytes');
    const ramTotal = parseMetric(text, 'node_memory_MemTotal_bytes');
    
    await db.insert(metrics).values({
      instance_id: instanceId,
      cpu_percent: 100 - cpu,
      ram_used_mb: Math.floor(ramUsed / 1024 / 1024),
      ram_total_mb: Math.floor(ramTotal / 1024 / 1024),
    });
    
  } catch (err) {
    console.error(`Failed to collect metrics for ${instanceId}:`, err);
  }
}

function parseMetric(text: string, name: string): number {
  const match = text.match(new RegExp(`${name}\\s+([\\d.]+)`));
  return match ? parseFloat(match[1]) : 0;
}
```

---

## Deliverables Checklist

- [ ] Hono.js API server with all routes
- [ ] PostgreSQL + Drizzle ORM setup
- [ ] HMAC + JWT authentication
- [ ] Hetzner Cloud API integration
- [ ] Cloudflare DNS API integration
- [ ] Provisioner with rollback logic
- [ ] WHMCS webhook handlers
- [ ] Instance ready callback endpoint
- [ ] Metrics collection service
- [ ] Admin routes for platform management
- [ ] Rate limiting middleware
- [ ] Error handling middleware
- [ ] Environment validation on startup
- [ ] Health check endpoint
- [ ] API documentation (OpenAPI/Swagger)
