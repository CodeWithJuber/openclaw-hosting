// apps/api/src/services/provisioner.ts
import { db, instances, users, webhookLog } from "@openclaw/db";
import { eq } from "drizzle-orm";
import { HetznerService, PLAN_TO_SERVER_TYPE, REGION_TO_LOCATION } from "./hetzner.js";
import { CloudflareService } from "./cloudflare.js";
import { generateSubdomain, generateCallbackToken } from "../utils/crypto.js";
import { renderCloudInit } from "./cloudinit.js";

export interface ProvisionInstanceParams {
  userId: string;
  whmcs_service_id: number;
  whmcs_client_id: number;
  plan: string;
  region: string;
  email: string;
  hostname?: string;
  ssh_key_ids?: string[];
  ai_preset?: string;
}

export class Provisioner {
  private hetzner: HetznerService;
  private cloudflare: CloudflareService;

  constructor() {
    const hetznerToken = process.env.HETZNER_API_TOKEN;
    const cfToken = process.env.CLOUDFLARE_API_TOKEN;
    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;

    if (!hetznerToken) {
      throw new Error("HETZNER_API_TOKEN environment variable is required");
    }
    if (!cfToken || !cfZoneId) {
      throw new Error("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID environment variables are required");
    }

    this.hetzner = new HetznerService(hetznerToken);
    this.cloudflare = new CloudflareService(cfToken, cfZoneId);
  }

  /**
   * Provision a new OpenClaw instance
   */
  async provisionInstance(params: ProvisionInstanceParams) {
    const subdomain = params.hostname || generateSubdomain();
    const callbackToken = generateCallbackToken();

    // Validate plan and region
    const serverType = PLAN_TO_SERVER_TYPE[params.plan];
    const location = REGION_TO_LOCATION[params.region];

    if (!serverType) {
      throw new Error(`Invalid plan: ${params.plan}`);
    }
    if (!location) {
      throw new Error(`Invalid region: ${params.region}`);
    }

    // Create database record first
    const [instance] = await db.insert(instances).values({
      user_id: params.userId,
      whmcs_service_id: params.whmcs_service_id,
      plan: params.plan as any,
      region: params.region as any,
      subdomain,
      callback_token: callbackToken,
      provision_started_at: new Date(),
      status: "provisioning",
    }).returning();

    try {
      // Log provisioning start
      await db.insert(webhookLog).values({
        source: "provisioner",
        event: "provision_start",
        payload: { instance_id: instance.id, subdomain, plan: params.plan, region: params.region },
        status: "received",
      });

      // Generate cloud-init user data
      const callbackUrl = `${process.env.API_URL || "http://localhost:2222"}/api/instances/${instance.id}/ready`;
      const userData = renderCloudInit({
        subdomain,
        callbackToken,
        callbackUrl,
        aiPreset: params.ai_preset,
        openclawVersion: process.env.OPENCLAW_VERSION || "latest",
      });

      // Create Hetzner server
      const server = await this.hetzner.createServer({
        name: `openclaw-${subdomain}`,
        server_type: serverType,
        location,
        user_data: userData,
        labels: {
          managed_by: "openclaw",
          instance_id: instance.id,
          whmcs_service_id: params.whmcs_service_id.toString(),
        },
      });

      // Get server IP
      const ipAddress = server.server.public_net.ipv4.ip;

      // Create DNS record
      const cfRecordId = await this.cloudflare.createARecord(subdomain, ipAddress);

      // Update database with server info
      await db.update(instances)
        .set({
          hetzner_server_id: server.server.id,
          ip_address: ipAddress,
          server_type,
          cloudflare_record_id: cfRecordId,
        })
        .where(eq(instances.id, instance.id));

      // Log success
      await db.insert(webhookLog).values({
        source: "provisioner",
        event: "provision_server_created",
        payload: { 
          instance_id: instance.id, 
          hetzner_server_id: server.server.id,
          ip_address: ipAddress,
        },
        status: "received",
      });

      return instance;

    } catch (error) {
      // Rollback on failure
      console.error(`[Provisioner] Failed to provision instance ${instance.id}:`, error);
      await this.rollback(instance.id, error as Error);
      throw error;
    }
  }

