/**
 * Utility functions for Web Automation
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate random delay between min and max
 */
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random user agent
 */
function randomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Parse proxy URL
 */
function parseProxy(proxyString) {
  try {
    const url = new URL(proxyString);
    return {
      server: `${url.protocol}//${url.hostname}:${url.port}`,
      username: url.username || undefined,
      password: url.password || undefined
    };
  } catch {
    return { server: proxyString };
  }
}

/**
 * Validate URL
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9.-]/gi, '_').replace(/_{2,}/g, '_');
}

/**
 * Generate unique ID
 */
function generateId(length = 16) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Deep merge objects
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  
  return output;
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Retry with exponential backoff
 */
async function retry(fn, options = {}) {
  const { retries = 3, delay = 1000, factor = 2 } = options;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const waitTime = delay * Math.pow(factor, attempt - 1);
        await sleep(waitTime);
      }
    }
  }

  throw lastError;
}

/**
 * Create directory if not exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Parse CSV content
 */
function parseCSV(content, options = {}) {
  const delimiter = options.delimiter || ',';
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    results.push(row);
  }
  
  return results;
}

/**
 * Convert object to CSV
 */
function toCSV(data, options = {}) {
  if (!data.length) return '';
  
  const delimiter = options.delimiter || ',';
  const headers = Object.keys(data[0]);
  
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains delimiter
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(delimiter) ? `"${escaped}"` : escaped;
    }).join(delimiter)
  );
  
  return [headers.join(delimiter), ...rows].join('\n');
}

/**
 * Mask sensitive data in logs
 */
function maskSensitive(data, fields = ['password', 'token', 'apiKey', 'secret']) {
  const masked = { ...data };
  
  for (const field of fields) {
    if (masked[field]) {
      masked[field] = '***';
    }
  }
  
  return masked;
}

module.exports = {
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
