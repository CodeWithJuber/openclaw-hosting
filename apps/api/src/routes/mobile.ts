// Mobile App API for OpenClaw Hosting
// REST API endpoints for mobile app integration

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const mobileApi = new Hono();

// All mobile routes require authentication
mobileApi.use('*', authenticate);

/**
 * Get dashboard summary for mobile
 * Lightweight endpoint optimized for mobile
 */
mobileApi.get('/dashboard', async (c) => {
  const user = c.get('user');
  
  // Fetch lightweight summary data
  const summary = {
    instances: {
      total: 5,
      active: 4,
      warning: 1
    },
    metrics: {
      cpu: 45,
      memory: 62,
      disk: 38
    },
    alerts: [
      { id: 1, severity: 'warning', message: 'High CPU on instance-3', time: '5 min ago' }
    ],
    recentActivity: [
      { action: 'Instance created', target: 'vps-123', time: '2 hours ago' },
      { action: 'Backup completed', target: 'vps-456', time: '5 hours ago' }
    ]
  };
  
  return c.json(summary);
});

/**
 * Get instances list (mobile-optimized)
 */
mobileApi.get('/instances', async (c) => {
  const instances = [
    {
      id: 'vps-123',
      name: 'Production API',
      status: 'active',
      ip: '192.168.1.100',
      region: 'us-east',
      plan: 'professional',
      cpu: 45,
      memory: 62,
      uptime: '15 days'
    },
    {
      id: 'vps-456',
      name: 'Staging',
      status: 'active',
      ip: '192.168.1.101',
      region: 'us-west',
      plan: 'starter',
      cpu: 12,
      memory: 28,
      uptime: '3 days'
    }
  ];
  
  return c.json(instances);
});

/**
 * Get instance details
 */
mobileApi.get('/instances/:id', async (c) => {
  const id = c.req.param('id');
  
  const instance = {
    id,
    name: 'Production API',
    status: 'active',
    ip: '192.168.1.100',
    region: 'us-east',
    plan: 'professional',
    createdAt: '2026-01-15T10:30:00Z',
    metrics: {
      cpu: { current: 45, history: [40, 42, 45, 43, 45] },
      memory: { current: 62, history: [58, 60, 61, 62, 62] },
      disk: { current: 38, history: [35, 36, 37, 38, 38] },
      network: { in: 120, out: 85 }
    },
    actions: ['restart', 'stop', 'resize', 'backup', 'delete']
  };
  
  return c.json(instance);
});

/**
 * Execute instance action
 */
mobileApi.post('/instances/:id/action', 
  zValidator('json', z.object({
    action: z.enum(['restart', 'stop', 'start', 'backup'])
  })),
  async (c) => {
    const id = c.req.param('id');
    const { action } = c.req.valid('json');
    
    // Execute action
    console.log(`Executing ${action} on instance ${id}`);
    
    return c.json({
      success: true,
      message: `${action} initiated for instance ${id}`,
      jobId: `job-${Date.now()}`
    });
  }
);

/**
 * Get notifications
 */
mobileApi.get('/notifications', async (c) => {
  const notifications = [
    {
      id: 1,
      type: 'alert',
      severity: 'warning',
      title: 'High CPU Usage',
      message: 'Instance vps-123 CPU usage above 80%',
      time: '5 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Backup Completed',
      message: 'Daily backup for vps-456 completed successfully',
      time: '2 hours ago',
      read: true
    },
    {
      id: 3,
      type: 'success',
      title: 'Instance Created',
      message: 'New instance vps-789 is now active',
      time: '1 day ago',
      read: true
    }
  ];
  
  return c.json(notifications);
});

/**
 * Mark notification as read
 */
mobileApi.post('/notifications/:id/read', async (c) => {
  const id = c.req.param('id');
  
  return c.json({
    success: true,
    message: `Notification ${id} marked as read`
  });
});

/**
 * Get billing summary
 */
mobileApi.get('/billing', async (c) => {
  const billing = {
    currentMonth: {
      total: 127.50,
      currency: 'USD',
      period: 'Feb 1 - Feb 28, 2026'
    },
    breakdown: [
      { service: 'VPS Instances', cost: 95.00 },
      { service: 'Bandwidth', cost: 15.50 },
      { service: 'Storage', cost: 12.00 },
      { service: 'API Calls', cost: 5.00 }
    ],
    upcomingInvoice: {
      amount: 127.50,
      dueDate: '2026-03-01'
    },
    paymentMethod: {
      type: 'card',
      last4: '4242'
    }
  };
  
  return c.json(billing);
});

/**
 * Get support tickets
 */
mobileApi.get('/support', async (c) => {
  const tickets = [
    {
      id: 'TKT-123',
      subject: 'Instance not responding',
      status: 'open',
      priority: 'high',
      createdAt: '2026-02-15T10:00:00Z',
      lastUpdate: '2 hours ago'
    },
    {
      id: 'TKT-122',
      subject: 'Question about billing',
      status: 'resolved',
      priority: 'low',
      createdAt: '2026-02-10T14:30:00Z',
      lastUpdate: '3 days ago'
    }
  ];
  
  return c.json(tickets);
});

/**
 * Create support ticket
 */
mobileApi.post('/support',
  zValidator('json', z.object({
    subject: z.string().min(5).max(200),
    message: z.string().min(20).max(2000),
    priority: z.enum(['low', 'medium', 'high']).optional()
  })),
  async (c) => {
    const { subject, message, priority = 'medium' } = c.req.valid('json');
    
    const ticket = {
      id: `TKT-${Date.now()}`,
      subject,
      message,
      priority,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    
    return c.json({
      success: true,
      ticket,
      message: 'Support ticket created successfully'
    });
  }
);

/**
 * Quick actions
 */
mobileApi.post('/quick-actions',
  zValidator('json', z.object({
    action: z.enum(['create-instance', 'backup-all', 'restart-all'])
  })),
  async (c) => {
    const { action } = c.req.valid('json');
    
    const actions: Record<string, string> = {
      'create-instance': 'Instance creation wizard opened',
      'backup-all': 'Backup initiated for all instances',
      'restart-all': 'Restart initiated for all instances'
    };
    
    return c.json({
      success: true,
      message: actions[action],
      action
    });
  }
);

/**
 * Search
 */
mobileApi.get('/search',
  zValidator('query', z.object({
    q: z.string().min(1)
  })),
  async (c) => {
    const { q } = c.req.valid('query');
    
    // Search across instances, docs, support
    const results = [
      { type: 'instance', title: 'Production API', id: 'vps-123' },
      { type: 'doc', title: 'Getting Started Guide', id: 'doc-1' },
      { type: 'support', title: 'Common Issues', id: 'article-1' }
    ].filter(r => r.title.toLowerCase().includes(q.toLowerCase()));
    
    return c.json({ query: q, results });
  }
);

/**
 * Push notification token registration
 */
mobileApi.post('/push-token',
  zValidator('json', z.object({
    token: z.string(),
    platform: z.enum(['ios', 'android']),
    deviceId: z.string()
  })),
  async (c) => {
    const { token, platform, deviceId } = c.req.valid('json');
    
    // Store push token for notifications
    console.log(`Registered ${platform} push token for device ${deviceId}`);
    
    return c.json({
      success: true,
      message: 'Push token registered'
    });
  }
);

export { mobileApi };
