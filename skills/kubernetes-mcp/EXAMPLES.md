# Kubernetes MCP Skill Examples

## Basic Operations

### List All Resources in a Namespace

```javascript
// Get all pods
const pods = await mcp.kubernetes.pods_list_in_namespace({
  namespace: "production"
});

// Get all services
const services = await mcp.kubernetes.resources_list({
  apiVersion: "v1",
  kind: "Service",
  namespace: "production"
});

// Get all deployments
const deployments = await mcp.kubernetes.resources_list({
  apiVersion: "apps/v1",
  kind: "Deployment",
  namespace: "production"
});

// Get all configmaps
const configMaps = await mcp.kubernetes.resources_list({
  apiVersion: "v1",
  kind: "ConfigMap",
  namespace: "production"
});
```

### Quick Pod Diagnostics

```javascript
async function diagnosePod(name, namespace) {
  console.log(`\n=== Diagnosing ${name} ===\n`);
  
  // 1. Get pod details
  const pod = await mcp.kubernetes.pods_get({ name, namespace });
  console.log("Status:", pod.status?.phase);
  console.log("Restarts:", pod.status?.containerStatuses?.[0]?.restartCount);
  
  // 2. Get recent events
  const events = await mcp.kubernetes.events_list({ namespace });
  const podEvents = events.filter(e => e.involvedObject?.name === name);
  console.log("\nRecent Events:");
  podEvents.slice(-5).forEach(e => {
    console.log(`  ${e.type}: ${e.reason} - ${e.message}`);
  });
  
  // 3. Get logs
  const logs = await mcp.kubernetes.pods_log({ 
    name, 
    namespace, 
    tail: 50 
  });
  console.log("\nRecent Logs:");
  console.log(logs);
  
  // 4. Get resource usage
  const metrics = await mcp.kubernetes.pods_top({ name, namespace });
  console.log("\nResource Usage:", metrics);
}

// Usage
await diagnosePod("web-server-abc123", "production");
```

### Deploy a Complete Application Stack

```javascript
async function deployApplication(config) {
  const { name, namespace, image, port, replicas = 3 } = config;
  
  // 1. Create namespace if not exists
  try {
    await mcp.kubernetes.resources_create_or_update({
      resource: `
apiVersion: v1
kind: Namespace
metadata:
  name: ${namespace}
`
    });
  } catch (e) {
    // Namespace may already exist
  }
  
  // 2. Create deployment
  const deployment = await mcp.kubernetes.resources_create_or_update({
    resource: `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: ${namespace}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
      - name: app
        image: ${image}
        ports:
        - containerPort: ${port}
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: ${port}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: ${port}
          initialDelaySeconds: 5
          periodSeconds: 5
`
    });
  
  // 3. Create service
  const service = await mcp.kubernetes.resources_create_or_update({
    resource: `
apiVersion: v1
kind: Service
metadata:
  name: ${name}
  namespace: ${namespace}
spec:
  selector:
    app: ${name}
  ports:
  - port: 80
    targetPort: ${port}
  type: ClusterIP
`
    });
  
  // 4. Wait for rollout (check pod status)
  let ready = false;
  let attempts = 0;
  while (!ready && attempts < 30) {
    await new Promise(r => setTimeout(r, 2000));
    const pods = await mcp.kubernetes.pods_list_in_namespace({
      namespace,
      labelSelector: `app=${name}`
    });
    ready = pods.every(p => p.status?.phase === "Running");
    attempts++;
    process.stdout.write(".");
  }
  
  console.log(`\n✅ Deployment ${name} is ready!`);
  return { deployment, service };
}

// Usage
await deployApplication({
  name: "my-api",
  namespace: "production",
  image: "myregistry/api:v1.2.3",
  port: 8080,
  replicas: 3
});
```

### Cleanup Resources

