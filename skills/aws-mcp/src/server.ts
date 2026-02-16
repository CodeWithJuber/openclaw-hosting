/**
 * AWS MCP Server
 * Main MCP server implementation for AWS services
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { AWSConfig, ServerConfig, ToolResult } from './types';
import { CredentialManager } from './credentials/manager';
import { S3Tools } from './tools/s3-tools';
import { EC2Tools } from './tools/ec2-tools';
import { LambdaTools } from './tools/lambda-tools';
import { CloudWatchTools } from './tools/cloudwatch-tools';
import { IAMTools } from './tools/iam-tools';
import { CostTools } from './tools/cost-tools';
import { CredentialTools } from './tools/credential-tools';
import { AWSSkillError } from './errors';

export class AWSSkillServer {
  private server: Server;
  private config: AWSConfig;
  private credentialManager: CredentialManager;
  
  // Tool handlers
  private s3Tools: S3Tools;
  private ec2Tools: EC2Tools;
  private lambdaTools: LambdaTools;
  private cloudwatchTools: CloudWatchTools;
  private iamTools: IAMTools;
  private costTools: CostTools;
  private credentialTools: CredentialTools;

  constructor(config: ServerConfig = {}) {
    this.config = {
      region: config.aws?.region || process.env.AWS_REGION || 'us-east-1',
      profile: config.aws?.profile,
      credentials: config.aws?.credentials,
      endpoint: config.aws?.endpoint,
      maxRetries: config.aws?.maxRetries || 3,
      requestTimeout: config.aws?.requestTimeout || 30000
    };

    // Initialize MCP server
    this.server = new Server(
      {
        name: config.name || 'aws-mcp-server',
        version: config.version || '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize credential manager
    this.credentialManager = new CredentialManager(this.config);

    // Initialize tool handlers
    this.s3Tools = new S3Tools(this.config, this.credentialManager);
    this.ec2Tools = new EC2Tools(this.config, this.credentialManager);
    this.lambdaTools = new LambdaTools(this.config, this.credentialManager);
    this.cloudwatchTools = new CloudWatchTools(this.config, this.credentialManager);
    this.iamTools = new IAMTools(this.config, this.credentialManager);
    this.costTools = new CostTools(this.config, this.credentialManager);
    this.credentialTools = new CredentialTools(this.config, this.credentialManager);

    this.setupHandlers();
  }

  /**
   * Initialize the server
   */
  async initialize(): Promise<void> {
    await this.credentialManager.initialize();
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getToolDefinitions()
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const result = await this.handleToolCall(request.params.name, request.params.arguments);
        return result;
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  /**
   * Get all tool definitions
   */
  private getToolDefinitions(): Tool[] {
    return [
      // Credential Management
      {
        name: 'aws_get_caller_identity',
        description: 'Get the current AWS account identity (account, ARN, user ID)',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'aws_list_profiles',
        description: 'List all configured AWS profiles from ~/.aws/config and ~/.aws/credentials',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'aws_assume_role',
        description: 'Assume an IAM role and return temporary credentials',
        inputSchema: {
          type: 'object',
          properties: {
            roleArn: { type: 'string', description: 'ARN of the role to assume' },
            roleSessionName: { type: 'string', description: 'Name for the role session' },
            durationSeconds: { type: 'number', description: 'Session duration in seconds (900-43200)' },
            externalId: { type: 'string', description: 'External ID for third-party access' },
            serialNumber: { type: 'string', description: 'MFA device serial number' },
            tokenCode: { type: 'string', description: 'MFA token code' }
          },
          required: ['roleArn', 'roleSessionName']
        }
      },
      {
        name: 'aws_get_session_token',
        description: 'Get a temporary session token (useful for MFA)',
        inputSchema: {
          type: 'object',
          properties: {
            durationSeconds: { type: 'number', description: 'Token lifetime in seconds (900-129600)' }
          },
          required: []
        }
      },
      {
        name: 'aws_validate_credentials',
        description: 'Validate current AWS credentials and return account info',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'aws_get_region',
        description: 'Get the current AWS region',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },

      // S3 Operations
      {
        name: 's3_list_buckets',
        description: 'List all S3 buckets in the account',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 's3_create_bucket',
        description: 'Create a new S3 bucket',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', description: 'Name of the bucket to create' },
            region: { type: 'string', description: 'AWS region for the bucket' },
            enableVersioning: { type: 'boolean', description: 'Enable versioning on the bucket' }
          },
          required: ['bucket']
        }
      },
      {
        name: 's3_delete_bucket',
        description: 'Delete an S3 bucket (must be empty unless force=true)',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', description: 'Name of the bucket to delete' },
            force: { type: 'boolean', description: 'Delete all objects before deleting bucket' }
          },
          required: ['bucket']
        }
      },
      {
        name: 's3_list_objects',
        description: 'List objects in an S3 bucket',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', description: 'Bucket name' },
            prefix: { type: 'string', description: 'Prefix to filter objects' },
            maxKeys: { type: 'number', description: 'Maximum number of keys to return' },
            continuationToken: { type: 'string', description: 'Token for pagination' }
          },
          required: ['bucket']
        }
      },
      {
        name: 's3_upload_object',
        description: 'Upload an object to S3',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', description: 'Destination bucket' },
            key: { type: 'string', description: 'Object key (path in bucket)' },
            filePath: { type: 'string', description: 'Local file path to upload' },
            content: { type: 'string', description: 'Content to upload (alternative to filePath)' },
            contentType: { type: 'string', description: 'MIME type of the content' },
            metadata: { type: 'object', description: 'Custom metadata key-value pairs' }
          },
          required: ['bucket', 'key']
        }
      },
      {
        name: 's3_download_object',
        description: 'Download an object from S3',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', description: 'Source bucket' },
            key: { type: 'string', description: 'Object key to download' },
            filePath: { type: 'string', description: 'Local path to save file (optional, returns content if not provided)' }
          },
          required: ['bucket', 'key']
        }
      },
      {
        name: 's3_delete_object',
        description: 'Delete an object from S3',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', description: 'Bucket name' },
            key: { type: 'string', description: 'Object key to delete' }
          },
          required: ['bucket', 'key']
        }
      },
      {
        name: 's3_get_object_url',
        description: 'Generate a presigned URL for an S3 object',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', description: 'Bucket name' },
            key: { type: 'string', description: 'Object key' },
            expiration: { type: 'number', description: 'URL expiration time in seconds (default: 3600)' },
            operation: { type: 'string', enum: ['get', 'put'], description: 'URL operation type' }
          },
          required: ['bucket', 'key']
        }
      },
      {
        name: 's3_copy_object',
        description: 'Copy an S3 object between buckets or keys',
        inputSchema: {
          type: 'object',
          properties: {
            sourceBucket: { type: 'string', description: 'Source bucket' },
            sourceKey: { type: 'string', description: 'Source object key' },
            destinationBucket: { type: 'string', description: 'Destination bucket' },
            destinationKey: { type: 'string', description: 'Destination object key' }
          },
          required: ['sourceBucket', 'sourceKey', 'destinationBucket', 'destinationKey']
        }
      },
      {
        name: 's3_get_object_metadata',
        description: 'Get metadata for an S3 object',
        inputSchema: {
          type: 'object',
          properties: {
            bucket: { type: 'string', description: 'Bucket name' },
            key: { type: 'string', description: 'Object key' }
          },
          required: ['bucket', 'key']
        }
      },

      // EC2 Operations
      {
        name: 'ec2_list_instances',
        description: 'List EC2 instances with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            instanceIds: { type: 'array', items: { type: 'string' }, description: 'Specific instance IDs to list' },
            filters: { type: 'array', description: 'Filters to apply' },
            maxResults: { type: 'number', description: 'Maximum results to return' }
          },
          required: []
        }
      },
      {
        name: 'ec2_create_instance',
        description: 'Launch a new EC2 instance',
        inputSchema: {
          type: 'object',
          properties: {
            imageId: { type: 'string', description: 'AMI ID' },
            instanceType: { type: 'string', description: 'Instance type (e.g., t3.micro)' },
            keyName: { type: 'string', description: 'SSH key pair name' },
            securityGroupIds: { type: 'array', items: { type: 'string' }, description: 'Security group IDs' },
            subnetId: { type: 'string', description: 'Subnet ID' },
            userData: { type: 'string', description: 'User data script' },
            tags: { type: 'object', description: 'Tags to apply to instance' },
            minCount: { type: 'number', description: 'Minimum instances to launch' },
            maxCount: { type: 'number', description: 'Maximum instances to launch' },
            iamInstanceProfile: { type: 'string', description: 'IAM instance profile name' }
          },
          required: ['imageId', 'instanceType']
        }
      },
      {
        name: 'ec2_start_instance',
        description: 'Start one or more EC2 instances',
        inputSchema: {
          type: 'object',
          properties: {
            instanceIds: { type: 'array', items: { type: 'string' }, description: 'Instance IDs to start' }
          },
          required: ['instanceIds']
        }
      },
      {
        name: 'ec2_stop_instance',
        description: 'Stop one or more EC2 instances',
        inputSchema: {
          type: 'object',
          properties: {
            instanceIds: { type: 'array', items: { type: 'string' }, description: 'Instance IDs to stop' },
            force: { type: 'boolean', description: 'Force stop the instances' }
          },
          required: ['instanceIds']
        }
      },
      {
        name: 'ec2_terminate_instance',
        description: 'Terminate one or more EC2 instances',
        inputSchema: {
          type: 'object',
          properties: {
            instanceIds: { type: 'array', items: { type: 'string' }, description: 'Instance IDs to terminate' }
          },
          required: ['instanceIds']
        }
      },
      {
        name: 'ec2_describe_instance',
        description: 'Get detailed information about a specific EC2 instance',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: { type: 'string', description: 'Instance ID' }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'ec2_get_instance_status',
        description: 'Get status checks for EC2 instances',
        inputSchema: {
          type: 'object',
          properties: {
            instanceIds: { type: 'array', items: { type: 'string' }, description: 'Instance IDs to check' },
            includeAllInstances: { type: 'boolean', description: 'Include all instances, not just running' }
          },
          required: []
        }
      },
      {
        name: 'ec2_list_security_groups',
        description: 'List EC2 security groups',
        inputSchema: {
          type: 'object',
          properties: {
            groupIds: { type: 'array', items: { type: 'string' }, description: 'Specific security group IDs' },
            filters: { type: 'array', description: 'Filters to apply' }
          },
          required: []
        }
      },
      {
        name: 'ec2_list_key_pairs',
        description: 'List EC2 key pairs (SSH keys)',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'ec2_list_images',
        description: 'List available AMIs',
        inputSchema: {
          type: 'object',
          properties: {
            owners: { type: 'array', items: { type: 'string' }, description: 'AMI owners (amazon, self, etc.)' },
            filters: { type: 'array', description: 'Filters to apply' }
          },
          required: []
        }
      },

      // Lambda Operations
      {
        name: 'lambda_list_functions',
        description: 'List Lambda functions',
        inputSchema: {
          type: 'object',
          properties: {
            maxItems: { type: 'number', description: 'Maximum functions to return' },
            functionVersion: { type: 'string', enum: ['ALL'], description: 'Include all versions' }
          },
          required: []
        }
      },
      {
        name: 'lambda_create_function',
        description: 'Create a new Lambda function',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: { type: 'string', description: 'Function name' },
            runtime: { type: 'string', description: 'Runtime (e.g., nodejs20.x, python3.11)' },
            role: { type: 'string', description: 'IAM role ARN' },
            handler: { type: 'string', description: 'Handler function' },
            code: { type: 'object', description: 'Function code (zipFile, s3Bucket/s3Key, or imageUri)' },
            description: { type: 'string', description: 'Function description' },
            timeout: { type: 'number', description: 'Timeout in seconds' },
            memorySize: { type: 'number', description: 'Memory in MB' },
            environment: { type: 'object', description: 'Environment variables' },
            vpcConfig: { type: 'object', description: 'VPC configuration' },
            layers: { type: 'array', items: { type: 'string' }, description: 'Layer ARNs' }
          },
          required: ['functionName', 'runtime', 'role', 'handler', 'code']
        }
      },
      {
        name: 'lambda_update_function_code',
        description: 'Update Lambda function code',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: { type: 'string', description: 'Function name' },
            zipFile: { type: 'string', description: 'Path to zip file' },
            s3Bucket: { type: 'string', description: 'S3 bucket containing code' },
            s3Key: { type: 'string', description: 'S3 key for code object' },
            s3ObjectVersion: { type: 'string', description: 'S3 object version' },
            imageUri: { type: 'string', description: 'Container image URI' },
            publish: { type: 'boolean', description: 'Publish new version' }
          },
          required: ['functionName']
        }
      },
      {
        name: 'lambda_update_function_config',
        description: 'Update Lambda function configuration',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: { type: 'string', description: 'Function name' },
            description: { type: 'string', description: 'Function description' },
            handler: { type: 'string', description: 'Handler function' },
            timeout: { type: 'number', description: 'Timeout in seconds' },
            memorySize: { type: 'number', description: 'Memory in MB' },
            runtime: { type: 'string', description: 'Runtime' },
            environment: { type: 'object', description: 'Environment variables' },
            role: { type: 'string', description: 'IAM role ARN' },
            vpcConfig: { type: 'object', description: 'VPC configuration' },
            layers: { type: 'array', items: { type: 'string' }, description: 'Layer ARNs' }
          },
          required: ['functionName']
        }
      },
      {
        name: 'lambda_invoke_function',
        description: 'Invoke a Lambda function',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: { type: 'string', description: 'Function name or ARN' },
            payload: { type: 'string', description: 'JSON payload' },
            invocationType: { type: 'string', enum: ['RequestResponse', 'Event', 'DryRun'], description: 'Invocation type' },
            logType: { type: 'string', enum: ['None', 'Tail'], description: 'Include execution log' },
            clientContext: { type: 'string', description: 'Client context' }
          },
          required: ['functionName']
        }
      },
      {
        name: 'lambda_delete_function',
        description: 'Delete a Lambda function',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: { type: 'string', description: 'Function name' },
            qualifier: { type: 'string', description: 'Function version/alias' }
          },
          required: ['functionName']
        }
      },
      {
        name: 'lambda_get_function',
        description: 'Get detailed information about a Lambda function',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: { type: 'string', description: 'Function name' },
            qualifier: { type: 'string', description: 'Function version/alias' }
          },
          required: ['functionName']
        }
      },
      {
        name: 'lambda_get_function_config',
        description: 'Get Lambda function configuration',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: { type: 'string', description: 'Function name' },
            qualifier: { type: 'string', description: 'Function version/alias' }
          },
          required: ['functionName']
        }
      },
      {
        name: 'lambda_list_layers',
        description: 'List Lambda layers',
        inputSchema: {
          type: 'object',
          properties: {
            compatibleRuntime: { type: 'string', description: 'Filter by compatible runtime' },
            maxItems: { type: 'number', description: 'Maximum layers to return' }
          },
          required: []
        }
      },
      {
        name: 'lambda_list_versions',
        description: 'List versions of a Lambda function',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: { type: 'string', description: 'Function name' },
            maxItems: { type: 'number', description: 'Maximum versions to return' }
          },
          required: ['functionName']
        }
      },

      // CloudWatch Logs Operations
      {
        name: 'cloudwatch_list_log_groups',
        description: 'List CloudWatch log groups',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupNamePrefix: { type: 'string', description: 'Filter by name prefix' },
            limit: { type: 'number', description: 'Maximum groups to return' },
            nextToken: { type: 'string', description: 'Pagination token' }
          },
          required: []
        }
      },
      {
        name: 'cloudwatch_describe_log_group',
        description: 'Get details about a specific log group',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string', description: 'Log group name' }
          },
          required: ['logGroupName']
        }
      },
      {
        name: 'cloudwatch_list_log_streams',
        description: 'List log streams in a log group',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string', description: 'Log group name' },
            logStreamNamePrefix: { type: 'string', description: 'Filter by stream name prefix' },
            orderBy: { type: 'string', enum: ['LogStreamName', 'LastEventTime'], description: 'Sort order' },
            descending: { type: 'boolean', description: 'Sort descending' },
            limit: { type: 'number', description: 'Maximum streams to return' },
            nextToken: { type: 'string', description: 'Pagination token' }
          },
          required: ['logGroupName']
        }
      },
      {
        name: 'cloudwatch_get_log_events',
        description: 'Get log events from a stream',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string', description: 'Log group name' },
            logStreamName: { type: 'string', description: 'Log stream name' },
            startTime: { type: 'number', description: 'Start time (epoch milliseconds)' },
            endTime: { type: 'number', description: 'End time (epoch milliseconds)' },
            limit: { type: 'number', description: 'Maximum events to return' },
            nextToken: { type: 'string', description: 'Pagination token' },
            startFromHead: { type: 'boolean', description: 'Read from beginning' }
          },
          required: ['logGroupName', 'logStreamName']
        }
      },
      {
        name: 'cloudwatch_filter_log_events',
        description: 'Filter log events with a pattern',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string', description: 'Log group name' },
            logStreamNames: { type: 'array', items: { type: 'string' }, description: 'Specific stream names' },
            startTime: { type: 'number', description: 'Start time (epoch milliseconds)' },
            endTime: { type: 'number', description: 'End time (epoch milliseconds)' },
            filterPattern: { type: 'string', description: 'CloudWatch filter pattern' },
            limit: { type: 'number', description: 'Maximum events to return' },
            nextToken: { type: 'string', description: 'Pagination token' }
          },
          required: ['logGroupName']
        }
      },
      {
        name: 'cloudwatch_query_logs',
        description: 'Run a CloudWatch Logs Insights query',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupNames: { type: 'array', items: { type: 'string' }, description: 'Log groups to query' },
            queryString: { type: 'string', description: 'CloudWatch Insights query' },
            startTime: { type: 'string', description: 'Start time (ISO 8601)' },
            endTime: { type: 'string', description: 'End time (ISO 8601)' },
            limit: { type: 'number', description: 'Maximum results to return' }
          },
          required: ['logGroupNames', 'queryString', 'startTime', 'endTime']
        }
      },
      {
        name: 'cloudwatch_create_log_group',
        description: 'Create a new CloudWatch log group',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string', description: 'Log group name' },
            kmsKeyId: { type: 'string', description: 'KMS key for encryption' },
            tags: { type: 'object', description: 'Tags for the log group' }
          },
          required: ['logGroupName']
        }
      },
      {
        name: 'cloudwatch_delete_log_group',
        description: 'Delete a CloudWatch log group',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string', description: 'Log group name' }
          },
          required: ['logGroupName']
        }
      },
      {
        name: 'cloudwatch_set_retention_policy',
        description: 'Set retention policy for a log group',
        inputSchema: {
          type: 'object',
          properties: {
            logGroupName: { type: 'string', description: 'Log group name' },
            retentionInDays: { type: 'number', description: 'Retention period in days' }
          },
          required: ['logGroupName', 'retentionInDays']
        }
      },

      // IAM Operations
      {
        name: 'iam_list_users',
        description: 'List IAM users',
        inputSchema: {
          type: 'object',
          properties: {
            pathPrefix: { type: 'string', description: 'Filter by path prefix' },
            maxItems: { type: 'number', description: 'Maximum users to return' },
            marker: { type: 'string', description: 'Pagination marker' }
          },
          required: []
        }
      },
      {
        name: 'iam_get_user',
        description: 'Get details about an IAM user',
        inputSchema: {
          type: 'object',
          properties: {
            userName: { type: 'string', description: 'User name (omit for current user)' }
          },
          required: []
        }
      },
      {
        name: 'iam_list_roles',
        description: 'List IAM roles',
        inputSchema: {
          type: 'object',
          properties: {
            pathPrefix: { type: 'string', description: 'Filter by path prefix' },
            maxItems: { type: 'number', description: 'Maximum roles to return' },
            marker: { type: 'string', description: 'Pagination marker' }
          },
          required: []
        }
      },
      {
        name: 'iam_get_role',
        description: 'Get details about an IAM role',
        inputSchema: {
          type: 'object',
          properties: {
            roleName: { type: 'string', description: 'Role name' }
          },
          required: ['roleName']
        }
      },
      {
        name: 'iam_list_policies',
        description: 'List IAM policies',
        inputSchema: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['All', 'AWS', 'Local'], description: 'Policy scope' },
            onlyAttached: { type: 'boolean', description: 'Only attached policies' },
            pathPrefix: { type: 'string', description: 'Filter by path prefix' },
            maxItems: { type: 'number', description: 'Maximum policies to return' },
            marker: { type: 'string', description: 'Pagination marker' }
          },
          required: []
        }
      },
      {
        name: 'iam_get_policy',
        description: 'Get details about an IAM policy',
        inputSchema: {
          type: 'object',
          properties: {
            policyArn: { type: 'string', description: 'Policy ARN' },
            versionId: { type: 'string', description: 'Specific version ID' }
          },
          required: ['policyArn']
        }
      },
      {
        name: 'iam_attach_user_policy',
        description: 'Attach a policy to an IAM user',
        inputSchema: {
          type: 'object',
          properties: {
            userName: { type: 'string', description: 'User name' },
            policyArn: { type: 'string', description: 'Policy ARN' }
          },
          required: ['userName', 'policyArn']
        }
      },
      {
        name: 'iam_detach_user_policy',
        description: 'Detach a policy from an IAM user',
        inputSchema: {
          type: 'object',
          properties: {
            userName: { type: 'string', description: 'User name' },
            policyArn: { type: 'string', description: 'Policy ARN' }
          },
          required: ['userName', 'policyArn']
        }
      },
      {
        name: 'iam_attach_role_policy',
        description: 'Attach a policy to an IAM role',
        inputSchema: {
          type: 'object',
          properties: {
            roleName: { type: 'string', description: 'Role name' },
            policyArn: { type: 'string', description: 'Policy ARN' }
          },
          required: ['roleName', 'policyArn']
        }
      },
      {
        name: 'iam_detach_role_policy',
        description: 'Detach a policy from an IAM role',
        inputSchema: {
          type: 'object',
          properties: {
            roleName: { type: 'string', description: 'Role name' },
            policyArn: { type: 'string', description: 'Policy ARN' }
          },
          required: ['roleName', 'policyArn']
        }
      },
      {
        name: 'iam_create_access_key',
        description: 'Create access key for an IAM user',
        inputSchema: {
          type: 'object',
          properties: {
            userName: { type: 'string', description: 'User name' }
          },
          required: ['userName']
        }
      },
      {
        name: 'iam_list_access_keys',
        description: 'List access keys for an IAM user',
        inputSchema: {
          type: 'object',
          properties: {
            userName: { type: 'string', description: 'User name' },
            maxItems: { type: 'number', description: 'Maximum keys to return' },
            marker: { type: 'string', description: 'Pagination marker' }
          },
          required: ['userName']
        }
      },
      {
        name: 'iam_delete_access_key',
        description: 'Delete an access key for an IAM user',
        inputSchema: {
          type: 'object',
          properties: {
            userName: { type: 'string', description: 'User name' },
            accessKeyId: { type: 'string', description: 'Access key ID' }
          },
          required: ['userName', 'accessKeyId']
        }
      },

      // Cost Explorer Operations
      {
        name: 'cost_get_cost_and_usage',
        description: 'Get cost and usage data',
        inputSchema: {
          type: 'object',
          properties: {
            timePeriod: { type: 'object', description: 'Time period with start and end dates (YYYY-MM-DD)' },
            granularity: { type: 'string', enum: ['DAILY', 'MONTHLY', 'HOURLY'], description: 'Data granularity' },
            metrics: { type: 'array', items: { type: 'string' }, description: 'Metrics to retrieve' },
            groupBy: { type: 'array', description: 'Grouping criteria' },
            filter: { type: 'object', description: 'Cost filter' }
          },
          required: ['timePeriod', 'granularity', 'metrics']
        }
      },
      {
        name: 'cost_get_cost_by_service',
        description: 'Get cost breakdown by AWS service',
        inputSchema: {
          type: 'object',
          properties: {
            timePeriod: { type: 'object', description: 'Time period with start and end dates' },
            granularity: { type: 'string', enum: ['DAILY', 'MONTHLY'], description: 'Data granularity' }
          },
          required: ['timePeriod']
        }
      },
      {
        name: 'cost_get_cost_by_tag',
        description: 'Get cost breakdown by tag',
        inputSchema: {
          type: 'object',
          properties: {
            timePeriod: { type: 'object', description: 'Time period with start and end dates' },
            tagKey: { type: 'string', description: 'Tag key to group by' },
            granularity: { type: 'string', enum: ['DAILY', 'MONTHLY'], description: 'Data granularity' }
          },
          required: ['timePeriod', 'tagKey']
        }
      },
      {
        name: 'cost_get_cost_forecast',
        description: 'Get cost forecast for future period',
        inputSchema: {
          type: 'object',
          properties: {
            timePeriod: { type: 'object', description: 'Future time period' },
            metric: { type: 'string', description: 'Cost metric to forecast' },
            granularity: { type: 'string', enum: ['DAILY', 'MONTHLY'], description: 'Forecast granularity' },
            predictionIntervalLevel: { type: 'number', description: 'Confidence level (80-99)' }
          },
          required: ['timePeriod']
        }
      },
      {
        name: 'cost_get_reservation_utilization',
        description: 'Get reservation utilization data',
        inputSchema: {
          type: 'object',
          properties: {
            timePeriod: { type: 'object', description: 'Time period' },
            granularity: { type: 'string', enum: ['DAILY', 'MONTHLY'], description: 'Data granularity' },
            filter: { type: 'object', description: 'Filter criteria' }
          },
          required: ['timePeriod']
        }
      },
      {
        name: 'cost_get_budgets',
        description: 'List cost budgets',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: { type: 'string', description: 'AWS account ID' },
            maxResults: { type: 'number', description: 'Maximum budgets to return' },
            nextToken: { type: 'string', description: 'Pagination token' }
          },
          required: []
        }
      },
      {
        name: 'cost_create_budget',
        description: 'Create a cost budget',
        inputSchema: {
          type: 'object',
          properties: {
            budgetName: { type: 'string', description: 'Budget name' },
            budgetLimit: { type: 'object', description: 'Budget limit amount and unit' },
            timePeriod: { type: 'object', description: 'Budget time period' },
            budgetType: { type: 'string', description: 'Budget type' },
            costFilters: { type: 'object', description: 'Cost filters' },
            costTypes: { type: 'object', description: 'Cost types to include' },
            notificationsWithSubscribers: { type: 'array', description: 'Notification settings' }
          },
          required: ['budgetName', 'budgetLimit', 'timePeriod']
        }
      }
    ];
  }

  /**
   * Handle tool calls
   */
  private async handleToolCall(name: string, args: any): Promise<ToolResult> {
    switch (name) {
      // Credential Management
      case 'aws_get_caller_identity':
        return this.credentialTools.getCallerIdentity();
      case 'aws_list_profiles':
        return this.credentialTools.listProfiles();
      case 'aws_assume_role':
        return this.credentialTools.assumeRole(args);
      case 'aws_get_session_token':
        return this.credentialTools.getSessionToken(args);
      case 'aws_validate_credentials':
        return this.credentialTools.validateCredentials();
      case 'aws_get_region':
        return this.credentialTools.getRegion();
      case 'aws_clear_credential_cache':
        return this.credentialTools.clearCredentialCache();

      // S3 Operations
      case 's3_list_buckets':
        return this.s3Tools.listBuckets();
      case 's3_create_bucket':
        return this.s3Tools.createBucket(args);
      case 's3_delete_bucket':
        return this.s3Tools.deleteBucket(args);
      case 's3_list_objects':
        return this.s3Tools.listObjects(args);
      case 's3_upload_object':
        return this.s3Tools.uploadObject(args);
      case 's3_download_object':
        return this.s3Tools.downloadObject(args);
      case 's3_delete_object':
        return this.s3Tools.deleteObject(args);
      case 's3_get_object_url':
        return this.s3Tools.getObjectUrl(args);
      case 's3_copy_object':
        return this.s3Tools.copyObject(args);
      case 's3_get_object_metadata':
        return this.s3Tools.getObjectMetadata(args);

      // EC2 Operations
      case 'ec2_list_instances':
        return this.ec2Tools.listInstances(args);
      case 'ec2_create_instance':
        return this.ec2Tools.createInstance(args);
      case 'ec2_start_instance':
        return this.ec2Tools.startInstances(args);
      case 'ec2_stop_instance':
        return this.ec2Tools.stopInstances(args);
      case 'ec2_terminate_instance':
        return this.ec2Tools.terminateInstances(args);
      case 'ec2_describe_instance':
        return this.ec2Tools.describeInstance(args);
      case 'ec2_get_instance_status':
        return this.ec2Tools.getInstanceStatus(args);
      case 'ec2_list_security_groups':
        return this.ec2Tools.listSecurityGroups(args);
      case 'ec2_list_key_pairs':
        return this.ec2Tools.listKeyPairs();
      case 'ec2_list_images':
        return this.ec2Tools.listImages(args);

      // Lambda Operations
      case 'lambda_list_functions':
        return this.lambdaTools.listFunctions(args);
      case 'lambda_create_function':
        return this.lambdaTools.createFunction(args);
      case 'lambda_update_function_code':
        return this.lambdaTools.updateFunctionCode(args);
      case 'lambda_update_function_config':
        return this.lambdaTools.updateFunctionConfig(args);
      case 'lambda_invoke_function':
        return this.lambdaTools.invokeFunction(args);
      case 'lambda_delete_function':
        return this.lambdaTools.deleteFunction(args);
      case 'lambda_get_function':
        return this.lambdaTools.getFunction(args);
      case 'lambda_get_function_config':
        return this.lambdaTools.getFunctionConfig(args);
      case 'lambda_list_layers':
        return this.lambdaTools.listLayers(args);
      case 'lambda_list_versions':
        return this.lambdaTools.listVersions(args);

      // CloudWatch Logs Operations
      case 'cloudwatch_list_log_groups':
        return this.cloudwatchTools.listLogGroups(args);
      case 'cloudwatch_describe_log_group':
        return this.cloudwatchTools.describeLogGroup(args);
      case 'cloudwatch_list_log_streams':
        return this.cloudwatchTools.listLogStreams(args);
      case 'cloudwatch_get_log_events':
        return this.cloudwatchTools.getLogEvents(args);
      case 'cloudwatch_filter_log_events':
        return this.cloudwatchTools.filterLogEvents(args);
      case 'cloudwatch_query_logs':
        return this.cloudwatchTools.queryLogs(args);
      case 'cloudwatch_create_log_group':
        return this.cloudwatchTools.createLogGroup(args);
      case 'cloudwatch_delete_log_group':
        return this.cloudwatchTools.deleteLogGroup(args);
      case 'cloudwatch_set_retention_policy':
        return this.cloudwatchTools.setRetentionPolicy(args);

      // IAM Operations
      case 'iam_list_users':
        return this.iamTools.listUsers(args);
      case 'iam_get_user':
        return this.iamTools.getUser(args);
      case 'iam_list_roles':
        return this.iamTools.listRoles(args);
      case 'iam_get_role':
        return this.iamTools.getRole(args);
      case 'iam_list_policies':
        return this.iamTools.listPolicies(args);
      case 'iam_get_policy':
        return this.iamTools.getPolicy(args);
      case 'iam_attach_user_policy':
        return this.iamTools.attachUserPolicy(args);
      case 'iam_detach_user_policy':
        return this.iamTools.detachUserPolicy(args);
      case 'iam_attach_role_policy':
        return this.iamTools.attachRolePolicy(args);
      case 'iam_detach_role_policy':
        return this.iamTools.detachRolePolicy(args);
      case 'iam_create_access_key':
        return this.iamTools.createAccessKey(args);
      case 'iam_list_access_keys':
        return this.iamTools.listAccessKeys(args);
      case 'iam_delete_access_key':
        return this.iamTools.deleteAccessKey(args);

      // Cost Explorer Operations
      case 'cost_get_cost_and_usage':
        return this.costTools.getCostAndUsage(args);
      case 'cost_get_cost_by_service':
        return this.costTools.getCostByService(args);
      case 'cost_get_cost_by_tag':
        return this.costTools.getCostByTag(args);
      case 'cost_get_cost_forecast':
        return this.costTools.getCostForecast(args);
      case 'cost_get_reservation_utilization':
        return this.costTools.getReservationUtilization(args);
      case 'cost_get_budgets':
        return this.costTools.getBudgets(args);
      case 'cost_create_budget':
        return this.costTools.createBudget(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * Handle errors and convert to tool result
   */
  private handleError(error: unknown): ToolResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof AWSSkillError ? error.code : 'UNKNOWN_ERROR';

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: errorMessage,
          code: errorCode,
          timestamp: new Date().toISOString()
        }, null, 2)
      }],
      isError: true
    };
  }

  /**
   * Start the server with stdio transport
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log to stderr so it doesn't interfere with MCP protocol
    console.error('AWS MCP Server running on stdio');
  }
}

// Run server if executed directly
if (require.main === module) {
  const server = new AWSSkillServer();
  server.initialize().then(() => {
    server.run();
  }).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
