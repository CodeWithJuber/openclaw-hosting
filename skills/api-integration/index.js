// Main entry point for API Integration Skill

const { AxiosClient } = require('./clients/axios-client');
const { FetchClient } = require('./clients/fetch-client');
const { ThrottledClient } = require('./clients/throttled-client');
const { CircuitBreakerClient } = require('./clients/circuit-breaker-client');
const { CachedClient } = require('./cache/cached-client');
const { GraphQLClient, QueryBuilder } = require('./graphql/graphql-client');
const { WebhookReceiver } = require('./webhooks/webhook-receiver');
const { OAuth2Client } = require('./auth/oauth2-client');
const { 
  ApiError, 
  NetworkError, 
  TimeoutError, 
  RateLimitError,
  AuthenticationError,
  ValidationError 
} = require('./errors/api-errors');
const { withRecovery } = require('./errors/recovery');

// Integration clients
const { GitHubClient } = require('./integrations/github');
const { StripeClient } = require('./integrations/stripe');
const { SlackClient } = require('./integrations/slack');
const { OpenAIClient } = require('./integrations/openai');

/**
 * Create an API client with the specified configuration
 * @param {Object} config - Client configuration
 * @returns {BaseClient} Configured client instance
 */
function createApiClient(config = {}) {
  const { preferFetch, ...restConfig } = config;
  
  // Determine which base client to use
  let ClientClass = preferFetch ? FetchClient : AxiosClient;
  
  // Wrap with caching if configured
  if (restConfig.cache) {
    return new CachedClient({ ...restConfig, baseClient: ClientClass });
  }
  
  // Wrap with circuit breaker if configured
  if (restConfig.circuitBreaker) {
    return new CircuitBreakerClient({ ...restConfig, baseClient: ClientClass });
  }
  
  // Wrap with throttling if configured
  if (restConfig.throttle) {
    return new ThrottledClient({ ...restConfig, baseClient: ClientClass });
  }
  
  return new ClientClass(restConfig);
}

module.exports = {
  // Client factories
  createApiClient,
  
  // Base clients
  AxiosClient,
  FetchClient,
  ThrottledClient,
  CircuitBreakerClient,
  CachedClient,
  
  // GraphQL
  GraphQLClient,
  QueryBuilder,
  
  // Webhooks
  WebhookReceiver,
  
  // Auth
  OAuth2Client,
  
  // Errors
  ApiError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  withRecovery,
  
  // Integrations
  GitHubClient,
  StripeClient,
  SlackClient,
  OpenAIClient
};
