// Plans configuration
export const PLANS = {
  starter: {
    name: 'Starter',
    description: 'Perfect for personal use',
    price: 9,
    serverType: 'cpx11',
    specs: {
      cpu: 2,
      memory: 4, // GB
      disk: 40, // GB
      bandwidth: 20 // TB
    }
  },
  professional: {
    name: 'Professional',
    description: 'For power users and small teams',
    price: 29,
    serverType: 'cpx31',
    specs: {
      cpu: 4,
      memory: 8,
      disk: 160,
      bandwidth: 20
    }
  },
  enterprise: {
    name: 'Enterprise',
    description: 'For businesses with high demands',
    price: 99,
    serverType: 'cpx51',
    specs: {
      cpu: 8,
      memory: 16,
      disk: 240,
      bandwidth: 20
    }
  }
} as const;

// Regions configuration
export const REGIONS = {
  'eu-frankfurt': {
    name: 'Frankfurt',
    location: 'fsn1',
    country: 'Germany'
  },
  'eu-helsinki': {
    name: 'Helsinki',
    location: 'hel1',
    country: 'Finland'
  },
  'us-ashburn': {
    name: 'Ashburn',
    location: 'ash',
    country: 'USA'
  },
  'us-hillsboro': {
    name: 'Hillsboro',
    location: 'hil',
    country: 'USA'
  },
  'ap-singapore': {
    name: 'Singapore',
    location: 'sin',
    country: 'Singapore'
  }
} as const;

// API Constants
export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// JWT Constants
export const JWT_EXPIRY = '24h';
export const JWT_REFRESH_EXPIRY = '7d';

// Rate limiting
export const RATE_LIMITS = {
  public: { requests: 30, window: 60 }, // 30 req/min
  authenticated: { requests: 100, window: 60 }, // 100 req/min
  admin: { requests: 200, window: 60 } // 200 req/min
} as const;