  /**
   * Handle instance ready callback from cloud-init
   */
  async handleInstanceReady(instanceId: string, token: string, data: {
    openclaw_version: string;
    gateway_port: number;
  }) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });

    if (!instance) {
      throw new Error("Instance not found");
    }

    if (instance.callback_token !== token) {
      throw new Error("Invalid callback token");
    }

    // Update instance as active
    await db.update(instances)
      .set({
        status: "active",
        openclaw_version: data.openclaw_version,
        gateway_port: data.gateway_port,
        provision_completed_at: new Date(),
        health_status: "up",
        last_health_check: new Date(),
      })
      .where(eq(instances.id, instanceId));

    // Log completion
    await db.insert(webhookLog).values({
      source: "provisioner",
      event: "provision_complete",
      payload: { 
        instance_id: instanceId, 
        openclaw_version: data.openclaw_version,
        gateway_port: data.gateway_port,
      },
      status: "received",
    });

    return { acknowledged: true };
  }

  /**
   * Suspend an instance (power off)
   */
  async suspendInstance(instanceId: string) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });

    if (!instance) {
      throw new Error("Instance not found");
    }

    if (!instance.hetzner_server_id) {
      throw new Error("Server not yet provisioned");
    }

    // Power off server
    await this.hetzner.powerOff(instance.hetzner_server_id);

    // Update database
    const [updated] = await db.update(instances)
      .set({ 
        status: "suspended", 
        suspended_at: new Date(),
        health_status: "down",
      })
      .where(eq(instances.id, instanceId))
      .returning();

    // Log action
    await db.insert(webhookLog).values({
      source: "provisioner",
      event: "instance_suspended",
      payload: { instance_id: instanceId, hetzner_server_id: instance.hetzner_server_id },
      status: "received",
    });

    return { 
      id: instanceId, 
      status: "suspended" as const, 
      suspended_at: updated.suspended_at!.toISOString(),
    };
  }

  /**
   * Unsuspend an instance (power on)
   */
  async unsuspendInstance(instanceId: string) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });

    if (!instance) {
      throw new Error("Instance not found");
    }

    if (!instance.hetzner_server_id) {
      throw new Error("Server not yet provisioned");
    }

    // Power on server
    await this.hetzner.powerOn(instance.hetzner_server_id);

    // Update database
    const [updated] = await db.update(instances)
      .set({ 
        status: "active", 
        suspended_at: null,
        health_status: "up",
        last_health_check: new Date(),
      })
      .where(eq(instances.id, instanceId))
      .returning();

    // Log action
    await db.insert(webhookLog).values({
      source: "provisioner",
      event: "instance_unsuspended",
      payload: { instance_id: instanceId, hetzner_server_id: instance.hetzner_server_id },
      status: "received",
    });

    return { 
      id: instanceId, 
      status: "active" as const, 
      unsuspended_at: new Date().toISOString(),
    };
  }

  /**
   * Terminate an instance (permanent deletion)
   */
  async terminateInstance(instanceId: string) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });

    if (!instance) {
      throw new Error("Instance not found");
    }

    // Delete Hetzner server
    if (instance.hetzner_server_id) {
      try {
        await this.hetzner.deleteServer(instance.hetzner_server_id);
      } catch (error) {
        console.error(`[Provisioner] Failed to delete Hetzner server:`, error);
        // Continue with cleanup even if Hetzner deletion fails
      }
    }

    // Delete DNS record
    if (instance.cloudflare_record_id) {
      try {
        await this.cloudflare.deleteRecord(instance.cloudflare_record_id);
      } catch (error) {
        console.error(`[Provisioner] Failed to delete DNS record:`, error);
      }
    }

    // Mark as terminated in database
    const [updated] = await db.update(instances)
      .set({ 
        status: "terminated", 
        terminated_at: new Date(),
        health_status: "down",
      })
      .where(eq(instances.id, instanceId))
      .returning();

    // Log action
    await db.insert(webhookLog).values({
      source: "provisioner",
      event: "instance_terminated",
      payload: { 
        instance_id: instanceId, 
        hetzner_server_id: instance.hetzner_server_id,
      },
      status: "received",
    });

    return { 
      id: instanceId, 
      status: "terminated" as const, 
      terminated_at: updated.terminated_at!.toISOString(),
      data_deleted: true,
    };
  }

  /**
   * Reboot an instance
   */
  async rebootInstance(instanceId: string) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });

    if (!instance) {
      throw new Error("Instance not found");
    }

    if (!instance.hetzner_server_id) {
      throw new Error("Server not yet provisioned");
    }

    // Reboot server
    await this.hetzner.reboot(instance.hetzner_server_id);

    // Update database
    await db.update(instances)
      .set({ 
        status: "rebooting",
        health_status: "unknown",
      })
      .where(eq(instances.id, instanceId));

    // Log action
    await db.insert(webhookLog).values({
      source: "provisioner",
      event: "instance_reboot",
      payload: { instance_id: instanceId, hetzner_server_id: instance.hetzner_server_id },
      status: "received",
    });

    return { 
      id: instanceId, 
      status: "rebooting" as const, 
      estimated_ready: 60,
    };
  }

  /**
   * Resize an instance (change plan)
   */
  async resizeInstance(instanceId: string, newPlan: string) {
    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });

    if (!instance) {
      throw new Error("Instance not found");
    }

    if (!instance.hetzner_server_id) {
      throw new Error("Server not yet provisioned");
    }

    const newServerType = PLAN_TO_SERVER_TYPE[newPlan];
    if (!newServerType) {
      throw new Error(`Invalid plan: ${newPlan}`);
    }

    const oldPlan = instance.plan;

    // Shutdown, resize, and restart
    await this.hetzner.shutdown(instance.hetzner_server_id);
    
    // Wait for shutdown (with timeout)
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const { server } = await this.hetzner.getServer(instance.hetzner_server_id);
      if (server.status === "off") break;
      attempts++;
    }

    // Change type
    await this.hetzner.changeType(instance.hetzner_server_id, newServerType);

    // Power on
    await this.hetzner.powerOn(instance.hetzner_server_id);

    // Update database
    await db.update(instances)
      .set({ 
        status: "active",
        plan: newPlan as any,
        server_type: newServerType,
      })
      .where(eq(instances.id, instanceId));

    // Log action
    await db.insert(webhookLog).values({
      source: "provisioner",
      event: "instance_resized",
      payload: { 
        instance_id: instanceId, 
        old_plan: oldPlan,
        new_plan: newPlan,
      },
      status: "received",
    });

    return { 
      id: instanceId, 
      old_plan: oldPlan,
      new_plan: newPlan,
      status: "active" as const,
    };
  }

  /**
   * Rollback partial provisioning on failure
   */
  private async rollback(instanceId: string, error: Error) {
    console.log(`[Provisioner] Rolling back instance ${instanceId}`);

    const instance = await db.query.instances.findFirst({
      where: eq(instances.id, instanceId),
    });

    if (!instance) return;

    // Clean up Hetzner server
    if (instance.hetzner_server_id) {
      try {
        await this.hetzner.deleteServer(instance.hetzner_server_id);
      } catch (e) {
        console.error(`[Provisioner] Failed to cleanup Hetzner server:`, e);
      }
    }

    // Clean up DNS record
    if (instance.cloudflare_record_id) {
      try {
        await this.cloudflare.deleteRecord(instance.cloudflare_record_id);
      } catch (e) {
        console.error(`[Provisioner] Failed to cleanup DNS record:`, e);
      }
    }

    // Mark as error in database
    await db.update(instances)
      .set({ 
        status: "error", 
        provision_error: error.message,
      })
      .where(eq(instances.id, instanceId));

    // Log error
    await db.insert(webhookLog).values({
      source: "provisioner",
      event: "provision_failed",
      payload: { instance_id: instanceId, error: error.message },
      status: "error",
      error: error.message,
    });
  }
}
