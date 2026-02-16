// apps/api/src/routes/webhooks.ts
import { Hono } from "hono";
import { db, webhookLog, instances } from "@openclaw/db";
import { eq } from "drizzle-orm";
import { Provisioner } from "../services/provisioner.js";
import { createHmac } from "crypto";

const app = new Hono();

const WHMCS_HMAC_SECRET = process.env.WHMCS_HMAC_SECRET;

// POST /api/webhooks/whmcs
app.post("/whmcs", async (c) => {
  const body = await c.req.json();
  
  // Verify webhook signature if provided
  const signature = c.req.header("X-Webhook-Signature");
  if (signature && WHMCS_HMAC_SECRET) {
    const expectedSig = createHmac("sha256", WHMCS_HMAC_SECRET)
      .update(JSON.stringify(body))
      .digest("hex");
    
    if (signature !== expectedSig) {
      return c.json({ error: "Invalid signature", code: "AUTH_INVALID_SIGNATURE" }, 401);
    }
  }

  // Log webhook
  await db.insert(webhookLog).values({
    source: "whmcs",
    event: body.event,
    payload: body,
    status: "received",
  });

  try {
    switch (body.event) {
      case "InvoicePaid":
        await handleInvoicePaid(body);
        break;
        
      case "InvoiceCancelled":
      case "ServiceCancelled":
        await handleServiceCancelled(body);
        break;
        
      case "ServiceUpgrade":
        await handleServiceUpgrade(body);
        break;

      case "ServiceSuspend":
        await handleServiceSuspend(body);
        break;

      case "ServiceUnsuspend":
        await handleServiceUnsuspend(body);
        break;
    }
  } catch (error) {
    console.error(`[Webhook] Error handling ${body.event}:`, error);
    
    await db.insert(webhookLog).values({
      source: "whmcs",
      event: `${body.event}_error`,
      payload: body,
      status: "error",
      error: (error as Error).message,
    });
  }
  
  return c.json({ received: true });
});

async function handleInvoicePaid(data: any) {
  // Auto-unsuspend if service was suspended for non-payment
  const serviceId = data.service_id || data.relid;
  if (!serviceId) return;

  const instance = await db.query.instances.findFirst({
    where: eq(instances.whmcs_service_id, serviceId),
  });

  if (instance?.status === "suspended") {
    const provisioner = new Provisioner();
    await provisioner.unsuspendInstance(instance.id);
  }
}

async function handleServiceCancelled(data: any) {
  const serviceId = data.service_id || data.relid;
  if (!serviceId) return;

  const instance = await db.query.instances.findFirst({
    where: eq(instances.whmcs_service_id, serviceId),
  });

  if (instance && instance.status !== "terminated") {
    const provisioner = new Provisioner();
    await provisioner.terminateInstance(instance.id);
  }
}

async function handleServiceUpgrade(data: any) {
  const serviceId = data.service_id || data.relid;
  const newPlan = data.new_plan; // This needs to be mapped from WHMCS product
  
  if (!serviceId || !newPlan) return;

  const instance = await db.query.instances.findFirst({
    where: eq(instances.whmcs_service_id, serviceId),
  });

  if (instance) {
    const provisioner = new Provisioner();
    await provisioner.resizeInstance(instance.id, newPlan);
  }
}

async function handleServiceSuspend(data: any) {
  const serviceId = data.service_id || data.relid;
  if (!serviceId) return;

  const instance = await db.query.instances.findFirst({
    where: eq(instances.whmcs_service_id, serviceId),
  });

  if (instance && instance.status === "active") {
    const provisioner = new Provisioner();
    await provisioner.suspendInstance(instance.id);
  }
}

async function handleServiceUnsuspend(data: any) {
  const serviceId = data.service_id || data.relid;
  if (!serviceId) return;

  const instance = await db.query.instances.findFirst({
    where: eq(instances.whmcs_service_id, serviceId),
  });

  if (instance?.status === "suspended") {
    const provisioner = new Provisioner();
    await provisioner.unsuspendInstance(instance.id);
  }
}

export const webhookRoutes = app;
