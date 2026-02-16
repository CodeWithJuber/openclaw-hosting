# AWS MCP Skill

A comprehensive AI Agent Skill for integrating AWS services with the Model Context Protocol (MCP). This skill provides a unified interface for managing AWS resources through standardized MCP tools.

## Overview

The AWS MCP Skill enables AI agents to interact with AWS services using the Model Context Protocol. It provides:

- **AWS Credential Management**: Secure handling of AWS credentials with profile support
- **S3 Operations**: List, upload, download, and manage S3 buckets and objects
- **EC2 Instance Management**: Start, stop, monitor, and manage EC2 instances
- **Lambda Function Deployment**: Deploy, invoke, and manage Lambda functions
- **CloudWatch Logs**: Query and analyze CloudWatch logs
- **IAM Permissions**: Manage users, roles, and permissions
- **Cost Monitoring**: Track AWS costs and billing information

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Configure AWS credentials
aws configure
# or
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

## Quick Start

### Basic Usage

```typescript
import { AWSSkill } from './src/aws-skill';

// Create skill instance
const aws = new AWSSkill({
  region: 'us-east-1',
  profile: 'default' // optional
});

// Initialize MCP server
await aws.initialize();

// List available tools
const tools = await aws.listTools();
console.log('Available tools:', tools.map(t => t.name));

// Call a tool
const buckets = await aws.callTool('s3_list_buckets', {});
console.log('S3 Buckets:', buckets);
```

### Using with MCP Client

```typescript
import { MCPClient } from '@openclaw/skill-mcp-client';
import { AWSSkillServer } from './src/server';

// Create AWS MCP server
const server = new AWSSkillServer({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Connect with MCP client
const client = new MCPClient({ name: 'aws-client', version: '1.0.0' });
await client.connectToServer({
  command: 'node',
  args: ['./dist/server.js'],
  env: {
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Use AWS tools
const instances = await client.callTool('ec2_list_instances', {});
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS MCP Skill                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   MCP       │  │   AWS       │  │     Tool Handlers       │  │
│  │   Server    │  │   Clients   │  │                         │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                      │                │
│  ┌──────▼────────────────▼──────────────────────▼──────────┐    │
│  │                    Credential Manager                     │    │
│  │              (Profiles, SSO, Assume Role)                 │    │
│  └───────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │   S3    │          │   EC2   │          │ Lambda  │
   └─────────┘          └─────────┘          └─────────┘
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │CloudWatch│         │   IAM   │          │ Cost    │
   └─────────┘          └─────────┘          │Explorer │
                                             └─────────┘
```

## Available Tools

### Credential Management

| Tool | Description |
|------|-------------|
| `aws_get_caller_identity` | Get current AWS account identity |
| `aws_list_profiles` | List configured AWS profiles |
| `aws_assume_role` | Assume an IAM role |
| `aws_get_session_token` | Get temporary session credentials |

### S3 Operations

| Tool | Description |
|------|-------------|
| `s3_list_buckets` | List all S3 buckets |
| `s3_create_bucket` | Create a new S3 bucket |
| `s3_delete_bucket` | Delete an S3 bucket |
| `s3_list_objects` | List objects in a bucket |
| `s3_upload_object` | Upload an object to S3 |
| `s3_download_object` | Download an object from S3 |
| `s3_delete_object` | Delete an object from S3 |
| `s3_get_object_url` | Generate presigned URL for object |
| `s3_copy_object` | Copy an object between buckets |

### EC2 Instance Management

| Tool | Description |
|------|-------------|
| `ec2_list_instances` | List EC2 instances |
| `ec2_start_instance` | Start an EC2 instance |
| `ec2_stop_instance` | Stop an EC2 instance |
| `ec2_terminate_instance` | Terminate an EC2 instance |
| `ec2_create_instance` | Launch a new EC2 instance |
| `ec2_describe_instance` | Get detailed instance information |
| `ec2_get_instance_status` | Check instance status |
| `ec2_list_security_groups` | List security groups |
| `ec2_list_key_pairs` | List SSH key pairs |

### Lambda Function Deployment

