/**
 * S3 Tool Handlers
 */

import { 
  S3Client, 
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
  GetBucketLocationCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream, createWriteStream, promises as fsPromises } from 'fs';
import { Readable } from 'stream';
import { AWSConfig, ToolResult, S3Bucket, S3Object } from '../types';
import { CredentialManager } from '../credentials/manager';
import { convertAwsError, AWSResourceNotFoundError } from '../errors';

export class S3Tools {
  private client: S3Client;
  private credentialManager: CredentialManager;

  constructor(config: AWSConfig, credentialManager: CredentialManager) {
    this.credentialManager = credentialManager;
    this.client = new S3Client({
      region: config.region,
      credentials: async () => this.credentialManager.getCredentialProvider()
    });
  }

  /**
   * List all S3 buckets
   */
  async listBuckets(): Promise<ToolResult> {
    try {
      const command = new ListBucketsCommand({});
      const response = await this.client.send(command);

      const buckets: S3Bucket[] = (response.Buckets || []).map(bucket => ({
        name: bucket.Name || '',
        creationDate: bucket.CreationDate
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ buckets }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Create a new S3 bucket
   */
  async createBucket(args: { 
    bucket: string; 
    region?: string;
    enableVersioning?: boolean;
  }): Promise<ToolResult> {
    try {
      const region = args.region || process.env.AWS_REGION || 'us-east-1';
      
      const command = new CreateBucketCommand({
        Bucket: args.bucket,
        CreateBucketConfiguration: region !== 'us-east-1' ? {
          LocationConstraint: region as any
        } : undefined
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            message: `Bucket '${args.bucket}' created successfully`,
            bucket: args.bucket,
            region
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Delete an S3 bucket
   */
  async deleteBucket(args: { 
    bucket: string; 
    force?: boolean;
  }): Promise<ToolResult> {
    try {
      // If force is true, delete all objects first
      if (args.force) {
        await this.deleteAllObjects(args.bucket);
      }

      const command = new DeleteBucketCommand({
        Bucket: args.bucket
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            message: `Bucket '${args.bucket}' deleted successfully`,
            bucket: args.bucket
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List objects in a bucket
   */
  async listObjects(args: {
    bucket: string;
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
  }): Promise<ToolResult> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: args.bucket,
        Prefix: args.prefix,
        MaxKeys: args.maxKeys || 1000,
        ContinuationToken: args.continuationToken
      });

      const response = await this.client.send(command);

      const objects: S3Object[] = (response.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified,
        etag: obj.ETag,
        storageClass: obj.StorageClass
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            objects,
            isTruncated: response.IsTruncated,
            continuationToken: response.NextContinuationToken,
            keyCount: response.KeyCount,
            maxKeys: response.MaxKeys
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Upload an object to S3
   */
  async uploadObject(args: {
    bucket: string;
    key: string;
    filePath?: string;
    content?: string;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<ToolResult> {
    try {
      let body: Buffer | Readable | string;

      if (args.filePath) {
        body = createReadStream(args.filePath);
      } else if (args.content) {
        body = args.content;
      } else {
        throw new Error('Either filePath or content must be provided');
      }

      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: args.bucket,
          Key: args.key,
          Body: body,
          ContentType: args.contentType,
          Metadata: args.metadata
        }
      });

      await upload.done();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Object '${args.key}' uploaded successfully to bucket '${args.bucket}'`,
            bucket: args.bucket,
            key: args.key
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Download an object from S3
   */
  async downloadObject(args: {
    bucket: string;
    key: string;
    filePath?: string;
  }): Promise<ToolResult> {
    try {
      const command = new GetObjectCommand({
        Bucket: args.bucket,
        Key: args.key
      });

      const response = await this.client.send(command);

      if (args.filePath) {
        // Save to file
        const writeStream = createWriteStream(args.filePath);
        (response.Body as Readable).pipe(writeStream);
        
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              message: `Object '${args.key}' downloaded to '${args.filePath}'`,
              bucket: args.bucket,
              key: args.key,
              filePath: args.filePath,
              contentType: response.ContentType,
              contentLength: response.ContentLength
            }, null, 2)
          }]
        };
      } else {
        // Return content as text
        const chunks: Buffer[] = [];
        for await (const chunk of response.Body as Readable) {
          chunks.push(Buffer.from(chunk));
        }
        const content = Buffer.concat(chunks).toString('utf-8');

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              bucket: args.bucket,
              key: args.key,
              contentType: response.ContentType,
              contentLength: response.ContentLength,
              content: content.substring(0, 10000) // Limit content size
            }, null, 2)
          }]
        };
      }
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Delete an object from S3
   */
  async deleteObject(args: {
    bucket: string;
    key: string;
  }): Promise<ToolResult> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: args.bucket,
        Key: args.key
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Object '${args.key}' deleted from bucket '${args.bucket}'`,
            bucket: args.bucket,
            key: args.key
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Generate presigned URL for an object
   */
  async getObjectUrl(args: {
    bucket: string;
    key: string;
    expiration?: number;
    operation?: 'get' | 'put';
  }): Promise<ToolResult> {
    try {
      const expiration = args.expiration || 3600;
      const operation = args.operation || 'get';

      const command = operation === 'get' 
        ? new GetObjectCommand({ Bucket: args.bucket, Key: args.key })
        : new PutObjectCommand({ Bucket: args.bucket, Key: args.key });

      const url = await getSignedUrl(this.client, command, { expiresIn: expiration });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            url,
            bucket: args.bucket,
            key: args.key,
            expiration,
            operation
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Copy an object between buckets
   */
  async copyObject(args: {
    sourceBucket: string;
    sourceKey: string;
    destinationBucket: string;
    destinationKey: string;
  }): Promise<ToolResult> {
    try {
      const command = new CopyObjectCommand({
        Bucket: args.destinationBucket,
        Key: args.destinationKey,
        CopySource: `${args.sourceBucket}/${encodeURIComponent(args.sourceKey)}`
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Object copied from '${args.sourceBucket}/${args.sourceKey}' to '${args.destinationBucket}/${args.destinationKey}'`,
            sourceBucket: args.sourceBucket,
            sourceKey: args.sourceKey,
            destinationBucket: args.destinationBucket,
            destinationKey: args.destinationKey
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get object metadata
   */
  async getObjectMetadata(args: {
    bucket: string;
    key: string;
  }): Promise<ToolResult> {
    try {
      const command = new HeadObjectCommand({
        Bucket: args.bucket,
        Key: args.key
      });

      const response = await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            bucket: args.bucket,
            key: args.key,
            contentType: response.ContentType,
            contentLength: response.ContentLength,
            lastModified: response.LastModified,
            etag: response.ETag,
            metadata: response.Metadata,
            versionId: response.VersionId
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Delete all objects in a bucket (for force delete)
   */
  private async deleteAllObjects(bucket: string): Promise<void> {
    let continuationToken: string | undefined;
    
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken
      });

      const listResponse = await this.client.send(listCommand);

      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Delete objects in batches of 1000
        for (const obj of listResponse.Contents) {
          if (obj.Key) {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucket,
              Key: obj.Key
            });
            await this.client.send(deleteCommand);
          }
        }
      }

      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);
  }
}
