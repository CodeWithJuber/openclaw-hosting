/**
 * IAM Tool Handlers
 */

import {
  IAMClient,
  ListUsersCommand,
  GetUserCommand,
  ListRolesCommand,
  GetRoleCommand,
  ListPoliciesCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  AttachUserPolicyCommand,
  DetachUserPolicyCommand,
  AttachRolePolicyCommand,
  DetachRolePolicyCommand,
  ListAttachedUserPoliciesCommand,
  ListAttachedRolePoliciesCommand,
  CreateAccessKeyCommand,
  ListAccessKeysCommand,
  DeleteAccessKeyCommand,
  GetUserPolicyCommand,
  ListUserPoliciesCommand,
  ListRolePoliciesCommand
} from '@aws-sdk/client-iam';
import { AWSConfig, ToolResult, IAMUser, IAMRole, IAMPolicy } from '../types';
import { CredentialManager } from '../credentials/manager';
import { convertAwsError } from '../errors';

export class IAMTools {
  private client: IAMClient;
  private credentialManager: CredentialManager;

  constructor(config: AWSConfig, credentialManager: CredentialManager) {
    this.credentialManager = credentialManager;
    this.client = new IAMClient({
      region: config.region,
      credentials: async () => this.credentialManager.getCredentialProvider()
    });
  }

