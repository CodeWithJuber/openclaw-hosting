/**
 * Type definitions for AWS MCP Skill
 */

// AWS Configuration
export interface AWSConfig {
  region: string;
  profile?: string;
  credentials?: AWSCredentials;
  endpoint?: string;
  maxRetries?: number;
  requestTimeout?: number;
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

// MCP Tool Definitions
export interface Tool {
  name: string;
  description: string;
  inputSchema: object;
}

export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    mimeType?: string;
    data?: string;
    resource?: {
      uri: string;
      mimeType?: string;
      text?: string;
      blob?: string;
    };
  }>;
  isError?: boolean;
}

// S3 Types
export interface S3Bucket {
  name: string;
  creationDate?: Date;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified?: Date;
  etag?: string;
  storageClass?: string;
}

export interface S3UploadOptions {
  bucket: string;
  key: string;
  filePath?: string;
  content?: string | Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  encryption?: string;
}

// EC2 Types
export interface EC2Instance {
  instanceId: string;
  instanceType: string;
  state: string;
  stateCode: number;
  launchTime?: Date;
  publicIpAddress?: string;
  privateIpAddress?: string;
  tags?: Record<string, string>;
  vpcId?: string;
  subnetId?: string;
  securityGroups?: Array<{ groupId: string; groupName: string }>;
  keyName?: string;
  platform?: string;
  architecture?: string;
}

export interface EC2CreateInstanceOptions {
  imageId: string;
  instanceType: string;
  keyName?: string;
  securityGroupIds?: string[];
  subnetId?: string;
  userData?: string;
  tags?: Record<string, string>;
  minCount?: number;
  maxCount?: number;
  iamInstanceProfile?: string;
}

// Lambda Types
export interface LambdaFunction {
  functionName: string;
  functionArn: string;
  runtime?: string;
  handler?: string;
  codeSize?: number;
  description?: string;
  timeout?: number;
  memorySize?: number;
  lastModified?: string;
  environment?: Record<string, string>;
  vpcConfig?: {
    subnetIds: string[];
    securityGroupIds: string[];
    vpcId: string;
  };
}

export interface LambdaCreateOptions {
  functionName: string;
  runtime: string;
  role: string;
  handler: string;
  code: {
    zipFile?: string;
    s3Bucket?: string;
    s3Key?: string;
    s3ObjectVersion?: string;
  };
  description?: string;
  timeout?: number;
  memorySize?: number;
  environment?: Record<string, string>;
  vpcConfig?: {
    subnetIds: string[];
    securityGroupIds: string[];
  };
  layers?: string[];
}

export interface LambdaInvokeOptions {
  functionName: string;
  payload?: string;
  invocationType?: 'RequestResponse' | 'Event' | 'DryRun';
  logType?: 'None' | 'Tail';
  clientContext?: string;
}

// CloudWatch Types
export interface LogGroup {
  logGroupName: string;
  creationTime?: number;
  retentionInDays?: number;
  metricFilterCount?: number;
  arn?: string;
  storedBytes?: number;
}

export interface LogEvent {
  timestamp?: number;
  message?: string;
  ingestionTime?: number;
}

export interface CloudWatchQueryOptions {
  logGroupNames: string[];
  queryString: string;
  startTime: string;
  endTime: string;
  limit?: number;
}

// IAM Types
export interface IAMUser {
  userName: string;
  userId: string;
  arn: string;
  createDate: Date;
  path?: string;
  permissionsBoundary?: string;
  tags?: Record<string, string>;
}

export interface IAMRole {
  roleName: string;
  roleId: string;
  arn: string;
  createDate: Date;
  assumeRolePolicyDocument?: string;
  description?: string;
  maxSessionDuration?: number;
  tags?: Record<string, string>;
}

export interface IAMPolicy {
  policyName: string;
  policyId: string;
  arn: string;
  createDate: Date;
  updateDate?: Date;
  description?: string;
  attachmentCount?: number;
  isAttachable?: boolean;
}

// Cost Explorer Types
export interface CostTimePeriod {
  start: string;
  end: string;
}

export interface CostAndUsageOptions {
  timePeriod: CostTimePeriod;
  granularity: 'DAILY' | 'MONTHLY' | 'HOURLY';
  metrics: string[];
  groupBy?: Array<{ type: string; key: string }>;
  filter?: object;
}

export interface Budget {
  budgetName: string;
  budgetLimit: {
    amount: string;
    unit: string;
  };
  timePeriod: {
    start?: Date;
    end?: Date;
  };
  budgetType: string;
  calculatedSpend?: {
    actualSpend: {
      amount: string;
      unit: string;
    };
    forecastedSpend?: {
      amount: string;
      unit: string;
    };
  };
}

// Credential Types
export interface AWSProfile {
  name: string;
  region?: string;
  output?: string;
}

export interface AssumeRoleOptions {
  roleArn: string;
  roleSessionName: string;
  durationSeconds?: number;
  externalId?: string;
  serialNumber?: string;
  tokenCode?: string;
}

export interface SessionCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

// Server Configuration
export interface ServerConfig {
  name?: string;
  version?: string;
  aws?: AWSConfig;
}
