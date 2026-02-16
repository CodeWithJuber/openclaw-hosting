// Agent Identity System - Avatars, Profiles, and Visual Presence
// Makes agents feel like real team members

import { createCanvas, loadImage } from 'canvas';

interface AgentPersonality {
  name: string;
  role: string;
  description: string;
  traits: string[];
  communicationStyle: 'formal' | 'casual' | 'technical' | 'friendly';
  expertise: string[];
  quirks?: string[];
}

interface AgentVisual {
  avatar: string; // Base64 or URL
  color: string;
  icon: string;
  statusIndicator: 'online' | 'busy' | 'away' | 'offline';
}

interface AgentIdentity {
  id: string;
  personality: AgentPersonality;
  visual: AgentVisual;
  stats: {
    tasksCompleted: number;
    tasksInProgress: number;
    successRate: number;
    averageResponseTime: number; // seconds
    totalWorkHours: number;
    joinedAt: Date;
    lastActiveAt: Date;
  };
  preferences: {
    workHours?: { start: number; end: number }; // 24h format
    preferredTasks?: string[];
    notificationSettings: {
      email: boolean;
      slack: boolean;
      dashboard: boolean;
    };
  };
}

interface AgentPresence {
  agentId: string;
  status: 'working' | 'idle' | 'meeting' | 'break' | 'offline';
  currentTask?: string;
  location?: string;
  mood?: 'focused' | 'excited' | 'tired' | 'stressed' | 'happy';
  updatedAt: Date;
}

class AgentIdentityManager {
  private identities: Map<string, AgentIdentity> = new Map();
  private presence: Map<string, AgentPresence> = new Map();
  
  // Pre-defined agent personalities
  private readonly agentTemplates: Record<string, AgentPersonality> = {
    'agent-1-whmcs': {
      name: 'WHMCS Wizard',
      role: 'Billing Integration Specialist',
      description: 'Expert in WHMCS module development and customer billing workflows',
      traits: ['detail-oriented', 'patient', 'methodical', 'customer-focused'],
      communicationStyle: 'formal',
      expertise: ['PHP', 'WHMCS API', 'Billing Systems', 'Customer Management'],
      quirks: ['Always double-checks API responses', 'Loves clean code documentation'],
    },
    'agent-2-api': {
      name: 'API Architect',
      role: 'Backend API Developer',
      description: 'Builds robust, scalable APIs with security-first approach',
      traits: ['fast', 'precise', 'security-conscious', 'innovative'],
      communicationStyle: 'technical',
      expertise: ['TypeScript', 'Hono.js', 'PostgreSQL', 'Redis', 'JWT'],
      quirks: ['Obsessed with performance metrics', 'Names variables descriptively'],
    },
    'agent-3-dashboard': {
      name: 'UI Visionary',
      role: 'Frontend Developer',
      description: 'Creates beautiful, intuitive user interfaces',
      traits: ['creative', 'user-focused', 'perfectionist', 'trendy'],
      communicationStyle: 'friendly',
      expertise: ['React', 'TypeScript', 'Tailwind CSS', 'UI/UX Design'],
      quirks: ['Notices pixel misalignments', 'Advocates for dark mode'],
    },
    'agent-4-infra': {
      name: 'DevOps Dynamo',
      role: 'Infrastructure Engineer',
      description: 'Keeps servers running and deployments smooth',
      traits: ['reliable', 'calm-under-pressure', 'automation-obsessed', 'vigilant'],
      communicationStyle: 'technical',
      expertise: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Infrastructure', 'Monitoring'],
      quirks: ['Checks logs at 3am', 'Has backup plans for backup plans'],
    },
    'agent-5-qa': {
      name: 'Quality Guardian',
      role: 'Testing Engineer',
      description: 'Ensures everything works perfectly before release',
      traits: ['thorough', 'skeptical', 'systematic', 'quality-obsessed'],
      communicationStyle: 'formal',
      expertise: ['Test Automation', 'E2E Testing', 'Load Testing', 'Bug Tracking'],
      quirks: ['Breaks things on purpose', 'Celebrates finding edge cases'],
    },
    'agent-6-security': {
      name: 'Security Sentinel',
      role: 'Security Engineer',
      description: 'Protects the platform from threats and vulnerabilities',
      traits: ['paranoid', 'vigilant', 'ethical', 'knowledgeable'],
      communicationStyle: 'formal',
      expertise: ['Penetration Testing', 'Cryptography', 'Security Auditing', 'Compliance'],
      quirks: ['Uses password managers for everything', 'Reads security advisories for fun'],
    },
  };
  
  /**
   * Create identity for an agent
   */
  async createIdentity(agentId: string, customPersonality?: Partial<AgentPersonality>): Promise<AgentIdentity> {
    const template = this.agentTemplates[agentId] || this.generateGenericPersonality(agentId);
    
    const personality: AgentPersonality = {
      ...template,
      ...customPersonality,
    };
    
    const visual = await this.generateVisual(personality);
    
    const identity: AgentIdentity = {
      id: agentId,
      personality,
      visual,
      stats: {
        tasksCompleted: 0,
        tasksInProgress: 0,
        successRate: 100,
        averageResponseTime: 0,
        totalWorkHours: 0,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      },
      preferences: {
        notificationSettings: {
          email: false,
          slack: true,
          dashboard: true,
        },
      },
    };
    
    this.identities.set(agentId, identity);
    
    // Set initial presence
    this.setPresence(agentId, {
      agentId,
      status: 'offline',
      updatedAt: new Date(),
    });
    
    return identity;
  }
  
