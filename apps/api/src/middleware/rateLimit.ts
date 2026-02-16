// apps/api/src/middleware/rateLimit.ts
import { createMiddleware } from "hono/factory";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const requests = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requests.entries()) {
    if (now > record.resetAt) {
      requests.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const rateLimit = createMiddleware(async (c, next) => {
  // Use API key if present, otherwise use IP
  const apiKey = c.req.header("X-API-Key");
  const ip = c.req.header("CF-Connecting-IP") || 
             c.req.header("X-Forwarded-For") || 
             "anonymous";
  
  const key = apiKey || ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  // Authenticated requests get higher limits
  const maxRequests = apiKey ? 100 : 20;
  
  const record = requests.get(key);
  
  if (!record || now > record.resetAt) {
    // New window
    requests.set(key, { count: 1, resetAt: now + windowMs });
  } else if (record.count >= maxRequests) {
    // Rate limit exceeded
    return c.json({ 
      error: "Rate limit exceeded", 
      code: "RATE_LIMITED",
      retry_after: Math.ceil((record.resetAt - now) / 1000)
    }, 429);
  } else {
    // Increment count
    record.count++;
  }
  
  // Add rate limit headers
  const current = requests.get(key)!;
  c.header("X-RateLimit-Limit", maxRequests.toString());
  c.header("X-RateLimit-Remaining", Math.max(0, maxRequests - current.count).toString());
  c.header("X-RateLimit-Reset", Math.ceil(current.resetAt / 1000).toString());
  
  await next();
});
