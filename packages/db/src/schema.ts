// packages/db/src/schema.ts
import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, real, pgEnum } from "drizzle-orm/pg-core";

// ─── Enums ───
export const instanceStatusEnum = pgEnum("instance_status", [
  "provisioning",
  "active",
  "suspended",
  "terminated",
  "error",
  "rebooting",
  "resizing"
]);

export const planEnum = pgEnum("plan", ["starter", "professional", "enterprise"]);

export const regionEnum = pgEnum("region", [
  "us-east",
  "us-west",
  "eu-frankfurt",
  "eu-helsinki",
  "sg-singapore",
  "jp-tokyo"
]);

export const userRoleEnum = pgEnum("user_role", ["client", "admin", "reseller"]);

// ─── Users ───
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  whmcs_client_id: integer("whmcs_client_id").unique(),
  role: userRoleEnum("role").notNull().default("client"),
  firebase_uid: varchar("firebase_uid", { length: 128 }).unique(),
  display_name: varchar("display_name", { length: 255 }),
  avatar_url: text("avatar_url"),
  reseller_id: uuid("reseller_id").references(() => users.id),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Instances (OpenClaw VPS) ───
export const instances = pgTable("instances", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id),
  whmcs_service_id: integer("whmcs_service_id").unique(),
  
  status: instanceStatusEnum("status").notNull().default("provisioning"),
  plan: planEnum("plan").notNull(),
  region: regionEnum("region").notNull(),
  
  // Server details
  hetzner_server_id: integer("hetzner_server_id"),
  ip_address: varchar("ip_address", { length: 45 }),
  server_type: varchar("server_type", { length: 50 }),
  
  // DNS
  subdomain: varchar("subdomain", { length: 63 }).notNull().unique(),
  cloudflare_record_id: varchar("cloudflare_record_id", { length: 64 }),
  custom_domain: varchar("custom_domain", { length: 255 }),
  
  // OpenClaw
  openclaw_version: varchar("openclaw_version", { length: 20 }),
  gateway_port: integer("gateway_port").default(18789),
  openclaw_config: jsonb("openclaw_config"),
  
  // Provisioning
  callback_token: varchar("callback_token", { length: 64 }),
  provision_started_at: timestamp("provision_started_at"),
  provision_completed_at: timestamp("provision_completed_at"),
  provision_error: text("provision_error"),
  
  // Lifecycle
  suspended_at: timestamp("suspended_at"),
  terminated_at: timestamp("terminated_at"),
  last_health_check: timestamp("last_health_check"),
  health_status: varchar("health_status", { length: 20 }).default("unknown"),
  uptime_percent: real("uptime_percent").default(0),
  
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ─── SSH Keys ───
export const sshKeys = pgTable("ssh_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  public_key: text("public_key").notNull(),
  fingerprint: varchar("fingerprint", { length: 64 }),
  hetzner_key_id: integer("hetzner_key_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// ─── DNS Records ───
export const dnsRecords = pgTable("dns_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  instance_id: uuid("instance_id").notNull().references(() => instances.id),
  subdomain: varchar("subdomain", { length: 255 }).notNull(),
  record_type: varchar("record_type", { length: 10 }).notNull().default("A"),
  cloudflare_record_id: varchar("cloudflare_record_id", { length: 64 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// ─── Metrics (Time-Series) ───
export const metrics = pgTable("metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  instance_id: uuid("instance_id").notNull().references(() => instances.id),
  cpu_percent: real("cpu_percent"),
  ram_used_mb: integer("ram_used_mb"),
  ram_total_mb: integer("ram_total_mb"),
  disk_used_gb: real("disk_used_gb"),
  disk_total_gb: real("disk_total_gb"),
  bandwidth_in_mb: real("bandwidth_in_mb"),
  bandwidth_out_mb: real("bandwidth_out_mb"),
  recorded_at: timestamp("recorded_at").notNull().defaultNow(),
});

// ─── AI Usage ───
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  instance_id: uuid("instance_id").notNull().references(() => instances.id),
  model: varchar("model", { length: 100 }).notNull(),
  tokens_in: integer("tokens_in").notNull().default(0),
  tokens_out: integer("tokens_out").notNull().default(0),
  cost_usd: real("cost_usd").notNull().default(0),
  request_count: integer("request_count").notNull().default(0),
  date: timestamp("date").notNull(),
});

// ─── Audit Log ───
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id),
  instance_id: uuid("instance_id").references(() => instances.id),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details"),
  ip_address: varchar("ip_address", { length: 45 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// ─── Webhook Log ───
export const webhookLog = pgTable("webhook_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: varchar("source", { length: 50 }).notNull(),
  event: varchar("event", { length: 100 }).notNull(),
  payload: jsonb("payload"),
  status: varchar("status", { length: 20 }).notNull().default("received"),
  error: text("error"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
