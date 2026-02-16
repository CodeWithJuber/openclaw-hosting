/**
 * LLM Response Cache - Applied compression technique
 * Reduces API calls by caching responses
 */

interface CacheEntry {
  response: string;
  model: string;
  timestamp: number;
  ttl: number;
}

class LLMResponseCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly defaultTTL = 3600 * 1000; // 1 hour
  
  /**
   * Generate cache key from prompt and parameters
   */
  private generateKey(prompt: string, model: string, params?: object): string {
    const data = JSON.stringify({ prompt, model, params });
    return this.hashString(data);
  }
  
  /**
   * Simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
  
  /**
   * Get cached response
   */
  async get(prompt: string, model: string, params?: object): Promise<string | null> {
    const key = this.generateKey(prompt, model, params);
    const entry = this.memoryCache.get(key);
    
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.response;
  }
  
  /**
   * Store response in cache
   */
  async set(
    prompt: string, 
    model: string, 
    response: string, 
    params?: object,
    ttl?: number
  ): Promise<void> {
    const key = this.generateKey(prompt, model, params);
    
    this.memoryCache.set(key, {
      response,
      model,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
    
    // Cleanup old entries if cache too large
    if (this.memoryCache.size > 10000) {
      this.cleanup();
    }
  }
  
  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }
  
  /**
   * Get cache stats
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.memoryCache.size,
      hitRate: 0 // Would track in production
    };
  }
  
  /**
   * Clear all cached entries
   */
  clear(): void {
    this.memoryCache.clear();
  }
}

// Singleton instance
export const llmCache = new LLMResponseCache();

/**
 * Decorator to cache LLM calls
 */
export function cachedLLM(ttl?: number) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const [prompt, model, params] = args;
      
      // Try cache first
      const cached = await llmCache.get(prompt, model, params);
      if (cached) {
        return cached;
      }
      
      // Call original method
      const result = await originalMethod.apply(this, args);
      
      // Cache result
      await llmCache.set(prompt, model, result, params, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}
