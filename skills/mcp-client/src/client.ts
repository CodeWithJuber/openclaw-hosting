/**
 * Main MCP Client Implementation
 */

import { EventEmitter } from 'events';
import { StdioClientTransport } from './transports/stdio.js';
import { SSEClientTransport } from './transports/sse.js';
import { HTTPClientTransport } from './transports/http.js';
import type { ClientTransport } from './transports/base.js';
import { withRetry, withTimeout, defaultLogger } from './utils/index.js';
import {
  MCPConnectionError,
  MCPTimeoutError,
  MCPProtocolError,
  MCPNotFoundError,
  MCPValidationError
} from './errors/index.js';
import type {
  ClientConfig,
  ServerParameters,
  TransportConfig,
  Tool,
  ToolResult,
  Resource,
  ResourceTemplate,
  ResourceContent,
  Prompt,
  PromptResult,
  ServerCapabilities,
  JSONRPCMessage,
  SamplingRequest,
  SamplingResult
} from './types/index.js';

export class MCPClient extends EventEmitter {
  private transport: ClientTransport | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number | string, (response: JSONRPCMessage) => void>();
  private serverCapabilities: ServerCapabilities = {};
  private config: Required<ClientConfig>;

  constructor(config: ClientConfig) {
    super();
    this.config = {
      name: config.name,
      version: config.version,
      capabilities: {
        sampling: false,
        roots: false,
        tools: true,
        resources: true,
        prompts: true,
        ...config.capabilities
      },
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      debug: config.debug ?? false
    };
  }

  /**
   * Connect to an MCP server using stdio transport
   */
  async connectToServer(params: ServerParameters): Promise<void> {
    const transport = new StdioClientTransport(params);
    await this.connectWithTransport(transport);
  }

  /**
   * Connect to an MCP server using a custom transport configuration
   */
  async connectWithConfig(config: TransportConfig): Promise<void> {
    let transport: ClientTransport;

    switch (config.type) {
      case 'stdio':
        if (!config.command) {
          throw new MCPConnectionError('Command required for stdio transport');
        }
        transport = new StdioClientTransport({
          command: config.command,
          args: config.args,
          env: config.env,
          cwd: config.cwd
        });
        break;
      case 'sse':
        if (!config.url) {
          throw new MCPConnectionError('URL required for SSE transport');
        }
        transport = new SSEClientTransport({
          url: config.url,
          headers: config.headers
        });
        break;
      case 'http':
      case 'streamable-http':
        if (!config.url) {
          throw new MCPConnectionError('URL required for HTTP transport');
        }
        transport = new HTTPClientTransport({
          url: config.url,
          headers: config.headers,
          timeout: this.config.timeout
        });
        break;
      default:
        throw new MCPConnectionError(`Unknown transport type: ${config.type}`);
    }

    await this.connectWithTransport(transport);
  }

  /**
   * Connect using a custom transport implementation
   */
  async connectWithTransport(transport: ClientTransport): Promise<void> {
    this.transport = transport;

    this.transport.on('message', (message: JSONRPCMessage) => {
      this.handleMessage(message);
    });

    this.transport.on('error', (error: Error) => {
      this.emit('error', error);
    });

    this.transport.on('close', () => {
      this.emit('close');
    });

    await withRetry(
      () => this.transport!.connect(),
      { maxRetries: this.config.retries, initialDelay: this.config.retryDelay }
    );

    // Initialize session
    await this.initialize();
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.pendingRequests.clear();
  }

  /**
   * Check if connected to a server
   */
  isConnected(): boolean {
    return this.transport?.isConnected() ?? false;
  }

  /**
   * Get server capabilities
   */
  getServerCapabilities(): ServerCapabilities {
    return { ...this.serverCapabilities };
  }

  /**
   * Get client capabilities
   */
  getClientCapabilities() {
    return { ...this.config.capabilities };
  }

  // Tool Operations

  /**
   * List available tools from the server
   */
  async listTools(): Promise<Tool[]> {
    const response = await this.request('tools/list', {});
    return (response.tools as Tool[]) || [];
  }

