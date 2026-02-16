# AWS MCP Skill Configuration

## Overview

This directory contains the AWS MCP (Model Context Protocol) Skill for OpenClaw, providing comprehensive AWS service integration.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   # OR set environment variables:
   export AWS_ACCESS_KEY_ID=your_access_key
   export AWS_SECRET_ACCESS_KEY=your_secret_key
   export AWS_REGION=us-east-1
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Run the MCP server:**
   ```bash
   npm start
   ```

## MCP Client Configuration

Add to your MCP client configuration:

### Claude Desktop / Cline

```json
{
  "mcpServers": {
    "aws": {
      "command": "node",
      "args": ["/path/to/skills/aws-mcp/dist/server.js"],
      "env": {
        "AWS_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "your_access_key",
        "AWS_SECRET_ACCESS_KEY": "your_secret_key"
      }
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "aws": {
      "command": "node",
      "args": ["/path/to/skills/aws-mcp/dist/server.js"],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

### VS Code

```json
{
  "servers": {
    "aws": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/skills/aws-mcp/dist/server.js"],
      "env": {
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

## Available Tools

### Credential Management
- `aws_get_caller_identity` - Get current AWS identity
- `aws_list_profiles` - List configured profiles
- `aws_assume_role` - Assume IAM role
- `aws_validate_credentials` - Validate credentials

### S3 Operations
- `s3_list_buckets` - List buckets
- `s3_create_bucket` - Create bucket
- `s3_delete_bucket` - Delete bucket
- `s3_list_objects` - List objects
- `s3_upload_object` - Upload object
- `s3_download_object` - Download object
- `s3_delete_object` - Delete object
- `s3_get_object_url` - Generate presigned URL
- `s3_copy_object` - Copy object

### EC2 Operations
- `ec2_list_instances` - List instances
- `ec2_create_instance` - Launch instance
- `ec2_start_instance` - Start instance
- `ec2_stop_instance` - Stop instance
- `ec2_terminate_instance` - Terminate instance
- `ec2_describe_instance` - Get instance details
- `ec2_list_security_groups` - List security groups
- `ec2_list_key_pairs` - List SSH keys

### Lambda Operations
- `lambda_list_functions` - List functions
- `lambda_create_function` - Create function
- `lambda_update_function_code` - Update code
- `lambda_update_function_config` - Update config
- `lambda_invoke_function` - Invoke function
- `lambda_delete_function` - Delete function

### CloudWatch Logs
- `cloudwatch_list_log_groups` - List log groups
- `cloudwatch_get_log_events` - Get log events
- `cloudwatch_filter_log_events` - Filter logs
- `cloudwatch_query_logs` - Run Insights query

### IAM Operations
- `iam_list_users` - List users
- `iam_list_roles` - List roles
- `iam_list_policies` - List policies
- `iam_attach_user_policy` - Attach policy to user
- `iam_attach_role_policy` - Attach policy to role
- `iam_create_access_key` - Create access key

### Cost Explorer
- `cost_get_cost_and_usage` - Get costs
- `cost_get_cost_by_service` - Costs by service
- `cost_get_cost_forecast` - Cost forecast
- `cost_get_budgets` - List budgets

## Security Notes

- Never commit AWS credentials to version control
- Use IAM roles when running on AWS infrastructure
- Enable MFA for sensitive operations
- Follow least privilege principle for IAM permissions
- Use VPC endpoints to keep traffic within AWS network

## License

MIT
