import { pgTable, serial, varchar, timestamp, integer, jsonb, boolean, text, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  whmcsClientId: integer('whmcs_client_id').unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('customer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  whmcsIdx: index('whmcs_client_id_idx').on(table.whmcsClientId)
}));

export const insertUserSchema: z.ZodType<unknown> = createInsertSchema(users);
export const selectUserSchema: z.ZodType<unknown> = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;

// Instances table
export const instances = pgTable('instances', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  whmcsServiceId: integer('whmcs_service_id').unique(),
  
  // Instance details
  hostname: varchar('hostname', { length: 255 }).notNull().unique(),
  hetznerServerId: varchar('hetzner_server_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 50 }),
  
  // Configuration
  plan: varchar('plan', { length: 50 }).notNull(), // starter, professional, enterprise
  region: varchar('region', { length: 50 }).notNull(),
  serverType: varchar('server_type', { length: 50 }), // cpx11, cpx31, etc.
  
  // Status
  status: varchar('status', { length: 50 }).notNull().default('provisioning'),
  // provisioning, active, suspended, terminated, error
  
  // Metadata
  config: jsonb('config').default({}),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  provisionedAt: timestamp('provisioned_at'),
  suspendedAt: timestamp('suspended_at'),
  terminatedAt: timestamp('terminated_at')
}, (table) => ({
  userIdIdx: index('instance_user_id_idx').on(table.userId),
  statusIdx: index('instance_status_idx').on(table.status),
  hostnameIdx: index('instance_hostname_idx').on(table.hostname)
}));

export const insertInstanceSchema: z.ZodType<unknown> = createInsertSchema(instances);
export const selectInstanceSchema: z.ZodType<unknown> = createSelectSchema(instances);
export type Instance = z.infer<typeof selectInstanceSchema>;
export type NewInstance = z.infer<typeof insertInstanceSchema>;

// Metrics table
export const metrics = pgTable('metrics', {
  id: serial('id').primaryKey(),
  instanceId: integer('instance_id').references(() => instances.id).notNull(),
  
  // CPU metrics
  cpuUsage: integer('cpu_usage'), // percentage
  cpuCores: integer('cpu_cores'),
  
  // Memory metrics (in MB)
  memoryUsed: integer('memory_used'),
  memoryTotal: integer('memory_total'),
  
  // Disk metrics (in MB)
  diskUsed: integer('disk_used'),
  diskTotal: integer('disk_total'),
  
  // Network metrics (in KB/s)
  networkIn: integer('network_in'),
  networkOut: integer('network_out'),
  
  // Timestamp
  recordedAt: timestamp('recorded_at').defaultNow().notNull()
}, (table) => ({
  instanceIdIdx: index('metrics_instance_id_idx').on(table.instanceId),
  recordedAtIdx: index('metrics_recorded_at_idx').on(table.recordedAt)
}));

export const insertMetricSchema: z.ZodType<unknown> = createInsertSchema(metrics);
export const selectMetricSchema: z.ZodType<unknown> = createSelectSchema(metrics);
export type Metric = z.infer<typeof selectMetricSchema>;
export type NewMetric = z.infer<typeof insertMetricSchema>;

// API Keys table (for WHMCS integration)
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  permissions: jsonb('permissions').default(['read']),
  isActive: boolean('is_active').default(true),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const insertApiKeySchema: z.ZodType<unknown> = createInsertSchema(apiKeys);
export const selectApiKeySchema: z.ZodType<unknown> = createSelectSchema(apiKeys);
export type ApiKey = z.infer<typeof selectApiKeySchema>;
export type NewApiKey = z.infer<typeof insertApiKeySchema>;

// Audit log
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  instanceId: integer('instance_id').references(() => instances.id),
  action: varchar('action', { length: 100 }).notNull(),
  details: jsonb('details').default({}),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('audit_user_id_idx').on(table.userId),
  actionIdx: index('audit_action_idx').on(table.action),
  createdAtIdx: index('audit_created_at_idx').on(table.createdAt)
}));

export const insertAuditLogSchema: z.ZodType<unknown> = createInsertSchema(auditLogs);
export const selectAuditLogSchema: z.ZodType<unknown> = createSelectSchema(auditLogs);
export type AuditLog = z.infer<typeof selectAuditLogSchema>;
export type NewAuditLog = z.infer<typeof insertAuditLogSchema>;
