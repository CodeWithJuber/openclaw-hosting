// WhatsApp Integration for OpenClaw Hosting
// Official WhatsApp Business API integration

import { EventEmitter } from 'events';
import axios from 'axios';

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  webhookSecret: string;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
  content: any;
  context?: {
    messageId: string;
  };
}

interface WhatsAppResponse {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: string;
  [key: string]: any;
}

class WhatsAppIntegration extends EventEmitter {
  private config: WhatsAppConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';
  
  constructor(config: WhatsAppConfig) {
    super();
    this.config = config;
  }
  
  /**
   * Send text message
   */
  async sendText(to: string, text: string, previewUrl: boolean = false): Promise<void> {
    const message: WhatsAppResponse = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body: text
      }
    };
    
    await this.sendMessage(message);
  }
  
  /**
   * Send template message
   */
  async sendTemplate(to: string, templateName: string, languageCode: string = 'en', components?: any[]): Promise<void> {
    const message: WhatsAppResponse = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    };
    
    await this.sendMessage(message);
  }
  
  /**
   * Send media (image, document, video)
   */
  async sendMedia(to: string, type: 'image' | 'document' | 'video', mediaUrl: string, caption?: string): Promise<void> {
    const message: WhatsAppResponse = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type,
      [type]: {
        link: mediaUrl,
        caption
      }
    };
    
    await this.sendMessage(message);
  }
  
  /**
   * Send interactive buttons
   */
  async sendButtons(to: string, body: string, buttons: Array<{ id: string; title: string }>): Promise<void> {
    const message: WhatsAppResponse = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: body
        },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };
    
    await this.sendMessage(message);
  }
  
  /**
   * Send list message
   */
  async sendList(to: string, header: string, body: string, buttonText: string, sections: any[]): Promise<void> {
    const message: WhatsAppResponse = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: header
        },
        body: {
          text: body
        },
        action: {
          button: buttonText,
          sections
        }
      }
    };
    
    await this.sendMessage(message);
  }
  
  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }
  
  /**
   * Process incoming webhook
   */
  processWebhook(body: any, signature: string): WhatsAppMessage | null {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return null;
    }
    
    // Extract message from webhook body
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    
    if (!message) return null;
    
    const parsedMessage: WhatsAppMessage = {
      id: message.id,
      from: message.from,
      timestamp: message.timestamp,
      type: message.type,
      content: message[message.type],
      context: message.context
    };
    
    // Emit event
    this.emit('message', parsedMessage);
    
    // Auto-mark as read
    this.markAsRead(message.id);
    
    return parsedMessage;
  }
  
  /**
   * Send VPS alert to WhatsApp
   */
  async sendVPSAlert(phoneNumber: string, alert: {
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    instanceId?: string;
    metrics?: any;
  }): Promise<void> {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨'
    };
    
    const text = `${emoji[alert.severity]} *${alert.title}*

${alert.message}

${alert.instanceId ? `Instance: ${alert.instanceId}` : ''}

_Time: ${new Date().toLocaleString()}_`;
    
    await this.sendText(phoneNumber, text);
    
    // If critical, also send buttons for quick actions
    if (alert.severity === 'critical') {
      await this.sendButtons(
        phoneNumber,
        'Quick Actions:',
        [
          { id: 'restart', title: '🔄 Restart' },
          { id: 'scale', title: '⬆️ Scale Up' },
          { id: 'support', title: '🆘 Get Help' }
        ]
      );
    }
  }
  
  /**
   * Send weekly report
   */
  async sendWeeklyReport(phoneNumber: string, report: {
    totalInstances: number;
    activeInstances: number;
    apiCalls: number;
    cost: number;
    topMetrics: any[];
  }): Promise<void> {
    const text = `📊 *Weekly OpenClaw Report*

*Instances:*
• Total: ${report.totalInstances}
• Active: ${report.activeInstances}

*Usage:*
• API Calls: ${report.apiCalls.toLocaleString()}
• Cost: $${report.cost.toFixed(2)}

*Top Metrics:*
${report.topMetrics.map(m => `• ${m.name}: ${m.value}`).join('\n')}

_View full dashboard: https://dashboard.openclaw.host_`;
    
    await this.sendText(phoneNumber, text);
  }
  
  /**
   * Handle button replies
   */
  async handleButtonReply(phoneNumber: string, buttonId: string, context: any): Promise<void> {
    switch (buttonId) {
      case 'restart':
        await this.sendText(phoneNumber, '🔄 Initiating instance restart...');
        this.emit('action', { type: 'restart', phoneNumber, context });
        break;
        
      case 'scale':
        await this.sendText(phoneNumber, '⬆️ Scaling up resources...');
        this.emit('action', { type: 'scale', phoneNumber, context });
        break;
        
      case 'support':
        await this.sendText(phoneNumber, '🆘 Support ticket created. Our team will contact you shortly.');
        this.emit('action', { type: 'support', phoneNumber, context });
        break;
        
      default:
        await this.sendText(phoneNumber, '❓ Unknown action. Please use the dashboard.');
    }
  }
  
  private async sendMessage(message: WhatsAppResponse): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Message sent:', response.data.messages?.[0]?.id);
    } catch (error: any) {
      console.error('Failed to send message:', error.response?.data || error.message);
      throw error;
    }
  }
  
  private verifyWebhookSignature(body: any, signature: string): boolean {
    // In production, implement proper HMAC verification
    // For now, simple check (replace with proper implementation)
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(JSON.stringify(body))
      .digest('hex');
    
    return signature === expectedSignature;
  }
  
  /**
   * Get message templates
   */
  async getTemplates(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.config.businessAccountId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      );
      
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }
}

// Express webhook handler
export function createWhatsAppWebhook(whatsapp: WhatsAppIntegration) {
  return async (req: any, res: any) => {
    // Verify webhook (GET request from Meta)
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      if (mode === 'subscribe' && token === whatsapp['config'].webhookSecret) {
        console.log('Webhook verified');
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
      return;
    }
    
    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const signature = req.headers['x-hub-signature-256'] || '';
      const message = whatsapp.processWebhook(req.body, signature);
      
      if (message) {
        res.status(200).json({ received: true });
      } else {
        res.status(400).json({ error: 'Invalid message' });
      }
    }
  };
}

export { WhatsAppIntegration, WhatsAppConfig, WhatsAppMessage };
