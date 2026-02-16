/**
 * Circuit breaker pattern implementation for API clients
 */
class CircuitBreakerClient {
  constructor(config = {}) {
    this.config = config;
    this.ClientClass = config.baseClient || require('./axios-client').AxiosClient;
    this.client = new this.ClientClass(config);
    
    const cbConfig = config.circuitBreaker || {};
    this.failureThreshold = cbConfig.failureThreshold || 5;
    this.resetTimeout = cbConfig.resetTimeout || 30000;
    this.halfOpenMaxCalls = cbConfig.halfOpenMaxCalls || 3;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }
  
  async request(config) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.halfOpenCalls = 0;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - too many failures');
      }
    }
    
    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new Error('Circuit breaker is HALF_OPEN - max test calls reached');
    }
    
    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
    }
    
    try {
      const result = await this.client.request(config);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.state = 'CLOSED';
        this.successCount = 0;
        this.halfOpenCalls = 0;
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
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

module.exports = { CircuitBreakerClient };
