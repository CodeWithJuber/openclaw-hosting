/**
 * Log sanitization to prevent secret leakage
 */

// Patterns to redact
const SENSITIVE_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{48,}/g, replacement: '[REDACTED_OPENAI_KEY]' },
  { pattern: /sk-ant-api[0-9a-z-_]{40,}/gi, replacement: '[REDACTED_ANTHROPIC_KEY]' },
  { pattern: /[a-f0-9]{64}/gi, replacement: '[REDACTED_HEX_SECRET]' },
  { pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*/g, replacement: '[REDACTED_JWT]' },
  { pattern: /password["\s]*[:=]["\s]*[^\s,"}]+/gi, replacement: 'password: [REDACTED]' },
  { pattern: /secret["\s]*[:=]["\s]*[^\s,"}]+/gi, replacement: 'secret: [REDACTED]' },
  { pattern: /token["\s]*[:=]["\s]*[^\s,"}]+/gi, replacement: 'token: [REDACTED]' },
  { pattern: /key["\s]*[:=]["\s]*[^\s,"}]+/gi, replacement: 'key: [REDACTED]' },
  { pattern: /Bearer\s+[a-zA-Z0-9_-]+/g, replacement: 'Bearer [REDACTED]' },
  { pattern: /Basic\s+[a-zA-Z0-9+/=]+/g, replacement: 'Basic [REDACTED]' },
];

/**
 * Sanitize a string to remove sensitive data
 */
export function sanitizeLog(input: string | object): string {
  let sanitized: string;
  
  if (typeof input === 'object') {
    sanitized = JSON.stringify(input);
  } else {
    sanitized = String(input);
  }
  
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  
  return sanitized;
}

/**
 * Create a safe logger that auto-sanitizes
 */
export function createSafeLogger(context: string) {
  return {
    debug: (message: string, meta?: object) => {
      console.debug(`[${context}] ${sanitizeLog(message)}`, meta ? sanitizeLog(meta) : '');
    },
    info: (message: string, meta?: object) => {
      console.info(`[${context}] ${sanitizeLog(message)}`, meta ? sanitizeLog(meta) : '');
    },
    warn: (message: string, meta?: object) => {
      console.warn(`[${context}] ${sanitizeLog(message)}`, meta ? sanitizeLog(meta) : '');
    },
    error: (message: string, meta?: object) => {
      console.error(`[${context}] ${sanitizeLog(message)}`, meta ? sanitizeLog(meta) : '');
    }
  };
}

/**
 * Sanitize error objects for safe logging
 */
export function sanitizeError(error: Error | unknown): { message: string; stack?: string; type: string } {
  if (error instanceof Error) {
    return {
      type: error.constructor.name,
      message: sanitizeLog(error.message),
      stack: error.stack ? sanitizeLog(error.stack) : undefined
    };
  }
  
  return {
    type: typeof error,
    message: sanitizeLog(String(error))
  };
}

/**
 * Sanitize HTTP headers for logging
 */
export function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie', 'x-webhook-secret'];
  
  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

export { SENSITIVE_PATTERNS };
