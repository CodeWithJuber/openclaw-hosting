// apps/api/src/routes/health.ts
import { Hono } from "hono";
import { db } from "@openclaw/db";

const app = new Hono();

// Track start time for uptime calculation
const startTime = Date.now();

app.get("/", async (c) => {
  let dbStatus: "connected" | "disconnected" = "disconnected";
  
  try {
    // Simple health check query
    await db.execute("SELECT 1");
    dbStatus = "connected";
  } catch (error) {
    console.error("[Health] Database connection failed:", error);
  }

  const status = dbStatus === "connected" ? 200 : 503;
  
  return c.json({
    status: "ok" as const,
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    db: dbStatus,
    timestamp: new Date().toISOString(),
  }, status);
});

export const healthRoutes = app;
