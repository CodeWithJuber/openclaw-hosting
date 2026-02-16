// apps/api/src/routes/instances.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db, instances, users } from "@openclaw/db";
import { eq, and, desc } from "drizzle-orm";
import { whmcsAuth, jwtAuth } from "../middleware/auth.js";
import { Provisioner } from "../services/provisioner.js";
import {
  CreateInstanceRequestSchema,
  InstanceReadyRequestSchema,
  ResizeInstanceRequestSchema,
} from "@openclaw/shared";

const app = new Hono();

// POST /api/instances — Create (WHMCS)
app.post(
  "/",
  whmcsAuth,
  zValidator("json", CreateInstanceRequestSchema),
  async (c) => {
    const data = c.req.valid("json");

    // Get or create user
    let user = await db.query.users.findFirst({
      where: eq(users.whmcs_client_id, data.whmcs_client_id),
    });

    if (!user) {
      [user] = await db.insert(users).values({
        email: data.email,
        whmcs_client_id: data.whmcs_client_id,
        role: "client",
      }).returning();
    }

    // Provision instance
    const provisioner = new Provisioner();
    const instance = await provisioner.provisionInstance({
      userId: user.id,
      ...data,
    });

    const domain = process.env.CLOUDFLARE_DOMAIN || "openclaw.host";

    return c.json({
      id: instance.id,
      status: "provisioning" as const,
      subdomain: instance.subdomain,
      url: `https://${instance.subdomain}.${domain}`,
      estimated_ready: 120,
    }, 201);
  }
);

// GET /api/instances/:id — Get instance
app.get("/:id", jwtAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, id),
  });

  if (!instance) {
    return c.json({ error: "Instance not found", code: "NOT_FOUND" }, 404);
  }

  // Check ownership
  if (user.role !== "admin" && instance.user_id !== user.sub) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 403);
  }

  const domain = process.env.CLOUDFLARE_DOMAIN || "openclaw.host";

  return c.json({
    id: instance.id,
    status: instance.status,
    plan: instance.plan,
    region: instance.region,
    ip_address: instance.ip_address,
    subdomain: instance.subdomain,
    url: `https://${instance.subdomain}.${domain}`,
    openclaw_version: instance.openclaw_version,
    created_at: instance.created_at.toISOString(),
    updated_at: instance.updated_at.toISOString(),
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
      last_check: instance.last_health_check?.toISOString() || null,
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

  if (!instance) {
    return c.json({ error: "Instance not found", code: "NOT_FOUND" }, 404);
  }

  if (user.role !== "admin" && instance.user_id !== user.sub) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 403);
  }

  const provisioner = new Provisioner();
  const result = await provisioner.rebootInstance(id);

  return c.json(result);
});

// POST /api/instances/:id/resize
app.post(
  "/:id/resize",
  whmcsAuth,
  zValidator("json", ResizeInstanceRequestSchema),
  async (c) => {
    const id = c.req.param("id");
    const { new_plan } = c.req.valid("json");

    const provisioner = new Provisioner();
    const result = await provisioner.resizeInstance(id, new_plan);

    return c.json(result);
  }
);

// POST /api/instances/:id/ready — Instance callback
app.post(
  "/:id/ready",
  zValidator("json", InstanceReadyRequestSchema),
  async (c) => {
    const id = c.req.param("id");
    const token = c.req.header("X-Callback-Token");
    const body = c.req.valid("json");

    if (!token) {
      return c.json({ error: "Missing callback token", code: "AUTH_MISSING" }, 401);
    }

    const provisioner = new Provisioner();
    const result = await provisioner.handleInstanceReady(id, token, body);

    return c.json(result);
  }
);

// GET /api/instances/:id/metrics
app.get("/:id/metrics", jwtAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const period = c.req.query("period") as "1h" | "24h" | "7d" | "30d" || "24h";

  // Verify ownership
  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, id),
  });

  if (!instance) {
    return c.json({ error: "Instance not found", code: "NOT_FOUND" }, 404);
  }

  if (user.role !== "admin" && instance.user_id !== user.sub) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 403);
  }

  // Calculate time range
  const now = new Date();
  const periods = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const since = new Date(now.getTime() - periods[period]);

  // Fetch metrics from database
  const { metrics } = await import("@openclaw/db");
  const metricsData = await db.query.metrics.findMany({
    where: and(
      eq(metrics.instance_id, id),
      metrics.recorded_at >= since
    ),
    orderBy: desc(metrics.recorded_at),
    limit: 1000,
  });

  // Calculate current stats (most recent)
  const current = metricsData[0] || {
    cpu_percent: 0,
    ram_used_mb: 0,
    ram_total_mb: 0,
    disk_used_gb: 0,
    disk_total_gb: 0,
  };

  // Reverse for chronological order
  const history = metricsData.slice().reverse();

  return c.json({
    current: {
      cpu_percent: current.cpu_percent || 0,
      ram_used_mb: current.ram_used_mb || 0,
      ram_total_mb: current.ram_total_mb || 0,
      disk_used_gb: current.disk_used_gb || 0,
      disk_total_gb: current.disk_total_gb || 0,
      bandwidth_used_gb: 0, // TODO: Implement bandwidth tracking
      bandwidth_total_gb: 1000, // Placeholder
    },
    history: {
      timestamps: history.map(m => m.recorded_at.toISOString()),
      cpu: history.map(m => m.cpu_percent || 0),
      ram: history.map(m => m.ram_used_mb || 0),
      disk: history.map(m => m.disk_used_gb || 0),
      network_in: history.map(m => m.bandwidth_in_mb || 0),
      network_out: history.map(m => m.bandwidth_out_mb || 0),
    },
    period,
  });
});

// GET /api/instances/:id/logs
app.get("/:id/logs", jwtAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const lines = parseInt(c.req.query("lines") || "100");
  const since = c.req.query("since");
  const level = c.req.query("level") as "info" | "warn" | "error" | undefined;

  // Verify ownership
  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, id),
  });

  if (!instance) {
    return c.json({ error: "Instance not found", code: "NOT_FOUND" }, 404);
  }

  if (user.role !== "admin" && instance.user_id !== user.sub) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 403);
  }

  // TODO: Implement log fetching from instance
  // For now, return placeholder
  return c.json({
    instance_id: id,
    logs: [],
    has_more: false,
  });
});

// POST /api/instances/:id/config
app.post("/:id/config", jwtAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  // Verify ownership
  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, id),
  });

  if (!instance) {
    return c.json({ error: "Instance not found", code: "NOT_FOUND" }, 404);
  }

  if (user.role !== "admin" && instance.user_id !== user.sub) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 403);
  }

  const body = await c.req.json();

  // Update config in database
  await db.update(instances)
    .set({
      openclaw_config: body,
    })
    .where(eq(instances.id, id));

  return c.json({
    id,
    config_updated: true,
    restart_required: true,
  });
});

// GET /api/instances/:id/ai-usage
app.get("/:id/ai-usage", jwtAuth, async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const period = c.req.query("period") as "today" | "7d" | "30d" || "7d";

  // Verify ownership
  const instance = await db.query.instances.findFirst({
    where: eq(instances.id, id),
  });

  if (!instance) {
    return c.json({ error: "Instance not found", code: "NOT_FOUND" }, 404);
  }

  if (user.role !== "admin" && instance.user_id !== user.sub) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 403);
  }

  // TODO: Implement AI usage aggregation
  return c.json({
    instance_id: id,
    period,
    total_cost_usd: 0,
    total_tokens_in: 0,
    total_tokens_out: 0,
    by_model: [],
    daily: [],
  });
});

export const instanceRoutes = app;
