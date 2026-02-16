const { AxiosClient } = require('../clients/axios-client');

/**
 * Stripe API client
 */
class StripeClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.STRIPE_SECRET_KEY;
    this.apiVersion = config.apiVersion || '2023-10-16';
    this.baseURL = config.baseURL || 'https://api.stripe.com';
    
    this.client = new AxiosClient({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Stripe-Version': this.apiVersion
      },
      retry: config.retry || {
        maxRetries: 3,
        retryCondition: (error) => {
          // Retry on rate limit or server errors
          return error.response?.status === 429 || error.response?.status >= 500;
        }
      }
    });
    
    // Webhook handling
    this.webhookSecret = config.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
  }
  
  // Customers
  get customers() {
    return {
      create: (params) => this.client.post('/v1/customers', this.toFormData(params)),
      retrieve: (id) => this.client.get(`/v1/customers/${id}`),
      update: (id, params) => this.client.post(`/v1/customers/${id}`, this.toFormData(params)),
      del: (id) => this.client.delete(`/v1/customers/${id}`),
      list: (params = {}) => this.client.get('/v1/customers', { params })
    };
  }
  
  // Payment Intents
  get paymentIntents() {
    return {
      create: (params) => this.client.post('/v1/payment_intents', this.toFormData(params)),
      retrieve: (id) => this.client.get(`/v1/payment_intents/${id}`),
      update: (id, params) => this.client.post(`/v1/payment_intents/${id}`, this.toFormData(params)),
      confirm: (id, params) => this.client.post(`/v1/payment_intents/${id}/confirm`, this.toFormData(params)),
      cancel: (id, params) => this.client.post(`/v1/payment_intents/${id}/cancel`, this.toFormData(params)),
      capture: (id, params) => this.client.post(`/v1/payment_intents/${id}/capture`, this.toFormData(params))
    };
  }
  
  // Subscriptions
  get subscriptions() {
    return {
      create: (params) => this.client.post('/v1/subscriptions', this.toFormData(params)),
      retrieve: (id) => this.client.get(`/v1/subscriptions/${id}`),
      update: (id, params) => this.client.post(`/v1/subscriptions/${id}`, this.toFormData(params)),
      cancel: (id, params) => this.client.delete(`/v1/subscriptions/${id}`, { params }),
      list: (params = {}) => this.client.get('/v1/subscriptions', { params })
    };
  }
  
  // Products
  get products() {
    return {
      create: (params) => this.client.post('/v1/products', this.toFormData(params)),
      retrieve: (id) => this.client.get(`/v1/products/${id}`),
      update: (id, params) => this.client.post(`/v1/products/${id}`, this.toFormData(params)),
      del: (id) => this.client.delete(`/v1/products/${id}`),
      list: (params = {}) => this.client.get('/v1/products', { params })
    };
  }
  
  // Prices
  get prices() {
    return {
      create: (params) => this.client.post('/v1/prices', this.toFormData(params)),
      retrieve: (id) => this.client.get(`/v1/prices/${id}`),
      update: (id, params) => this.client.post(`/v1/prices/${id}`, this.toFormData(params)),
      list: (params = {}) => this.client.get('/v1/prices', { params })
    };
  }
  
  // Invoices
  get invoices() {
    return {
      create: (params) => this.client.post('/v1/invoices', this.toFormData(params)),
      retrieve: (id) => this.client.get(`/v1/invoices/${id}`),
      update: (id, params) => this.client.post(`/v1/invoices/${id}`, this.toFormData(params)),
      finalize: (id) => this.client.post(`/v1/invoices/${id}/finalize`),
      pay: (id, params) => this.client.post(`/v1/invoices/${id}/pay`, this.toFormData(params)),
      void: (id) => this.client.post(`/v1/invoices/${id}/void`),
      list: (params = {}) => this.client.get('/v1/invoices', { params })
    };
  }
  
  // Checkout Sessions
  get checkout = {
    sessions: {
      create: (params) => this.client.post('/v1/checkout/sessions', this.toFormData(params)),
      retrieve: (id) => this.client.get(`/v1/checkout/sessions/${id}`),
      list: (params = {}) => this.client.get('/v1/checkout/sessions', { params })
    }
  };
  
  // Webhooks
  get webhooks() {
    return {
      constructEvent: (payload, signature, secret) => {
        const crypto = require('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', secret || this.webhookSecret)
          .update(payload, 'utf8')
          .digest('hex');
        
        const isValid = crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(`t=${Date.now()},v1=${expectedSignature}`)
        );
        
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
        
        return JSON.parse(payload);
      }
    };
  }
  
  // Convert params to form data format (Stripe uses form encoding)
  toFormData(params) {
    const formData = new URLSearchParams();
    this.flattenParams(params, '', formData);
    return formData;
  }
  
  flattenParams(params, prefix, formData) {
    if (params === null || params === undefined) return;
    
    if (Array.isArray(params)) {
      params.forEach((value, i) => {
        this.flattenParams(value, `${prefix}[${i}]`, formData);
      });
    } else if (typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        const newPrefix = prefix ? `${prefix}[${key}]` : key;
        this.flattenParams(value, newPrefix, formData);
      });
    } else {
      formData.append(prefix, String(params));
    }
  }
}

module.exports = { StripeClient };
