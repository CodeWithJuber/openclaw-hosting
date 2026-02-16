/**
 * EC2 Tool Handlers
 */

import { 
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  TerminateInstancesCommand,
  DescribeInstanceStatusCommand,
  DescribeSecurityGroupsCommand,
  DescribeKeyPairsCommand,
  DescribeImagesCommand,
  DescribeInstanceTypesCommand
} from '@aws-sdk/client-ec2';
import { AWSConfig, ToolResult, EC2Instance, EC2CreateInstanceOptions } from '../types';
import { CredentialManager } from '../credentials/manager';
import { convertAwsError } from '../errors';

export class EC2Tools {
  private client: EC2Client;
  private credentialManager: CredentialManager;

  constructor(config: AWSConfig, credentialManager: CredentialManager) {
    this.credentialManager = credentialManager;
    this.client = new EC2Client({
      region: config.region,
      credentials: async () => this.credentialManager.getCredentialProvider()
    });
  }

  /**
   * List EC2 instances
   */
  async listInstances(args: {
    instanceIds?: string[];
    filters?: Array<{ name: string; values: string[] }>;
    maxResults?: number;
  } = {}): Promise<ToolResult> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: args.instanceIds,
        Filters: args.filters?.map(f => ({
          Name: f.name,
          Values: f.values
        })),
        MaxResults: args.maxResults
      });

      const response = await this.client.send(command);

      const instances: EC2Instance[] = [];
      
      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          instances.push({
            instanceId: instance.InstanceId || '',
            instanceType: instance.InstanceType || '',
            state: instance.State?.Name || 'unknown',
            stateCode: instance.State?.Code || 0,
            launchTime: instance.LaunchTime,
            publicIpAddress: instance.PublicIpAddress,
            privateIpAddress: instance.PrivateIpAddress,
            tags: this.parseTags(instance.Tags),
            vpcId: instance.VpcId,
            subnetId: instance.SubnetId,
            securityGroups: instance.SecurityGroups?.map(sg => ({
              groupId: sg.GroupId || '',
              groupName: sg.GroupName || ''
            })),
            keyName: instance.KeyName,
            platform: instance.Platform,
            architecture: instance.Architecture
          });
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ instances }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Create a new EC2 instance
   */
  async createInstance(args: EC2CreateInstanceOptions): Promise<ToolResult> {
    try {
      const command = new RunInstancesCommand({
        ImageId: args.imageId,
        InstanceType: args.instanceType,
        KeyName: args.keyName,
        SecurityGroupIds: args.securityGroupIds,
        SubnetId: args.subnetId,
        UserData: args.userData ? Buffer.from(args.userData).toString('base64') : undefined,
        MinCount: args.minCount || 1,
        MaxCount: args.maxCount || 1,
        IamInstanceProfile: args.iamInstanceProfile ? {
          Name: args.iamInstanceProfile
        } : undefined,
        TagSpecifications: args.tags ? [{
          ResourceType: 'instance',
          Tags: Object.entries(args.tags).map(([key, value]) => ({
            Key: key,
            Value: value
          }))
        }] : undefined
      });

      const response = await this.client.send(command);

      const instances = (response.Instances || []).map(instance => ({
        instanceId: instance.InstanceId || '',
        instanceType: instance.InstanceType || '',
        state: instance.State?.Name || 'pending',
        stateCode: instance.State?.Code || 0,
        launchTime: instance.LaunchTime,
        privateIpAddress: instance.PrivateIpAddress,
        tags: this.parseTags(instance.Tags)
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Instance(s) launched successfully`,
            instances,
            reservationId: response.ReservationId
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Start EC2 instances
   */
  async startInstances(args: {
    instanceIds: string[];
  }): Promise<ToolResult> {
    try {
      const command = new StartInstancesCommand({
        InstanceIds: args.instanceIds
      });

      const response = await this.client.send(command);

      const startingInstances = (response.StartingInstances || []).map(inst => ({
        instanceId: inst.InstanceId,
        currentState: inst.CurrentState?.Name,
        previousState: inst.PreviousState?.Name
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Starting ${startingInstances.length} instance(s)`,
            instances: startingInstances
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Stop EC2 instances
   */
  async stopInstances(args: {
    instanceIds: string[];
    force?: boolean;
  }): Promise<ToolResult> {
    try {
      const command = new StopInstancesCommand({
        InstanceIds: args.instanceIds,
        Force: args.force
      });

      const response = await this.client.send(command);

      const stoppingInstances = (response.StoppingInstances || []).map(inst => ({
        instanceId: inst.InstanceId,
        currentState: inst.CurrentState?.Name,
        previousState: inst.PreviousState?.Name
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Stopping ${stoppingInstances.length} instance(s)`,
            instances: stoppingInstances
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Terminate EC2 instances
   */
  async terminateInstances(args: {
    instanceIds: string[];
  }): Promise<ToolResult> {
    try {
      const command = new TerminateInstancesCommand({
        InstanceIds: args.instanceIds
      });

      const response = await this.client.send(command);

      const terminatingInstances = (response.TerminatingInstances || []).map(inst => ({
        instanceId: inst.InstanceId,
        currentState: inst.CurrentState?.Name,
        previousState: inst.PreviousState?.Name
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            message: `Terminating ${terminatingInstances.length} instance(s)`,
            instances: terminatingInstances
          }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Get EC2 instance status
   */
  async getInstanceStatus(args: {
    instanceIds?: string[];
    includeAllInstances?: boolean;
  } = {}): Promise<ToolResult> {
    try {
      const command = new DescribeInstanceStatusCommand({
        InstanceIds: args.instanceIds,
        IncludeAllInstances: args.includeAllInstances
      });

      const response = await this.client.send(command);

      const statuses = (response.InstanceStatuses || []).map(status => ({
        instanceId: status.InstanceId,
        availabilityZone: status.AvailabilityZone,
        state: status.InstanceState?.Name,
        instanceStatus: {
          status: status.InstanceStatus?.Status,
          details: status.InstanceStatus?.Details?.map(d => ({
            name: d.Name,
            status: d.Status
          }))
        },
        systemStatus: {
          status: status.SystemStatus?.Status,
          details: status.SystemStatus?.Details?.map(d => ({
            name: d.Name,
            status: d.Status
          }))
        }
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ statuses }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * Describe a specific instance
   */
  async describeInstance(args: {
    instanceId: string;
  }): Promise<ToolResult> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [args.instanceId]
      });

      const response = await this.client.send(command);
      const reservation = response.Reservations?.[0];
      const instance = reservation?.Instances?.[0];

      if (!instance) {
        throw new Error(`Instance ${args.instanceId} not found`);
      }

      const details = {
        instanceId: instance.InstanceId,
        instanceType: instance.InstanceType,
        state: instance.State?.Name,
        stateCode: instance.State?.Code,
        launchTime: instance.LaunchTime,
        publicIpAddress: instance.PublicIpAddress,
        privateIpAddress: instance.PrivateIpAddress,
        publicDnsName: instance.PublicDnsName,
        privateDnsName: instance.PrivateDnsName,
        tags: this.parseTags(instance.Tags),
        vpcId: instance.VpcId,
        subnetId: instance.SubnetId,
        securityGroups: instance.SecurityGroups,
        keyName: instance.KeyName,
        platform: instance.Platform,
        architecture: instance.Architecture,
        rootDeviceType: instance.RootDeviceType,
        rootDeviceName: instance.RootDeviceName,
        blockDeviceMappings: instance.BlockDeviceMappings?.map(bdm => ({
          deviceName: bdm.DeviceName,
          volumeId: bdm.Ebs?.VolumeId,
          status: bdm.Ebs?.Status,
          attachTime: bdm.Ebs?.AttachTime
        })),
        networkInterfaces: instance.NetworkInterfaces?.map(ni => ({
          networkInterfaceId: ni.NetworkInterfaceId,
          subnetId: ni.SubnetId,
          vpcId: ni.VpcId,
          privateIpAddress: ni.PrivateIpAddress,
          publicIp: ni.Association?.PublicIp
        }))
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ instance: details }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List security groups
   */
  async listSecurityGroups(args: {
    groupIds?: string[];
    filters?: Array<{ name: string; values: string[] }>;
  } = {}): Promise<ToolResult> {
    try {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: args.groupIds,
        Filters: args.filters?.map(f => ({
          Name: f.name,
          Values: f.values
        }))
      });

      const response = await this.client.send(command);

      const securityGroups = (response.SecurityGroups || []).map(sg => ({
        groupId: sg.GroupId,
        groupName: sg.GroupName,
        description: sg.Description,
        vpcId: sg.VpcId,
        ownerId: sg.OwnerId,
        inboundRules: sg.IpPermissions?.map(rule => ({
          protocol: rule.IpProtocol,
          fromPort: rule.FromPort,
          toPort: rule.ToPort,
          ipRanges: rule.IpRanges?.map(r => ({
            cidrIp: r.CidrIp,
            description: r.Description
          })),
          userIdGroupPairs: rule.UserIdGroupPairs?.map(p => ({
            groupId: p.GroupId,
            vpcId: p.VpcId,
            description: p.Description
          }))
        })),
        outboundRules: sg.IpPermissionsEgress?.map(rule => ({
          protocol: rule.IpProtocol,
          fromPort: rule.FromPort,
          toPort: rule.ToPort,
          ipRanges: rule.IpRanges?.map(r => ({
            cidrIp: r.CidrIp,
            description: r.Description
          }))
        })),
        tags: this.parseTags(sg.Tags)
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ securityGroups }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List SSH key pairs
   */
  async listKeyPairs(): Promise<ToolResult> {
    try {
      const command = new DescribeKeyPairsCommand({});
      const response = await this.client.send(command);

      const keyPairs = (response.KeyPairs || []).map(kp => ({
        keyPairId: kp.KeyPairId,
        keyName: kp.KeyName,
        keyFingerprint: kp.KeyFingerprint,
        keyType: kp.KeyType,
        createTime: kp.CreateTime,
        tags: this.parseTags(kp.Tags)
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ keyPairs }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
  }

  /**
   * List available AMIs
   */
  async listImages(args: {
    owners?: string[];
    filters?: Array<{ name: string; values: string[] }>;
  } = {}): Promise<ToolResult> {
    try {
      const command = new DescribeImagesCommand({
        Owners: args.owners || ['amazon'],
        Filters: args.filters?.map(f => ({
          Name: f.name,
          Values: f.values
        }))
      });

      const response = await this.client.send(command);

      const images = (response.Images || []).map(img => ({
        imageId: img.ImageId,
        name: img.Name,
        description: img.Description,
        ownerId: img.OwnerId,
        creationDate: img.CreationDate,
        architecture: img.Architecture,
        platform: img.Platform,
        state: img.State,
        rootDeviceType: img.RootDeviceType,
        rootDeviceName: img.RootDeviceName,
        virtualizationType: img.VirtualizationType,
        hypervisor: img.Hypervisor,
        tags: this.parseTags(img.Tags)
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ images }, null, 2)
        }]
      };
    } catch (error) {
      throw convertAwsError(error);
    }
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
