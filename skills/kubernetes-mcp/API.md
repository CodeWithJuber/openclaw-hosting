# Kubernetes MCP Skill - API Reference

## Tool Categories

### 1. Configuration Tools (`config` toolset)

#### `configuration_contexts_list`
List all available Kubernetes contexts from kubeconfig.

**Parameters:** None

**Returns:** Array of context objects with name and cluster URL.

**Example:**
```javascript
const contexts = await mcp.kubernetes.configuration_contexts_list();
// Returns: [{ name: "production", cluster: "https://prod.example.com" }, ...]
```

---

#### `configuration_view`
Get the current Kubernetes configuration as YAML.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `minified` | boolean | No | Return only current context (default: true) |

**Example:**
```javascript
const config = await mcp.kubernetes.configuration_view({ minified: true });
```

---

### 2. Pod Management Tools (`core` toolset)

#### `pods_list`
List all pods across all namespaces.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `labelSelector` | string | No | Label selector filter (e.g., "app=web,env=prod") |
| `fieldSelector` | string | No | Field selector filter (e.g., "status.phase=Running") |
| `context` | string | No | Kubernetes context for multi-cluster |

**Example:**
```javascript
const pods = await mcp.kubernetes.pods_list({
  labelSelector: "app=web",
  fieldSelector: "status.phase=Running"
});
```

---

#### `pods_list_in_namespace`
List pods in a specific namespace.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `namespace` | string | Yes | Namespace name |
| `labelSelector` | string | No | Label selector filter |
| `fieldSelector` | string | No | Field selector filter |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const pods = await mcp.kubernetes.pods_list_in_namespace({
  namespace: "production",
  labelSelector: "app=api"
});
```

---

#### `pods_get`
Get detailed information about a specific pod.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Pod name |
| `namespace` | string | No | Namespace (default: current) |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const pod = await mcp.kubernetes.pods_get({
  name: "web-7d9f4b8c5-x2v4p",
  namespace: "production"
});
```

---

#### `pods_delete`
Delete a pod.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Pod name |
| `namespace` | string | No | Namespace (default: current) |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
await mcp.kubernetes.pods_delete({
  name: "web-7d9f4b8c5-x2v4p",
  namespace: "production"
});
```

---

#### `pods_log`
Get container logs from a pod.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Pod name |
| `namespace` | string | No | Namespace (default: current) |
| `container` | string | No | Container name (for multi-container pods) |
| `tail` | integer | No | Number of lines from end (default: 100) |
| `previous` | boolean | No | Get previous container logs |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const logs = await mcp.kubernetes.pods_log({
  name: "web-7d9f4b8c5-x2v4p",
  namespace: "production",
  tail: 500,
  previous: false
});
```

---

#### `pods_exec`
Execute a command in a pod container.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Pod name |
| `namespace` | string | No | Namespace (default: current) |
| `container` | string | No | Container name |
| `command` | array | Yes | Command and arguments (e.g., ["ls", "-la"]) |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const result = await mcp.kubernetes.pods_exec({
  name: "web-7d9f4b8c5-x2v4p",
  namespace: "production",
  command: ["cat", "/etc/os-release"]
});
```

---

#### `pods_run`
Run a new pod with a container image.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `image` | string | Yes | Container image |
| `name` | string | No | Pod name (random if not provided) |
| `namespace` | string | No | Namespace (default: current) |
| `port` | integer | No | Port to expose |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const pod = await mcp.kubernetes.pods_run({
  name: "debug-pod",
  namespace: "default",
  image: "busybox:latest",
  port: 8080
});
```

---

