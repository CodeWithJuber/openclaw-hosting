# MCP Client Skill

A comprehensive AI Agent Skill for interacting with Model Context Protocol (MCP) servers. This skill provides a complete MCP client implementation with support for tool discovery, resource management, prompt handling, and server connection management.

## Overview

The Model Context Protocol (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. This skill provides:

- **MCP Client Implementation**: Full-featured client for connecting to MCP servers
- **Tool Discovery & Invocation**: Automatically discover and call tools from MCP servers
- **Resource Management**: Read and manage resources exposed by MCP servers
- **Prompt Handling**: Access and use prompts/templates from MCP servers
- **Server Connection Management**: Support for multiple transport types (stdio, SSE, HTTP)
- **Error Handling & Retries**: Robust error handling with automatic retry logic
- **Common MCP Servers Integration**: Pre-configured support for popular MCP servers

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## Quick Start

### Basic Usage

```typescript
import { MCPClient } from './src/client';

// Create a client instance
const client = new MCPClient({
  name: 'my-mcp-client',
  version: '1.0.0'
});

// Connect to an MCP server
await client.connectToServer({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/files']
});

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools.map(t => t.name));

// Call a tool
const result = await client.callTool('read_file', { path: '/path/to/file.txt' });
console.log('Result:', result);

// Cleanup
await client.disconnect();
```

### Using with Claude/OpenAI

```typescript
import { MCPClient } from './src/client';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();
const client = new MCPClient();

// Connect to server
await client.connectToServer({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-git']
});

// Get available tools
const tools = await client.listTools();

// Use with Claude
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1000,
  messages: [{ role: 'user', content: 'What files were changed in the last commit?' }],
  tools: tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema
  }))
});

// Handle tool calls
for (const content of response.content) {
  if (content.type === 'tool_use') {
    const result = await client.callTool(content.name, content.input);
    // Send result back to Claude...
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Client Skill                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Client    │  │   Tools     │  │     Resources       │  │
│  │   Core      │  │   Manager   │  │      Manager        │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │             │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────────▼──────────┐  │
│  │  Transport  │  │   Prompts   │  │   Error Handling    │  │
│  │   Layer     │  │   Manager   │  │   & Retry Logic     │  │
│  └──────┬──────┘  └─────────────┘  └─────────────────────┘  │
│         │                                                    │
│  ┌──────▼──────────────────────────────────────────────┐    │
│  │              MCP Server (External)                   │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. MCPClient Class

The main client class that manages connections to MCP servers.

```typescript
class MCPClient {
  constructor(config?: ClientConfig);
  
  // Connection management
  connectToServer(params: ServerParameters): Promise<void>;
  disconnect(): Promise<void>;
  
  // Tool operations
  listTools(): Promise<Tool[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
  
  // Resource operations
  listResources(): Promise<Resource[]>;
  readResource(uri: string): Promise<ResourceContent>;
  subscribeToResource(uri: string, callback: (content: ResourceContent) => void): Promise<void>;
  
  // Prompt operations
  listPrompts(): Promise<Prompt[]>;
  getPrompt(name: string, args?: Record<string, string>): Promise<PromptMessage[]>;
  
  // Capabilities
  getServerCapabilities(): Promise<ServerCapabilities>;
  getClientCapabilities(): ClientCapabilities;
}
```

### 2. Transport Layer

Supports multiple transport mechanisms:

- **StdioTransport**: For local process-based servers
- **SSETransport**: For Server-Sent Events based servers
- **HTTPTransport**: For HTTP-based servers
- **StreamableHTTPTransport**: For modern streamable HTTP servers

```typescript
// Stdio transport (most common)
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path'],
  env: { /* environment variables */ }
});

// SSE transport
const sseTransport = new SSEClientTransport({
  url: 'http://localhost:3000/sse'
});

// HTTP transport
const httpTransport = new HTTPClientTransport({
  url: 'http://localhost:3000/mcp'
});
```

### 3. Tool Discovery & Invocation

```typescript
// List all available tools
const tools = await client.listTools();

