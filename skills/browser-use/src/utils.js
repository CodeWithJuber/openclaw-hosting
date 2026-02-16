/**
 * Utility functions for Browser-Use skill
 */

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>}
 */
async function retry(fn, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;
  const shouldRetry = options.shouldRetry || (() => true);
  const onRetry = options.onRetry || (() => {});
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      onRetry(error, attempt);
      
      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Generate random delay between min and max
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {number}
 */
function randomDelay(min = 1000, max = 3000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format URL with protocol
 * @param {string} url - URL to format
 * @returns {string}
 */
function formatUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Parse cookie string to object
 * @param {string} cookieStr - Cookie string
 * @returns {Object}
 */
function parseCookie(cookieStr) {
  const parts = cookieStr.split(';');
  const [name, value] = parts[0].trim().split('=');
  
  const cookie = { name, value };
  
  for (let i = 1; i < parts.length; i++) {
    const [key, val] = parts[i].trim().split('=');
    const keyLower = key.toLowerCase();
    
    if (keyLower === 'expires') {
      cookie.expires = new Date(val).getTime() / 1000;
    } else if (keyLower === 'max-age') {
      cookie.expires = Date.now() / 1000 + parseInt(val);
    } else if (keyLower === 'domain') {
      cookie.domain = val;
    } else if (keyLower === 'path') {
      cookie.path = val;
    } else if (keyLower === 'secure') {
      cookie.secure = true;
    } else if (keyLower === 'httponly') {
      cookie.httpOnly = true;
    } else if (keyLower === 'samesite') {
      cookie.sameSite = val;
    }
  }
  
  return cookie;
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename
 * @param {string} filename - Filename to sanitize
 * @returns {string}
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[\u003c>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255);
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object}
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Generate UUID
 * @returns {string}
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Wait for condition with timeout
 * @param {Function} condition - Condition function
 * @param {Object} options - Wait options
 * @returns {Promise<boolean>}
 */
async function waitFor(condition, options = {}) {
  const timeout = options.timeout || 30000;
  const interval = options.interval || 100;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await sleep(interval);
  }
  
  return false;
}

module.exports = {
  sleep,
  retry,
  randomDelay,
  formatUrl,
  parseCookie,
  isValidUrl,
  sanitizeFilename,
  deepMerge,
  generateUUID,
  waitFor
};
