import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const authRoutes = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email } = c.req.valid('json');
  
  // TODO: Implement JWT authentication
  return c.json({
    success: true,
    message: 'Login endpoint - implement JWT auth',
    email
  });
});

authRoutes.post('/logout', (c) => {
  return c.json({ success: true, message: 'Logged out' });
});

authRoutes.get('/me', (c) => {
  // TODO: Return authenticated user
  return c.json({
    id: 'temp-user-id',
    email: 'user@example.com',
    role: 'customer'
  });
});
