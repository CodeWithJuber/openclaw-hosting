/**
 * CloudWatch Logs Tool Handlers
 */

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
  FilterLogEventsCommand,
  StartQueryCommand,
  GetQueryResultsCommand,
  CreateLogGroupCommand,
  DeleteLogGroupCommand,
  PutRetentionPolicyCommand,
  DeleteRetentionPolicyCommand
} from '@aws-sdk/client-cloudwatch-logs';
import { AWSConfig, ToolResult, LogGroup, LogEvent, CloudWatchQueryOptions } from '../types';
import { CredentialManager } from '../credentials/manager';
import { convertAwsError } from '../errors';

export class CloudWatchTools {
  private client: CloudWatchLogsClient;
  private credentialManager: CredentialManager;

  constructor(config: AWSConfig, credentialManager: CredentialManager) {
    this.credentialManager = credentialManager;
    this.client = new CloudWatchLogsClient({
      region: config.region,
      credentials: async () => this.credentialManager.getCredentialProvider()
    });
  }

  /**
   * List CloudWatch log groups
   */
  async listLogGroups(args: {
    logGroupNamePrefix?: string;
    limit?: number;
    nextToken?: string;
  } = {}): Promise<ToolResult> {
    try {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: args.logGroupNamePrefix,
        limit: args.limit,
        nextToken: args.nextToken
      });

      const response = await this.client.send(command);