```javascript
async function cleanupNamespace(namespace) {
  console.log(`Cleaning up namespace: ${namespace}`);
  
  // Delete deployments
  const deployments = await mcp.kubernetes.resources_list({
    apiVersion: "apps/v1",
    kind: "Deployment",
    namespace
  });
  
  for (const dep of deployments) {
    await mcp.kubernetes.resources_delete({
      apiVersion: "apps/v1",
      kind: "Deployment",
      name: dep.metadata.name,
      namespace
    });
    console.log(`Deleted deployment: ${dep.metadata.name}`);
  }
  
  // Delete services (except default/kubernetes)
  const services = await mcp.kubernetes.resources_list({
    apiVersion: "v1",
    kind: "Service",
    namespace
  });
  
  for (const svc of services) {
    if (svc.metadata.name !== "kubernetes") {
      await mcp.kubernetes.resources_delete({
        apiVersion: "v1",
        kind: "Service",
        name: svc.metadata.name,
        namespace
      });
      console.log(`Deleted service: ${svc.metadata.name}`);
    }
  }
  
  // Delete configmaps
  const configMaps = await mcp.kubernetes.resources_list({
    apiVersion: "v1",
    kind: "ConfigMap",
    namespace
  });
  
  for (const cm of configMaps) {
    await mcp.kubernetes.resources_delete({
      apiVersion: "v1",
      kind: "ConfigMap",
      name: cm.metadata.name,
      namespace
    });
    console.log(`Deleted configmap: ${cm.metadata.name}`);
  }
  
  console.log("✅ Cleanup complete");
}

// Usage
await cleanupNamespace("staging");
```

### Monitor Cluster Health

```javascript
async function clusterHealthCheck() {
  const report = {
    timestamp: new Date().toISOString(),
    nodes: [],
    namespaces: [],
    issues: []
  };
  
  // Check nodes
  const nodes = await mcp.kubernetes.resources_list({
    apiVersion: "v1",
    kind: "Node"
  });
  
  for (const node of nodes) {
    const conditions = node.status?.conditions || [];
    const ready = conditions.find(c => c.type === "Ready");
    
    report.nodes.push({
      name: node.metadata.name,
      ready: ready?.status === "True",
      conditions: conditions.map(c => ({ type: c.type, status: c.status }))
    });
    
    if (ready?.status !== "True") {
      report.issues.push(`Node ${node.metadata.name} is not ready`);
    }
  }
  
  // Check pods in all namespaces
  const pods = await mcp.kubernetes.pods_list();
  const failedPods = pods.filter(p => 
    p.status?.phase === "Failed" || 
    p.status?.phase === "Unknown"
  );
  
  // Check for CrashLoopBackOff
  const crashLoopPods = pods.filter(p => {
    const containerStatus = p.status?.containerStatuses?.[0];
    return containerStatus?.state?.waiting?.reason === "CrashLoopBackOff";
  });
  
  // Check recent warning events
  const events = await mcp.kubernetes.events_list();
  const warnings = events.filter(e => e.type === "Warning").slice(-20);
  
  report.issues.push(
    ...failedPods.map(p => `Pod ${p.metadata.name} in ${p.metadata.namespace} is ${p.status?.phase}`),
    ...crashLoopPods.map(p => `Pod ${p.metadata.name} in ${p.metadata.namespace} is in CrashLoopBackOff`),
    ...warnings.map(e => `Warning: ${e.reason} - ${e.message} (${e.involvedObject?.name})`)
  );
  
  // Resource usage summary
  const nodeMetrics = await mcp.kubernetes.nodes_top();
  report.resourceUsage = nodeMetrics;
  
  return report;
}

// Usage
const health = await clusterHealthCheck();
console.log(JSON.stringify(health, null, 2));
```

### Database Migration Job

```javascript
async function runDatabaseMigration(config) {
  const { namespace, image, dbHost, dbName } = config;
  const jobName = `db-migration-${Date.now()}`;
  
  // Create migration job
  await mcp.kubernetes.resources_create_or_update({
    resource: `
apiVersion: batch/v1
kind: Job
metadata:
  name: ${jobName}
  namespace: ${namespace}
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migration
        image: ${image}
        command: ["npm", "run", "migrate"]
        env:
        - name: DB_HOST
          value: "${dbHost}"
        - name: DB_NAME
          value: "${dbName}"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
  backoffLimit: 2
`
    });
  
  // Wait for completion
  let completed = false;
  let attempts = 0;
  
  while (!completed && attempts < 60) {
    await new Promise(r => setTimeout(r, 5000));
    
    const job = await mcp.kubernetes.resources_get({
      apiVersion: "batch/v1",
      kind: "Job",
      name: jobName,
      namespace
    });
    
    const succeeded = job.status?.succeeded || 0;
    const failed = job.status?.failed || 0;
    
    if (succeeded > 0) {
      completed = true;
      console.log("✅ Migration completed successfully");
    } else if (failed > 0) {
      throw new Error("Migration job failed");
    } else {
      process.stdout.write(".");
    }
    attempts++;
  }
  
  // Get logs
  const pods = await mcp.kubernetes.pods_list_in_namespace({
    namespace,
    labelSelector: `job-name=${jobName}`
  });
  
  if (pods.length > 0) {
    const logs = await mcp.kubernetes.pods_log({
      name: pods[0].metadata.name,
      namespace
    });
    console.log("\nMigration logs:\n", logs);
  }
  
  // Cleanup job
  await mcp.kubernetes.resources_delete({
    apiVersion: "batch/v1",
    kind: "Job",
    name: jobName,
    namespace
  });
}

// Usage
await runDatabaseMigration({
  namespace: "production",
  image: "myapp:migrations-v1.2.3",
  dbHost: "postgres.database.svc.cluster.local",
  dbName: "myapp"
});
```

