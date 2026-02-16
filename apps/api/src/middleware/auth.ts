// apps/api/src/middleware/auth.ts
import { createMiddleware } from "hono/factory";
import { createHmac, timingSafeEqual } from "crypto";
import * as jose from "jose";

// JWT Secret from environment
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-change-in-production"
);

// WHMCS API credentials
const WHMCS_API_KEY = process.env.WHMCS_API_KEY;
const WHMCS_HMAC_SECRET = process.env.WHMCS_HMAC_SECRET;

/**
 * WHMCS API Key + HMAC Authentication
 * Used for server-to-server communication from WHMCS
 */
export const whmcsAuth = createMiddleware(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  const timestamp = c.req.header("X-Timestamp");
  const signature = c.req.header("X-Signature");
  
  if (!apiKey || !timestamp || !signature) {
    return c.json({ 
      error: "Missing authentication headers", 
      code: "AUTH_MISSING" 
    }, 401);
  }
  
  // Check timestamp (5 minute expiry to prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return c.json({ 
      error: "Request expired or invalid timestamp", 
      code: "AUTH_EXPIRED" 
    }, 401);
  }
  
  // Verify API key
  if (!WHMCS_API_KEY || apiKey !== WHMCS_API_KEY) {
    return c.json({ 
      error: "Invalid API key", 
      code: "AUTH_INVALID_KEY" 
    }, 401);
  }
  
  // Verify HMAC signature
  if (!WHMCS_HMAC_SECRET) {
    return c.json({ 
      error: "Server configuration error", 
      code: "AUTH_CONFIG_ERROR" 
    }, 500);
  }
  
  // Clone the request to read the body
  const clonedReq = c.req.raw.clone();
  const body = await clonedReq.text();
  
  const expectedSig = createHmac("sha256", WHMCS_HMAC_SECRET)
    .update(body + timestamp)
    .digest("hex");
  
  // Timing-safe comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return c.json({ 
        error: "Invalid signature", 
        code: "AUTH_INVALID_SIGNATURE" 
      }, 401);
    }
  } catch {
    return c.json({ 
      error: "Invalid signature format", 
      code: "AUTH_INVALID_SIGNATURE" 
    }, 401);
  }
  
  // Set auth context
  c.set("authType", "whmcs");
  await next();
});

/**
 * JWT Authentication
 * Used for dashboard/client authentication
 */
export const jwtAuth = createMiddleware(async (c, next) => {
  const auth = c.req.header("Authorization");
  
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ 
      error: "Missing or invalid authorization header", 
      code: "AUTH_MISSING_TOKEN" 
    }, 401);
  }
  
  const token = auth.slice(7);
  
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });
    
    // Validate payload structure
    if (!payload.sub) {
      return c.json({ 
        error: "Invalid token payload", 
        code: "AUTH_INVALID_PAYLOAD" 
      }, 401);
    }
    
    c.set("user", {
      sub: payload.sub as string,
      role: (payload.role as string) || "client",
      instance_id: payload.instance_id as string | undefined,
      email: payload.email as string | undefined,
    });
    
    c.set("authType", "jwt");
    await next();
  } catch (err) {
    if (err instanceof jose.errors.JWTExpired) {
      return c.json({ 
        error: "Token expired", 
        code: "AUTH_TOKEN_EXPIRED" 
      }, 401);
    }
    
    return c.json({ 
      error: "Invalid token", 
      code: "AUTH_INVALID_TOKEN" 
    }, 401);
  }
});

/**
 * Admin-only middleware
 * Must be used after jwtAuth
 */
export const adminOnly = createMiddleware(async (c, next) => {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ 
      error: "Authentication required", 
      code: "AUTH_REQUIRED" 
    }, 401);
  }
  
  if (user.role !== "admin") {
    return c.json({ 
      error: "Admin access required", 
      code: "AUTH_FORBIDDEN" 
    }, 403);
  }
  
  await next();
});

/**
 * Combined auth middleware - accepts either WHMCS or JWT
 */
export const combinedAuth = createMiddleware(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");
  const auth = c.req.header("Authorization");
  
  if (apiKey) {
    // Try WHMCS auth
    return whmcsAuth(c, next);
  } else if (auth?.startsWith("Bearer ")) {
    // Try JWT auth
    return jwtAuth(c, next);
  }
  
  return c.json({ 
    error: "Authentication required", 
    code: "AUTH_REQUIRED" 
  }, 401);
});

// Type definitions for Hono context
declare module "hono" {
  interface ContextVariableMap {
    user: {
      sub: string;
      role: string;
      instance_id?: string;
      email?: string;
    };
    authType: "whmcs" | "jwt";
  }
}