| Tool | Description |
|------|-------------|
| `lambda_list_functions` | List Lambda functions |
| `lambda_create_function` | Create a new Lambda function |
| `lambda_update_function_code` | Update function code |
| `lambda_update_function_config` | Update function configuration |
| `lambda_invoke_function` | Invoke a Lambda function |
| `lambda_delete_function` | Delete a Lambda function |
| `lambda_get_function_logs` | Get function execution logs |
| `lambda_list_layers` | List Lambda layers |

### CloudWatch Logs

| Tool | Description |
|------|-------------|
| `cloudwatch_list_log_groups` | List CloudWatch log groups |
| `cloudwatch_describe_log_group` | Get log group details |
| `cloudwatch_get_log_events` | Get log events from a stream |
| `cloudwatch_filter_log_events` | Filter logs with patterns |
| `cloudwatch_query_logs` | Run CloudWatch Insights queries |
| `cloudwatch_create_log_group` | Create a new log group |
| `cloudwatch_delete_log_group` | Delete a log group |

### IAM Permissions

| Tool | Description |
|------|-------------|
| `iam_list_users` | List IAM users |
| `iam_get_user` | Get user details |
| `iam_list_roles` | List IAM roles |
| `iam_get_role` | Get role details and policies |
| `iam_list_policies` | List IAM policies |
| `iam_get_policy` | Get policy details |
| `iam_attach_policy` | Attach policy to user/role |
| `iam_detach_policy` | Detach policy from user/role |
| `iam_create_access_key` | Create access key for user |
| `iam_list_access_keys` | List access keys for user |

### Cost Monitoring

| Tool | Description |
|------|-------------|
| `cost_get_cost_and_usage` | Get cost and usage data |
| `cost_get_cost_forecast` | Get cost forecast |
| `cost_get_usage_forecast` | Get usage forecast |
| `cost_get_cost_by_service` | Break down costs by service |
| `cost_get_cost_by_tag` | Break down costs by tags |
| `cost_get_budgets` | List cost budgets |
| `cost_create_budget` | Create a cost budget |
| `ce_get_reservation_utilization` | Get reservation utilization |

## Configuration

### Environment Variables

```bash
# Required
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1

# Optional
export AWS_PROFILE=default              # Use named profile
export AWS_SESSION_TOKEN=session_token  # For temporary credentials
export AWS_ROLE_ARN=arn:aws:iam::...    # Role to assume
```

### AWS Config File

```ini
# ~/.aws/config
[default]
region = us-east-1
output = json

[profile production]
region = eu-west-1
role_arn = arn:aws:iam::123456789012:role/ProductionRole
source_profile = default
```

### Credentials File

```ini
# ~/.aws/credentials
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = ...

[production]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
```

## Tool Usage Examples

### S3 Operations

```typescript
// List all buckets
const buckets = await aws.callTool('s3_list_buckets', {});

// List objects in a bucket
const objects = await aws.callTool('s3_list_objects', {
  bucket: 'my-bucket',
  prefix: 'uploads/',
  maxKeys: 100
});

// Upload a file
await aws.callTool('s3_upload_object', {
  bucket: 'my-bucket',
  key: 'data/file.txt',
  filePath: '/local/path/file.txt',
  metadata: { author: 'user@example.com' }
});

// Download a file
const result = await aws.callTool('s3_download_object', {
  bucket: 'my-bucket',
  key: 'data/file.txt',
  filePath: '/local/path/downloaded.txt'
});

// Generate presigned URL
const url = await aws.callTool('s3_get_object_url', {
  bucket: 'my-bucket',
  key: 'data/file.txt',
  expiration: 3600 // 1 hour
});
```

### EC2 Instance Management

```typescript
// List all instances
const instances = await aws.callTool('ec2_list_instances', {
  filters: [{ name: 'instance-state-name', values: ['running'] }]
});

// Start an instance
await aws.callTool('ec2_start_instance', {
  instanceId: 'i-1234567890abcdef0'
});

// Create a new instance
const newInstance = await aws.callTool('ec2_create_instance', {
  imageId: 'ami-12345678',
  instanceType: 't3.micro',
  keyName: 'my-key-pair',
  securityGroupIds: ['sg-12345678'],
  subnetId: 'subnet-12345678',
  tags: { Name: 'MyInstance', Environment: 'dev' }
});

// Get instance status
const status = await aws.callTool('ec2_get_instance_status', {
  instanceIds: ['i-1234567890abcdef0']
});
```

### Lambda Function Deployment

