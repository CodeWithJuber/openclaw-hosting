/**
 * Main exports for MCP Client Skill
 */

// Core client
export { MCPClient } from './client.js';
export { MCPClientManager } from './manager.js';

// Transports
export {
  BaseTransport,
  type ClientTransport,
  StdioClientTransport,
  SSEClientTransport,
  HTTPClientTransport,
  createRequestId
} from './transports/index.js';

// Errors
export {
  MCPError,
  MCPConnectionError,
  MCPTimeoutError,
  MCPProtocolError,
  MCPAuthenticationError,
  MCPAuthorizationError,
  MCPNotFoundError,
  MCPValidationError,
  MCPRetryExhaustedError,
  isMCPError,
  isRetryableError
} from './errors/index.js';

// Types
export type {
  ClientConfig,
  ClientCapabilities,
  ServerParameters,
  ServerCapabilities,
  Tool,
  ToolAnnotations,
  ToolResult,
  TextContent,
  ImageContent,
  ResourceContent,
  Resource,
  ResourceTemplate,
  Prompt,
  PromptArgument,
  PromptResult,
  PromptMessage,
  SamplingRequest,
  SamplingMessage,
  SamplingResult,
  ModelPreferences,
  ModelHint,
  JSONRPCMessage,
  JSONRPCError,
  MCPConfig,
  ServerConfig,
  TransportType,
  TransportConfig
} from './types/index.js';

// Utils
export {
  withRetry,
  withTimeout,
  sleep,
  defaultRetryOptions,
  ConsoleLogger,
  defaultLogger,
  LogLevel,
  type Logger
} from './utils/index.js';