#### `pods_top`
Get CPU/memory metrics for pods.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | No | Specific pod name |
| `namespace` | string | No | Namespace filter |
| `all_namespaces` | boolean | No | Show all namespaces |
| `label_selector` | string | No | Label selector filter |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const metrics = await mcp.kubernetes.pods_top({
  namespace: "production",
  label_selector: "app=api"
});
```

---

### 3. Generic Resource Tools (`core` toolset)

#### `resources_list`
List any Kubernetes resource type.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `apiVersion` | string | Yes | API version (e.g., "apps/v1") |
| `kind` | string | Yes | Resource kind (e.g., "Deployment") |
| `namespace` | string | No | Namespace (omit for cluster-scoped) |
| `labelSelector` | string | No | Label selector filter |
| `fieldSelector` | string | No | Field selector filter |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const deployments = await mcp.kubernetes.resources_list({
  apiVersion: "apps/v1",
  kind: "Deployment",
  namespace: "production"
});
```

---

#### `resources_get`
Get a specific Kubernetes resource.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `apiVersion` | string | Yes | API version |
| `kind` | string | Yes | Resource kind |
| `name` | string | Yes | Resource name |
| `namespace` | string | No | Namespace |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const deployment = await mcp.kubernetes.resources_get({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production"
});
```

---

#### `resources_create_or_update`
Create or update a Kubernetes resource from YAML/JSON.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `resource` | string | Yes | YAML or JSON resource definition |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
await mcp.kubernetes.resources_create_or_update({
  resource: `
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-config
  namespace: default
data:
  key: value
`
});
```

---

#### `resources_delete`
Delete a Kubernetes resource.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `apiVersion` | string | Yes | API version |
| `kind` | string | Yes | Resource kind |
| `name` | string | Yes | Resource name |
| `namespace` | string | No | Namespace |
| `gracePeriodSeconds` | integer | No | Grace period before deletion |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
await mcp.kubernetes.resources_delete({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "old-deployment",
  namespace: "production",
  gracePeriodSeconds: 30
});
```

---

#### `resources_scale`
Get or update the scale of a scalable resource.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `apiVersion` | string | Yes | API version |
| `kind` | string | Yes | Resource kind (Deployment, StatefulSet, etc.) |
| `name` | string | Yes | Resource name |
| `namespace` | string | No | Namespace |
| `scale` | integer | No | New replica count (omit to just get current) |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
// Scale to 5 replicas
await mcp.kubernetes.resources_scale({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production",
  scale: 5
});

// Get current scale
const current = await mcp.kubernetes.resources_scale({
  apiVersion: "apps/v1",
  kind: "Deployment",
  name: "web-server",
  namespace: "production"
});
```

---

### 4. Namespace Tools (`core` toolset)

#### `namespaces_list`
List all namespaces.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const namespaces = await mcp.kubernetes.namespaces_list();
```

---

#### `projects_list` (OpenShift)
List all OpenShift projects.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `context` | string | No | Kubernetes context |

---

### 5. Event Tools (`core` toolset)

#### `events_list`
List Kubernetes events.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `namespace` | string | No | Filter by namespace |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const events = await mcp.kubernetes.events_list({
  namespace: "production"
});
```

---

### 6. Node Tools (`core` toolset)

#### `nodes_top`
Get node resource usage metrics.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | No | Specific node name |
| `label_selector` | string | No | Label selector filter |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const nodes = await mcp.kubernetes.nodes_top();
const specificNode = await mcp.kubernetes.nodes_top({
  name: "worker-1"
});
```

---

#### `nodes_stats_summary`
Get detailed node statistics including PSI metrics.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Node name |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const stats = await mcp.kubernetes.nodes_stats_summary({
  name: "worker-1"
});
```

---

#### `nodes_log`
Get node logs (kubelet, etc.).

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Node name |
| `query` | string | Yes | Service or log file path (e.g., "kubelet", "/var/log/kubelet.log") |
| `tailLines` | integer | No | Number of lines to retrieve |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const logs = await mcp.kubernetes.nodes_log({
  name: "worker-1",
  query: "kubelet",
  tailLines: 100
});
```

---

### 7. Helm Tools (`helm` toolset)

#### `helm_install`
Install a Helm chart.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `chart` | string | Yes | Chart reference or URL |
| `name` | string | No | Release name (random if not provided) |
| `namespace` | string | No | Target namespace |
| `values` | object | No | Chart values |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
await mcp.kubernetes.helm_install({
  name: "my-postgres",
  namespace: "database",
  chart: "oci://registry-1.docker.io/bitnamicharts/postgresql",
  values: {
    auth: {
      postgresPassword: "secret123"
    }
  }
});
```

