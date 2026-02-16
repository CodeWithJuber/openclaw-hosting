const NodeCache = require('node-cache');

/**
 * Cached client wrapper with TTL support
 */
class CachedClient {
  constructor(config = {}) {
    this.config = config;
    this.ClientClass = config.baseClient || require('../clients/axios-client').AxiosClient;
    this.client = new this.ClientClass(config);
    
    const cacheConfig = config.cache || {};
    this.cache = new NodeCache({
      stdTTL: (cacheConfig.ttl || 300000) / 1000, // Convert to seconds
      maxKeys: cacheConfig.maxSize || 1000
    });
    
    this.keyGenerator = cacheConfig.keyGenerator || this.defaultKeyGenerator;
    this.strategy = cacheConfig.strategy || 'cache-first';
    this.staleTtl = cacheConfig.staleTtl || 0;
  }
  
  defaultKeyGenerator(config) {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
  }
  
  async request(config) {
    const cacheConfig = config.cache !== undefined ? config.cache : true;
    
    if (cacheConfig === false || this.strategy === 'network-only') {
      return this.client.request(config);
    }
    
    const cacheKey = this.keyGenerator(config);
    const cached = this.cache.get(cacheKey);
    
    // Check for stale-while-revalidate
    if (cached && this.staleTtl > 0) {
      const age = Date.now() - cached.timestamp;
      if (age < this.config.cache.ttl) {
        return cached.data;
      } else if (age < this.config.cache.ttl + this.staleTtl) {
        // Serve stale, refresh in background
        this.refreshInBackground(config, cacheKey);
        return cached.data;
      }
    }
    
    switch (this.strategy) {
      case 'cache-first':
        if (cached) return cached.data;
        const data = await this.client.request(config);
        this.setCache(cacheKey, data, cacheConfig);
        return data;
        
      case 'network-first':
        try {
          const networkData = await this.client.request(config);
          this.setCache(cacheKey, networkData, cacheConfig);
          return networkData;
        } catch (error) {
          if (cached) return cached.data;
          throw error;
        }
        
      case 'cache-only':
        if (cached) return cached.data;
        throw new Error('Cache miss and strategy is cache-only');
        
      default:
        return this.client.request(config);
    }
  }
  
  setCache(key, data, cacheConfig) {
    let ttl = this.config.cache?.ttl;
    if (typeof cacheConfig === 'object' && cacheConfig.ttl) {
      ttl = cacheConfig.ttl;
    }
    
    this.cache.set(key, { data, timestamp: Date.now() }, ttl ? ttl / 1000 : undefined);
  }
  
  async refreshInBackground(config, cacheKey) {
    try {
      const data = await this.client.request(config);
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
    } catch (error) {
      // Silent fail on background refresh
    }
  }
  
  invalidateCache(key) {
    this.cache.del(key);
  }
  
  invalidateCachePattern(pattern) {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const matchingKeys = keys.filter(key => regex.test(key));
    this.cache.del(matchingKeys);
  }
  
  clearCache() {
    this.cache.flushAll();
  }
  
  getCacheStats() {
    return this.cache.getStats();
  }
  
  async get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }
  
  async post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  }
  
  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }
  
  async patch(url, data, config = {}) {
    return this.request({ ...config, method: 'PATCH', url, data });
  }
  
  async delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }
  
  addRequestInterceptor(onFulfilled, onRejected) {
    return this.client.addRequestInterceptor(onFulfilled, onRejected);
  }
  
  addResponseInterceptor(onFulfilled, onRejected) {
    return this.client.addResponseInterceptor(onFulfilled, onRejected);
  }
}

module.exports = { CachedClient };
