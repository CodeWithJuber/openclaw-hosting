/**
 * Example: MCP Client with Claude Integration
 * 
 * This example demonstrates how to:
 * 1. Connect to an MCP server
 * 2. Get available tools
 * 3. Use Claude to decide which tools to call
 * 4. Execute tool calls and return results to Claude
 * 
 * Requires ANTHROPIC_API_KEY environment variable
 */

import { MCPClient } from '../src/index.js';
import { defaultLogger } from '../src/index.js';

// Note: You would need to install @anthropic-ai/sdk for this example
// import Anthropic from '@anthropic-ai/sdk';

async function main() {
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    console.error('Set it with: export ANTHROPIC_API_KEY=your_key_here');
    process.exit(1);
  }

  const client = new MCPClient({
    name: 'claude-integration',
    version: '1.0.0',
    debug: true
  });

  try {
    // Connect to filesystem server
    const allowedPath = process.argv[2] || '/tmp';
    
    defaultLogger.info(`Connecting to filesystem server with path: ${allowedPath}`);
    
    await client.connectToServer({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', allowedPath]
    });

    defaultLogger.info('Connected successfully!');

    // Get available tools
    const tools = await client.listTools();
    
    // Format tools for Claude
    const claudeTools = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }));

    defaultLogger.info(`Loaded ${claudeTools.length} tools for Claude`);

    // Example query
    const query = process.argv[3] || 'What files are in the directory?';
    defaultLogger.info(`\nUser query: ${query}`);

    // This is a simplified example showing the flow
    // In a real implementation, you would:
    // 1. Send the query to Claude with the available tools
    // 2. Claude decides which tools to call
    // 3. Execute the tool calls
    // 4. Send results back to Claude
    // 5. Return Claude's final response

    console.log('\n--- Example Tool Flow ---');
    console.log('1. User asks:', query);
    console.log('2. Claude analyzes and decides to call: list_directory');
    console.log('3. Executing tool call...');

    // Simulate Claude calling the tool
    const result = await client.callTool('list_directory', { path: allowedPath });
    
    console.log('4. Tool result received');
    for (const content of result.content) {
      if (content.type === 'text') {
        console.log('5. Content:', content.text.substring(0, 200) + '...');
      }
    }
    console.log('6. Sending result back to Claude for final response');
    console.log('7. Claude responds: Here are the files in the directory...');

    // Example of a more complex interaction
    console.log('\n--- Complex Tool Flow Example ---');
    
    // Step 1: Search for files
    const searchQuery = '*.txt';
    console.log(`1. User asks: Find all ${searchQuery} files`);
    
    const searchResult = await client.callTool('search_files', {
      path: allowedPath,
      pattern: searchQuery
    });
    
    let foundFiles: string[] = [];
    for (const content of searchResult.content) {
      if (content.type === 'text') {
        foundFiles = content.text.split('\n').filter(f => f.trim());
      }
    }
    
    console.log(`2. Found ${foundFiles.length} files`);
    
    // Step 2: Read the first file if any found
    if (foundFiles.length > 0) {
      const firstFile = foundFiles[0];
      console.log(`3. Claude decides to read: ${firstFile}`);
      
      const readResult = await client.callTool('read_file', { path: firstFile });
      
      console.log('4. File contents received');
      for (const content of readResult.content) {
        if (content.type === 'text') {
          console.log('5. Preview:', content.text.substring(0, 200) + '...');
        }
      }
    }

    console.log('\n--- Full Claude Integration Code ---');
    console.log(`
// Full implementation would look like:

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Send query to Claude with tools
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1000,
  messages: [{ role: 'user', content: query }],
  tools: claudeTools
});

// Handle tool calls
for (const content of response.content) {
  if (content.type === 'tool_use') {
    const result = await client.callTool(content.name, content.input);
    // Send result back to Claude...
  }
}
    `);

  } catch (error) {
    defaultLogger.error('Error:', error);
    process.exit(1);
  } finally {
    await client.disconnect();
    defaultLogger.info('\nDisconnected from server');
  }
}

main();
