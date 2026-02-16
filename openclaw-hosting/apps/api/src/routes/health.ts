import { Hono } from 'hono';

export const healthRoutes = new Hono();

healthRoutes.get('/', (c) => c.json({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
}));

healthRoutes.get('/ready', (c) => {
  // TODO: Check database connectivity
  return c.json({
    ready: true,
    checks: {
      database: 'ok'
    }
  });
});
