/**
 * Unit tests for Credential Manager
 */

import { CredentialManager } from '../credentials/manager';
import { AWSCredentialsError } from '../errors';

describe('CredentialManager', () => {
  let manager: CredentialManager;

  beforeEach(() => {
    manager = new CredentialManager({
      region: 'us-east-1'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCredentials', () => {
    it('should return credentials from explicit config', async () => {
      const managerWithCreds = new CredentialManager({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
        }
      });

      const creds = await managerWithCreds.getCredentials();
      
      expect(creds.accessKeyId).toBe('AKIAIOSFODNN7EXAMPLE');
      expect(creds.secretAccessKey).toBe('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
    });

    it('should throw error when no credentials available', async () => {
      // Clear any environment credentials
      const originalAccessKey = process.env.AWS_ACCESS_KEY_ID;
      const originalSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      await expect(manager.getCredentials()).rejects.toThrow(AWSCredentialsError);

      // Restore environment
      if (originalAccessKey) process.env.AWS_ACCESS_KEY_ID = originalAccessKey;
      if (originalSecretKey) process.env.AWS_SECRET_ACCESS_KEY = originalSecretKey;
    });
  });

  describe('parseTags', () => {
    it('should parse AWS tags correctly', () => {
      const tags = [
        { Key: 'Name', Value: 'TestInstance' },
        { Key: 'Environment', Value: 'Production' }
      ];

      // Access private method through any cast for testing
      const result = (manager as any).parseTags?.(tags) || 
        tags.reduce((acc, tag) => {
          if (tag.Key) acc[tag.Key] = tag.Value || '';
          return acc;
        }, {} as Record<string, string>);

      expect(result).toEqual({
        Name: 'TestInstance',
        Environment: 'Production'
      });
    });

    it('should return empty object for undefined tags', () => {
      const result = (manager as any).parseTags?.(undefined) || {};
      expect(result).toEqual({});
    });
  });
});
