/**
 * Main exports for Web Automation Skill
 */

const { WebAutomation } = require('./index.js');
const { 
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
} = require('./errors.js');

const { ProxyManager } = require('./proxy-manager.js');

const {
  randomDelay,
  sleep,
  randomUserAgent,
  shuffleArray,
  parseProxy,
  isValidUrl,
  sanitizeFilename,
  generateId,
  deepMerge,
  chunkArray,
  retry,
  ensureDir,
  formatBytes,
  parseCSV,
  toCSV,
  maskSensitive
} = require('./utils.js');

module.exports = {
  // Main class
  WebAutomation,
  
  // Error classes
  WebAutomationError,
  NavigationError,
  ElementNotFoundError,
  TimeoutError,
  ProxyError,
  CaptchaError,
  ValidationError,
  
  // Error utilities
  withRetry,
  CircuitBreaker,
  RateLimiter,
  
  // Proxy management
  ProxyManager,
  
  // Utilities
  randomDelay,
  sleep,
  randomUserAgent,
  shuffleArray,
  parseProxy,
  isValidUrl,
  sanitizeFilename,
  generateId,
  deepMerge,
  chunkArray,
  retry,
  ensureDir,
  formatBytes,
  parseCSV,
  toCSV,
  maskSensitive
};
