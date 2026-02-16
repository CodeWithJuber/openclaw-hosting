# API Integration Skill - Examples

This directory contains comprehensive examples demonstrating all features of the API Integration Skill.

## Examples Overview

### 1. Basic HTTP (`basic-http.js`)
- Creating API clients with different authentication methods
- Bearer token authentication
- API key authentication (header and query param)
- Using Axios vs Fetch clients
- Request/response interceptors

```bash
node examples/basic-http.js
```

### 2. OAuth2 (`oauth2.js`)
- Authorization Code flow with PKCE
- Client Credentials flow
- Token refresh handling
- GitHub OAuth example

```bash
node examples/oauth2.js
```

### 3. Webhooks (`webhooks.js`)
- Basic webhook receiver with signature verification
- Stripe webhook handling
- GitHub webhook handling
- Sending webhooks with signatures

```bash
node examples/webhooks.js
```

### 4. GraphQL (`graphql.js`)
- Basic GraphQL queries and mutations
- Using the Query Builder
- Fragments
- Error handling
- Complex queries

```bash
node examples/graphql.js
```

### 5. Advanced Features (`advanced.js`)
- Response caching
- Rate limiting
- Circuit breaker pattern
- Error recovery with retry
- Batch processing

```bash
node examples/advanced.js
```

### 6. Integrations (`integrations.js`)
- GitHub API usage
- Stripe API usage
- Slack API usage
- OpenAI API usage
- Combining multiple services

```bash
node examples/integrations.js
```

## Running Examples

Most examples require environment variables. Create a `.env` file:

```bash
# GitHub
GITHUB_TOKEN=your_github_token

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Slack
SLACK_BOT_TOKEN=xoxb-...

# OpenAI
OPENAI_API_KEY=sk-...

# Generic API
API_TOKEN=your_api_token
API_KEY=your_api_key
```

Then run any example:

```bash
# Install dependencies first
npm install

# Run an example
node examples/basic-http.js
```

## Environment Setup

```bash
# Clone the skill
cd /root/.openclaw/workspace/skills/api-integration

# Install dependencies
npm install

# Set up environment variables
export GITHUB_TOKEN=your_token
export OPENAI_API_KEY=your_key
# ... etc

# Run examples
node examples/integrations.js
```
