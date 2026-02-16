# Kubernetes MCP Skill

A comprehensive Kubernetes management skill for OpenClaw that enables AI agents to manage K8s clusters using the Model Context Protocol (MCP). Based on the [kubernetes-mcp-server](https://github.com/containers/kubernetes-mcp-server) implementation.

## Features

- **Cluster Connection**: Automatic kubeconfig detection, multi-cluster support, in-cluster authentication
- **Pod Management**: List, get, create, delete pods; view logs; execute commands; run containers
- **Deployment Operations**: Create, update, scale, rollback deployments; manage replicas
- **Service & Ingress**: Manage services, endpoints, ingress rules, and routes (OpenShift)
- **ConfigMaps & Secrets**: Create, update, delete configuration data and sensitive information
- **Namespace Operations**: List, create, delete, and switch between namespaces
- **Resource Monitoring**: View cluster events, resource usage metrics (CPU/memory), node statistics
- **Generic Resources**: CRUD operations on any Kubernetes resource type
- **Helm Integration**: Install, list, and uninstall Helm charts
- **Multi-Cluster**: Work with multiple clusters simultaneously

## Quick Start

```bash
# Install the Kubernetes MCP server
npm install -g kubernetes-mcp-server

# Or use npx (no installation required)
npx kubernetes-mcp-server@latest
```

## Configuration

### Basic Configuration

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

### Advanced Configuration

```json
{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": [
        "-y",
        "kubernetes-mcp-server@latest",
        "--kubeconfig", "/path/to/kubeconfig",
        "--log-level", "6",
        "--list-output", "yaml",
        "--toolsets", "core,config,helm"
      ]
    }
  }
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--kubeconfig` | Path to Kubernetes config file | Auto-detected |
| `--log-level` | Logging verbosity (0-9) | 0 |
| `--list-output` | Output format (yaml/table) | table |
| `--read-only` | Disable write operations | false |
| `--disable-destructive` | Disable delete/update operations | false |
| `--toolsets` | Enabled toolsets (comma-separated) | core,config,helm |
| `--disable-multi-cluster` | Restrict to current context | false |

## Toolsets

Toolsets group related functionality. Enable only what you need to reduce context size.

| Toolset | Description | Default |
|---------|-------------|---------|
| `config` | Kubeconfig management | ✓ |
| `core` | Pods, resources, events, namespaces | ✓ |
| `helm` | Helm chart management | ✓ |
| `kcp` | kcp workspace management | ✗ |
| `kiali` | Istio/Kiali service mesh tools | ✗ |
| `kubevirt` | Virtual machine management | ✗ |

## Available Tools

### Cluster Configuration

#### List Available Contexts
```javascript
// List all Kubernetes contexts from kubeconfig
const contexts = await mcp.kubernetes.configuration_contexts_list();
```

#### View Current Configuration
```javascript
// Get current kubeconfig (minified or full)
const config = await mcp.kubernetes.configuration_view({ minified: true });
```

### Pod Management

#### List Pods
```javascript
// List all pods across all namespaces
const allPods = await mcp.kubernetes.pods_list();

// List pods in specific namespace with label filter
const filteredPods = await mcp.kubernetes.pods_list_in_namespace({
  namespace: "production",
  labelSelector: "app=web,env=prod"
});

// List pods with field selector
const runningPods = await mcp.kubernetes.pods_list({
  fieldSelector: "status.phase=Running"
});
```

#### Get Pod Details
```javascript
const pod = await mcp.kubernetes.pods_get({
  name: "web-server-7d9f4b8c5-x2v4p",
  namespace: "production"
});
```

#### Create/Run Pod
```javascript
// Run a simple pod
const newPod = await mcp.kubernetes.pods_run({
  name: "test-pod",
  namespace: "default",
  image: "nginx:latest",
  port: 80
});

// Create pod from YAML
const podYaml = `
apiVersion: v1
kind: Pod
metadata:
  name: custom-pod
  namespace: default
spec:
  containers:
  - name: app
    image: myapp:v1
    ports:
    - containerPort: 8080
`;

await mcp.kubernetes.resources_create_or_update({ resource: podYaml });
```

#### Delete Pod
```javascript
await mcp.kubernetes.pods_delete({
  name: "web-server-7d9f4b8c5-x2v4p",
  namespace: "production"
});
```

#### View Pod Logs
```javascript
// Get recent logs (default: last 100 lines)
const logs = await mcp.kubernetes.pods_log({
  name: "web-server-7d9f4b8c5-x2v4p",
  namespace: "production",
  tail: 500,
  container: "app" // Optional: specific container
});

// Get previous container logs (for crashed pods)
const prevLogs = await mcp.kubernetes.pods_log({
  name: "web-server-7d9f4b8c5-x2v4p",
  namespace: "production",
  previous: true
});
```

#### Execute Commands in Pod
```javascript
// Run command in pod
const result = await mcp.kubernetes.pods_exec({
  name: "web-server-7d9f4b8c5-x2v4p",
  namespace: "production",
  container: "app", // Optional
  command: ["ls", "-la", "/app"]
});

// Interactive shell
const shellResult = await mcp.kubernetes.pods_exec({
  name: "web-server-7d9f4b8c5-x2v4p",
  namespace: "production",
  command: ["sh", "-c", "echo $PATH"]
});
```

#### Monitor Pod Resources
```javascript
// Get CPU/memory usage for specific pod
const metrics = await mcp.kubernetes.pods_top({
  name: "web-server-7d9f4b8c5-x2v4p",
  namespace: "production"
});

// Get metrics for all pods in namespace
const allMetrics = await mcp.kubernetes.pods_top({
  namespace: "production",
  all_namespaces: false
});
```

### Deployment Operations

#### List Deployments
```javascript
const deployments = await mcp.kubernetes.resources_list({
  apiVersion: "apps/v1",
  kind: "Deployment",
  namespace: "production"
});
```

#### Get Deployment Details
```javascript
const deployment = await mcp.kubernetes.resources_get({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production"
});
```

#### Create/Update Deployment
```javascript
const deploymentYaml = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-server
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
`;

await mcp.kubernetes.resources_create_or_update({ resource: deploymentYaml });
```

#### Scale Deployment
```javascript
// Scale to specific replica count
const scaleResult = await mcp.kubernetes.resources_scale({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production",
  scale: 5
});

// Get current scale without changing
const currentScale = await mcp.kubernetes.resources_scale({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production"
});
```

#### Delete Deployment
```javascript
await mcp.kubernetes.resources_delete({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production",
  gracePeriodSeconds: 30 // Optional grace period
});
```

### Service Management

#### List Services
```javascript
const services = await mcp.kubernetes.resources_list({
  apiVersion: "v1",
  kind: "Service",
  namespace: "production"
});
```

#### Create Service
```javascript
const serviceYaml = `
apiVersion: v1
kind: Service
metadata:
  name: web-service
  namespace: production
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
`;

await mcp.kubernetes.resources_create_or_update({ resource: serviceYaml });
```

#### Create LoadBalancer Service
```javascript
const lbServiceYaml = `
apiVersion: v1
kind: Service
metadata:
  name: web-lb
  namespace: production
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
`;

await mcp.kubernetes.resources_create_or_update({ resource: lbServiceYaml });
```

### Ingress Management

#### List Ingresses
```javascript
const ingresses = await mcp.kubernetes.resources_list({
  apiVersion: "networking.k8s.io/v1",
  kind: "Ingress",
  namespace: "production"
});
```

#### Create Ingress
```javascript
const ingressYaml = `
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
`;

await mcp.kubernetes.resources_create_or_update({ resource: ingressYaml });
```

### ConfigMaps

#### List ConfigMaps
```javascript
const configMaps = await mcp.kubernetes.resources_list({
  apiVersion: "v1",
  kind: "ConfigMap",
  namespace: "production"
});
```

#### Create ConfigMap
```javascript
const configMapYaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  database.properties: |
    db.host=postgres
    db.port=5432
    db.name=myapp
  app.settings: |
    log.level=info
    cache.enabled=true
`;

await mcp.kubernetes.resources_create_or_update({ resource: configMapYaml });
```

#### Create ConfigMap from Literal Values
```javascript
const simpleConfigYaml = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: simple-config
  namespace: production
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "info"
  CACHE_TTL: "300"
`;

await mcp.kubernetes.resources_create_or_update({ resource: simpleConfigYaml });
```

### Secrets

#### List Secrets
```javascript
const secrets = await mcp.kubernetes.resources_list({
  apiVersion: "v1",
  kind: "Secret",
  namespace: "production"
});
```

#### Create Secret
```javascript
// Base64 encode values first
const dbPassword = Buffer.from("super-secret-password").toString("base64");
const apiKey = Buffer.from("sk-1234567890abcdef").toString("base64");

const secretYaml = `
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
data:
  DB_PASSWORD: ${dbPassword}
  API_KEY: ${apiKey}
`;

await mcp.kubernetes.resources_create_or_update({ resource: secretYaml });
```

#### Create Docker Registry Secret
```javascript
const dockerSecretYaml = `
apiVersion: v1
kind: Secret
metadata:
  name: regcred
  namespace: production
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: ${Buffer.from(JSON.stringify({
    auths: {
      "https://index.docker.io/v1/": {
        username: "myuser",
        password: "mypass",
        email: "myuser@example.com",
        auth: Buffer.from("myuser:mypass").toString("base64")
      }
    }
  })).toString("base64")}
`;

await mcp.kubernetes.resources_create_or_update({ resource: dockerSecretYaml });
```

### Namespace Operations

#### List Namespaces
```javascript
const namespaces = await mcp.kubernetes.namespaces_list();
```

#### Create Namespace
```javascript
const namespaceYaml = `
apiVersion: v1
kind: Namespace
metadata:
  name: new-project
  labels:
    environment: production
    team: platform
`;

await mcp.kubernetes.resources_create_or_update({ resource: namespaceYaml });
```

#### Delete Namespace
```javascript
await mcp.kubernetes.resources_delete({
  apiVersion: "v1",
  kind: "Namespace",
  name: "old-project"
});
```

### Resource Monitoring

#### View Cluster Events
```javascript
// All events
const allEvents = await mcp.kubernetes.events_list();

// Events in specific namespace
const namespaceEvents = await mcp.kubernetes.events_list({
  namespace: "production"
});
```

#### Node Resource Usage
```javascript
// List all nodes with CPU/memory usage
const nodes = await mcp.kubernetes.nodes_top();

// Specific node
const nodeMetrics = await mcp.kubernetes.nodes_top({
  name: "worker-node-1"
});
```

#### Node Statistics
```javascript
// Detailed node stats including PSI metrics (Linux 4.20+)
const stats = await mcp.kubernetes.nodes_stats_summary({
  name: "worker-node-1"
});
```

#### Node Logs
```javascript
// Get kubelet logs
const kubeletLogs = await mcp.kubernetes.nodes_log({
  name: "worker-node-1",
  query: "kubelet",
  tailLines: 100
});
```

### Generic Resource Operations

The following tools work with ANY Kubernetes resource type, including CRDs.

#### List Any Resource Type
```javascript
// List StatefulSets
const statefulSets = await mcp.kubernetes.resources_list({
  apiVersion: "apps/v1",
  kind: "StatefulSet",
  namespace: "production"
});

// List Jobs
const jobs = await mcp.kubernetes.resources_list({
  apiVersion: "batch/v1",
  kind: "Job",
  namespace: "production"
});

// List CronJobs
const cronJobs = await mcp.kubernetes.resources_list({
  apiVersion: "batch/v1",
  kind: "CronJob",
  namespace: "production"
});

// List Custom Resources
const crds = await mcp.kubernetes.resources_list({
  apiVersion: "mygroup.example.com/v1",
  kind: "MyCustomResource",
  namespace: "production"
});
```

#### Get Any Resource
```javascript
const resource = await mcp.kubernetes.resources_get({
  apiVersion: "apps/v1",
  kind: "StatefulSet",
  name: "postgres",
  namespace: "production"
});
```

#### Create or Update Any Resource
```javascript
await mcp.kubernetes.resources_create_or_update({ resource: yamlContent });
```

#### Delete Any Resource
```javascript
await mcp.kubernetes.resources_delete({
  apiVersion: "apps/v1",
  kind: "StatefulSet",
  name: "postgres",
  namespace: "production"
});
```

### Helm Operations

#### Install Chart
```javascript
const release = await mcp.kubernetes.helm_install({
  name: "my-postgres",
  namespace: "database",
  chart: "oci://registry-1.docker.io/bitnamicharts/postgresql",
  values: {
    auth: {
      postgresPassword: "secret123",
      database: "myapp"
    },
    primary: {
      persistence: {
        size: "10Gi"
      }
    }
  }
});
```

#### List Releases
```javascript
// All releases
const allReleases = await mcp.kubernetes.helm_list();

// Specific namespace
const nsReleases = await mcp.kubernetes.helm_list({
  namespace: "database"
});
```

#### Uninstall Release
```javascript
await mcp.kubernetes.helm_uninstall({
  name: "my-postgres",
  namespace: "database"
});
```

## Multi-Cluster Support

When multi-cluster is enabled, most tools accept an optional `context` parameter:

```javascript
// List pods in production cluster
const prodPods = await mcp.kubernetes.pods_list({ context: "production" });

// List pods in staging cluster
const stagingPods = await mcp.kubernetes.pods_list({ context: "staging" });
```

## Common Workflows

### Deploy a New Application

```javascript
// 1. Create namespace
await mcp.kubernetes.resources_create_or_update({
  resource: `
apiVersion: v1
kind: Namespace
metadata:
  name: myapp
`
});

// 2. Create ConfigMap
await mcp.kubernetes.resources_create_or_update({
  resource: `
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
  namespace: myapp
data:
  APP_ENV: "production"
`
});

// 3. Create Secret
await mcp.kubernetes.resources_create_or_update({
  resource: `
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
  namespace: myapp
type: Opaque
data:
  DB_PASSWORD: ${Buffer.from("password").toString("base64")}
`
});

// 4. Create Deployment
await mcp.kubernetes.resources_create_or_update({
  resource: `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: myapp-config
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: myapp-secrets
              key: DB_PASSWORD
`
});

// 5. Create Service
await mcp.kubernetes.resources_create_or_update({
  resource: `
apiVersion: v1
kind: Service
metadata:
  name: myapp
  namespace: myapp
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
`
});
```

### Debug a Failing Pod

```javascript
// 1. Get pod status
const pod = await mcp.kubernetes.pods_get({
  name: "failing-pod",
  namespace: "production"
});

// 2. Check recent events
const events = await mcp.kubernetes.events_list({
  namespace: "production"
});

// 3. View logs
const logs = await mcp.kubernetes.pods_log({
  name: "failing-pod",
  namespace: "production",
  tail: 500
});

// 4. Check previous container logs if restarted
const prevLogs = await mcp.kubernetes.pods_log({
  name: "failing-pod",
  namespace: "production",
  previous: true
});

// 5. Execute diagnostic commands
const env = await mcp.kubernetes.pods_exec({
  name: "failing-pod",
  namespace: "production",
  command: ["env"]
});
```

### Scale Application for High Traffic

```javascript
// 1. Check current resource usage
const metrics = await mcp.kubernetes.pods_top({
  namespace: "production",
  labelSelector: "app=web"
});

// 2. Scale deployment
await mcp.kubernetes.resources_scale({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production",
  scale: 10
});

// 3. Verify new pods are running
const pods = await mcp.kubernetes.pods_list_in_namespace({
  namespace: "production",
  labelSelector: "app=web"
});
```

### Rolling Update

```javascript
// 1. Get current deployment
const deployment = await mcp.kubernetes.resources_get({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production"
});

// 2. Update image version
const updatedYaml = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-server
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: myapp:v2.0.0  # Updated version
        ports:
        - containerPort: 8080
`;

await mcp.kubernetes.resources_create_or_update({ resource: updatedYaml });

// 3. Monitor rollout
const rolloutStatus = await mcp.kubernetes.resources_get({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production"
});
```

## Best Practices

1. **Use Namespaces**: Organize resources by environment (dev, staging, prod) and team
2. **Label Resources**: Apply consistent labels for filtering and selection
3. **Resource Limits**: Always set CPU/memory requests and limits
4. **Health Checks**: Configure liveness and readiness probes
5. **Secrets Management**: Use Kubernetes Secrets or external secret managers
6. **Read-Only Mode**: Use `--read-only` for production inspection without risk
7. **Log Aggregation**: Use `pods_log` for debugging, but prefer centralized logging
8. **Monitoring**: Regularly check `pods_top` and `nodes_top` for resource issues

## Security Considerations

1. **RBAC**: Ensure proper Role-Based Access Control is configured
2. **Service Accounts**: Use dedicated service accounts with minimal permissions
3. **Network Policies**: Restrict pod-to-pod communication
4. **Pod Security**: Enable Pod Security Standards (PSS) or Pod Security Policies (PSP)
5. **Secrets**: Never commit secrets to version control; use sealed secrets or external managers
6. **Read-Only Access**: Use `--read-only` flag for safe cluster inspection
7. **Audit Logging**: Enable Kubernetes audit logging for compliance

## Troubleshooting

### Connection Issues
```bash
# Verify kubeconfig
kubectl config view

# Test connection
kubectl cluster-info

# Check current context
kubectl config current-context
```

### Permission Errors
- Verify RBAC roles and bindings
- Check service account permissions
- Use `kubectl auth can-i` to test permissions

### Resource Not Found
- Verify namespace exists
- Check resource name spelling
- Ensure correct API version and kind

### Timeout Errors
- Increase timeout in client configuration
- Check network connectivity to cluster
- Verify cluster is not overloaded

## References

- [Kubernetes MCP Server](https://github.com/containers/kubernetes-mcp-server)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)

## License

MIT © OpenClaw
