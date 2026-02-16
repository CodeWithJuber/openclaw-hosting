// apps/api/src/routes/auth.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createHmac, timingSafeEqual } from "crypto";
import * as jose from "jose";
import { SSORequestSchema } from "@openclaw/shared";
import { db, users } from "@openclaw/db";
import { eq } from "drizzle-orm";

const app = new Hono();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-change-in-production"
);

const WHMCS_HMAC_SECRET = process.env.WHMCS_HMAC_SECRET;

// POST /api/auth/sso — WHMCS SSO
app.post(
  "/sso",
  zValidator("json", SSORequestSchema),
  async (c) => {
    const { client_id, service_id, email, timestamp, signature } = c.req.valid("json");

    // Verify timestamp (5 minute expiry)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return c.json({ error: "Request expired", code: "AUTH_EXPIRED" }, 401);
    }

    // Verify HMAC signature
    if (!WHMCS_HMAC_SECRET) {
      return c.json({ error: "Server configuration error", code: "AUTH_CONFIG_ERROR" }, 500);
    }

    const payload = JSON.stringify({ client_id, service_id, email, timestamp });
    const expectedSig = createHmac("sha256", WHMCS_HMAC_SECRET)
      .update(payload)
      .digest("hex");

    try {
      const sigBuf = Buffer.from(signature, "hex");
      const expectedBuf = Buffer.from(expectedSig, "hex");

      if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
        return c.json({ error: "Invalid signature", code: "AUTH_INVALID_SIGNATURE" }, 401);
      }
    } catch {
      return c.json({ error: "Invalid signature format", code: "AUTH_INVALID_SIGNATURE" }, 401);
    }

    // Get or create user
    let user = await db.query.users.findFirst({
      where: eq(users.whmcs_client_id, client_id),
    });

    if (!user) {
      [user] = await db.insert(users).values({
        email,
        whmcs_client_id: client_id,
        role: "client",
      }).returning();
    }

    // Generate JWT
    const token = await new jose.SignJWT({
      sub: user.id,
      role: user.role,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    const dashboardUrl = process.env.DASHBOARD_URL || "http://localhost:5173";

    return c.json({
      token,
      redirect_url: `${dashboardUrl}/auth/callback?token=${token}`,
      expires_in: 86400, // 24 hours
    });
  }
);

export const authRoutes = app;