  /**
   * Get agent identity
   */
  getIdentity(agentId: string): AgentIdentity | undefined {
    return this.identities.get(agentId);
  }
  
  /**
   * Update agent presence
   */
  setPresence(agentId: string, presence: Partial<AgentPresence>): AgentPresence {
    const current = this.presence.get(agentId) || {
      agentId,
      status: 'offline',
      updatedAt: new Date(),
    };
    
    const updated: AgentPresence = {
      ...current,
      ...presence,
      agentId,
      updatedAt: new Date(),
    };
    
    this.presence.set(agentId, updated);
    
    // Update last active
    const identity = this.identities.get(agentId);
    if (identity) {
      identity.stats.lastActiveAt = new Date();
    }
    
    return updated;
  }
  
  /**
   * Get agent presence
   */
  getPresence(agentId: string): AgentPresence | undefined {
    return this.presence.get(agentId);
  }
  
  /**
   * Get all agents with their presence
   */
  getAllAgents(): Array<{ identity: AgentIdentity; presence: AgentPresence }> {
    const result = [];
    
    for (const [agentId, identity] of this.identities) {
      const presence = this.presence.get(agentId) || {
        agentId,
        status: 'offline',
        updatedAt: new Date(),
      };
      
      result.push({ identity, presence });
    }
    
    return result;
  }
  
  /**
   * Update agent stats
   */
  updateStats(agentId: string, stats: Partial<AgentIdentity['stats']>): void {
    const identity = this.identities.get(agentId);
    if (!identity) return;
    
    identity.stats = { ...identity.stats, ...stats };
  }
  
  /**
   * Record task completion
   */
  recordTaskCompletion(agentId: string, success: boolean, responseTime: number): void {
    const identity = this.identities.get(agentId);
    if (!identity) return;
    
    identity.stats.tasksCompleted++;
    identity.stats.tasksInProgress = Math.max(0, identity.stats.tasksInProgress - 1);
    
    // Update success rate
    const total = identity.stats.tasksCompleted;
    const successful = success ? 
      (identity.stats.successRate / 100) * (total - 1) + 1 :
      (identity.stats.successRate / 100) * (total - 1);
    identity.stats.successRate = Math.round((successful / total) * 100);
    
    // Update average response time
    const oldAvg = identity.stats.averageResponseTime;
    identity.stats.averageResponseTime = 
      (oldAvg * (total - 1) + responseTime) / total;
  }
  
  /**
   * Generate avatar for agent
   */
  private async generateVisual(personality: AgentPersonality): Promise<AgentVisual> {
    // Generate color based on role
    const color = this.generateColor(personality.role);
    
    // Generate initials
    const initials = personality.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    // Create avatar canvas
    const canvas = createCanvas(128, 128);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);
    
    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 64, 64);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 128, 128);
    
    const avatar = canvas.toDataURL('image/png');
    
    return {
      avatar,
      color,
      icon: this.getIconForRole(personality.role),
      statusIndicator: 'offline',
    };
  }
  
  private generateColor(role: string): string {
    const colors: Record<string, string> = {
      'Billing': '#10b981', // Green
      'Backend': '#3b82f6', // Blue
      'Frontend': '#8b5cf6', // Purple
      'Infrastructure': '#f59e0b', // Amber
      'Testing': '#ec4899', // Pink
      'Security': '#ef4444', // Red
    };
    
    for (const [key, color] of Object.entries(colors)) {
      if (role.includes(key)) return color;
    }
    
    return '#6b7280'; // Gray default
  }
  
  private getIconForRole(role: string): string {
    const icons: Record<string, string> = {
      'Billing': '💰',
      'Backend': '⚙️',
      'Frontend': '🎨',
      'Infrastructure': '🖥️',
      'Testing': '🧪',
      'Security': '🔒',
    };
    
    for (const [key, icon] of Object.entries(icons)) {
      if (role.includes(key)) return icon;
    }
    
    return '🤖';
  }
  
  private generateGenericPersonality(agentId: string): AgentPersonality {
    return {
      name: `Agent ${agentId}`,
      role: 'General Purpose Agent',
      description: 'Versatile AI agent ready to help with various tasks',
      traits: ['adaptable', 'helpful', 'efficient'],
      communicationStyle: 'friendly',
      expertise: ['General Programming', 'Problem Solving'],
    };
  }
  
  /**
   * Get agent greeting message
   */
  getGreeting(agentId: string): string {
    const identity = this.identities.get(agentId);
    if (!identity) return 'Hello!';
    
    const { personality } = identity;
    const hour = new Date().getHours();
    
    let timeGreeting = 'Hello';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';
    
    const style = personality.communicationStyle;
    
    if (style === 'formal') {
      return `${timeGreeting}. I am ${personality.name}, ${personality.role}. How may I assist you today?`;
    } else if (style === 'technical') {
      return `${timeGreeting}! ${personality.name} here. Ready to tackle some ${personality.expertise[0]} challenges?`;
    } else {
      return `Hey there! ${personality.name} at your service! ${personality.quirks?.[0] || ''}`;
    }
  }
}

export { AgentIdentityManager, AgentIdentity, AgentPersonality, AgentVisual, AgentPresence };