  /**
   * Call a tool on the server
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    if (this.config.debug) {
      defaultLogger.debug(`Calling tool: ${name}`, args);
    }

    return withRetry(
      () => this.request('tools/call', { name, arguments: args }),
      { maxRetries: this.config.retries, initialDelay: this.config.retryDelay }
    ) as Promise<ToolResult>;
  }

  // Resource Operations

  /**
   * List available resources from the server
   */
  async listResources(): Promise<Resource[]> {
    const response = await this.request('resources/list', {});
    return (response.resources as Resource[]) || [];
  }

  /**
   * List resource templates from the server
   */
  async listResourceTemplates(): Promise<ResourceTemplate[]> {
    const response = await this.request('resources/templates/list', {});
    return (response.resourceTemplates as ResourceTemplate[]) || [];
  }

  /**
   * Read a resource from the server
   */
  async readResource(uri: string): Promise<ResourceContent> {
    const response = await this.request('resources/read', { uri });
    return response.contents as ResourceContent;
  }

  /**
   * Subscribe to resource updates
   */
  async subscribeToResource(uri: string, callback: (content: ResourceContent) => void): Promise<void> {
    await this.request('resources/subscribe', { uri });
    
    // Store callback for notifications
    this.on(`resource/${uri}`, callback);
  }

  /**
   * Unsubscribe from resource updates
   */
  async unsubscribeFromResource(uri: string): Promise<void> {
    await this.request('resources/unsubscribe', { uri });
    this.removeAllListeners(`resource/${uri}`);
  }

  // Prompt Operations

  /**
   * List available prompts from the server
   */
  async listPrompts(): Promise<Prompt[]> {
    const response = await this.request('prompts/list', {});
    return (response.prompts as Prompt[]) || [];
  }

  /**
   * Get a prompt from the server
   */
  async getPrompt(name: string, args?: Record<string, string>): Promise<PromptResult> {
    return this.request('prompts/get', { name, arguments: args }) as Promise<PromptResult>;
  }

  // Sampling (Server-initiated LLM calls)

  /**
   * Handle sampling requests from the server
   */
  onSamplingRequest(handler: (request: SamplingRequest) => Promise<SamplingResult>): void {
    this.on('sampling/request', handler);
  }

  // Private Methods

  private async initialize(): Promise<void> {
    const response = await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: this.config.capabilities,
      clientInfo: {
        name: this.config.name,
        version: this.config.version
      }
    });

    this.serverCapabilities = (response.capabilities as ServerCapabilities) || {};

    // Send initialized notification
    await this.notify('initialized', {});
  }

  private async request(method: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.transport) {
      throw new MCPConnectionError('Not connected to server');
    }

    const id = ++this.requestId;
    const message: JSONRPCMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return withTimeout(
      new Promise((resolve, reject) => {
        this.pendingRequests.set(id, (response) => {
          if (response.error) {
            reject(this.createErrorFromResponse(response.error));
          } else {
            resolve(response.result as Record<string, unknown>);
          }
        });

        this.transport!.send(message).catch(reject);
      }),
      this.config.timeout,
      `Request timeout: ${method}`
    );
  }

  private async notify(method: string, params: Record<string, unknown>): Promise<void> {
    if (!this.transport) {
      throw new MCPConnectionError('Not connected to server');
    }

    const message: JSONRPCMessage = {
      jsonrpc: '2.0',
      method,
      params
    };

    await this.transport.send(message);
  }

  private handleMessage(message: JSONRPCMessage): void {
    if (this.config.debug) {
      defaultLogger.debug('Received message:', message);
    }

    // Handle responses
    if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
      const handler = this.pendingRequests.get(message.id);
      if (handler) {
        this.pendingRequests.delete(message.id);
        handler(message);
      }
      return;
    }

    // Handle notifications
    if (message.method) {
      this.handleNotification(message.method, message.params as Record<string, unknown>);
    }
  }

  private handleNotification(method: string, params: Record<string, unknown>): void {
    switch (method) {
      case 'notifications/resources/updated':
        const uri = params.uri as string;
        this.emit(`resource/${uri}`, params);
        break;
      case 'sampling/createMessage':
        this.emit('sampling/request', params);
        break;
      default:
        this.emit('notification', { method, params });
    }
  }

  private createErrorFromResponse(error: { code: number; message: string; data?: unknown }): Error {
    switch (error.code) {
      case -32602:
        return new MCPValidationError(error.message, { data: error.data });
      case -32601:
        return new MCPNotFoundError(error.message);
      case -32000:
        return new MCPProtocolError(error.message);
      default:
        return new Error(error.message);
    }
  }
}
