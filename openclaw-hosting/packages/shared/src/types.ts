// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Instance types
export type InstanceStatus = 'provisioning' | 'active' | 'suspended' | 'terminated' | 'error';
export type InstancePlan = 'starter' | 'professional' | 'enterprise';

export interface InstanceConfig {
  channels?: string[];
  aiSettings?: {
    defaultModel?: string;
    apiKeys?: Record<string, string>;
  };
  skills?: string[];
}

// User types (duplicated from db for shared usage)
export interface User {
  id: number;
  whmcsClientId: number | null;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// Instance types (duplicated from db for shared usage)
export interface Instance {
  id: number;
  userId: number;
  whmcsServiceId: number | null;
  hostname: string;
  hetznerServerId: string | null;
  ipAddress: string | null;
  plan: string;
  region: string;
  serverType: string | null;
  status: string;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
  provisionedAt: Date | null;
  suspendedAt: Date | null;
  terminatedAt: Date | null;
}

// Metrics types
export interface InstanceMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    unit: string;
  };
  disk: {
    used: number;
    total: number;
    unit: string;
  };
  network: {
    in: number;
    out: number;
    unit: string;
  };
  timestamp: string;
}

// WHMCS types
export interface WHMCSPayload {
  action: string;
  serviceId: number;
  clientId: number;
  plan: InstancePlan;
  region: string;
  email: string;
}

// Auth types
export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthContext {
  userId: string;
  email: string;
  role: 'customer' | 'admin';
}
