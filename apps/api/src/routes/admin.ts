// apps/api/src/routes/admin.ts
import { Hono } from "hono";
import { db, instances, users } from "@openclaw/db";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { jwtAuth, adminOnly } from "../middleware/auth.js";

const app = new Hono();

// All admin routes require JWT + admin role
app.use("*", jwtAuth);
app.use("*", adminOnly);

// GET /api/admin/instances
app.get("/instances", async (c) => {
  const query = c.req.query();
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "20");
  const status = query.status;
  const region = query.region;
  const search = query.search;

  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];
  if (status) conditions.push(eq(instances.status, status as any));
  if (region) conditions.push(eq(instances.region, region as any));

  // Fetch instances with pagination
  const results = await db.query.instances.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(instances.created_at),
    limit,
    offset,
  });

  // Get total count
  const countResult = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(instances)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  const total = countResult[0]?.count || 0;

  // Get summary stats
  const activeCount = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(instances)
    .where(eq(instances.status, "active"));
  
  const suspendedCount = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(instances)
    .where(eq(instances.status, "suspended"));
  
  const provisioningCount = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(instances)
    .where(eq(instances.status, "provisioning"));

  const domain = process.env.CLOUDFLARE_DOMAIN || "openclaw.host";

  return c.json({
    instances: results.map(instance => ({
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
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
    summary: {
      total_active: activeCount[0]?.count || 0,
      total_suspended: suspendedCount[0]?.count || 0,
      total_provisioning: provisioningCount[0]?.count || 0,
      total_revenue_mrr: 0, // TODO: Calculate from plan pricing
    },
  });
});

// GET /api/admin/users
app.get("/users", async (c) => {
  const query = c.req.query();
  const page = parseInt(query.page || "1");
  const limit = parseInt(query.limit || "20");
  const search = query.search;

  const offset = (page - 1) * limit;

  const results = await db.query.users.findMany({
    orderBy: desc(users.created_at),
    limit,
    offset,
  });

  const countResult = await db.select({ count: sql`count(*)`.mapWith(Number) }).from(users);
  const total = countResult[0]?.count || 0;

  return c.json({
    users: results.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      whmcs_client_id: user.whmcs_client_id,
      display_name: user.display_name,
      created_at: user.created_at.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /api/admin/stats
app.get("/stats", async (c) => {
  // Instance stats by status
  const statusCounts = await db.select({
    status: instances.status,
    count: sql`count(*)`.mapWith(Number),
  })
    .from(instances)
    .groupBy(instances.status);

  // Instance stats by region
  const regionCounts = await db.select({
    region: instances.region,
    count: sql`count(*)`.mapWith(Number),
  })
    .from(instances)
    .groupBy(instances.region);

  // Instance stats by plan
  const planCounts = await db.select({
    plan: instances.plan,
    count: sql`count(*)`.mapWith(Number),
  })
    .from(instances)
    .groupBy(instances.plan);

  // Recent instances
  const recentInstances = await db.query.instances.findMany({
    orderBy: desc(instances.created_at),
    limit: 10,
  });

  return c.json({
    by_status: statusCounts,
    by_region: regionCounts,
    by_plan: planCounts,
    recent: recentInstances.map(i => ({
      id: i.id,
      subdomain: i.subdomain,
      status: i.status,
      created_at: i.created_at.toISOString(),
    })),
  });
});

export const adminRoutes = app;