  /**
   * List IAM users
   */
  async listUsers(args: {
    pathPrefix?: string;
    maxItems?: number;
    marker?: string;
  } = {}): Promise<ToolResult> {
    try {
      const command = new ListUsersCommand({
        PathPrefix: args.pathPrefix,
        MaxItems: args.maxItems,
        Marker: args.marker
      });

      const response = await this.client.send(command);

      const users: IAMUser[] = (response.Users || []).map(user => ({
        userName: user.UserName || '',
        userId: user.UserId || '',
        arn: user.Arn || '',
        createDate: user.CreateDate || new Date(),
        path: user.Path,
        permissionsBoundary: user.PermissionsBoundary?.PermissionsBoundaryArn,
        tags: this.parseTags(user.Tags)
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            users,
            isTruncated: response.IsTruncated,
            marker: response.Marker
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get user details
   */
  async getUser(args: {
    userName?: string;
  } = {}): Promise<ToolResult> {
    try {
      const command = new GetUserCommand({
        UserName: args.userName
      });

      const response = await this.client.send(command);
      const user = response.User;

      if (!user) {
        throw new Error('User not found');
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            userName: user.UserName,
            userId: user.UserId,
            arn: user.Arn,
            createDate: user.CreateDate,
            path: user.Path,
            permissionsBoundary: user.PermissionsBoundary?.PermissionsBoundaryArn,
            passwordLastUsed: user.PasswordLastUsed,
            tags: this.parseTags(user.Tags)
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List IAM roles
   */
  async listRoles(args: {
    pathPrefix?: string;
    maxItems?: number;
    marker?: string;
  } = {}): Promise<ToolResult> {
    try {
      const command = new ListRolesCommand({
        PathPrefix: args.pathPrefix,
        MaxItems: args.maxItems,
        Marker: args.marker
      });

      const response = await this.client.send(command);

      const roles: IAMRole[] = (response.Roles || []).map(role => ({
        roleName: role.RoleName || '',
        roleId: role.RoleId || '',
        arn: role.Arn || '',
        createDate: role.CreateDate || new Date(),
        assumeRolePolicyDocument: role.AssumeRolePolicyDocument ? 
          Buffer.from(role.AssumeRolePolicyDocument, 'base64').toString('utf-8') : undefined,
        description: role.Description,
        maxSessionDuration: role.MaxSessionDuration,
        tags: this.parseTags(role.Tags)
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            roles,
            isTruncated: response.IsTruncated,
            marker: response.Marker
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get role details
   */
  async getRole(args: {
    roleName: string;
  }): Promise<ToolResult> {
    try {
      const command = new GetRoleCommand({
        RoleName: args.roleName
      });

      const response = await this.client.send(command);
      const role = response.Role;

      if (!role) {
        throw new Error(`Role '${args.roleName}' not found`);
      }

      // Get attached policies
      const attachedPolicies = await this.getAttachedRolePolicies(args.roleName);
      
      // Get inline policies
      const inlinePolicies = await this.getInlineRolePolicies(args.roleName);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            roleName: role.RoleName,
            roleId: role.RoleId,
            arn: role.Arn,
            createDate: role.CreateDate,
            assumeRolePolicyDocument: role.AssumeRolePolicyDocument ? 
              JSON.parse(Buffer.from(role.AssumeRolePolicyDocument, 'base64').toString('utf-8')) : undefined,
            description: role.Description,
            maxSessionDuration: role.MaxSessionDuration,
            tags: this.parseTags(role.Tags),
            attachedPolicies,
            inlinePolicies
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List IAM policies
   */
  async listPolicies(args: {
    scope?: 'All' | 'AWS' | 'Local';
    onlyAttached?: boolean;
    pathPrefix?: string;
    maxItems?: number;
    marker?: string;
  } = {}): Promise<ToolResult> {
    try {
      const command = new ListPoliciesCommand({
        Scope: args.scope,
        OnlyAttached: args.onlyAttached,
        PathPrefix: args.pathPrefix,
        MaxItems: args.maxItems,
        Marker: args.marker
      });

      const response = await this.client.send(command);

      const policies: IAMPolicy[] = (response.Policies || []).map(policy => ({
        policyName: policy.PolicyName || '',
        policyId: policy.PolicyId || '',
        arn: policy.Arn || '',
        createDate: policy.CreateDate || new Date(),
        updateDate: policy.UpdateDate,
        description: policy.Description,
        attachmentCount: policy.AttachmentCount,
        isAttachable: policy.IsAttachable
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            policies,
            isTruncated: response.IsTruncated,
            marker: response.Marker
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get policy details
   */
  async getPolicy(args: {
    policyArn: string;
    versionId?: string;
  }): Promise<ToolResult> {
    try {
      // Get policy metadata
      const policyCommand = new GetPolicyCommand({
        PolicyArn: args.policyArn
      });

      const policyResponse = await this.client.send(policyCommand);
      const policy = policyResponse.Policy;

      if (!policy) {
        throw new Error(`Policy '${args.policyArn}' not found`);
      }

      // Get policy document
      const versionCommand = new GetPolicyVersionCommand({
        PolicyArn: args.policyArn,
        VersionId: args.versionId || policy.DefaultVersionId
      });

      const versionResponse = await this.client.send(versionCommand);
      const document = versionResponse.PolicyVersion?.Document ?
        JSON.parse(Buffer.from(versionResponse.PolicyVersion.Document, 'base64').toString('utf-8')) : undefined;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            policyName: policy.PolicyName,
            policyId: policy.PolicyId,
            arn: policy.Arn,
            createDate: policy.CreateDate,
            updateDate: policy.UpdateDate,
            description: policy.Description,
            attachmentCount: policy.AttachmentCount,
            isAttachable: policy.IsAttachable,
            defaultVersionId: policy.DefaultVersionId,
            path: policy.Path,
            permissionsBoundaryUsageCount: policy.PermissionsBoundaryUsageCount,
            tags: this.parseTags(policy.Tags),
            document
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Attach policy to user
   */
  async attachUserPolicy(args: {
    userName: string;
    policyArn: string;
  }): Promise<ToolResult> {
    try {
      const command = new AttachUserPolicyCommand({
        UserName: args.userName,
        PolicyArn: args.policyArn
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Policy '${args.policyArn}' attached to user '${args.userName}'`,
            userName: args.userName,
            policyArn: args.policyArn
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Detach policy from user
   */
  async detachUserPolicy(args: {
    userName: string;
    policyArn: string;
  }): Promise<ToolResult> {
    try {
      const command = new DetachUserPolicyCommand({
        UserName: args.userName,
        PolicyArn: args.policyArn
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Policy '${args.policyArn}' detached from user '${args.userName}'`,
            userName: args.userName,
            policyArn: args.policyArn
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Attach policy to role
   */
  async attachRolePolicy(args: {
    roleName: string;
    policyArn: string;
  }): Promise<ToolResult> {
    try {
      const command = new AttachRolePolicyCommand({
        RoleName: args.roleName,
        PolicyArn: args.policyArn
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Policy '${args.policyArn}' attached to role '${args.roleName}'`,
            roleName: args.roleName,
            policyArn: args.policyArn
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Detach policy from role
   */
  async detachRolePolicy(args: {
    roleName: string;
    policyArn: string;
  }): Promise<ToolResult> {
    try {
      const command = new DetachRolePolicyCommand({
        RoleName: args.roleName,
        PolicyArn: args.policyArn
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Policy '${args.policyArn}' detached from role '${args.roleName}'`,
            roleName: args.roleName,
            policyArn: args.policyArn
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Create access key for user
   */
  async createAccessKey(args: {
    userName: string;
  }): Promise<ToolResult> {
    try {
      const command = new CreateAccessKeyCommand({
        UserName: args.userName
      });

      const response = await this.client.send(command);
      const accessKey = response.AccessKey;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Access key created for user '${args.userName}'`,
            userName: accessKey?.UserName,
            accessKeyId: accessKey?.AccessKeyId,
            secretAccessKey: accessKey?.SecretAccessKey,
            status: accessKey?.Status,
            createDate: accessKey?.CreateDate
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List access keys for user
   */
  async listAccessKeys(args: {
    userName: string;
    maxItems?: number;
    marker?: string;
  }): Promise<ToolResult> {
    try {
      const command = new ListAccessKeysCommand({
        UserName: args.userName,
        MaxItems: args.maxItems,
        Marker: args.marker
      });

      const response = await this.client.send(command);

      const accessKeys = (response.AccessKeyMetadata || []).map(key => ({
        userName: key.UserName,
        accessKeyId: key.AccessKeyId,
        status: key.Status,
        createDate: key.CreateDate
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            accessKeys,
            isTruncated: response.IsTruncated,
            marker: response.Marker
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Delete access key
   */
  async deleteAccessKey(args: {
    userName: string;
    accessKeyId: string;
  }): Promise<ToolResult> {
    try {
      const command = new DeleteAccessKeyCommand({
        UserName: args.userName,
        AccessKeyId: args.accessKeyId
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Access key '${args.accessKeyId}' deleted for user '${args.userName}'`,
            userName: args.userName,
            accessKeyId: args.accessKeyId
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get attached policies for a role
   */
  private async getAttachedRolePolicies(roleName: string): Promise<any[]> {
    const command = new ListAttachedRolePoliciesCommand({
      RoleName: roleName
    });

    const response = await this.client.send(command);
    return (response.AttachedPolicies || []).map(policy => ({
      policyName: policy.PolicyName,
      policyArn: policy.PolicyArn
    }));
  }

  /**
   * Get inline policies for a role
   */
  private async getInlineRolePolicies(roleName: string): Promise<string[]> {
    const command = new ListRolePoliciesCommand({
      RoleName: roleName
    });

    const response = await this.client.send(command);
    return response.PolicyNames || [];
  }

  /**
   * Parse AWS tags to record
   */
  private parseTags(tags?: Array<{ Key?: string; Value?: string }>): Record<string, string> {
    if (!tags) return {};
    return tags.reduce((acc, tag) => {
      if (tag.Key) {
        acc[tag.Key] = tag.Value || '';
      }
      return acc;
    }, {} as Record<string, string>);
  }
}
