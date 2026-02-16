// packages/shared/src/types.ts
import { z } from "zod";

// ─── Enums ───
export const PlanSchema = z.enum(["starter", "professional", "enterprise"]);
export const RegionSchema = z.enum([
  "us-east",
  "us-west", 
  "eu-frankfurt",
  "eu-helsinki",
  "sg-singapore",
  "jp-tokyo"
]);
export const InstanceStatusSchema = z.enum([
  "provisioning",
  "active",
  "suspended",
  "terminated",
  "error",
  "rebooting",
  "resizing"
]);
export const UserRoleSchema = z.enum(["client", "admin", "reseller"]);
export const AIPresetSchema = z.enum(["anthropic", "openai", "ollama", "multi"]);

// ─── Instance Routes ───
export const CreateInstanceRequestSchema = z.object({
  whmcs_service_id: z.number().int().positive(),
  whmcs_client_id: z.number().int().positive(),
  plan: PlanSchema,
  region: RegionSchema,
  email: z.string().email(),
  hostname: z.string().regex(/^[a-z0-9-]{3,30}$/).optional(),
  ssh_key_ids: z.array(z.string().uuid()).max(5).optional(),
  ai_preset: AIPresetSchema.optional(),
});

export const CreateInstanceResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("provisioning"),
  subdomain: z.string(),
  url: z.string().url(),
  estimated_ready: z.number().int(),
});

export const InstanceResponseSchema = z.object({
  id: z.string().uuid(),
  status: InstanceStatusSchema,
  plan: z.string(),
  region: z.string(),
  ip_address: z.string().nullable(),
  subdomain: z.string(),
  url: z.string().url(),
  openclaw_version: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  whmcs_service_id: z.number(),
  server: z.object({
    hetzner_id: z.number(),
    server_type: z.string(),
    datacenter: z.string(),
  }),
  dns: z.object({
    subdomain: z.string(),
    cloudflare_record_id: z.string(),
  }),
  health: z.object({
    last_check: z.string().datetime().nullable(),
    gateway_status: z.enum(["up", "down", "unknown"]),
    uptime_percent: z.number(),
  }),
});

export const SuspendInstanceResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("suspended"),
  suspended_at: z.string().datetime(),
});

export const UnsuspendInstanceResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("active"),
  unsuspended_at: z.string().datetime(),
});

export const TerminateInstanceResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("terminated"),
  terminated_at: z.string().datetime(),
  data_deleted: z.boolean(),
});

export const RebootInstanceResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("rebooting"),
  estimated_ready: z.number().int(),
});

export const ResizeInstanceRequestSchema = z.object({
  new_plan: PlanSchema,
});

export const ResizeInstanceResponseSchema = z.object({
  id: z.string().uuid(),
  old_plan: z.string(),
  new_plan: z.string(),
  status: z.literal("resizing"),
});

// ─── Metrics ───
export const MetricsResponseSchema = z.object({
  current: z.object({
    cpu_percent: z.number(),
    ram_used_mb: z.number(),
    ram_total_mb: z.number(),
    disk_used_gb: z.number(),
    disk_total_gb: z.number(),
    bandwidth_used_gb: z.number(),
    bandwidth_total_gb: z.number(),
  }),
  history: z.object({
    timestamps: z.array(z.string().datetime()),
    cpu: z.array(z.number()),
    ram: z.array(z.number()),
    disk: z.array(z.number()),
    network_in: z.array(z.number()),
    network_out: z.array(z.number()),
  }),
  period: z.enum(["1h", "24h", "7d", "30d"]),
});

// ─── Logs ───
export const LogsResponseSchema = z.object({
  instance_id: z.string().uuid(),
  logs: z.array(z.object({
    timestamp: z.string().datetime(),
    level: z.enum(["info", "warn", "error", "debug"]),
    message: z.string(),
    source: z.enum(["openclaw", "nginx", "system"]),
  })),
  has_more: z.boolean(),
  next_cursor: z.string().optional(),
});

// ─── Config ───
export const UpdateConfigRequestSchema = z.object({
  agent: z.object({
    model: z.string().optional(),
  }).optional(),
  api_keys: z.object({
    anthropic: z.string().optional(),
    openai: z.string().optional(),
    custom: z.record(z.string()).optional(),
  }).optional(),
  channels: z.object({
    whatsapp: z.object({ enabled: z.boolean() }).optional(),
    telegram: z.object({ enabled: z.boolean(), bot_token: z.string().optional() }).optional(),
    discord: z.object({ enabled: z.boolean() }).optional(),
    slack: z.object({ enabled: z.boolean() }).optional(),
  }).optional(),
});

