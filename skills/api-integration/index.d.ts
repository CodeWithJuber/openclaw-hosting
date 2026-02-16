/**
 * Type definitions for API Integration Skill
 */

// Client Configuration
export interface ClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  retry?: RetryConfig;
  throttle?: ThrottleConfig;
  cache?: CacheConfig;
  circuitBreaker?: CircuitBreakerConfig;
  preferFetch?: boolean;
}

// Authentication Configuration
export interface AuthConfig {
  type: 'bearer' | 'apiKey' | 'oauth2' | 'custom';
  token?: string;
  refreshToken?: string;
  onTokenRefresh?: (newToken: string) => void;
  key?: string;
  headerName?: string;
  in?: 'header' | 'query';
  paramName?: string;
  applyAuth?: (config: RequestConfig) => RequestConfig;
}

// Retry Configuration
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: any) => boolean;
  backoffType?: 'exponential' | 'linear' | 'fixed';
}

// Throttle Configuration
export interface ThrottleConfig {
  limit: number;
  interval: number;
  burstLimit?: number;
}

// Cache Configuration
export interface CacheConfig {
  ttl?: number;
  maxSize?: number;
  keyGenerator?: (config: RequestConfig) => string;
  strategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only';
  staleTtl?: number;
}

// Circuit Breaker Configuration
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxCalls?: number;
}

// Request Configuration
export interface RequestConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  cache?: boolean | CacheConfig;
  context?: Record<string, any>;
}

// Response
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

// Rate Limit Info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
}

// OAuth2 Configuration
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationEndpoint?: string;
  tokenEndpoint: string;
  redirectUri?: string;
  scopes?: string[];
}

// Webhook Configuration
export interface WebhookConfig {
  secret: string;
  algorithm?: string;
  signatureHeader?: string;
  timestampHeader?: string;
  maxAge?: number;
}

// GraphQL Configuration
export interface GraphQLConfig {
  endpoint: string;
  headers?: Record<string, string>;
  wsEndpoint?: string;
}

// Base Client Interface
export declare class BaseClient {
  constructor(config: ClientConfig);
  get<T = any>(url: string, config?: RequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<T>;
  addRequestInterceptor(onFulfilled?: (config: RequestConfig) => RequestConfig, onRejected?: (error: any) => any): number;
  addResponseInterceptor(onFulfilled?: (response: ApiResponse) => any, onRejected?: (error: any) => any): number;
}

// Error Classes
export declare class ApiError extends Error {
  status?: number;
  code?: string;
  response?: any;
}

export declare class NetworkError extends ApiError {}
export declare class TimeoutError extends ApiError {}
export declare class RateLimitError extends ApiError {
  retryAfter: number;
}
export declare class AuthenticationError extends ApiError {}
export declare class ValidationError extends ApiError {
  validationErrors: Record<string, string[]>;
}

// Main export
export declare function createApiClient(config?: ClientConfig): BaseClient;
