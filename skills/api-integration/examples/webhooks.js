const { WebhookReceiver } = require('../webhooks/webhook-receiver');
const express = require('express');

/**
 * Example: Webhook Handling
 * 
 * This example demonstrates how to receive and verify webhooks
 * from various providers.
 */

/**
 * Example 1: Basic Webhook Receiver
 */
function basicWebhookExample() {
  const app = express();
  app.use(express.json());
  
  const receiver = new WebhookReceiver({
    secret: process.env.WEBHOOK_SECRET,
    algorithm: 'sha256',
    signatureHeader: 'x-webhook-signature',
    timestampHeader: 'x-webhook-timestamp',
    maxAge: 300000 // 5 minutes
  });
  
  app.post('/webhooks', receiver.middleware(), (req, res) => {
    const event = req.webhookEvent;
    
    console.log('Received webhook:', event.type);
    
    switch (event.type) {
      case 'user.created':
        handleUserCreated(event.data);
        break;
      case 'user.updated':
        handleUserUpdated(event.data);
        break;
      case 'payment.success':
        handlePaymentSuccess(event.data);
        break;
      case 'payment.failed':
        handlePaymentFailed(event.data);
        break;
      default:
        console.log('Unknown event type:', event.type);
    }
    
    res.status(200).json({ received: true });
  });
  
  function handleUserCreated(data) {
    console.log('New user created:', data.id);
    // Add to database, send welcome email, etc.
  }
  
  function handleUserUpdated(data) {
    console.log('User updated:', data.id);
    // Update user record
  }
  
  function handlePaymentSuccess(data) {
    console.log('Payment succeeded:', data.id);
    // Fulfill order, send receipt, etc.
  }
  
  function handlePaymentFailed(data) {
    console.log('Payment failed:', data.id);
    // Notify user, retry logic, etc.
  }
  
  app.listen(3000, () => {
    console.log('Webhook server listening on port 3000');
  });
}

/**
 * Example 2: Stripe Webhook Handler
 */
function stripeWebhookExample() {
  const app = express();
  
  // Stripe requires raw body for signature verification
  app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
  
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  app.post('/webhooks/stripe', (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful!');
        handlePaymentIntentSucceeded(paymentIntent);
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('PaymentMethod was attached to a Customer!');
        break;
      case 'invoice.paid':
        const invoice = event.data.object;
        console.log('Invoice was paid!');
        handleInvoicePaid(invoice);
        break;
      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log('Subscription created!');
        handleSubscriptionCreated(subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  });
  
  function handlePaymentIntentSucceeded(paymentIntent) {
    // Fulfill the purchase
    console.log('Fulfilling order for PaymentIntent:', paymentIntent.id);
  }
  
  function handleInvoicePaid(invoice) {
    // Handle subscription payment
    console.log('Invoice paid:', invoice.id);
  }
  
  function handleSubscriptionCreated(subscription) {
    // Handle new subscription
    console.log('New subscription:', subscription.id);
  }
  
  app.listen(3000);
}

/**
 * Example 3: GitHub Webhook Handler
 */
function githubWebhookExample() {
  const app = express();
  app.use(express.json());
  
  const crypto = require('crypto');
  
  app.post('/webhooks/github', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
    
    if (signature !== digest) {
      return res.status(401).send('Invalid signature');
    }
    
    const event = req.headers['x-github-event'];
    const payload = req.body;
    
    console.log('GitHub event:', event);
    
    switch (event) {
      case 'push':
        handlePush(payload);
        break;
      case 'pull_request':
        handlePullRequest(payload);
        break;
      case 'issues':
        handleIssues(payload);
        break;
      case 'release':
        handleRelease(payload);
        break;
      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }
    
    res.status(200).send('OK');
  });
  
  function handlePush(payload) {
    console.log(`Push to ${payload.repository.full_name}:${payload.ref}`);
    // Trigger CI/CD, update cache, etc.
  }
  
  function handlePullRequest(payload) {
    const action = payload.action;
    const pr = payload.pull_request;
    console.log(`PR #${pr.number} ${action}: ${pr.title}`);
    
    if (action === 'opened' || action === 'synchronize') {
      // Run tests, code review, etc.
    }
  }
  
  function handleIssues(payload) {
    console.log(`Issue #${payload.issue.number} ${payload.action}`);
  }
  
  function handleRelease(payload) {
    if (payload.action === 'published') {
      console.log('New release published:', payload.release.tag_name);
      // Deploy to production, notify users, etc.
    }
  }
  
  app.listen(3000);
}

/**
 * Example 4: Sending Webhooks with Signature
 */
function sendWebhookExample() {
  const { WebhookReceiver } = require('../webhooks/webhook-receiver');
  
  // Create a receiver to generate signatures
  const sender = new WebhookReceiver({
    secret: 'my-webhook-secret',
    signatureHeader: 'x-webhook-signature',
    timestampHeader: 'x-webhook-timestamp'
  });
  
  // Payload to send
  const payload = {
    type: 'order.created',
    data: {
      orderId: '12345',
      amount: 99.99,
      currency: 'USD'
    }
  };
  
  // Generate signature
  const { signature, timestamp, headers } = sender.signPayload(payload);
  
  // Send webhook
  const axios = require('axios');
  axios.post('https://partner.com/webhooks', payload, {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }).then(() => {
    console.log('Webhook sent successfully');
  }).catch(err => {
    console.error('Failed to send webhook:', err.message);
  });
}

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('Webhook examples defined. Uncomment the example you want to run.');
  // basicWebhookExample();
  // stripeWebhookExample();
  // githubWebhookExample();
}

module.exports = {
  basicWebhookExample,
  stripeWebhookExample,
  githubWebhookExample,
  sendWebhookExample
};
