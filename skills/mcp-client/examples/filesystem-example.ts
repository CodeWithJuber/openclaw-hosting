/**
 * Example: Basic MCP Client with Filesystem Server
 * 
 * This example demonstrates how to:
 * 1. Connect to an MCP filesystem server
 * 2. List available tools
 * 3. Call tools to read files and list directories
 * 4. Handle errors gracefully
 */

import { MCPClient } from '../src/index.js';
import { defaultLogger } from '../src/index.js';

async function main() {
  // Create client instance
  const client = new MCPClient({
    name: 'filesystem-example',
    version: '1.0.0',
    debug: true
  });

  try {
    // Connect to filesystem server
    // Note: Replace '/path/to/allowed/directory' with an actual path
    const allowedPath = process.argv[2] || '/tmp';
    
    defaultLogger.info(`Connecting to filesystem server with path: ${allowedPath}`);
    
    await client.connectToServer({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', allowedPath]
    });

    defaultLogger.info('Connected successfully!');

    // List available tools
    const tools = await client.listTools();
    defaultLogger.info('Available tools:');
    for (const tool of tools) {
      console.log(`  - ${tool.name}: ${tool.description}`);
    }

    // List directory contents
    defaultLogger.info(`\nListing directory: ${allowedPath}`);
    const listResult = await client.callTool('list_directory', {
      path: allowedPath
    });
    
    console.log('Directory contents:');
    for (const content of listResult.content) {
      if (content.type === 'text') {
        console.log(content.text);
      }
    }

    // Create a test file
    const testFilePath = `${allowedPath}/mcp-test.txt`;
    defaultLogger.info(`\nCreating test file: ${testFilePath}`);
    
    await client.callTool('write_file', {
      path: testFilePath,
      content: 'Hello from MCP Client!\nThis file was created by the MCP filesystem example.'
    });
    
    defaultLogger.info('File created successfully!');

    // Read the file back
    defaultLogger.info(`\nReading file: ${testFilePath}`);
    const readResult = await client.callTool('read_file', {
      path: testFilePath
    });
    
    console.log('File contents:');
    for (const content of readResult.content) {
      if (content.type === 'text') {
        console.log(content.text);
      }
    }

    // Search for files
    defaultLogger.info(`\nSearching for .txt files in: ${allowedPath}`);
    const searchResult = await client.callTool('search_files', {
      path: allowedPath,
      pattern: '*.txt'
    });
    
    console.log('Search results:');
    for (const content of searchResult.content) {
      if (content.type === 'text') {
        console.log(content.text);
      }
    }

    // Clean up - delete test file
    defaultLogger.info(`\nDeleting test file: ${testFilePath}`);
    await client.callTool('delete_file', {
      path: testFilePath
    });
    
    defaultLogger.info('File deleted successfully!');

  } catch (error) {
    defaultLogger.error('Error:', error);
    process.exit(1);
  } finally {
    // Always disconnect
    await client.disconnect();
    defaultLogger.info('\nDisconnected from server');
  }
}

// Run the example
main();
