import { Hono } from 'hono';

export const webhookRoutes = new Hono();

webhookRoutes.post('/whmcs', async (c) => {
  const body = await c.req.json();
  
  // TODO: Handle WHMCS webhooks
  console.log('WHMCS Webhook received:', body);
  
  return c.json({ success: true });
});

webhookRoutes.post('/instance-ready', async (c) => {
  const body = await c.req.json();
  
  // TODO: Handle instance ready callback from cloud-init
  console.log('Instance ready callback:', body);
  
  return c.json({ success: true });
});