---

#### `helm_list`
List Helm releases.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `namespace` | string | No | Filter by namespace |
| `all_namespaces` | boolean | No | List all namespaces |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
const releases = await mcp.kubernetes.helm_list({
  namespace: "database"
});
```

---

#### `helm_uninstall`
Uninstall a Helm release.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `name` | string | Yes | Release name |
| `namespace` | string | No | Namespace |
| `context` | string | No | Kubernetes context |

**Example:**
```javascript
await mcp.kubernetes.helm_uninstall({
  name: "my-postgres",
  namespace: "database"
});
```

---

## Common Resource Types Reference

### Core Resources (v1)

| Resource | apiVersion | kind |
|----------|-----------|------|
| Pod | v1 | Pod |
| Service | v1 | Service |
| ConfigMap | v1 | ConfigMap |
| Secret | v1 | Secret |
| Namespace | v1 | Namespace |
| Node | v1 | Node |
| PersistentVolume | v1 | PersistentVolume |
| PersistentVolumeClaim | v1 | PersistentVolumeClaim |

### Workload Resources

| Resource | apiVersion | kind |
|----------|-----------|------|
| Deployment | apps/v1 | Deployment |
| StatefulSet | apps/v1 | StatefulSet |
| DaemonSet | apps/v1 | DaemonSet |
| ReplicaSet | apps/v1 | ReplicaSet |
| Job | batch/v1 | Job |
| CronJob | batch/v1 | CronJob |

### Network Resources

| Resource | apiVersion | kind |
|----------|-----------|------|
| Ingress | networking.k8s.io/v1 | Ingress |
| NetworkPolicy | networking.k8s.io/v1 | NetworkPolicy |
| IngressClass | networking.k8s.io/v1 | IngressClass |

### RBAC Resources

| Resource | apiVersion | kind |
|----------|-----------|------|
| Role | rbac.authorization.k8s.io/v1 | Role |
| ClusterRole | rbac.authorization.k8s.io/v1 | ClusterRole |
| RoleBinding | rbac.authorization.k8s.io/v1 | RoleBinding |
| ClusterRoleBinding | rbac.authorization.k8s.io/v1 | ClusterRoleBinding |

### OpenShift Resources

| Resource | apiVersion | kind |
|----------|-----------|------|
| Route | route.openshift.io/v1 | Route |
| Project | project.openshift.io/v1 | Project |

---

## Field Selectors Reference

### Pod Field Selectors

| Field | Example Values |
|-------|---------------|
| `metadata.name` | `my-pod` |
| `metadata.namespace` | `production` |
| `spec.nodeName` | `worker-1` |
| `spec.restartPolicy` | `Always`, `OnFailure`, `Never` |
| `spec.schedulerName` | `default-scheduler` |
| `spec.serviceAccountName` | `default` |
| `status.phase` | `Pending`, `Running`, `Succeeded`, `Failed`, `Unknown` |
| `status.podIP` | `10.0.0.1` |
| `status.nominatedNodeName` | `worker-2` |

### Usage Example
```javascript
const runningPods = await mcp.kubernetes.pods_list({
  fieldSelector: "status.phase=Running,spec.nodeName=worker-1"
});
```

---

## Label Selectors Reference

### Equality-Based
```javascript
// Exact match
"app=web"

// Not equal
"env!=dev"
```

### Set-Based
```javascript
// In set
"app in (web, api)"

// Not in set
"env notin (dev, test)"

// Key exists
"monitoring"

// Key does not exist
"!deprecated"
```

### Combined
```javascript
"app=web,env in (prod,staging),!debug"
```