export const UpdateConfigResponseSchema = z.object({
  id: z.string().uuid(),
  config_updated: z.boolean(),
  restart_required: z.boolean(),
});

// ─── AI Usage ───
export const AIUsageResponseSchema = z.object({
  instance_id: z.string().uuid(),
  period: z.enum(["today", "7d", "30d"]),
  total_cost_usd: z.number(),
  total_tokens_in: z.number(),
  total_tokens_out: z.number(),
  by_model: z.array(z.object({
    model: z.string(),
    tokens_in: z.number(),
    tokens_out: z.number(),
    cost_usd: z.number(),
    request_count: z.number(),
  })),
  daily: z.array(z.object({
    date: z.string(),
    cost_usd: z.number(),
    tokens: z.number(),
  })),
});

// ─── Auth ───
export const SSORequestSchema = z.object({
  client_id: z.number().int(),
  service_id: z.number().int(),
  email: z.string().email(),
  timestamp: z.number().int(),
  signature: z.string(),
});

export const SSOResponseSchema = z.object({
  token: z.string(),
  redirect_url: z.string().url(),
  expires_in: z.number().int(),
});

// ─── Webhooks ───
export const WebhookRequestSchema = z.object({
  event: z.string(),
  service_id: z.number().int(),
  client_id: z.number().int(),
  data: z.record(z.any()),
});

export const WebhookResponseSchema = z.object({
  received: z.boolean(),
});

// ─── Instance Ready Callback ───
export const InstanceReadyRequestSchema = z.object({
  openclaw_version: z.string(),
  gateway_port: z.number().int(),
});

export const InstanceReadyResponseSchema = z.object({
  acknowledged: z.boolean(),
});

// ─── Health ───
export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  version: z.string(),
  uptime: z.number(),
  db: z.enum(["connected", "disconnected"]),
  timestamp: z.string().datetime(),
});

// ─── Error ───
export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.record(z.string()).optional(),
});

// ─── Admin ───
export const AdminInstancesResponseSchema = z.object({
  instances: z.array(InstanceResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    total_pages: z.number(),
  }),
  summary: z.object({
    total_active: z.number(),
    total_suspended: z.number(),
    total_provisioning: z.number(),
    total_revenue_mrr: z.number(),
  }),
});

// Type exports
export type Plan = z.infer<typeof PlanSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type InstanceStatus = z.infer<typeof InstanceStatusSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type AIPreset = z.infer<typeof AIPresetSchema>;

export type CreateInstanceRequest = z.infer<typeof CreateInstanceRequestSchema>;
export type CreateInstanceResponse = z.infer<typeof CreateInstanceResponseSchema>;
export type InstanceResponse = z.infer<typeof InstanceResponseSchema>;
export type SuspendInstanceResponse = z.infer<typeof SuspendInstanceResponseSchema>;
export type UnsuspendInstanceResponse = z.infer<typeof UnsuspendInstanceResponseSchema>;
export type TerminateInstanceResponse = z.infer<typeof TerminateInstanceResponseSchema>;
export type RebootInstanceResponse = z.infer<typeof RebootInstanceResponseSchema>;
export type ResizeInstanceRequest = z.infer<typeof ResizeInstanceRequestSchema>;
export type ResizeInstanceResponse = z.infer<typeof ResizeInstanceResponseSchema>;

export type MetricsResponse = z.infer<typeof MetricsResponseSchema>;
export type LogsResponse = z.infer<typeof LogsResponseSchema>;
export type UpdateConfigRequest = z.infer<typeof UpdateConfigRequestSchema>;
export type UpdateConfigResponse = z.infer<typeof UpdateConfigResponseSchema>;
export type AIUsageResponse = z.infer<typeof AIUsageResponseSchema>;

export type SSORequest = z.infer<typeof SSORequestSchema>;
export type SSOResponse = z.infer<typeof SSOResponseSchema>;
export type WebhookRequest = z.infer<typeof WebhookRequestSchema>;
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;
export type InstanceReadyRequest = z.infer<typeof InstanceReadyRequestSchema>;
export type InstanceReadyResponse = z.infer<typeof InstanceReadyResponseSchema>;

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type AdminInstancesResponse = z.infer<typeof AdminInstancesResponseSchema>;
