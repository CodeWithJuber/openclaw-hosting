import { z } from 'zod';

// Instance validators
export const createInstanceSchema = z.object({
  whmcs_service_id: z.number().int().positive(),
  whmcs_client_id: z.number().int().positive(),
  plan: z.enum(['starter', 'professional', 'enterprise']),
  region: z.string().min(1),
  email: z.string().email()
});

export const updateInstanceSchema = z.object({
  plan: z.enum(['starter', 'professional', 'enterprise']).optional(),
  config: z.record(z.unknown()).optional()
});

// Auth validators
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional()
});

// Metrics validators
export const metricsQuerySchema = z.object({
  range: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  interval: z.enum(['1m', '5m', '1h', '1d']).optional()
});

// Pagination validators
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// WHMCS webhook validators
export const whmcsWebhookSchema = z.object({
  action: z.string(),
  service_id: z.number().optional(),
  client_id: z.number().optional(),
  data: z.record(z.unknown()).optional()
});
