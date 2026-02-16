/**
 * Proxy Manager for rotating proxies
 */

const { shuffleArray, sleep } = require('./utils');

class ProxyManager {
  constructor(options = {}) {
    this.proxies = options.proxies || [];
    this.currentIndex = 0;
    this.failedProxies = new Map();
    this.maxFailures = options.maxFailures || 3;
    this.banDuration = options.banDuration || 300000; // 5 minutes
    this.rotationStrategy = options.rotationStrategy || 'round-robin'; // round-robin, random, least-used
    
    // Statistics
    this.stats = new Map();
    this.proxies.forEach(proxy => {
      this.stats.set(this.getProxyKey(proxy), {
        uses: 0,
        failures: 0,
        lastUsed: null,
        totalResponseTime: 0
      });
    });
  }

  /**
   * Get unique key for proxy
   */
  getProxyKey(proxy) {
    if (typeof proxy === 'string') return proxy;
    return `${proxy.server}:${proxy.username || 'noauth'}`;
  }

  /**
   * Add proxy to pool
   */
  addProxy(proxy) {
    this.proxies.push(proxy);
    this.stats.set(this.getProxyKey(proxy), {
      uses: 0,
      failures: 0,
      lastUsed: null,
      totalResponseTime: 0
    });
  }

  /**
   * Remove proxy from pool
   */
  removeProxy(proxy) {
    const key = this.getProxyKey(proxy);
    this.proxies = this.proxies.filter(p => this.getProxyKey(p) !== key);
    this.stats.delete(key);
    this.failedProxies.delete(key);
  }

  /**
   * Get next available proxy
   */
  getNextProxy() {
    const availableProxies = this.getAvailableProxies();
    
    if (availableProxies.length === 0) {
      throw new Error('No available proxies');
    }

    let selectedProxy;

    switch (this.rotationStrategy) {
      case 'random':
        selectedProxy = availableProxies[Math.floor(Math.random() * availableProxies.length)];
        break;
      case 'least-used':
        selectedProxy = this.getLeastUsedProxy(availableProxies);
        break;
      case 'round-robin':
      default:
        selectedProxy = availableProxies[this.currentIndex % availableProxies.length];
        this.currentIndex++;
        break;
    }

    this.updateStats(selectedProxy, 'use');
    return selectedProxy;
  }

  /**
   * Get available proxies (not banned)
   */
  getAvailableProxies() {
    const now = Date.now();
    return this.proxies.filter(proxy => {
      const key = this.getProxyKey(proxy);
      const banInfo = this.failedProxies.get(key);
      
      if (!banInfo) return true;
      
      // Check if ban has expired
      if (now - banInfo.bannedAt > this.banDuration) {
        this.failedProxies.delete(key);
        return true;
      }
      
      return false;
    });
  }

  /**
   * Get least used proxy
   */
  getLeastUsedProxy(availableProxies) {
    return availableProxies.reduce((least, current) => {
      const leastKey = this.getProxyKey(least);
      const currentKey = this.getProxyKey(current);
      const leastStats = this.stats.get(leastKey);
      const currentStats = this.stats.get(currentKey);
      
      return currentStats.uses < leastStats.uses ? current : least;
    });
  }

  /**
   * Mark proxy as failed
   */
  markFailed(proxy, error) {
    const key = this.getProxyKey(proxy);
    const stats = this.stats.get(key);
    
    if (stats) {
      stats.failures++;
    }

    const failures = (this.failedProxies.get(key)?.failures || 0) + 1;
    
    if (failures >= this.maxFailures) {
      this.failedProxies.set(key, {
        failures,
        bannedAt: Date.now(),
        lastError: error?.message
      });
    } else {
      this.failedProxies.set(key, { failures, bannedAt: null, lastError: error?.message });
    }
  }

  /**
   * Mark proxy as successful
   */
  markSuccess(proxy, responseTime) {
    const key = this.getProxyKey(proxy);
    const stats = this.stats.get(key);
    
    if (stats) {
      stats.totalResponseTime += responseTime;
    }

    // Clear failures on success
    this.failedProxies.delete(key);
  }

  /**
   * Update proxy statistics
   */
  updateStats(proxy, action) {
    const key = this.getProxyKey(proxy);
    const stats = this.stats.get(key);
    
    if (!stats) return;

    if (action === 'use') {
      stats.uses++;
      stats.lastUsed = Date.now();
    }
  }

  /**
   * Get proxy statistics
   */
  getStats() {
    const stats = {};
    for (const [key, data] of this.stats) {
      stats[key] = {
        ...data,
        avgResponseTime: data.uses > 0 ? data.totalResponseTime / data.uses : 0,
        isBanned: this.failedProxies.has(key)
      };
    }
    return stats;
  }

  /**
   * Test proxy connectivity
   */
  async testProxy(proxy, testUrl = 'https://httpbin.org/ip') {
    const startTime = Date.now();
    
    try {
      const axios = require('axios');
      const { ProxyAgent } = require('proxy-agent');
      
      const proxyUrl = typeof proxy === 'string' 
        ? proxy 
        : `http://${proxy.username}:${proxy.password}@${proxy.server.replace('http://', '').replace('https://', '')}`;
      
      const agent = new ProxyAgent(proxyUrl);
      
      const response = await axios.get(testUrl, {
        httpsAgent: agent,
        httpAgent: agent,
        timeout: 30000
      });
      
      const responseTime = Date.now() - startTime;
      this.markSuccess(proxy, responseTime);
      
      return {
        success: true,
        responseTime,
        data: response.data
      };
    } catch (error) {
      this.markFailed(proxy, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test all proxies
   */
  async testAllProxies(testUrl) {
    const results = [];
    
    for (const proxy of this.proxies) {
      const result = await this.testProxy(proxy, testUrl);
      results.push({
        proxy: this.getProxyKey(proxy),
        ...result
      });
      await sleep(1000); // Rate limit tests
    }
    
    return results;
  }

  /**
   * Shuffle proxy order
   */
  shuffle() {
    this.proxies = shuffleArray(this.proxies);
    this.currentIndex = 0;
  }

  /**
   * Get proxy count
   */
  get count() {
    return this.proxies.length;
  }

  /**
   * Get available proxy count
   */
  get availableCount() {
    return this.getAvailableProxies().length;
  }
}

module.exports = { ProxyManager };
