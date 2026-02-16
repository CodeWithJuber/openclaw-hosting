/**
 * MCP Client Manager for handling multiple server connections
 */

import { MCPClient } from './client.js';
import type { MCPConfig, ServerConfig, Tool, Resource, Prompt } from './types/index.js';
import { MCPConnectionError, MCPNotFoundError } from './errors/index.js';
import { defaultLogger } from './utils/index.js';

interface ManagedClient {
  id: string;
  client: MCPClient;
  config: ServerConfig;
  connected: boolean;
}

export class MCPClientManager {
  private clients = new Map<string, ManagedClient>();

  /**
   * Load configuration from an MCP config file
   */
  async loadConfig(configPath: string): Promise<void> {
    try {
      const configModule = await import(configPath, { assert: { type: 'json' } });
      const config: MCPConfig = configModule.default;
      await this.loadFromObject(config);
    } catch (error) {
      throw new MCPConnectionError(`Failed to load config from ${configPath}: ${error}`);
    }
  }

  /**
   * Load configuration from a config object
   */
  async loadFromObject(config: MCPConfig): Promise<void> {
    for (const [id, serverConfig] of Object.entries(config.mcpServers)) {
      if (serverConfig.disabled) {
        defaultLogger.info(`Skipping disabled server: ${id}`);
        continue;
      }

      await this.addServer(id, serverConfig);
    }
  }

  /**
   * Add a new server to the manager
   */
  async addServer(id: string, config: ServerConfig): Promise<void> {
    const client = new MCPClient({
      name: `mcp-client-${id}`,
      version: '1.0.0'
    });

    const managedClient: ManagedClient = {
      id,
      client,
      config,
      connected: false
    };

    this.clients.set(id, managedClient);

    try {
      await client.connectToServer({
        command: config.command,
        args: config.args,
        env: config.env,
        cwd: config.cwd
      });
      managedClient.connected = true;
      defaultLogger.info(`Connected to server: ${id}`);
    } catch (error) {
      defaultLogger.error(`Failed to connect to server ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove a server from the manager
   */
  async removeServer(id: string): Promise<void> {
    const managedClient = this.clients.get(id);
    if (!managedClient) {
      throw new MCPNotFoundError(`Server not found: ${id}`);
    }

    await managedClient.client.disconnect();
    this.clients.delete(id);
    defaultLogger.info(`Disconnected from server: ${id}`);
  }

  /**
   * Get a specific client by ID
   */
  getClient(id: string): MCPClient {
    const managedClient = this.clients.get(id);
    if (!managedClient) {
      throw new MCPNotFoundError(`Server not found: ${id}`);
    }
    return managedClient.client;
  }

  /**
   * List all connected server IDs
   */
  listServers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * List all tools from all servers
   */
  async listAllTools(): Promise<Array<{ serverId: string; tool: Tool }>> {
    const allTools: Array<{ serverId: string; tool: Tool }> = [];

    for (const [id, managedClient] of this.clients) {
      if (!managedClient.connected) continue;

      try {
        const tools = await managedClient.client.listTools();
        for (const tool of tools) {
          allTools.push({ serverId: id, tool });
        }
      } catch (error) {
        defaultLogger.error(`Failed to list tools from ${id}:`, error);
      }
    }

    return allTools;
  }

  /**
   * List all resources from all servers
   */
  async listAllResources(): Promise<Array<{ serverId: string; resource: Resource }>> {
    const allResources: Array<{ serverId: string; resource: Resource }> = [];

    for (const [id, managedClient] of this.clients) {
      if (!managedClient.connected) continue;

      try {
        const resources = await managedClient.client.listResources();
        for (const resource of resources) {
          allResources.push({ serverId: id, resource });
        }
      } catch (error) {
        defaultLogger.error(`Failed to list resources from ${id}:`, error);
      }
    }

    return allResources;
  }

  /**
   * List all prompts from all servers
   */
  async listAllPrompts(): Promise<Array<{ serverId: string; prompt: Prompt }>> {
    const allPrompts: Array<{ serverId: string; prompt: Prompt }> = [];

    for (const [id, managedClient] of this.clients) {
      if (!managedClient.connected) continue;

      try {
        const prompts = await managedClient.client.listPrompts();
        for (const prompt of prompts) {
          allPrompts.push({ serverId: id, prompt });
        }
      } catch (error) {
        defaultLogger.error(`Failed to list prompts from ${id}:`, error);
      }
    }

    return allPrompts;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const client = this.getClient(serverId);
    return client.callTool(toolName, args);
  }

  /**
   * Call a tool by its fully qualified name (serverId:toolName)
   */
  async callQualifiedTool(
    qualifiedName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const [serverId, toolName] = qualifiedName.split(':');
    if (!serverId || !toolName) {
      throw new MCPValidationError(`Invalid qualified tool name: ${qualifiedName}. Use format 'serverId:toolName'`);
    }
    return this.callTool(serverId, toolName, args);
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    for (const [id, managedClient] of this.clients) {
      try {
        await managedClient.client.disconnect();
        managedClient.connected = false;
        defaultLogger.info(`Disconnected from server: ${id}`);
      } catch (error) {
        defaultLogger.error(`Error disconnecting from ${id}:`, error);
      }
    }
  }

  /**
   * Get connection status for all servers
   */
  getConnectionStatus(): Array<{ id: string; connected: boolean }> {
    return Array.from(this.clients.entries()).map(([id, client]) => ({
      id,
      connected: client.connected
    }));
  }
}

// Import needed for callQualifiedTool method
import { MCPValidationError } from './errors/index.js';