```typescript
// List functions
const functions = await aws.callTool('lambda_list_functions', {});

// Create a function
await aws.callTool('lambda_create_function', {
  functionName: 'my-function',
  runtime: 'nodejs20.x',
  role: 'arn:aws:iam::123456789012:role/lambda-role',
  handler: 'index.handler',
  code: {
    zipFile: '/path/to/function.zip'
  },
  environment: {
    variables: { NODE_ENV: 'production' }
  },
  timeout: 30,
  memorySize: 256
});

// Invoke a function
const result = await aws.callTool('lambda_invoke_function', {
  functionName: 'my-function',
  payload: JSON.stringify({ key: 'value' }),
  invocationType: 'RequestResponse'
});

// Update function code
await aws.callTool('lambda_update_function_code', {
  functionName: 'my-function',
  zipFile: '/path/to/updated-function.zip'
});
```

### CloudWatch Logs

```typescript
// List log groups
const logGroups = await aws.callTool('cloudwatch_list_log_groups', {
  logGroupNamePrefix: '/aws/lambda'
});

// Get recent log events
const logs = await aws.callTool('cloudwatch_get_log_events', {
  logGroupName: '/aws/lambda/my-function',
  logStreamName: '2024/01/01/[$LATEST]abc123',
  limit: 100
});

// Query logs with Insights
const queryResults = await aws.callTool('cloudwatch_query_logs', {
  logGroupNames: ['/aws/lambda/my-function'],
  queryString: `
    fields @timestamp, @message
    | filter @message like /ERROR/
    | sort @timestamp desc
    | limit 20
  `,
  startTime: new Date(Date.now() - 3600000).toISOString(),
  endTime: new Date().toISOString()
});
```

### IAM Permissions

```typescript
// List users
const users = await aws.callTool('iam_list_users', {});

// Get role details
const role = await aws.callTool('iam_get_role', {
  roleName: 'MyRole'
});

// Attach policy to user
await aws.callTool('iam_attach_policy', {
  userName: 'my-user',
  policyArn: 'arn:aws:iam::aws:policy/ReadOnlyAccess'
});

// Create access key
const accessKey = await aws.callTool('iam_create_access_key', {
  userName: 'my-user'
});
```

### Cost Monitoring

```typescript
// Get monthly costs
const costs = await aws.callTool('cost_get_cost_and_usage', {
  timePeriod: {
    start: '2024-01-01',
    end: '2024-01-31'
  },
  granularity: 'MONTHLY',
  metrics: ['BlendedCost', 'UsageQuantity']
});

// Get costs by service
const byService = await aws.callTool('cost_get_cost_by_service', {
  timePeriod: {
    start: '2024-01-01',
    end: '2024-01-31'
  }
});

// Get cost forecast
const forecast = await aws.callTool('cost_get_cost_forecast', {
  timePeriod: {
    start: '2024-02-01',
    end: '2024-02-28'
  },
  metric: 'BLENDED_COST',
  predictionIntervalLevel: 95
});
```

## Error Handling

The skill provides structured error handling for AWS API errors:

```typescript
import { 
  AWSCredentialsError,
  AWSPermissionError,
  AWSResourceNotFoundError,
  AWSRateLimitError,
  AWSServiceError 
} from './src/errors';

try {
  await aws.callTool('s3_get_object', { bucket: 'nonexistent', key: 'file.txt' });
} catch (error) {
  if (error instanceof AWSResourceNotFoundError) {
    console.log('Resource not found:', error.resourceId);
  } else if (error instanceof AWSPermissionError) {
    console.log('Permission denied:', error.requiredPermission);
  } else if (error instanceof AWSRateLimitError) {
    console.log('Rate limited. Retry after:', error.retryAfter);
  }
}
```

## Security Best Practices

1. **Use IAM Roles**: Prefer IAM roles over long-term access keys
2. **Least Privilege**: Grant minimum necessary permissions
3. **Rotate Credentials**: Regularly rotate access keys
4. **Enable CloudTrail**: Log all API calls for auditing
5. **Use VPC Endpoints**: Keep traffic within AWS network
6. **Encrypt Data**: Enable encryption at rest and in transit

## Testing

```bash
# Run unit tests
npm test

# Run integration tests (requires AWS credentials)
npm run test:integration

# Run with coverage
npm run test:coverage
```

## License

MIT © OpenClaw
