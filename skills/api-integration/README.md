# API Integration Skill

A comprehensive skill for integrating with REST and GraphQL APIs, featuring robust authentication, rate limiting, caching, and error handling.

## Installation

```bash
npm install @openclaw/skill-api-integration
```

## Quick Start

```javascript
const { createApiClient } = require('@openclaw/skill-api-integration');

// Create a client with Bearer authentication
const client = createApiClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'bearer',
    token: process.env.API_TOKEN
  }
});

// Make requests
const user = await client.get('/users/123');
const newUser = await client.post('/users', { name: 'John', email: 'john@example.com' });
```

## Features

- ✅ **HTTP Clients** - Axios and native fetch with unified interface
- ✅ **Authentication** - Bearer tokens, API keys, OAuth2 flows
- ✅ **Rate Limiting** - Built-in throttling and retry logic
- ✅ **Webhook Handling** - Secure webhook receiver with signature verification
- ✅ **GraphQL Support** - Full GraphQL client with query builder
- ✅ **Response Caching** - Intelligent caching with TTL support
- ✅ **Error Handling** - Structured error types and recovery strategies
- ✅ **Common Integrations** - Pre-built clients for GitHub, Stripe, Slack, OpenAI

## Documentation

See [SKILL.md](./SKILL.md) for comprehensive documentation.

## Examples

See [examples/](./examples/) directory for working examples of all features.

## License

MIT © OpenClaw
