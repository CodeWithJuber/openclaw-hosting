/**
 * Example: MCP Client with Multiple Servers
 * 
 * This example demonstrates how to:
 * 1. Use MCPClientManager to manage multiple server connections
 * 2. Load configuration from a file or object
 * 3. List tools from all connected servers
 * 4. Route tool calls to appropriate servers
 */

import { MCPClientManager } from '../src/index.js';
import { defaultLogger } from '../src/index.js';

async function main() {
  const manager = new MCPClientManager();

  try {
    // Define configuration inline (could also load from JSON file)
    const config = {
      mcpServers: {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp']
        },
        memory: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-memory']
        },
        fetch: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-fetch']
        }
      }
    };

    defaultLogger.info('Loading configuration...');
    await manager.loadFromObject(config);

    // Show connected servers
    const servers = manager.listServers();
    defaultLogger.info(`Connected to ${servers.length} servers: ${servers.join(', ')}`);

    // List all tools from all servers
    defaultLogger.info('\n--- All Available Tools ---');
    const allTools = await manager.listAllTools();
    
    for (const { serverId, tool } of allTools) {
      console.log(`[${serverId}] ${tool.name}: ${tool.description}`);
    }

    // Use filesystem server
    defaultLogger.info('\n--- Using Filesystem Server ---');
    const fsClient = manager.getClient('filesystem');
    const listResult = await fsClient.callTool('list_directory', { path: '/tmp' });
    
    console.log('Directory listing:');
    for (const content of listResult.content) {
      if (content.type === 'text') {
        console.log(content.text.substring(0, 500) + '...'); // Truncate for display
      }
    }

    // Use memory server
    defaultLogger.info('\n--- Using Memory Server ---');
    const memoryClient = manager.getClient('memory');
    
    // Create an entity in memory
    await memoryClient.callTool('create_entities', {
      entities: [
        {
          name: 'example_entity',
          entityType: 'example',
          observations: ['This is a test entity created by the multi-server example']
        }
      ]
    });
    
    defaultLogger.info('Created entity in memory');

    // Read the entity back
    const readResult = await memoryClient.callTool('read_graph', {});
    console.log('Memory contents:');
    for (const content of readResult.content) {
      if (content.type === 'text') {
        console.log(content.text.substring(0, 500) + '...');
      }
    }

    // Use fetch server
    defaultLogger.info('\n--- Using Fetch Server ---');
    const fetchClient = manager.getClient('fetch');
    
    const fetchResult = await fetchClient.callTool('fetch', {
      url: 'https://api.github.com/repos/modelcontextprotocol/servers',
      max_length: 1000
    });
    
    console.log('Fetched data:');
    for (const content of fetchResult.content) {
      if (content.type === 'text') {
        console.log(content.text.substring(0, 500) + '...');
      }
    }

    // Show connection status
    defaultLogger.info('\n--- Connection Status ---');
    const status = manager.getConnectionStatus();
    for (const { id, connected } of status) {
      console.log(`  ${id}: ${connected ? 'connected' : 'disconnected'}`);
    }

  } catch (error) {
    defaultLogger.error('Error:', error);
    process.exit(1);
  } finally {
    // Disconnect from all servers
    await manager.disconnectAll();
    defaultLogger.info('\nDisconnected from all servers');
  }
}

main();
