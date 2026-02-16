import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { config } from 'dotenv';

import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { instanceRoutes } from './routes/instances.js';
import { metricsRoutes } from './routes/metrics.js';
import { webhookRoutes } from './routes/webhooks.js';
import { adminRoutes } from './routes/admin.js';

config();

const app = new Hono();

// Middleware
app.use(logger());
app.use(cors({
  origin: process.env.DASHBOARD_URL || 'http://localhost:5173',
  credentials: true
}));

// Routes
app.route('/health', healthRoutes);
app.route('/auth', authRoutes);
app.route('/instances', instanceRoutes);
app.route('/metrics', metricsRoutes);
app.route('/webhooks', webhookRoutes);
app.route('/admin', adminRoutes);

// Root
app.get('/', (c) => c.json({ 
  name: 'OpenClaw Hosting API',
  version: '0.1.0',
  status: 'ok'
}));

const port = parseInt(process.env.API_PORT || '2222');

console.log(`🚀 OpenClaw API starting on port ${port}`);

serve({
  fetch: app.fetch,
  port
});

export type AppType = typeof app;