// Get tool details
const tool = tools.find(t => t.name === 'search_files');
console.log(tool.description);
console.log(tool.inputSchema); // JSON Schema for parameters

// Call a tool
const result = await client.callTool('search_files', {
  pattern: '*.ts',
  path: '/src'
});

// Handle different content types
for (const content of result.content) {
  if (content.type === 'text') {
    console.log(content.text);
  } else if (content.type === 'image') {
    console.log(`Image: ${content.mimeType}`);
  } else if (content.type === 'resource') {
    console.log(`Resource: ${content.resource.uri}`);
  }
}
```

### 4. Resource Management

```typescript
// List available resources
const resources = await client.listResources();

// Read a resource
const resource = await client.readResource('file:///path/to/file.txt');

// Subscribe to resource updates
await client.subscribeToResource('file:///path/to/file.txt', (update) => {
  console.log('Resource updated:', update);
});

// List resource templates
const templates = await client.listResourceTemplates();
```

### 5. Prompt Handling

```typescript
// List available prompts
const prompts = await client.listPrompts();

// Get a prompt with arguments
const messages = await client.getPrompt('code_review', {
  language: 'typescript',
  code: 'function example() {}'
});

// Use with LLM
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1000,
  messages: messages
});
```

## Configuration

### Client Configuration

```typescript
interface ClientConfig {
  name: string;           // Client name
  version: string;        // Client version
  capabilities?: {
    sampling?: boolean;   // Support for LLM sampling
    roots?: boolean;      // Support for roots
    tools?: boolean;      // Support for tools
    resources?: boolean;  // Support for resources
    prompts?: boolean;    // Support for prompts
  };
  timeout?: number;       // Request timeout in ms
  retries?: number;       // Number of retries
  retryDelay?: number;    // Delay between retries in ms
}
```

### Server Configuration

```typescript
interface ServerParameters {
  command: string;        // Command to run
  args?: string[];        // Arguments
  env?: Record<string, string>;  // Environment variables
  cwd?: string;           // Working directory
}
```

## Error Handling & Retries

The client includes built-in error handling and automatic retry logic:

```typescript
const client = new MCPClient({
  retries: 3,
  retryDelay: 1000,
  timeout: 30000
});

// Errors are categorized and handled appropriately
try {
  await client.callTool('some_tool', args);
} catch (error) {
  if (error instanceof MCPConnectionError) {
    // Handle connection errors
  } else if (error instanceof MCPTimeoutError) {
    // Handle timeout errors
  } else if (error instanceof MCPProtocolError) {
    // Handle protocol errors
  }
}
```

### Error Types

- `MCPConnectionError`: Connection-related errors
- `MCPTimeoutError`: Request timeout errors
- `MCPProtocolError`: Protocol-level errors
- `MCPAuthenticationError`: Authentication failures
- `MCPAuthorizationError`: Authorization failures
- `MCPNotFoundError`: Resource/tool not found
- `MCPValidationError`: Input validation errors

## Common MCP Servers Integration

### Filesystem Server

```typescript
await client.connectToServer({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/allowed/path']
});

// Available tools: read_file, write_file, list_directory, search_files
```

### Git Server

```typescript
await client.connectToServer({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-git', '--repository', '/path/to/repo']
});

// Available tools: git_log, git_diff, git_status, git_branch
```

### PostgreSQL Server

```typescript
await client.connectToServer({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb']
});

// Available tools: query, execute
```

### Memory Server

```typescript
await client.connectToServer({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-memory']
});

// Available tools: create_entities, create_relations, add_observations
```

### Fetch Server

```typescript
await client.connectToServer({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-fetch']
});

// Available tools: fetch, fetch_html, fetch_markdown
```

## Advanced Usage

### Multiple Server Connections

```typescript
const client = new MCPClient();

// Connect to multiple servers
await client.connectToServer({ id: 'filesystem', /* ... */ });
await client.connectToServer({ id: 'git', /* ... */ });
await client.connectToServer({ id: 'postgres', /* ... */ });

// Use tools from any server
const allTools = await client.listAllTools();
const result = await client.callTool('filesystem:read_file', { path: '/file.txt' });
```

### Custom Transports

```typescript
import { ClientTransport } from './src/transports/base';

