/**
 * Fetch-based HTTP client for modern environments
 */
class FetchClient {
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
    
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.rateLimitInfo = null;
    this.context = config.context || {};
    
    // Setup auth if configured
    if (config.auth) {
      this.setupAuth(config.auth);
    }
  }
  
  setupAuth(authConfig) {
    this.addRequestInterceptor((config) => {
      switch (authConfig.type) {
        case 'bearer':
          config.headers['Authorization'] = `Bearer ${authConfig.token}`;
          break;
        case 'apiKey':
          if (authConfig.in === 'query') {
            const separator = config.url.includes('?') ? '&' : '?';
            config.url += `${separator}${authConfig.paramName || 'api_key'}=${authConfig.key}`;
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
  
  async request(config) {
    let mergedConfig = {
      ...this.config,
      ...config,
      headers: { ...this.config.headers, ...config.headers },
      context: { ...this.context, ...config.context }
    };
    
    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      mergedConfig = await interceptor(mergedConfig);
    }
    
    const url = mergedConfig.baseURL 
      ? `${mergedConfig.baseURL}${mergedConfig.url}` 
      : mergedConfig.url;
    
    // Build query string
    let fullUrl = url;
    if (mergedConfig.params) {
      const params = new URLSearchParams(mergedConfig.params);
      fullUrl += `?${params.toString()}`;
    }
    
    // Setup timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout);
    
    try {
      const fetchConfig = {
        method: mergedConfig.method || 'GET',
        headers: mergedConfig.headers,
        signal: controller.signal,
        body: mergedConfig.data ? JSON.stringify(mergedConfig.data) : undefined
      };
      
      const response = await fetch(fullUrl, fetchConfig);
      clearTimeout(timeoutId);
      
      // Track rate limits
      this.rateLimitInfo = {
        limit: response.headers.get('x-ratelimit-limit'),
        remaining: response.headers.get('x-ratelimit-remaining'),
        resetAt: response.headers.get('x-ratelimit-reset')
      };
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = await response.text();
        throw error;
      }
      
      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Apply response interceptors
      let result = { data, status: response.status, headers: response.headers, config: mergedConfig };
      for (const interceptor of this.responseInterceptors) {
        result = await interceptor(result);
      }
      
      return result.data !== undefined ? result.data : result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Apply error response interceptors
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.length >= 2) {
          try {
            await interceptor(null, error);
          } catch (e) {
            // Interceptor handled error
          }
        }
      }
      
      throw error;
    }
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
    this.requestInterceptors.push(onFulfilled);
    return this.requestInterceptors.length - 1;
  }
  
  addResponseInterceptor(onFulfilled, onRejected) {
    this.responseInterceptors.push(onFulfilled);
    return this.responseInterceptors.length - 1;
  }
  
  getRateLimitInfo() {
    return this.rateLimitInfo;
  }
}

module.exports = { FetchClient };
