/**
 * Core types for MCP Client
 */

export interface ClientConfig {
  name: string;
  version: string;
  capabilities?: ClientCapabilities;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  debug?: boolean;
}

export interface ClientCapabilities {
  sampling?: boolean;
  roots?: boolean;
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
}

export interface ServerParameters {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface ServerCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  logging?: boolean;
  sampling?: boolean;
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  annotations?: ToolAnnotations;
}

export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface ToolResult {
  content: Array<TextContent | ImageContent | ResourceContent>;
  isError?: boolean;
}

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContent {
  type: 'image';
  data: string;
  mimeType: string;
}

export interface ResourceContent {
  type: 'resource';
  resource: {
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  };
}

export interface Resource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface ResourceTemplate {
  uriTemplate: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface ResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface Prompt {
  name: string;
  description?: string;
  arguments?: PromptArgument[];
}

export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: TextContent | ImageContent;
}

export interface PromptResult {
  description?: string;
  messages: PromptMessage[];
}

export interface SamplingRequest {
  messages: SamplingMessage[];
  maxTokens: number;
  temperature?: number;
  stopSequences?: string[];
  modelPreferences?: ModelPreferences;
}

export interface SamplingMessage {
  role: 'user' | 'assistant';
  content: TextContent | ImageContent;
}

export interface ModelPreferences {
  hints?: ModelHint[];
  costPriority?: number;
  speedPriority?: number;
  intelligencePriority?: number;
}

export interface ModelHint {
  name?: string;
}

export interface SamplingResult {
  content: TextContent | ImageContent;
  stopReason?: 'endTurn' | 'stopSequence' | 'maxTokens';
  model?: string;
}

export interface JSONRPCMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPConfig {
  mcpServers: Record<string, ServerConfig>;
}

export interface ServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  disabled?: boolean;
}

export type TransportType = 'stdio' | 'sse' | 'http' | 'streamable-http';

export interface TransportConfig {
  type: TransportType;
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  headers?: Record<string, string>;
}
