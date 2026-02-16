const { createApiClient, AxiosClient, FetchClient } = require('../index');

/**
 * Example: Basic HTTP Client Usage
 * 
 * This example demonstrates how to use the basic HTTP clients
 * with different authentication methods.
 */

async function basicHttpExample() {
  // Example 1: Simple client with Bearer token
  const apiClient = createApiClient({
    baseURL: 'https://api.example.com',
    auth: {
      type: 'bearer',
      token: process.env.API_TOKEN
    }
  });
  
  try {
    const user = await apiClient.get('/users/123');
    console.log('User:', user);
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Example 2: API Key authentication (header)
  const apiKeyClient = createApiClient({
    baseURL: 'https://api.example.com',
    auth: {
      type: 'apiKey',
      key: process.env.API_KEY,
      headerName: 'X-API-Key'
    }
  });
  
  // Example 3: API Key authentication (query param)
  const queryKeyClient = createApiClient({
    baseURL: 'https://api.example.com',
    auth: {
      type: 'apiKey',
      key: process.env.API_KEY,
      in: 'query',
      paramName: 'api_key'
    }
  });
  
  // Example 4: Using Fetch client instead of Axios
  const fetchClient = createApiClient({
    baseURL: 'https://api.example.com',
    preferFetch: true,
    auth: {
      type: 'bearer',
      token: process.env.API_TOKEN
    }
  });
}

/**
 * Example: Retry Logic
 */
async function retryExample() {
  const client = createApiClient({
    baseURL: 'https://api.example.com',
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffType: 'exponential',
      retryCondition: (error) => {
        // Retry on network errors or 5xx responses
        return !error.response || error.response.status >= 500;
      }
    }
  });
  
  // This request will automatically retry on failure
  const data = await client.get('/unreliable-endpoint');
}

/**
 * Example: Request/Response Interceptors
 */
async function interceptorExample() {
  const client = new AxiosClient({
    baseURL: 'https://api.example.com'
  });
  
  // Add request ID to all requests
  client.addRequestInterceptor((config) => {
    config.headers['X-Request-ID'] = generateUUID();
    config.headers['X-Timestamp'] = new Date().toISOString();
    return config;
  });
  
  // Log all responses
  client.addResponseInterceptor(
    (response) => {
      console.log(`[${response.config.headers['X-Request-ID']}] ${response.status}`);
      return response;
    },
    (error) => {
      console.error('Request failed:', error.message);
      throw error;
    }
  );
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Run examples if this file is executed directly
if (require.main === module) {
  basicHttpExample().catch(console.error);
}

module.exports = {
  basicHttpExample,
  retryExample,
  interceptorExample
};
