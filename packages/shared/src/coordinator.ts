// Real-time agent coordination using Redis Pub/Sub
import { createClient, RedisClientType } from 'redis';

interface AgentUpdate {
  timestamp: number;
  agent: string;
  status: string;
  data: any;
  progress?: number;
}

interface ProvisionEvent {
  instanceId: string;
  event: 'started' | 'progress' | 'completed' | 'failed' | 'rolled_back';
  data: any;
  timestamp: number;
}

class AgentCoordinator {
  private redis: RedisClientType;
  private subscribers: Map<string, Function[]> = new Map();
  
  constructor(redisUrl: string = 'redis://localhost:6379') {
    this.redis = createClient({ url: redisUrl });
  }
  
  async connect(): Promise<void> {
    await this.redis.connect();
    console.log('✅ Agent coordinator connected to Redis');
  }
  
  // Agent publishes update
  async publishAgentUpdate(
    agentId: string, 
    status: string, 
    data: any,
    progress?: number
  ): Promise<void> {
    const update: AgentUpdate = {
      timestamp: Date.now(),
      agent: agentId,
      status,
      data,
      progress
    };
    
    await this.redis.publish(`agent:${agentId}`, JSON.stringify(update));
    console.log(`[${agentId}] ${status}${progress ? ` (${progress}%)` : ''}`);
  }
  
  // Publish provisioning event
  async publishProvisionEvent(
    instanceId: string,
    event: ProvisionEvent['event'],
    data: any
  ): Promise<void> {
    const provisionEvent: ProvisionEvent = {
      instanceId,
      event,
      data,
      timestamp: Date.now()
    };
    
    await this.redis.publish(`provision:${instanceId}`, JSON.stringify(provisionEvent));
    await this.redis.publish('provision:all', JSON.stringify(provisionEvent));
  }
  
  // Subscribe to agent updates
  async subscribeToAgent(agentId: string, callback: (update: AgentUpdate) => void): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe(`agent:${agentId}`, (message) => {
      const update: AgentUpdate = JSON.parse(message);
      callback(update);
    });
    
    console.log(`👂 Subscribed to agent:${agentId}`);
  }
  
  // Subscribe to all agents
  async subscribeToAllAgents(callback: (update: AgentUpdate) => void): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.connect();
    
    await subscriber.pSubscribe('agent:*', (message, channel) => {
      const update: AgentUpdate = JSON.parse(message);
      callback(update);
    });
    
    console.log('👂 Subscribed to all agents');
  }
  
  // Subscribe to provisioning events
  async subscribeToProvisioning(
    instanceId: string | 'all',
    callback: (event: ProvisionEvent) => void
  ): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.connect();
    
    const channel = instanceId === 'all' ? 'provision:all' : `provision:${instanceId}`;
    
    await subscriber.subscribe(channel, (message) => {
      const event: ProvisionEvent = JSON.parse(message);
      callback(event);
    });
    
    console.log(`👂 Subscribed to provisioning:${instanceId}`);
  }
  
  // Publish system alert
  async publishAlert(level: 'info' | 'warning' | 'error', message: string, data?: any): Promise<void> {
    const alert = {
      timestamp: Date.now(),
      level,
      message,
      data
    };
    
    await this.redis.publish('system:alerts', JSON.stringify(alert));
    
    if (level === 'error') {
      console.error(`🚨 [ALERT] ${message}`, data);
    } else if (level === 'warning') {
      console.warn(`⚠️ [ALERT] ${message}`, data);
    } else {
      console.log(`ℹ️ [ALERT] ${message}`, data);
    }
  }
  
  // Subscribe to system alerts
  async subscribeToAlerts(callback: (alert: any) => void): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.connect();
    
    await subscriber.subscribe('system:alerts', (message) => {
      const alert = JSON.parse(message);
      callback(alert);
    });
    
    console.log('👂 Subscribed to system alerts');
  }
  
  // Get agent status
  async getAgentStatus(agentId: string): Promise<AgentUpdate | null> {
    const status = await this.redis.get(`agent:${agentId}:status`);
    return status ? JSON.parse(status) : null;
  }
  
  // Set agent status
  async setAgentStatus(agentId: string, update: AgentUpdate): Promise<void> {
    await this.redis.set(`agent:${agentId}:status`, JSON.stringify(update));
    await this.redis.expire(`agent:${agentId}:status`, 3600); // Expire after 1 hour
  }
  
  // Disconnect
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let coordinator: AgentCoordinator | null = null;

export function getCoordinator(redisUrl?: string): AgentCoordinator {
  if (!coordinator) {
    coordinator = new AgentCoordinator(redisUrl);
  }
  return coordinator;
}

export { AgentCoordinator, AgentUpdate, ProvisionEvent };
