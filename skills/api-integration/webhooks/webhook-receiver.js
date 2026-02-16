const crypto = require('crypto');

/**
 * Webhook receiver with signature verification
 */
class WebhookReceiver {
  constructor(config) {
    this.secret = config.secret;
    this.algorithm = config.algorithm || 'sha256';
    this.signatureHeader = config.signatureHeader || 'x-webhook-signature';
    this.timestampHeader = config.timestampHeader || 'x-webhook-timestamp';
    this.maxAge = config.maxAge || 300000; // 5 minutes default
  }
  
  /**
   * Express middleware for webhook handling
   */
  middleware() {
    return (req, res, next) => {
      try {
        const payload = JSON.stringify(req.body);
        const signature = req.headers[this.signatureHeader.toLowerCase()];
        const timestamp = req.headers[this.timestampHeader.toLowerCase()];
        
        if (!signature) {
          return res.status(401).json({ error: 'Missing signature' });
        }
        
        if (!this.verifySignature(payload, signature, timestamp)) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
        
        req.webhookEvent = req.body;
        next();
      } catch (error) {
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }
    };
  }
  
  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature, timestamp) {
    // Check timestamp if provided
    if (timestamp && this.maxAge) {
      const now = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(timestamp);
      if (now - webhookTime > this.maxAge / 1000) {
        return false;
      }
    }
    
    // Compute expected signature
    const expectedSignature = this.computeSignature(payload, timestamp);
    
    // Constant-time comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }
  
  /**
   * Compute expected signature
   */
  computeSignature(payload, timestamp) {
    const data = timestamp ? `${timestamp}.${payload}` : payload;
    return crypto
      .createHmac(this.algorithm, this.secret)
      .update(data)
      .digest('hex');
  }
  
  /**
   * Generate signature for sending webhooks
   */
  signPayload(payload, timestamp = Math.floor(Date.now() / 1000)) {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signature = this.computeSignature(payloadStr, timestamp);
    
    return {
      signature,
      timestamp,
      headers: {
        [this.signatureHeader]: signature,
        [this.timestampHeader]: timestamp.toString()
      }
    };
  }
}

/**
 * Webhook event parser with schema validation
 */
class WebhookParser {
  constructor(config = {}) {
    this.schema = config.schema;
  }
  
  parse(payload) {
    if (this.schema) {
      return this.schema.parse(payload);
    }
    return payload;
  }
}

module.exports = { WebhookReceiver, WebhookParser };
