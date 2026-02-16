# OpenClaw Kubernetes MCP Configuration

## Server Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": [
        "-y",
        "kubernetes-mcp-server@latest",
        "--toolsets", "core,config,helm"
      ]
    }
  }
}
```

### VS Code / Copilot

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "kubernetes": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "kubernetes-mcp-server@latest"
      ]
    }
  }
}
```

### Cursor

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

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `KUBECONFIG` | Path to kubeconfig file | `~/.kube/config` |
| `KUBERNETES_MCP_LOG_LEVEL` | Log verbosity (0-9) | `6` |
| `KUBERNETES_MCP_TOOLSETS` | Enabled toolsets | `core,config,helm` |

## Advanced Configuration

### With Custom Kubeconfig

```json
{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": [
        "-y",
        "kubernetes-mcp-server@latest",
        "--kubeconfig", "/path/to/custom/kubeconfig",
        "--log-level", "6"
      ]
    }
  }
}
```

### Read-Only Mode (Safe for Production)

```json
{
  "mcpServers": {
    "kubernetes-readonly": {
      "command": "npx",
      "args": [
        "-y",
        "kubernetes-mcp-server@latest",
        "--read-only",
        "--toolsets", "core,config"
      ]
    }
  }
}
```

### HTTP/SSE Mode (for remote access)

```json
{
  "mcpServers": {
    "kubernetes": {
      "type": "sse",
      "url": "http://localhost:8080/sse"
    }
  }
}
```

Start the server:
```bash
npx kubernetes-mcp-server@latest --port 8080
```

## Toolset Configuration

### Minimal (Pods only)
```json
{
  "args": [
    "-y",
    "kubernetes-mcp-server@latest",
    "--toolsets", "core"
  ]
}
```

### Standard (Pods, Config, Helm)
```json
{
  "args": [
    "-y",
    "kubernetes-mcp-server@latest",
    "--toolsets", "core,config,helm"
  ]
}
```

### Full (All features)
```json
{
  "args": [
    "-y",
    "kubernetes-mcp-server@latest",
    "--toolsets", "core,config,helm,kcp,kiali,kubevirt"
  ]
}
```

## Multi-Cluster Setup

### Restrict to Single Cluster
```json
{
  "args": [
    "-y",
    "kubernetes-mcp-server@latest",
    "--disable-multi-cluster"
  ]
}
```

### Specific Context Only
```json
{
  "args": [
    "-y",
    "kubernetes-mcp-server@latest",
    "--kubeconfig", "/path/to/kubeconfig",
    "--disable-multi-cluster"
  ]
}
```

## Kubernetes RBAC Setup

For production use, create a dedicated ServiceAccount:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: mcp-server
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: mcp-server-readonly
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: mcp-server-readonly
subjects:
- kind: ServiceAccount
  name: mcp-server
  namespace: default
roleRef:
  kind: ClusterRole
  name: mcp-server-readonly
  apiGroup: rbac.authorization.k8s.io
```

## Troubleshooting

### Verify Installation
```bash
npx kubernetes-mcp-server@latest --help
```

### Test Connection
```bash
kubectl cluster-info
```

### Check Logs
Add `--log-level 9` for maximum verbosity.
