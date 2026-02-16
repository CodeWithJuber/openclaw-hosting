// apps/api/src/index.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";

import { instanceRoutes } from "./routes/instances.js";
import { authRoutes } from "./routes/auth.js";
import { webhookRoutes } from "./routes/webhooks.js";
import { healthRoutes } from "./routes/health.js";
import { adminRoutes } from "./routes/admin.js";
import { errorHandler } from "./middleware/error.js";
import { rateLimit } from "./middleware/rateLimit.js";

// Validate required environment variables
const requiredEnvVars = [
  "DATABASE_URL",
  "HETZNER_API_TOKEN",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ZONE_ID",
  "CLOUDFLARE_DOMAIN",
  "JWT_SECRET",
  "WHMCS_API_KEY",
  "WHMCS_HMAC_SECRET",
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error("[Config] Missing required environment variables:", missingVars.join(", "));
  console.error("[Config] Please set all required variables before starting the server.");
  process.exit(1);
}

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

// Root endpoint
app.get("/", (c) => {
  return c.json({
    name: "OpenClaw API",
    version: "1.0.0",
    documentation: "/api/health",
  });
});

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found", code: "NOT_FOUND" }, 404);
});

// Start server
const port = parseInt(process.env.API_PORT || "2222");

console.log(`[Server] Starting OpenClaw API on port ${port}`);
console.log(`[Server] Environment: ${process.env.NODE_ENV || "development"}`);

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`[Server] Listening on http://localhost:${info.port}`);
});

export default app;
