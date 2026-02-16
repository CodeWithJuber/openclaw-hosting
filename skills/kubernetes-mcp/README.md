# Kubernetes MCP Skill - README

## Overview

The Kubernetes MCP Skill enables AI agents to manage Kubernetes clusters through the Model Context Protocol (MCP). This skill provides comprehensive cluster management capabilities including pod operations, deployment management, service configuration, and resource monitoring.

## What's Included

| File | Description |
|------|-------------|
| `SKILL.md` | Complete documentation with usage examples and best practices |
| `CONFIG.md` | Configuration options for various MCP clients |
| `EXAMPLES.md` | Practical code examples for common workflows |
| `API.md` | Complete API reference for all available tools |
| `package.json` | Package metadata and dependencies |

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Access to a Kubernetes cluster
- `kubectl` configured (optional, for verification)

### 2. Configure Your MCP Client

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent:

```json
{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": ["-y", "kubernetes-mcp-server@latest"]
    }
  }
}
```

#### VS Code with GitHub Copilot

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "kubernetes": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "kubernetes-mcp-server@latest"]
    }
  }
}
```

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": ["-y", "kubernetes-mcp-server@latest"]
    }
  }
}
```

### 3. Verify Connection

Once configured, you can ask your AI assistant to:

```
"List all pods in the default namespace"
"Show me the cluster configuration"
"What deployments are running in production?"
```

## Features

### Cluster Management
- ✅ Automatic kubeconfig detection
- ✅ Multi-cluster support
- ✅ In-cluster authentication
- ✅ Context switching

### Pod Operations
- ✅ List, get, create, delete pods
- ✅ View container logs
- ✅ Execute commands in containers
- ✅ Run new pods from images
- ✅ Resource usage metrics

### Deployment Management
- ✅ Create, update, delete deployments
- ✅ Scale replicas
- ✅ Rolling updates
- ✅ Rollback support

### Service & Networking
- ✅ Manage Services (ClusterIP, NodePort, LoadBalancer)
- ✅ Configure Ingress rules
- ✅ OpenShift Routes support

### Configuration
- ✅ ConfigMaps for configuration data
- ✅ Secrets for sensitive information
- ✅ Environment variable management

### Namespace Operations
- ✅ List, create, delete namespaces
- ✅ Resource isolation
- ✅ OpenShift Projects support

### Resource Monitoring
- ✅ Cluster events
- ✅ Pod and node resource usage
- ✅ CPU/memory metrics
- ✅ Node statistics with PSI metrics

### Helm Integration
- ✅ Install charts
- ✅ List releases
- ✅ Uninstall releases

### Generic Resources
- ✅ CRUD operations on any K8s resource
- ✅ Custom Resource Definition (CRD) support

## Toolsets

The skill is organized into toolsets that can be enabled/disabled:

| Toolset | Description | Default |
|---------|-------------|---------|
| `config` | Kubeconfig management | ✅ |
| `core` | Pods, resources, events, namespaces | ✅ |
| `helm` | Helm chart management | ✅ |
| `kcp` | kcp workspace management | ❌ |
| `kiali` | Istio/Kiali service mesh | ❌ |
| `kubevirt` | Virtual machine management | ❌ |

To customize enabled toolsets:

```json
{
  "args": [
    "-y",
    "kubernetes-mcp-server@latest",
    "--toolsets", "core,config"
  ]
}
```

## Security Modes

### Read-Only Mode
Safe for production inspection without modification:

```json
{
  "args": [
    "-y",
    "kubernetes-mcp-server@latest",
    "--read-only"
  ]
}
```

### Disable Destructive Operations
Allow creates but prevent deletes:

```json
{
  "args": [
    "-y",
    "kubernetes-mcp-server@latest",
    "--disable-destructive"
  ]
}
```

## Common Use Cases

### 1. Debugging a Failing Application

```
"The web-api pod in production is crashing. Can you help me debug it?"
```

The AI will:
1. Get pod status and events
2. Check container logs
3. Look for error patterns
4. Suggest fixes

### 2. Deploying a New Application

```
"Deploy myapp:v2.0 to the production namespace with 3 replicas"
```

The AI will:
1. Create/update the deployment
2. Verify pods are running
3. Check service endpoints

### 3. Scaling for Traffic

```
"Scale the api deployment to 10 replicas for the Black Friday sale"
```

### 4. Resource Monitoring

```
"Show me which pods are using the most CPU in the production namespace"
```

### 5. Configuration Updates

```
"Update the database connection string in the app-config ConfigMap"
```

## Best Practices

1. **Use Namespaces**: Organize by environment and team
2. **Label Resources**: Enable filtering and selection
3. **Set Resource Limits**: Prevent resource exhaustion
4. **Health Checks**: Configure probes for reliability
5. **Read-Only in Prod**: Use `--read-only` for production inspection
6. **Audit Changes**: Review before applying updates

## Troubleshooting

### Connection Issues

```bash
# Verify kubectl works
kubectl cluster-info

# Check current context
kubectl config current-context

# Test MCP server directly
npx kubernetes-mcp-server@latest --help
```

### Permission Errors

Ensure your kubeconfig has appropriate RBAC permissions:

```bash
# Test permissions
kubectl auth can-i get pods
kubectl auth can-i create deployments
```

### Multi-Cluster Issues

If working with multiple clusters, specify the context explicitly:

```javascript
await mcp.kubernetes.pods_list({ context: "production" });
```

## Documentation

- **[SKILL.md](SKILL.md)** - Complete feature documentation
- **[CONFIG.md](CONFIG.md)** - Configuration options
- **[EXAMPLES.md](EXAMPLES.md)** - Code examples
- **[API.md](API.md)** - API reference

## References

- [Kubernetes MCP Server](https://github.com/containers/kubernetes-mcp-server) - Upstream project
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [MCP Protocol](https://modelcontextprotocol.io/)

## License

MIT © OpenClaw
