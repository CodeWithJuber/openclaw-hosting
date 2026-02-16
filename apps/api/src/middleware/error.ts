// apps/api/src/middleware/error.ts
import type { ErrorHandler } from "hono";
import { ZodError } from "zod";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error("[Error]", err);
  
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json({ 
      error: "Validation failed", 
      code: "VALIDATION_ERROR",
      details: err.errors.reduce((acc, e) => {
        acc[e.path.join(".")] = e.message;
        return acc;
      }, {} as Record<string, string>)
    }, 400);
  }
  
  // Handle custom errors with status codes
  if (err.message?.includes("not found")) {
    return c.json({ error: err.message, code: "NOT_FOUND" }, 404);
  }
  
  if (err.message?.includes("unauthorized") || err.message?.includes("Unauthorized")) {
    return c.json({ error: err.message, code: "UNAUTHORIZED" }, 401);
  }
  
  if (err.message?.includes("forbidden") || err.message?.includes("Forbidden")) {
    return c.json({ error: err.message, code: "FORBIDDEN" }, 403);
  }
  
  if (err.message?.includes("rate limit")) {
    return c.json({ error: err.message, code: "RATE_LIMITED" }, 429);
  }
  
  // Default internal server error
  return c.json({ 
    error: "Internal server error",
    code: "INTERNAL_ERROR"
  }, 500);
};
