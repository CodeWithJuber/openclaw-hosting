/**
 * AWS Credential Manager
 * Handles AWS credential loading from various sources
 */

import { 
  STSClient, 
  GetCallerIdentityCommand,
  AssumeRoleCommand,
  GetSessionTokenCommand 
} from '@aws-sdk/client-sts';
import { 
  fromEnv, 
  fromIni, 
  fromInstanceMetadata,
  fromContainerMetadata 
} from '@aws-sdk/credential-providers';
import { 
  AWSConfig, 
  AWSCredentials, 
  AWSProfile, 
  AssumeRoleOptions, 
  SessionCredentials 
} from '../types';
import { AWSCredentialsError, convertAwsError } from '../errors';

export class CredentialManager {
  private config: AWSConfig;
  private stsClient?: STSClient;
  private cachedCredentials?: AWSCredentials;
  private credentialsExpiration?: Date;

  constructor(config: AWSConfig) {
    this.config = config;
  }

  /**
   * Initialize the credential manager
   */
  async initialize(): Promise<void> {
    // Validate credentials are available
    await this.getCredentials();
    
    // Initialize STS client
    this.stsClient = new STSClient({
      region: this.config.region,
      credentials: await this.getCredentialProvider()
    });
  }

  /**
   * Get AWS credentials from various sources
   */
  async getCredentials(): Promise<AWSCredentials> {
    // Return cached credentials if still valid
    if (this.cachedCredentials && this.credentialsExpiration && 
        this.credentialsExpiration > new Date()) {
      return this.cachedCredentials;
    }

    // Priority: explicit config > environment > profile > instance metadata
    let credentials: AWSCredentials | undefined;

    // 1. Check explicit config
    if (this.config.credentials) {
      credentials = this.config.credentials;
    }
    // 2. Check environment variables
    else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
      };
    }
    // 3. Check profile
    else if (this.config.profile) {
      try {
        const provider = fromIni({ profile: this.config.profile });
        const creds = await provider();
        credentials = {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          sessionToken: creds.sessionToken
        };
      } catch (error) {
        console.warn(`Failed to load profile ${this.config.profile}:`, error);
      }
    }
    // 4. Try default profile
    else {
      try {
        const provider = fromIni();
        const creds = await provider();
        credentials = {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          sessionToken: creds.sessionToken
        };
      } catch (error) {
        // Continue to next method
      }
    }

    // 5. Try instance/container metadata (ECS/EC2)
    if (!credentials) {
      try {
        const provider = fromContainerMetadata();
        const creds = await provider();
        credentials = {
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          sessionToken: creds.sessionToken
        };
      } catch (error) {
        try {
          const provider = fromInstanceMetadata();
          const creds = await provider();
          credentials = {
            accessKeyId: creds.accessKeyId,
            secretAccessKey: creds.secretAccessKey,
            sessionToken: creds.sessionToken
          };
        } catch (error) {
          // No credentials found
        }
      }
    }

    if (!credentials) {
      throw new AWSCredentialsError(
        'No AWS credentials found. Please configure credentials via environment variables, ' +
        'shared credential file (~/.aws/credentials), or IAM role.'
      );
    }

    this.cachedCredentials = credentials;
    return credentials;
  }

  /**
   * Get credential provider for AWS SDK clients
   */
  async getCredentialProvider(): Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  }> {
    const creds = await this.getCredentials();
    return {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
      sessionToken: creds.sessionToken
    };
  }

  /**
   * Get current caller identity
   */
  async getCallerIdentity(): Promise<{
    account: string;
    arn: string;
    userId: string;
  }> {
    if (!this.stsClient) {
      throw new AWSCredentialsError('Credential manager not initialized');
    }

    try {
      const command = new GetCallerIdentityCommand({});
      const response = await this.stsClient.send(command);
      
      return {
        account: response.Account || '',
        arn: response.Arn || '',
        userId: response.UserId || ''
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List available AWS profiles
   */
  async listProfiles(): Promise<AWSProfile[]> {
    const profiles: AWSProfile[] = [];
    
    // Try to read from config file
    try {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');
      
      const configPath = path.join(os.homedir(), '.aws', 'config');
      const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');

      // Parse config file
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        const configProfiles = this.parseConfigFile(configContent, 'config');
        profiles.push(...configProfiles);
      }

      // Parse credentials file
      if (fs.existsSync(credentialsPath)) {
        const credsContent = fs.readFileSync(credentialsPath, 'utf-8');
        const credsProfiles = this.parseConfigFile(credsContent, 'credentials');
        
        // Merge or add profiles
        for (const credProfile of credsProfiles) {
          const existing = profiles.find(p => p.name === credProfile.name);
          if (existing) {
            // Profile exists, credentials file takes precedence for region
          } else {
            profiles.push(credProfile);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to read AWS config files:', error);
    }

    return profiles;
  }

  /**
   * Assume an IAM role
   */
  async assumeRole(options: AssumeRoleOptions): Promise<SessionCredentials> {
    if (!this.stsClient) {
      throw new AWSCredentialsError('Credential manager not initialized');
    }

    try {
      const command = new AssumeRoleCommand({
        RoleArn: options.roleArn,
        RoleSessionName: options.roleSessionName,
        DurationSeconds: options.durationSeconds || 3600,
        ExternalId: options.externalId,
        SerialNumber: options.serialNumber,
        TokenCode: options.tokenCode
      });

      const response = await this.stsClient.send(command);
      const creds = response.Credentials;

      if (!creds?.AccessKeyId || !creds.SecretAccessKey || !creds.SessionToken) {
        throw new AWSCredentialsError('Failed to assume role: incomplete credentials returned');
      }

      return {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken,
        expiration: creds.Expiration || new Date(Date.now() + 3600000)
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get session token (for MFA)
   */
  async getSessionToken(durationSeconds?: number): Promise<SessionCredentials> {
    if (!this.stsClient) {
      throw new AWSCredentialsError('Credential manager not initialized');
    }

    try {
      const command = new GetSessionTokenCommand({
        DurationSeconds: durationSeconds || 3600
      });

      const response = await this.stsClient.send(command);
      const creds = response.Credentials;

      if (!creds?.AccessKeyId || !creds.SecretAccessKey || !creds.SessionToken) {
        throw new AWSCredentialsError('Failed to get session token');
      }

      return {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken,
        expiration: creds.Expiration || new Date(Date.now() + 3600000)
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Parse AWS config/credentials file
   */
  private parseConfigFile(content: string, type: 'config' | 'credentials'): AWSProfile[] {
    const profiles: AWSProfile[] = [];
    const lines = content.split('\n');
    let currentProfile: AWSProfile | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
        continue;
      }

      // Profile header
      const profileMatch = trimmed.match(/^\[(profile\s+)?(.+)\]$/);
      if (profileMatch) {
        if (currentProfile) {
          profiles.push(currentProfile);
        }
        currentProfile = {
          name: profileMatch[2].trim()
        };
      }

      // Key-value pairs
      const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
      if (kvMatch && currentProfile) {
        const key = kvMatch[1].trim();
        const value = kvMatch[2].trim();

        if (key === 'region') {
          currentProfile.region = value;
        } else if (key === 'output') {
          currentProfile.output = value;
        }
      }
    }

    if (currentProfile) {
      profiles.push(currentProfile);
    }

    return profiles;
  }

  /**
   * Clear cached credentials
   */
  clearCache(): void {
    this.cachedCredentials = undefined;
    this.credentialsExpiration = undefined;
  }
}