class CustomTransport implements ClientTransport {
  async connect(): Promise<void> {
    // Custom connection logic
  }
  
  async send(message: JSONRPCMessage): Promise<void> {
    // Custom send logic
  }
  
  async close(): Promise<void> {
    // Custom cleanup logic
  }
}

const client = new MCPClient();
await client.connectWithTransport(new CustomTransport());
```

### Sampling (Server-initiated LLM calls)

```typescript
const client = new MCPClient({
  capabilities: {
    sampling: true
  }
});

// Handle sampling requests from server
client.on('sampling/request', async (request) => {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: request.maxTokens,
    messages: request.messages
  });
  
  return {
    content: response.content,
    stopReason: response.stop_reason
  };
});
```

## Configuration File

Create `mcp-config.json` for easy server management:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/home/user/project"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
      "env": {
        "PGPASSWORD": "secret"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

Load configuration:

```typescript
import { MCPClientManager } from './src/manager';

const manager = new MCPClientManager();
await manager.loadConfig('./mcp-config.json');

// Access all connected clients
const tools = await manager.listAllTools();
```

## Examples

### Example 1: File Search Assistant

```typescript
import { MCPClient } from './src/client';

async function fileSearchAssistant() {
  const client = new MCPClient({ name: 'file-search', version: '1.0.0' });
  
  await client.connectToServer({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/project']
  });
  
  // Search for TypeScript files
  const result = await client.callTool('search_files', {
    pattern: '**/*.ts',
    path: '/project/src'
  });
  
  console.log('Found files:', result.content[0].text);
  
  await client.disconnect();
}
```

### Example 2: Code Review with Git

```typescript
async function codeReview() {
  const client = new MCPClient({ name: 'code-review', version: '1.0.0' });
  
  await client.connectToServer({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git', '--repository', '.']
  });
  
  // Get recent commits
  const log = await client.callTool('git_log', { limit: 5 });
  
  // Get diff for the latest commit
  const diff = await client.callTool('git_diff', {
    target: 'HEAD~1',
    source: 'HEAD'
  });
  
  console.log('Recent changes:', diff.content[0].text);
  
  await client.disconnect();
}
```

### Example 3: Database Query Assistant

```typescript
async function databaseAssistant() {
  const client = new MCPClient({ name: 'db-assistant', version: '1.0.0' });
  
  await client.connectToServer({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres', process.env.DATABASE_URL]
  });
  
  // Query database
  const result = await client.callTool('query', {
    sql: 'SELECT * FROM users WHERE created_at > NOW() - INTERVAL \'7 days\''
  });
  
  console.log('Recent users:', result.content[0].text);
  
  await client.disconnect();
}
```

## Best Practices

1. **Always cleanup connections**: Use `try/finally` or `async/await` with proper cleanup
2. **Handle errors gracefully**: Differentiate between connection, timeout, and protocol errors
3. **Use timeouts**: Set appropriate timeouts for different operations
4. **Validate inputs**: Check tool input schemas before calling
5. **Cache capabilities**: Server capabilities rarely change during a session
6. **Monitor resources**: Unsubscribe from resources when no longer needed

## Troubleshooting

### Connection Issues

```typescript
// Enable debug logging
const client = new MCPClient({
  debug: true
});

// Check server is running
try {
  await client.connectToServer(params);
} catch (error) {
  console.error('Failed to connect:', error.message);
  // Check: Is the command correct? Are dependencies installed?
}
```

### Tool Not Found

```typescript
// List available tools first
const tools = await client.listTools();
const toolNames = tools.map(t => t.name);

if (!toolNames.includes('desired_tool')) {
  console.log('Available tools:', toolNames);
  console.log('Tool not found. Check server configuration.');
}
```

### Timeout Issues

```typescript
// Increase timeout for long-running operations
const client = new MCPClient({
  timeout: 60000, // 60 seconds
  retries: 5
});
```

## API Reference

See the [API Documentation](./docs/api.md) for detailed information about all classes, interfaces, and methods.

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [MCP Documentation](https://modelcontextprotocol.io)

## License

MIT
