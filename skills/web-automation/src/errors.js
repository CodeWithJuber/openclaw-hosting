/**
 * Error classes for Web Automation
 */

class WebAutomationError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'WebAutomationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class NavigationError extends WebAutomationError {
  constructor(message, url, attempts) {
    super(message, 'NAVIGATION_ERROR', { url, attempts });
    this.name = 'NavigationError';
  }
}

class ElementNotFoundError extends WebAutomationError {
  constructor(selector, page) {
    super(`Element not found: ${selector}`, 'ELEMENT_NOT_FOUND', { selector, page });
    this.name = 'ElementNotFoundError';
  }
}

class TimeoutError extends WebAutomationError {
  constructor(operation, timeout) {
    super(`Operation timed out after ${timeout}ms: ${operation}`, 'TIMEOUT', { operation, timeout });
    this.name = 'TimeoutError';
  }
}

class ProxyError extends WebAutomationError {
  constructor(message, proxy) {
    super(message, 'PROXY_ERROR', { proxy });
    this.name = 'ProxyError';
  }
}

class CaptchaError extends WebAutomationError {
  constructor(message, service) {
    super(message, 'CAPTCHA_ERROR', { service });
    this.name = 'CaptchaError';
  }
}

class ValidationError extends WebAutomationError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
  }
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry(fn, options = {}) {
  const {
    retries = 3,
    delay = 1000,
    backoff = 2,
    onRetry = null,
    shouldRetry = null
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      if (attempt < retries) {
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        
        if (onRetry) {
          onRetry(error, attempt, waitTime);
        }

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

/**
 * Circuit breaker pattern
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.failures = 0;
      } else {
        throw new WebAutomationError('Circuit breaker is OPEN', 'CIRCUIT_OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

/**
 * Rate limiter
 */
class RateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 10;
    this.windowMs = options.windowMs || 60000;
    this.requests = [];
  }

  async acquire() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.requests.push(now);
  }
}

module.exports = {
  WebAutomationError,
  NavigationError,
  ElementNotFoundError,
  TimeoutError,
  ProxyError,
  CaptchaError,
  ValidationError,
  withRetry,
  CircuitBreaker,
  RateLimiter
};
