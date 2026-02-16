/**
 * Lambda Tool Handlers
 */

import {
  LambdaClient,
  ListFunctionsCommand,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  InvokeCommand,
  DeleteFunctionCommand,
  GetFunctionCommand,
  ListLayersCommand,
  GetFunctionConfigurationCommand,
  ListVersionsByFunctionCommand
} from '@aws-sdk/client-lambda';
import { readFileSync } from 'fs';
import { AWSConfig, ToolResult, LambdaFunction, LambdaCreateOptions, LambdaInvokeOptions } from '../types';
import { CredentialManager } from '../credentials/manager';
import { convertAwsError } from '../errors';

export class LambdaTools {
  private client: LambdaClient;
  private credentialManager: CredentialManager;

  constructor(config: AWSConfig, credentialManager: CredentialManager) {
    this.credentialManager = credentialManager;
    this.client = new LambdaClient({
      region: config.region,
      credentials: async () => this.credentialManager.getCredentialProvider()
    });
  }

  /**
   * List Lambda functions
   */
  async listFunctions(args: {
    maxItems?: number;
    functionVersion?: 'ALL';
  } = {}): Promise<ToolResult> {
    try {
      const command = new ListFunctionsCommand({
        MaxItems: args.maxItems,
        FunctionVersion: args.functionVersion
      });

      const response = await this.client.send(command);

      const functions: LambdaFunction[] = (response.Functions || []).map(fn => ({
        functionName: fn.FunctionName || '',
        functionArn: fn.FunctionArn || '',
        runtime: fn.Runtime,
        handler: fn.Handler,
        codeSize: fn.CodeSize,
        description: fn.Description,
        timeout: fn.Timeout,
        memorySize: fn.MemorySize,
        lastModified: fn.LastModified,
        environment: fn.Environment?.Variables,
        vpcConfig: fn.VpcConfig ? {
          subnetIds: fn.VpcConfig.SubnetIds || [],
          securityGroupIds: fn.VpcConfig.SecurityGroupIds || [],
          vpcId: fn.VpcConfig.VpcId || ''
        } : undefined
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            functions,
            nextMarker: response.NextMarker
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Create a new Lambda function
   */
  async createFunction(args: LambdaCreateOptions): Promise<ToolResult> {
    try {
      let code: any = {};

      if (args.code.zipFile) {
        const zipBuffer = readFileSync(args.code.zipFile);
        code.ZipFile = zipBuffer;
      } else if (args.code.s3Bucket && args.code.s3Key) {
        code.S3Bucket = args.code.s3Bucket;
        code.S3Key = args.code.s3Key;
        if (args.code.s3ObjectVersion) {
          code.S3ObjectVersion = args.code.s3ObjectVersion;
        }
      }

      const command = new CreateFunctionCommand({
        FunctionName: args.functionName,
        Runtime: args.runtime,
        Role: args.role,
        Handler: args.handler,
        Code: code,
        Description: args.description,
        Timeout: args.timeout,
        MemorySize: args.memorySize,
        Environment: args.environment ? {
          Variables: args.environment
        } : undefined,
        VpcConfig: args.vpcConfig ? {
          SubnetIds: args.vpcConfig.subnetIds,
          SecurityGroupIds: args.vpcConfig.securityGroupIds
        } : undefined,
        Layers: args.layers
      });

      const response = await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Function '${args.functionName}' created successfully`,
            functionName: response.FunctionName,
            functionArn: response.FunctionArn,
            runtime: response.Runtime,
            handler: response.Handler,
            timeout: response.Timeout,
            memorySize: response.MemorySize,
            state: response.State,
            lastModified: response.LastModified
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Update Lambda function code
   */
  async updateFunctionCode(args: {
    functionName: string;
    zipFile?: string;
    s3Bucket?: string;
    s3Key?: string;
    s3ObjectVersion?: string;
    imageUri?: string;
    publish?: boolean;
  }): Promise<ToolResult> {
    try {
      let code: any = {};

      if (args.zipFile) {
        code.ZipFile = readFileSync(args.zipFile);
      } else if (args.s3Bucket && args.s3Key) {
        code.S3Bucket = args.s3Bucket;
        code.S3Key = args.s3Key;
        if (args.s3ObjectVersion) {
          code.S3ObjectVersion = args.s3ObjectVersion;
        }
      } else if (args.imageUri) {
        code.ImageUri = args.imageUri;
      }

      const command = new UpdateFunctionCodeCommand({
        FunctionName: args.functionName,
        ...code,
        Publish: args.publish
      });

      const response = await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Function '${args.functionName}' code updated successfully`,
            functionName: response.FunctionName,
            functionArn: response.FunctionArn,
            codeSize: response.CodeSize,
            version: response.Version,
            lastModified: response.LastModified,
            state: response.State
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Update Lambda function configuration
   */
  async updateFunctionConfig(args: {
    functionName: string;
    description?: string;
    handler?: string;
    timeout?: number;
    memorySize?: number;
    runtime?: string;
    environment?: Record<string, string>;
    role?: string;
    vpcConfig?: {
      subnetIds: string[];
      securityGroupIds: string[];
    };
    layers?: string[];
  }): Promise<ToolResult> {
    try {
      const command = new UpdateFunctionConfigurationCommand({
        FunctionName: args.functionName,
        Description: args.description,
        Handler: args.handler,
        Timeout: args.timeout,
        MemorySize: args.memorySize,
        Runtime: args.runtime,
        Role: args.role,
        Environment: args.environment ? {
          Variables: args.environment
        } : undefined,
        VpcConfig: args.vpcConfig ? {
          SubnetIds: args.vpcConfig.subnetIds,
          SecurityGroupIds: args.vpcConfig.securityGroupIds
        } : undefined,
        Layers: args.layers
      });

      const response = await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Function '${args.functionName}' configuration updated successfully`,
            functionName: response.FunctionName,
            functionArn: response.FunctionArn,
            runtime: response.Runtime,
            handler: response.Handler,
            timeout: response.Timeout,
            memorySize: response.MemorySize,
            state: response.State,
            lastModified: response.LastModified
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Invoke a Lambda function
   */
  async invokeFunction(args: LambdaInvokeOptions): Promise<ToolResult> {
    try {
      const command = new InvokeCommand({
        FunctionName: args.functionName,
        Payload: args.payload ? Buffer.from(args.payload) : undefined,
        InvocationType: args.invocationType,
        LogType: args.logType,
        ClientContext: args.clientContext ? 
          Buffer.from(args.clientContext).toString('base64') : undefined
      });

      const response = await this.client.send(command);

      const payload = response.Payload ? 
        Buffer.from(response.Payload).toString('utf-8') : undefined;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            functionName: args.functionName,
            statusCode: response.StatusCode,
            executedVersion: response.ExecutedVersion,
            logResult: response.LogResult ? 
              Buffer.from(response.LogResult, 'base64').toString('utf-8') : undefined,
            payload: payload ? JSON.parse(payload) : undefined,
            functionError: response.FunctionError
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Delete a Lambda function
   */
  async deleteFunction(args: {
    functionName: string;
    qualifier?: string;
  }): Promise<ToolResult> {
    try {
      const command = new DeleteFunctionCommand({
        FunctionName: args.functionName,
        Qualifier: args.qualifier
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Function '${args.functionName}' deleted successfully`,
            functionName: args.functionName
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get function details
   */
  async getFunction(args: {
    functionName: string;
    qualifier?: string;
  }): Promise<ToolResult> {
    try {
      const command = new GetFunctionCommand({
        FunctionName: args.functionName,
        Qualifier: args.qualifier
      });

      const response = await this.client.send(command);

      const config = response.Configuration;
      const code = response.Code;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            functionName: config?.FunctionName,
            functionArn: config?.FunctionArn,
            runtime: config?.Runtime,
            handler: config?.Handler,
            codeSize: config?.CodeSize,
            description: config?.Description,
            timeout: config?.Timeout,
            memorySize: config?.MemorySize,
            lastModified: config?.LastModified,
            state: config?.State,
            stateReason: config?.StateReason,
            stateReasonCode: config?.StateReasonCode,
            version: config?.Version,
            environment: config?.Environment?.Variables,
            vpcConfig: config?.VpcConfig ? {
              subnetIds: config.VpcConfig.SubnetIds,
              securityGroupIds: config.VpcConfig.SecurityGroupIds,
              vpcId: config.VpcConfig.VpcId
            } : undefined,
            layers: config?.Layers?.map(layer => ({
              arn: layer.Arn,
              codeSize: layer.CodeSize,
              signingProfileVersionArn: layer.SigningProfileVersionArn,
              signingJobArn: layer.SigningJobArn
            })),
            codeLocation: code?.Location,
            repositoryType: code?.RepositoryType,
            tracingConfig: config?.TracingConfig?.Mode,
            revisionId: config?.RevisionId,
            packageType: config?.PackageType,
            architectures: config?.Architectures,
            ephemeralStorage: config?.EphemeralStorage?.Size,
            snapStart: config?.SnapStart?.ApplyOn
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get function configuration
   */
  async getFunctionConfig(args: {
    functionName: string;
    qualifier?: string;
  }): Promise<ToolResult> {
    try {
      const command = new GetFunctionConfigurationCommand({
        FunctionName: args.functionName,
        Qualifier: args.qualifier
      });

      const response = await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            functionName: response.FunctionName,
            functionArn: response.FunctionArn,
            runtime: response.Runtime,
            role: response.Role,
            handler: response.Handler,
            codeSize: response.CodeSize,
            description: response.Description,
            timeout: response.Timeout,
            memorySize: response.MemorySize,
            lastModified: response.LastModified,
            state: response.State,
            environment: response.Environment?.Variables,
            vpcConfig: response.VpcConfig,
            layers: response.Layers,
            tracingConfig: response.TracingConfig,
            revisionId: response.RevisionId,
            packageType: response.PackageType,
            architectures: response.Architectures,
            ephemeralStorage: response.EphemeralStorage,
            snapStart: response.SnapStart
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List Lambda layers
   */
  async listLayers(args: {
    compatibleRuntime?: string;
    maxItems?: number;
  } = {}): Promise<ToolResult> {
    try {
      const command = new ListLayersCommand({
        CompatibleRuntime: args.compatibleRuntime,
        MaxItems: args.maxItems
      });

      const response = await this.client.send(command);

      const layers = (response.Layers || []).map(layer => ({
        layerName: layer.LayerName,
        layerArn: layer.LayerArn,
        latestMatchingVersion: layer.LatestMatchingVersion ? {
          layerVersionArn: layer.LatestMatchingVersion.LayerVersionArn,
          version: layer.LatestMatchingVersion.Version,
          description: layer.LatestMatchingVersion.Description,
          createdDate: layer.LatestMatchingVersion.CreatedDate,
          compatibleRuntimes: layer.LatestMatchingVersion.CompatibleRuntimes,
          licenseInfo: layer.LatestMatchingVersion.LicenseInfo
        } : undefined
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            layers,
            nextMarker: response.NextMarker
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List function versions
   */
  async listVersions(args: {
    functionName: string;
    maxItems?: number;
  }): Promise<ToolResult> {
    try {
      const command = new ListVersionsByFunctionCommand({
        FunctionName: args.functionName,
        MaxItems: args.maxItems
      });

      const response = await this.client.send(command);

      const versions = (response.Versions || []).map(fn => ({
        functionName: fn.FunctionName,
        functionArn: fn.FunctionArn,
        runtime: fn.Runtime,
        handler: fn.Handler,
        codeSize: fn.CodeSize,
        description: fn.Description,
        timeout: fn.Timeout,
        memorySize: fn.MemorySize,
        lastModified: fn.LastModified,
        version: fn.Version,
        environment: fn.Environment?.Variables
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            versions,
            nextMarker: response.NextMarker
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }
}
