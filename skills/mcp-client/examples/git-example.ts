/**
 * Example: MCP Client with Git Server
 * 
 * This example demonstrates how to:
 * 1. Connect to an MCP git server
 * 2. Query git repository information
 * 3. Get commit history and diffs
 */

import { MCPClient } from '../src/index.js';
import { defaultLogger } from '../src/index.js';

async function main() {
  const client = new MCPClient({
    name: 'git-example',
    version: '1.0.0',
    debug: true
  });

  try {
    // Connect to git server
    const repoPath = process.argv[2] || '.';
    
    defaultLogger.info(`Connecting to git server for repo: ${repoPath}`);
    
    await client.connectToServer({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-git', '--repository', repoPath]
    });

    defaultLogger.info('Connected successfully!');

    // List available tools
    const tools = await client.listTools();
    defaultLogger.info('Available tools:');
    for (const tool of tools) {
      console.log(`  - ${tool.name}: ${tool.description}`);
    }

    // Get git status
    defaultLogger.info('\n--- Git Status ---');
    const statusResult = await client.callTool('git_status', {});
    for (const content of statusResult.content) {
      if (content.type === 'text') {
        console.log(content.text);
      }
    }

    // Get recent commits
    defaultLogger.info('\n--- Recent Commits ---');
    const logResult = await client.callTool('git_log', { limit: 5 });
    for (const content of logResult.content) {
      if (content.type === 'text') {
        console.log(content.text);
      }
    }

    // Get current branch
    defaultLogger.info('\n--- Current Branch ---');
    const branchResult = await client.callTool('git_branch', {});
    for (const content of branchResult.content) {
      if (content.type === 'text') {
        console.log(content.text);
      }
    }

    // Show diff of last commit (if available)
    defaultLogger.info('\n--- Last Commit Diff ---');
    try {
      const diffResult = await client.callTool('git_diff', {
        target: 'HEAD~1',
        source: 'HEAD'
      });
      for (const content of diffResult.content) {
        if (content.type === 'text') {
          console.log(content.text);
        }
      }
    } catch (error) {
      defaultLogger.warn('Could not get diff (might be first commit):', error);
    }

  } catch (error) {
    defaultLogger.error('Error:', error);
    process.exit(1);
  } finally {
    await client.disconnect();
    defaultLogger.info('\nDisconnected from server');
  }
}

main();
