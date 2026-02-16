const axios = require('axios');
const axiosRetry = require('axios-retry');

/**
 * Axios-based HTTP client with retry support
 */
class AxiosClient {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...config.headers
      }
    };
    
    this.instance = axios.create(this.config);
    this.rateLimitInfo = null;
    
    // Setup retry if configured
    if (config.retry) {
      this.setupRetry(config.retry);
    }
    
    // Setup auth if configured
    if (config.auth) {
      this.setupAuth(config.auth);
    }
    
    // Setup rate limit tracking if configured
    if (config.respectRateLimits) {
      this.setupRateLimitTracking(config.rateLimitHeaders);
    }
    
    // Store context for interceptors
    this.context = config.context || {};
  }
  
  setupRetry(retryConfig) {
    axiosRetry(this.instance, {
      retries: retryConfig.maxRetries || 3,
      retryDelay: (retryCount) => {
        const delay = retryConfig.retryDelay || 1000;
        if (retryConfig.backoffType === 'exponential') {
          return delay * Math.pow(2, retryCount - 1);
        }
        return delay;
      },
      retryCondition: retryConfig.retryCondition || ((error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
               (error.response?.status >= 500);
      })
    });
  }
  
  setupAuth(authConfig) {
    this.instance.interceptors.request.use((config) => {
      switch (authConfig.type) {
        case 'bearer':
          config.headers['Authorization'] = `Bearer ${authConfig.token}`;
          break;
        case 'apiKey':
          if (authConfig.in === 'query') {
            config.params = config.params || {};
            config.params[authConfig.paramName || 'api_key'] = authConfig.key;
          } else {
            config.headers[authConfig.headerName || 'X-API-Key'] = authConfig.key;
          }
          break;
        case 'custom':
          if (authConfig.applyAuth) {
            config = authConfig.applyAuth(config);
          }
          break;
      }
      return config;
    });
  }
  
  setupRateLimitTracking(headerNames = {}) {
    const headers = {
      limit: headerNames.limit || 'x-ratelimit-limit',
      remaining: headerNames.remaining || 'x-ratelimit-remaining',
      reset: headerNames.reset || 'x-ratelimit-reset',
      ...headerNames
    };
    
    this.instance.interceptors.response.use((response) => {
      this.rateLimitInfo = {
        limit: parseInt(response.headers[headers.limit]) || null,
        remaining: parseInt(response.headers[headers.remaining]) || null,
        resetAt: parseInt(response.headers[headers.reset]) || null
      };
      return response;
    });
  }
  
  async request(config) {
    const mergedConfig = {
      ...config,
      context: { ...this.context, ...config.context }
    };
    const response = await this.instance.request(mergedConfig);
    return response.data;
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
    return this.instance.interceptors.request.use(onFulfilled, onRejected);
  }
  
  addResponseInterceptor(onFulfilled, onRejected) {
    return this.instance.interceptors.response.use(onFulfilled, onRejected);
  }
  
  getRateLimitInfo() {
    return this.rateLimitInfo;
  }
}

module.exports = { AxiosClient };