      const logGroups: LogGroup[] = (response.logGroups || []).map(lg => ({
        logGroupName: lg.logGroupName || '',
        creationTime: lg.creationTime,
        retentionInDays: lg.retentionInDays,
        metricFilterCount: lg.metricFilterCount,
        arn: lg.arn,
        storedBytes: lg.storedBytes
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            logGroups,
            nextToken: response.nextToken
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Describe a specific log group
   */
  async describeLogGroup(args: {
    logGroupName: string;
  }): Promise<ToolResult> {
    try {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: args.logGroupName,
        limit: 1
      });

      const response = await this.client.send(command);
      const logGroup = response.logGroups?.[0];

      if (!logGroup) {
        throw new Error(`Log group '${args.logGroupName}' not found`);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            logGroupName: logGroup.logGroupName,
            creationTime: logGroup.creationTime,
            retentionInDays: logGroup.retentionInDays,
            metricFilterCount: logGroup.metricFilterCount,
            arn: logGroup.arn,
            storedBytes: logGroup.storedBytes,
            kmsKeyId: logGroup.kmsKeyId
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List log streams in a log group
   */
  async listLogStreams(args: {
    logGroupName: string;
    logStreamNamePrefix?: string;
    orderBy?: 'LogStreamName' | 'LastEventTime';
    descending?: boolean;
    limit?: number;
    nextToken?: string;
  }): Promise<ToolResult> {
    try {
      const command = new DescribeLogStreamsCommand({
        logGroupName: args.logGroupName,
        logStreamNamePrefix: args.logStreamNamePrefix,
        orderBy: args.orderBy,
        descending: args.descending,
        limit: args.limit,
        nextToken: args.nextToken
      });

      const response = await this.client.send(command);

      const streams = (response.logStreams || []).map(stream => ({
        logStreamName: stream.logStreamName,
        creationTime: stream.creationTime,
        firstEventTimestamp: stream.firstEventTimestamp,
        lastEventTimestamp: stream.lastEventTimestamp,
        lastIngestionTime: stream.lastIngestionTime,
        uploadSequenceToken: stream.uploadSequenceToken,
        arn: stream.arn,
        storedBytes: stream.storedBytes
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            logGroupName: args.logGroupName,
            streams,
            nextToken: response.nextToken
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get log events from a stream
   */
  async getLogEvents(args: {
    logGroupName: string;
    logStreamName: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    nextToken?: string;
    startFromHead?: boolean;
  }): Promise<ToolResult> {
    try {
      const command = new GetLogEventsCommand({
        logGroupName: args.logGroupName,
        logStreamName: args.logStreamName,
        startTime: args.startTime,
        endTime: args.endTime,
        limit: args.limit,
        nextToken: args.nextToken,
        startFromHead: args.startFromHead
      });

      const response = await this.client.send(command);

      const events: LogEvent[] = (response.events || []).map(event => ({
        timestamp: event.timestamp,
        message: event.message,
        ingestionTime: event.ingestionTime
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            logGroupName: args.logGroupName,
            logStreamName: args.logStreamName,
            events,
            nextForwardToken: response.nextForwardToken,
            nextBackwardToken: response.nextBackwardToken
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Filter log events with pattern
   */
  async filterLogEvents(args: {
    logGroupName: string;
    logStreamNames?: string[];
    startTime?: number;
    endTime?: number;
    filterPattern?: string;
    limit?: number;
    nextToken?: string;
  }): Promise<ToolResult> {
    try {
      const command = new FilterLogEventsCommand({
        logGroupName: args.logGroupName,
        logStreamNames: args.logStreamNames,
        startTime: args.startTime,
        endTime: args.endTime,
        filterPattern: args.filterPattern,
        limit: args.limit,
        nextToken: args.nextToken
      });

      const response = await this.client.send(command);

      const events = (response.events || []).map(event => ({
        logStreamName: event.logStreamName,
        timestamp: event.timestamp,
        message: event.message,
        ingestionTime: event.ingestionTime,
        eventId: event.eventId
      }));

      const searchedStreams = (response.searchedLogStreams || []).map(stream => ({
        logStreamName: stream.logStreamName,
        searchedCompletely: stream.searchedCompletely
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            logGroupName: args.logGroupName,
            events,
            searchedStreams,
            nextToken: response.nextToken
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Run CloudWatch Insights query
   */
  async queryLogs(args: CloudWatchQueryOptions): Promise<ToolResult> {
    try {
      // Start query
      const startCommand = new StartQueryCommand({
        logGroupNames: args.logGroupNames,
        queryString: args.queryString,
        startTime: new Date(args.startTime).getTime(),
        endTime: new Date(args.endTime).getTime(),
        limit: args.limit
      });

      const startResponse = await this.client.send(startCommand);
      const queryId = startResponse.queryId;

      if (!queryId) {
        throw new Error('Failed to start query');
      }

      // Poll for results
      let results: any = null;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds timeout

      while (attempts < maxAttempts) {
        const getCommand = new GetQueryResultsCommand({ queryId });
        const getResponse = await this.client.send(getCommand);

        if (getResponse.status === 'Complete') {
          results = getResponse;
          break;
        } else if (getResponse.status === 'Failed' || getResponse.status === 'Cancelled') {
          throw new Error(`Query ${getResponse.status}: ${getResponse.status || 'Unknown error'}`);
        }

        // Wait 1 second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!results) {
        throw new Error('Query timed out');
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            queryId,
            status: results.status,
            results: results.results?.map((row: any) => 
              row.reduce((acc: any, field: any) => {
                acc[field.field] = field.value;
                return acc;
              }, {})
            ),
            statistics: results.statistics,
            resultsProcessed: results.resultsProcessed
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Create a new log group
   */
  async createLogGroup(args: {
    logGroupName: string;
    kmsKeyId?: string;
    tags?: Record<string, string>;
  }): Promise<ToolResult> {
    try {
      const command = new CreateLogGroupCommand({
        logGroupName: args.logGroupName,
        kmsKeyId: args.kmsKeyId,
        tags: args.tags
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Log group '${args.logGroupName}' created successfully`,
            logGroupName: args.logGroupName
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Delete a log group
   */
  async deleteLogGroup(args: {
    logGroupName: string;
  }): Promise<ToolResult> {
    try {
      const command = new DeleteLogGroupCommand({
        logGroupName: args.logGroupName
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Log group '${args.logGroupName}' deleted successfully`,
            logGroupName: args.logGroupName
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Set retention policy for log group
   */
  async setRetentionPolicy(args: {
    logGroupName: string;
    retentionInDays: number;
  }): Promise<ToolResult> {
    try {
      const command = new PutRetentionPolicyCommand({
        logGroupName: args.logGroupName,
        retentionInDays: args.retentionInDays
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Retention policy set for '${args.logGroupName}'`,
            logGroupName: args.logGroupName,
            retentionInDays: args.retentionInDays
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Delete retention policy from log group
   */
  async deleteRetentionPolicy(args: {
    logGroupName: string;
  }): Promise<ToolResult> {
    try {
      const command = new DeleteRetentionPolicyCommand({
        logGroupName: args.logGroupName
      });

      await this.client.send(command);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Retention policy removed from '${args.logGroupName}'`,
            logGroupName: args.logGroupName
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }
}
