const { createApiClient, CachedClient } = require('../index');
const { withRecovery, retryOnErrors } = require('../errors/recovery');
const {
  NetworkError,
  TimeoutError,
  RateLimitError
} = require('../errors/api-errors');

/**
 * Example: Advanced Features
 * 
 * This example demonstrates caching, rate limiting, circuit breakers,
 * and error recovery patterns.
 */

/**
 * Example 1: Response Caching
 */
async function cachingExample() {
  // Create a cached client
  const client = createApiClient({
    baseURL: 'https://api.example.com',
    cache: {
      ttl: 300000, // 5 minutes
      maxSize: 1000,
      strategy: 'cache-first'
    }
  });
  
  // First request - fetches from API
  const data1 = await client.get('/users/123');
  console.log('First request (API):', data1);
  
  // Second request - returns from cache
  const data2 = await client.get('/users/123');
  console.log('Second request (cache):', data2);
  
  // Skip cache for fresh data
  const fresh = await client.get('/users/123', { cache: false });
  console.log('Fresh request (API):', fresh);
  
  // Custom TTL per request
  const shortCache = await client.get('/users/456', { 
    cache: { ttl: 60000 } // 1 minute
  });
  
  // Invalidate cache
  client.invalidateCache('/users/123');
  
  // Clear all cache
  client.clearCache();
}

/**
 * Example 2: Rate Limiting
 */
async function rateLimitingExample() {
  const { ThrottledClient } = require('../index');
  
  // Limit to 100 requests per minute
  const client = new ThrottledClient({
    baseURL: 'https://api.example.com',
    throttle: {
      limit: 100,
      interval: 60000, // 1 minute
      burstLimit: 10   // Allow 10 requests immediately
    }
  });
  
  // These requests will be throttled automatically
  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push(client.get(`/items/${i}`));
  }
  
  const results = await Promise.all(promises);
  console.log(`Made ${results.length} requests with rate limiting`);
}

/**
 * Example 3: Circuit Breaker
 */
async function circuitBreakerExample() {
  const { CircuitBreakerClient } = require('../index');
  
  const client = new CircuitBreakerClient({
    baseURL: 'https://unreliable-api.example.com',
    circuitBreaker: {
      failureThreshold: 5,  // Open after 5 failures
      resetTimeout: 30000,  // Try again after 30 seconds
      halfOpenMaxCalls: 3   // Test with 3 calls when half-open
    }
  });
  
  try {
    const data = await client.get('/data');
    console.log('Data:', data);
  } catch (error) {
    if (error.message.includes('Circuit breaker is OPEN')) {
      console.log('Circuit is open - API is temporarily unavailable');
      // Use fallback data or queue for later
    }
  }
  
  // Check circuit state
  console.log('Circuit state:', client.getState());
}

/**
 * Example 4: Error Recovery
 */
async function errorRecoveryExample() {
  const client = createApiClient({
    baseURL: 'https://api.example.com'
  });
  
  // Basic retry with recovery
  const result = await withRecovery(
    () => client.get('/critical-data'),
    {
      maxAttempts: 3,
      delay: 1000,
      backoff: 'exponential',
      onError: (error, attempt) => {
        console.log(`Attempt ${attempt} failed: ${error.message}`);
      },
      fallback: () => {
        console.log('All attempts failed, using fallback');
        return { data: [], fromFallback: true };
      }
    }
  );
  
  console.log('Result:', result);
}

/**
 * Example 5: Retry on Specific Errors
 */
async function selectiveRetryExample() {
  const client = createApiClient({
    baseURL: 'https://api.example.com'
  });
  
  // Only retry on network and timeout errors, not 4xx errors
  const result = await retryOnErrors(
    () => client.get('/data'),
    [NetworkError, TimeoutError, RateLimitError],
    {
      maxAttempts: 5,
      delay: 2000,
      backoff: 'exponential'
    }
  );
  
  console.log('Result:', result);
}

/**
 * Example 6: Combined Features
 */
async function combinedFeaturesExample() {
  // Client with caching, rate limiting, and retry
  const client = createApiClient({
    baseURL: 'https://api.example.com',
    auth: {
      type: 'bearer',
      token: process.env.API_TOKEN
    },
    cache: {
      ttl: 60000,
      strategy: 'stale-while-revalidate',
      staleTtl: 300000
    },
    throttle: {
      limit: 60,
      interval: 60000
    },
    retry: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffType: 'exponential'
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 60000
    }
  });
  
  // This request will:
  // 1. Check cache first
  // 2. Respect rate limits
  // 3. Retry on failure
  // 4. Use circuit breaker to prevent cascade failures
  const data = await client.get('/important-data');
  console.log('Data:', data);
}

/**
 * Example 7: Batch Requests with Rate Limiting
 */
async function batchWithRateLimitExample() {
  const { ThrottledClient } = require('../index');
  
  const client = new ThrottledClient({
    baseURL: 'https://api.example.com',
    throttle: {
      limit: 10,
      interval: 1000 // 10 requests per second
    }
  });
  
  // Process items in batches
  const items = Array.from({ length: 100 }, (_, i) => i + 1);
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Process batch with rate limiting
    const batchResults = await Promise.all(
      batch.map(id => client.get(`/items/${id}`))
    );
    
    results.push(...batchResults);
    console.log(`Processed batch ${i / batchSize + 1}/${Math.ceil(items.length / batchSize)}`);
  }
  
  console.log(`Processed ${results.length} items`);
}

// Run examples if this file is executed directly
if (require.main === module) {
  errorRecoveryExample().catch(console.error);
}

module.exports = {
  cachingExample,
  rateLimitingExample,
  circuitBreakerExample,
  errorRecoveryExample,
  selectiveRetryExample,
  combinedFeaturesExample,
  batchWithRateLimitExample
};
