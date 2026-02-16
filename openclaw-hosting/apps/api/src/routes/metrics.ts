import { Hono } from 'hono';

export const metricsRoutes = new Hono();

metricsRoutes.get('/:instanceId', (c) => {
  const instanceId = c.req.param('instanceId');
  
  // TODO: Return metrics for instance
  return c.json({
    instanceId,
    cpu: { usage: 45, cores: 4 },
    memory: { used: 4.2, total: 8, unit: 'GB' },
    disk: { used: 25, total: 80, unit: 'GB' },
    network: { in: 1024, out: 512, unit: 'KB/s' },
    timestamp: new Date().toISOString()
  });
});

metricsRoutes.get('/:instanceId/history', (c) => {
  const instanceId = c.req.param('instanceId');
  const range = c.req.query('range') || '24h';
  
  // TODO: Return historical metrics
  return c.json({
    instanceId,
    range,
    data: []
  });
});
