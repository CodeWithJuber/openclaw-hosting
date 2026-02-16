# API Integration Skill

A comprehensive skill for integrating with REST and GraphQL APIs, featuring robust authentication, rate limiting, caching, and error handling.

## Features

- **HTTP Clients**: Axios and native fetch with unified interface
- **Authentication**: Bearer tokens, API keys, OAuth2 flows
- **Rate Limiting**: Built-in throttling and retry logic
- **Webhook Handling**: Secure webhook receiver with signature verification
- **GraphQL Support**: Full GraphQL client with query builder
- **Response Caching**: Intelligent caching with TTL support
- **Error Handling**: Structured error types and recovery strategies
- **Common Integrations**: Pre-built clients for GitHub, Stripe, and more

## Quick Start

```javascript
const { createApiClient } = require('@openclaw/skill-api-integration');

// Simple REST API client
const client = createApiClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'bearer',
    token: process.env.API_TOKEN
  }
});

const data = await client.get('/users/123');
```

## Table of Contents

1. [HTTP Client Utilities](#http-client-utilities)
2. [Authentication](#authentication)
3. [Rate Limiting & Retry](#rate-limiting--retry)
4. [Webhook Handling](#webhook-handling)
5. [GraphQL Client](#graphql-client)
6. [API Response Caching](#api-response-caching)
7. [Error Handling](#error-handling)
8. [Common Integrations](#common-integrations)

---

## HTTP Client Utilities

### Axios Client

The Axios client provides a feature-rich HTTP client with interceptors, request/response transformation, and automatic JSON parsing.

```javascript
const { AxiosClient } = require('@openclaw/skill-api-integration');

const client = new AxiosClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'X-Custom-Header': 'value'
  }
});

// GET request
const user = await client.get('/users/123', {
  params: { include: 'profile' }
});

// POST request
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT/PATCH/DELETE
await client.put('/users/123', { name: 'Jane Doe' });
await client.patch('/users/123', { email: 'jane@example.com' });
await client.delete('/users/123');
```

### Fetch Client

Lightweight fetch-based client for modern environments.

```javascript
const { FetchClient } = require('@openclaw/skill-api-integration');

const client = new FetchClient({
  baseURL: 'https://api.example.com',
  timeout: 30000
});

const data = await client.get('/users/123');
```

### Unified Interface

Both clients implement the same interface for easy swapping:

```javascript
const { createApiClient } = require('@openclaw/skill-api-integration');

// Automatically selects best client based on environment
const client = createApiClient({
  baseURL: 'https://api.example.com',
  preferFetch: true // Use fetch instead of axios
});
```

### Request/Response Interceptors

```javascript
client.addRequestInterceptor((config) => {
  config.headers['X-Request-ID'] = generateUUID();
  return config;
});

client.addResponseInterceptor(
  (response) => {
    // Transform successful responses
    return response.data;
  },
  (error) => {
    // Handle errors globally
    console.error('API Error:', error.message);
    throw error;
  }
);
```

---

## Authentication

### Bearer Token Authentication

```javascript
const client = createApiClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'bearer',
    token: 'your-access-token',
    // Optional: token refresh
    refreshToken: 'refresh-token',
    onTokenRefresh: (newToken) => {
      // Save new token
      process.env.API_TOKEN = newToken;
    }
  }
});
```

### API Key Authentication

```javascript
// Header-based API key
const client = createApiClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'apiKey',
    key: 'your-api-key',
    headerName: 'X-API-Key' // Default: X-API-Key
  }
});

// Query parameter-based API key
const client2 = createApiClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'apiKey',
    key: 'your-api-key',
    in: 'query',
    paramName: 'api_key'
  }
});
```

### OAuth2 Authentication

```javascript
const { OAuth2Client } = require('@openclaw/skill-api-integration/auth');

// Authorization Code Flow
const oauth = new OAuth2Client({
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  authorizationEndpoint: 'https://auth.example.com/authorize',
  tokenEndpoint: 'https://auth.example.com/token',
  redirectUri: 'https://your-app.com/callback',
  scopes: ['read', 'write']
});

// Get authorization URL
const authUrl = oauth.getAuthorizationUrl({
  state: 'random-state-string',
  codeChallenge: 'pkce-code-challenge' // Optional PKCE
});

// Exchange code for token
const tokens = await oauth.exchangeCodeForToken('authorization-code');

// Refresh token
const newTokens = await oauth.refreshAccessToken(tokens.refresh_token);

// Client Credentials Flow
const clientCreds = new OAuth2Client({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  tokenEndpoint: 'https://auth.example.com/token'
});

const tokens = await clientCreds.clientCredentialsGrant();
```

### Custom Authentication

```javascript
const client = createApiClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'custom',
    applyAuth: (config) => {
      const timestamp = Date.now();
      const signature = generateSignature(config, timestamp);
      config.headers['X-Timestamp'] = timestamp;
      config.headers['X-Signature'] = signature;
      return config;
    }
  }
});
```

---

## Rate Limiting & Retry

### Automatic Retry with Exponential Backoff

```javascript
const client = createApiClient({
  baseURL: 'https://api.example.com',
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // Initial delay in ms
    retryCondition: (error) => {
      // Retry on network errors or 5xx responses
      return !error.response || error.response.status >= 500;
    },
    backoffType: 'exponential' // 'exponential', 'linear', 'fixed'
  }
});
```

### Rate Limiting (Throttling)

```javascript
const { ThrottledClient } = require('@openclaw/skill-api-integration');

// Limit to 100 requests per minute
const client = new ThrottledClient({
  baseURL: 'https://api.example.com',
  throttle: {
    limit: 100,
    interval: 60000 // 1 minute
  }
});

// Burst handling
const client2 = new ThrottledClient({
  baseURL: 'https://api.example.com',
  throttle: {
    limit: 100,
    interval: 60000,
    burstLimit: 10 // Allow 10 requests immediately
  }
});
```

### Rate Limit Response Handling

```javascript
const client = createApiClient({
  baseURL: 'https://api.example.com',
  respectRateLimits: true, // Auto-retry on 429 responses
  rateLimitHeaders: {
    limit: 'X-RateLimit-Limit',
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset'
  }
});

// Access rate limit info
const response = await client.get('/data');
console.log(client.getRateLimitInfo());
// { limit: 1000, remaining: 999, resetAt: 1704067200 }
```

---

## Webhook Handling

### Webhook Receiver

```javascript
const { WebhookReceiver } = require('@openclaw/skill-api-integration/webhooks');

const receiver = new WebhookReceiver({
  secret: process.env.WEBHOOK_SECRET,
  algorithm: 'sha256', // Signature algorithm
  signatureHeader: 'X-Webhook-Signature',
  timestampHeader: 'X-Webhook-Timestamp',
  maxAge: 300000 // 5 minutes - reject old webhooks
});

// Express middleware
app.post('/webhooks', receiver.middleware(), (req, res) => {
  const event = req.webhookEvent;
  
  switch (event.type) {
    case 'user.created':
      handleUserCreated(event.data);
      break;
    case 'payment.success':
      handlePaymentSuccess(event.data);
      break;
  }
  
  res.status(200).send('OK');
});

// Manual verification
const isValid = receiver.verifySignature(payload, signature, timestamp);
```

### Webhook Event Parser

```javascript
const { WebhookParser } = require('@openclaw/skill-api-integration/webhooks');

const parser = new WebhookParser({
  // Schema validation with Zod
  schema: z.object({
    type: z.string(),
    data: z.object({
      id: z.string(),
      status: z.enum(['pending', 'completed', 'failed'])
    })
  })
});

const event = parser.parse(req.body);
```

### Common Webhook Providers

```javascript
const { 
  StripeWebhookReceiver,
  GitHubWebhookReceiver,
  SlackWebhookReceiver 
} = require('@openclaw/skill-api-integration/webhooks/providers');

// Stripe
const stripeWebhook = new StripeWebhookReceiver({
  secret: process.env.STRIPE_WEBHOOK_SECRET
});

app.post('/webhooks/stripe', stripeWebhook.middleware(), handleStripeEvent);

// GitHub
const githubWebhook = new GitHubWebhookReceiver({
  secret: process.env.GITHUB_WEBHOOK_SECRET
});

app.post('/webhooks/github', githubWebhook.middleware(), handleGitHubEvent);
```

---

## GraphQL Client

### Basic Usage

```javascript
const { GraphQLClient } = require('@openclaw/skill-api-integration/graphql');

const client = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Simple query
const { user } = await client.query(`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`, { id: '123' });

// Mutation
const { createUser } = await client.mutation(`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
    }
  }
`, { input: { name: 'John', email: 'john@example.com' } });
```

### Query Builder

```javascript
const { QueryBuilder } = require('@openclaw/skill-api-integration/graphql');

const qb = new QueryBuilder();

// Build queries programmatically
const query = qb
  .query('GetUser')
  .variable('id', 'ID!')
  .field('user', { id: '$id' }, (user) => {
    user
      .field('id')
      .field('name')
      .field('email')
      .field('posts', { limit: 10 }, (posts) => {
        posts
          .field('id')
          .field('title')
          .field('createdAt');
      });
  })
  .build();

// Generated query:
// query GetUser($id: ID!) {
//   user(id: $id) {
//     id
//     name
//     email
//     posts(limit: 10) {
//       id
//       title
//       createdAt
//     }
//   }
// }
```

### Fragments

```javascript
const userFragment = qb.fragment('UserFields', 'User', (f) => {
  f.field('id').field('name').field('email');
});

const query = qb
  .query('GetUser')
  .variable('id', 'ID!')
  .fragment(userFragment)
  .field('user', { id: '$id' }, (user) => {
    user.spread('UserFields');
  })
  .build();
```

### Subscriptions (WebSocket)

```javascript
const { GraphQLSubscriptionClient } = require('@openclaw/skill-api-integration/graphql');

const subClient = new GraphQLSubscriptionClient({
  endpoint: 'wss://api.example.com/graphql',
  connectionParams: {
    authorization: `Bearer ${token}`
  }
});

const unsubscribe = await subClient.subscribe(`
  subscription OnUserUpdated($id: ID!) {
    userUpdated(id: $id) {
      id
      name
      status
    }
  }
`, { id: '123' }, (data) => {
  console.log('User updated:', data);
});

// Later: unsubscribe();
```

---

## API Response Caching

### In-Memory Cache

```javascript
const { CachedClient } = require('@openclaw/skill-api-integration/cache');

const client = new CachedClient({
  baseURL: 'https://api.example.com',
  cache: {
    ttl: 300000, // 5 minutes default TTL
    maxSize: 1000, // Max 1000 entries
    keyGenerator: (config) => `${config.method}:${config.url}`
  }
});

// Cached request
const data = await client.get('/users/123'); // Fetches from API
const data2 = await client.get('/users/123'); // Returns from cache

// Skip cache
const fresh = await client.get('/users/123', { cache: false });

// Custom TTL per request
const data = await client.get('/users/123', { cache: { ttl: 60000 } });

// Invalidate cache
client.invalidateCache('/users/123');
client.invalidateCachePattern('/users/*');
client.clearCache();
```

### Redis Cache (Advanced)

```javascript
const { RedisCachedClient } = require('@openclaw/skill-api-integration/cache');

const client = new RedisCachedClient({
  baseURL: 'https://api.example.com',
  redis: {
    host: 'localhost',
    port: 6379,
    keyPrefix: 'api:cache:'
  },
  cache: {
    ttl: 300000
  }
});
```

### Cache Strategies

```javascript
const client = new CachedClient({
  baseURL: 'https://api.example.com',
  cache: {
    strategy: 'stale-while-revalidate',
    ttl: 300000,
    staleTtl: 86400000 // Serve stale for up to 24 hours while revalidating
  }
});

// Strategies:
// - 'cache-first': Return cached, fetch in background if stale
// - 'network-first': Always fetch, cache for fallback
// - 'stale-while-revalidate': Return cached immediately, update in background
// - 'cache-only': Never fetch, only return cached
// - 'network-only': Never cache, always fetch
```

---

## Error Handling

### Structured Error Types

```javascript
const { 
  ApiError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  AuthenticationError,
  ValidationError 
} = require('@openclaw/skill-api-integration/errors');

try {
  const data = await client.get('/users/123');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof AuthenticationError) {
    console.log('Authentication failed. Refreshing token...');
  } else if (error instanceof ValidationError) {
    console.log('Validation errors:', error.validationErrors);
  } else if (error instanceof NetworkError) {
    console.log('Network error. Will retry...');
  }
}
```

### Error Recovery Strategies

```javascript
const { withRecovery } = require('@openclaw/skill-api-integration/errors');

const result = await withRecovery(
  () => client.get('/critical-data'),
  {
    maxAttempts: 3,
    delay: 1000,
    onError: (error, attempt) => {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
    },
    fallback: () => ({ data: [] }) // Return default on failure
  }
);
```

### Circuit Breaker

```javascript
const { CircuitBreakerClient } = require('@openclaw/skill-api-integration');

const client = new CircuitBreakerClient({
  baseURL: 'https://api.example.com',
  circuitBreaker: {
    failureThreshold: 5, // Open after 5 failures
    resetTimeout: 30000, // Try again after 30 seconds
    halfOpenMaxCalls: 3  // Test with 3 calls when half-open
  }
});

// When circuit is open, requests fail immediately
// without hitting the API
```

---

## Common Integrations

### GitHub API

```javascript
const { GitHubClient } = require('@openclaw/skill-api-integration/integrations');

const github = new GitHubClient({
  token: process.env.GITHUB_TOKEN
});

// Users
const user = await github.getUser('octocat');
const repos = await github.getUserRepos('octocat', { per_page: 10 });

// Repositories
const repo = await github.getRepo('owner', 'repo');
const issues = await github.getIssues('owner', 'repo', { state: 'open' });

// Create issue
const issue = await github.createIssue('owner', 'repo', {
  title: 'Bug report',
  body: 'Description of the bug',
  labels: ['bug']
});

// GraphQL API
const { viewer } = await github.graphql(`
  query {
    viewer {
      login
      repositories(first: 10) {
        nodes {
          name
          stargazerCount
        }
      }
    }
  }
`);
```

### Stripe API

```javascript
const { StripeClient } = require('@openclaw/skill-api-integration/integrations');

const stripe = new StripeClient({
  apiKey: process.env.STRIPE_SECRET_KEY,
  apiVersion: '2023-10-16'
});

// Customers
const customer = await stripe.customers.create({
  email: 'customer@example.com',
  name: 'John Doe'
});

// Payment Intents
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // $20.00
  currency: 'usd',
  customer: customer.id
});

// Subscriptions
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'price_123' }]
});

// Webhook handling
const event = await stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Slack API

```javascript
const { SlackClient } = require('@openclaw/skill-api-integration/integrations');

const slack = new SlackClient({
  token: process.env.SLACK_BOT_TOKEN
});

// Send message
await slack.chat.postMessage({
  channel: '#general',
  text: 'Hello from OpenClaw!',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Bold* message with _formatting_'
      }
    }
  ]
});

// Upload file
await slack.files.upload({
  channels: '#general',
  file: fs.createReadStream('report.pdf'),
  title: 'Monthly Report'
});
```

### OpenAI API

```javascript
const { OpenAIClient } = require('@openclaw/skill-api-integration/integrations');

const openai = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY
});

// Chat completions
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ]
});

