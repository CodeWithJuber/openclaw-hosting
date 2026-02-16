import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const instanceRoutes = new Hono();

const createInstanceSchema = z.object({
  whmcs_service_id: z.number(),
  whmcs_client_id: z.number(),
  plan: z.enum(['starter', 'professional', 'enterprise']),
  region: z.string(),
  email: z.string().email()
});

instanceRoutes.get('/', (c) => {
  // TODO: Return instances for authenticated user
  return c.json({
    instances: []
  });
});

instanceRoutes.post('/', zValidator('json', createInstanceSchema), async (c) => {
  const data = c.req.valid('json');
  
  // TODO: Create instance in database and provision
  return c.json({
    success: true,
    message: 'Instance provisioning initiated',
    data
  }, 201);
});

instanceRoutes.get('/:id', (c) => {
  const id = c.req.param('id');
  
  // TODO: Return specific instance
  return c.json({
    id,
    status: 'active',
    plan: 'professional'
  });
});

instanceRoutes.patch('/:id', (c) => {
  const id = c.req.param('id');
  
  // TODO: Update instance
  return c.json({
    success: true,
    message: `Instance ${id} updated`
  });
});

instanceRoutes.delete('/:id', (c) => {
  const id = c.req.param('id');
  
  // TODO: Terminate instance
  return c.json({
    success: true,
    message: `Instance ${id} termination initiated`
  });
});
