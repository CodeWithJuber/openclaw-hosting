/**
 * Credential Tool Handlers
 */

import { AWSConfig, ToolResult, AssumeRoleOptions } from '../types';
import { CredentialManager } from '../credentials/manager';
import { convertAwsError } from '../errors';

export class CredentialTools {
  private credentialManager: CredentialManager;

  constructor(config: AWSConfig, credentialManager: CredentialManager) {
    this.credentialManager = credentialManager;
  }

  /**
   * Get current AWS caller identity
   */
  async getCallerIdentity(): Promise<ToolResult> {
    try {
      const identity = await this.credentialManager.getCallerIdentity();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            account: identity.account,
            arn: identity.arn,
            userId: identity.userId
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List configured AWS profiles
   */
  async listProfiles(): Promise<ToolResult> {
    try {
      const profiles = await this.credentialManager.listProfiles();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ profiles }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Assume an IAM role
   */
  async assumeRole(args: AssumeRoleOptions): Promise<ToolResult> {
    try {
      const credentials = await this.credentialManager.assumeRole(args);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Successfully assumed role '${args.roleArn}'`,
            roleArn: args.roleArn,
            roleSessionName: args.roleSessionName,
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
            expiration: credentials.expiration.toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get session token (for MFA)
   */
  async getSessionToken(args: {
    durationSeconds?: number;
  } = {}): Promise<ToolResult> {
    try {
      const credentials = await this.credentialManager.getSessionToken(args.durationSeconds);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'Session token obtained successfully',
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
            expiration: credentials.expiration.toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get current region
   */
  async getRegion(): Promise<ToolResult> {
    try {
      const region = process.env.AWS_REGION || 
                     process.env.AWS_DEFAULT_REGION || 
                     'us-east-1';

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ region }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Validate current credentials
   */
  async validateCredentials(): Promise<ToolResult> {
    try {
      const identity = await this.credentialManager.getCallerIdentity();
      const region = process.env.AWS_REGION || 
                     process.env.AWS_DEFAULT_REGION || 
                     'us-east-1';

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: true,
            account: identity.account,
            identity: identity.arn,
            region: region,
            message: 'Credentials are valid'
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Credentials are invalid or missing'
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  /**
   * Clear credential cache
   */
  async clearCredentialCache(): Promise<ToolResult> {
    try {
      this.credentialManager.clearCache();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: 'Credential cache cleared successfully'
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }
}