// Streaming
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

---

## Advanced Configuration

### Environment-Based Config

```javascript
const config = {
  development: {
    baseURL: 'https://api-staging.example.com',
    timeout: 30000,
    retry: { maxRetries: 1 }
  },
  production: {
    baseURL: 'https://api.example.com',
    timeout: 10000,
    retry: { maxRetries: 3 },
    circuitBreaker: { failureThreshold: 5 }
  }
};

const client = createApiClient(config[process.env.NODE_ENV || 'development']);
```

### Request Context

```javascript
// Pass context through requests for logging/tracing
const client = createApiClient({
  baseURL: 'https://api.example.com',
  context: {
    requestId: generateUUID(),
    userId: currentUser.id
  }
});

client.addRequestInterceptor((config) => {
  config.headers['X-Request-ID'] = config.context.requestId;
  return config;
});
```

---

## Best Practices

1. **Always use environment variables for secrets** - Never hardcode API keys
2. **Implement proper retry logic** - Network failures are inevitable
3. **Respect rate limits** - Use throttling to avoid being blocked
4. **Cache appropriately** - Don't hammer APIs for static data
5. **Handle errors gracefully** - Provide fallbacks where possible
6. **Use circuit breakers** - Prevent cascade failures
7. **Validate webhook signatures** - Ensure webhook authenticity
8. **Monitor API health** - Log response times and error rates

---

## License

MIT © OpenClaw