### Helm Chart Management

```javascript
async function manageHelmRelease(config) {
  const { name, namespace, chart, version, values = {} } = config;
  
  // Check if release exists
  const releases = await mcp.kubernetes.helm_list({ namespace });
  const existing = releases.find(r => r.name === name);
  
  if (existing) {
    console.log(`Upgrading existing release: ${name}`);
    // For upgrade, you'd typically use helm upgrade
    // For now, uninstall and reinstall
    await mcp.kubernetes.helm_uninstall({ name, namespace });
  }
  
  // Install chart
  console.log(`Installing chart: ${chart}`);
  const release = await mcp.kubernetes.helm_install({
    name,
    namespace,
    chart,
    values
  });
  
  console.log(`✅ Release ${release.name} installed successfully`);
  return release;
}

// Install PostgreSQL
await manageHelmRelease({
  name: "postgres",
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

// Install Redis
await manageHelmRelease({
  name: "redis",
  namespace: "cache",
  chart: "oci://registry-1.docker.io/bitnamicharts/redis",
  values: {
    auth: {
      enabled: false
    },
    master: {
      persistence: {
        size: "5Gi"
      }
    }
  }
});
```

### Blue-Green Deployment

```javascript
async function blueGreenDeployment(config) {
  const { appName, namespace, newImage } = config;
  
  const blueName = `${appName}-blue`;
  const greenName = `${appName}-green`;
  
  // Determine which is currently active
  const services = await mcp.kubernetes.resources_list({
    apiVersion: "v1",
    kind: "Service",
    namespace
  });
  
  const activeService = services.find(s => s.metadata.name === appName);
  const currentSelector = activeService?.spec?.selector?.version;
  
  const activeColor = currentSelector === "green" ? "green" : "blue";
  const newColor = activeColor === "blue" ? "green" : "blue";
  const newDeploymentName = newColor === "blue" ? blueName : greenName;
  
  console.log(`Current active: ${activeColor}, deploying to: ${newColor}`);
  
  // Deploy new version to inactive color
  await mcp.kubernetes.resources_create_or_update({
    resource: `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${newDeploymentName}
  namespace: ${namespace}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${appName}
      version: ${newColor}
  template:
    metadata:
      labels:
        app: ${appName}
        version: ${newColor}
    spec:
      containers:
      - name: app
        image: ${newImage}
        ports:
        - containerPort: 8080
`
    });
  
  // Wait for new deployment to be ready
  console.log("Waiting for new deployment to be ready...");
  await new Promise(r => setTimeout(r, 10000));
  
  // Verify new pods are healthy
  const newPods = await mcp.kubernetes.pods_list_in_namespace({
    namespace,
    labelSelector: `app=${appName},version=${newColor}`
  });
  
  const allReady = newPods.every(p => 
    p.status?.phase === "Running" &&
    p.status?.containerStatuses?.every(c => c.ready)
  );
  
  if (!allReady) {
    throw new Error("New deployment is not healthy, aborting switch");
  }
  
  // Switch service to new color
  await mcp.kubernetes.resources_create_or_update({
    resource: `
apiVersion: v1
kind: Service
metadata:
  name: ${appName}
  namespace: ${namespace}
spec:
  selector:
    app: ${appName}
    version: ${newColor}
  ports:
  - port: 80
    targetPort: 8080
`
    });
  
  console.log(`✅ Switched traffic to ${newColor}`);
  
  // Scale down old deployment
  const oldDeploymentName = activeColor === "blue" ? blueName : greenName;
  await mcp.kubernetes.resources_scale({
    apiVersion: "apps/v1",
    kind: "Deployment",
    name: oldDeploymentName,
    namespace,
    scale: 0
  });
  
  console.log(`Scaled down ${activeColor} deployment`);
}

// Usage
await blueGreenDeployment({
  appName: "web-api",
  namespace: "production",
  newImage: "myapp:v2.0.0"
});
```
