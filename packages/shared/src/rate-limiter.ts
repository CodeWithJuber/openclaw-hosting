// Rate limiter implementation for Hetzner and Cloudflare APIs
// Token bucket algorithm with exponential backoff

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  
  constructor(
    private capacity: number,
    private refillRate: number // tokens per ms
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  async acquire(): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    
    // Wait for token
    const waitTime = (1 - this.tokens) / this.refillRate;
    await sleep(waitTime);
    return this.acquire();
  }
  
  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Rate limiters for different APIs
export const rateLimiters = {
  // Hetzner: 3600 requests/hour = 1 request/second
  hetzner: new TokenBucket(100, 1 / 1000),
  
  // Cloudflare: 1200 requests/5 minutes = 4 requests/second
  cloudflare: new TokenBucket(200, 4 / 1000),
  
  // WHMCS: 100 requests/minute
  whmcs: new TokenBucket(50, 100 / 60000)
};

// API call with retry and rate limiting
export async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  limiter: TokenBucket,
  maxRetries: number = 3
): Promise<T> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Wait for rate limit token
      await limiter.acquire();
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // Check if rate limited
      if (error.status === 429 || error.code === 'rate_limited') {
        const retryAfter = error.headers?.['retry-after'] || Math.pow(2, i);
        console.log(`Rate limited. Retrying after ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }
      
      // Don't retry on client errors
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Exponential backoff for server errors
      const backoff = Math.pow(2, i) * 1000;
      await sleep(backoff);
    }
  }
  
  throw lastError;
}
