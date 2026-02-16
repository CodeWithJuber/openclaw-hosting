const pThrottle = require('p-throttle');

/**
 * Throttled client wrapper that limits request rate
 */
class ThrottledClient {
  constructor(config = {}) {
    this.config = config;
    this.ClientClass = config.baseClient || require('./axios-client').AxiosClient;
    this.client = new this.ClientClass(config);
    
    // Setup throttling
    const throttleConfig = config.throttle || {};
    this.throttle = pThrottle({
      limit: throttleConfig.limit || 100,
      interval: throttleConfig.interval || 60000
    });
    
    this.burstLimit = throttleConfig.burstLimit || throttleConfig.limit || 100;
    this.currentBurst = 0;
  }
  
  async request(config) {
    const throttledRequest = this.throttle(async () => {
      return this.client.request(config);
    });
    
    return throttledRequest();
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
  
  getRateLimitInfo() {
    return this.client.getRateLimitInfo();
  }
}

module.exports = { ThrottledClient };
