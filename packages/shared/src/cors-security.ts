import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

/**
 * CORS configuration with strict origin validation
 * Prevents CSRF and unauthorized cross-origin requests
 */

interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
}

/**
 * Create secure CORS middleware
 */
export function createSecureCORS(config: CORSConfig) {
  const {
    allowedOrigins,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-API-Key', 'X-Timestamp', 'X-Signature'],
    allowCredentials = true,
    maxAge = 86400
  } = config;
  
  return cors({
    origin: (origin, c) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return null;
      }
      
      // Check if origin is in allowlist
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      
      // Log rejected origins for debugging
      console.warn(`[CORS] Rejected origin: ${origin}`);
      return null;
    },
    allowMethods,
    allowHeaders,
    maxAge,
    credentials: allowCredentials
  });
}

/**
 * Security headers middleware
 */
export function createSecurityHeaders() {
  return secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for some React features
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    xXssProtection: '1; mode=block',
    permissionsPolicy: {
      accelerometer: [],
      camera: [],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      microphone: [],
      payment: [],
      usb: []
    }
  });
}

/**
 * Apply all security middleware to Hono app
 */
export function applySecurityMiddleware(app: Hono, corsConfig: CORSConfig) {
  // Security headers first
  app.use('*', createSecurityHeaders());
  
  // CORS
  app.use('*', createSecureCORS(corsConfig));
  
  // Additional security middleware
  app.use('*', async (c, next) => {
    // Add security-related headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    await next();
  });
}

export { CORSConfig };
