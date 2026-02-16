const { AxiosClient } = require('../clients/axios-client');

/**
 * Slack API client
 */
class SlackClient {
  constructor(config = {}) {
    this.token = config.token || process.env.SLACK_BOT_TOKEN;
    this.baseURL = config.baseURL || 'https://slack.com/api';
    
    this.client = new AxiosClient({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      retry: config.retry || {
        maxRetries: 3,
        retryCondition: (error) => {
          // Retry on rate limit (429) or server errors
          return error.response?.status === 429 || error.response?.status >= 500;
        }
      }
    });
  }
  
  // Chat methods
  get chat() {
    return {
      postMessage: async (params) => {
        const response = await this.client.post('/chat.postMessage', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      update: async (params) => {
        const response = await this.client.post('/chat.update', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      delete: async (params) => {
        const response = await this.client.post('/chat.delete', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      postEphemeral: async (params) => {
        const response = await this.client.post('/chat.postEphemeral', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      }
    };
  }
  
  // Users methods
  get users() {
    return {
      info: async (user) => {
        const response = await this.client.get('/users.info', { params: { user } });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      list: async (params = {}) => {
        const response = await this.client.get('/users.list', { params });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      lookupByEmail: async (email) => {
        const response = await this.client.get('/users.lookupByEmail', { params: { email } });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      }
    };
  }
  
  // Conversations methods
  get conversations() {
    return {
      list: async (params = {}) => {
        const response = await this.client.get('/conversations.list', { params });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      info: async (channel) => {
        const response = await this.client.get('/conversations.info', { params: { channel } });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      history: async (params) => {
        const response = await this.client.get('/conversations.history', { params });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      replies: async (params) => {
        const response = await this.client.get('/conversations.replies', { params });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      open: async (params) => {
        const response = await this.client.post('/conversations.open', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      }
    };
  }
  
  // Files methods
  get files() {
    return {
      upload: async (params) => {
        const FormData = require('form-data');
        const form = new FormData();
        
        if (params.file) {
          form.append('file', params.file);
        }
        if (params.content) {
          form.append('content', params.content);
        }
        if (params.channels) {
          form.append('channels', Array.isArray(params.channels) ? params.channels.join(',') : params.channels);
        }
        if (params.title) {
          form.append('title', params.title);
        }
        
        const response = await this.client.request({
          method: 'POST',
          url: '/files.upload',
          data: form,
          headers: form.getHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      info: async (file) => {
        const response = await this.client.get('/files.info', { params: { file } });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      list: async (params = {}) => {
        const response = await this.client.get('/files.list', { params });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      delete: async (file) => {
        const response = await this.client.post('/files.delete', { file });
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      }
    };
  }
  
  // Views methods (modals)
  get views() {
    return {
      open: async (params) => {
        const response = await this.client.post('/views.open', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      publish: async (params) => {
        const response = await this.client.post('/views.publish', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      update: async (params) => {
        const response = await this.client.post('/views.update', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      push: async (params) => {
        const response = await this.client.post('/views.push', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      }
    };
  }
  
  // Reactions methods
  get reactions() {
    return {
      add: async (params) => {
        const response = await this.client.post('/reactions.add', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      },
      
      remove: async (params) => {
        const response = await this.client.post('/reactions.remove', params);
        if (!response.ok) {
          throw new Error(`Slack API error: ${response.error}`);
        }
        return response;
      }
    };
  }
  
  // Auth test
  async authTest() {
    const response = await this.client.get('/auth.test');
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }
    return response;
  }
  
  // Generic API method for other endpoints
  async api(method, params = {}) {
    const response = await this.client.post(`/${method}`, params);
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.error}`);
    }
    return response;
  }
}

module.exports = { SlackClient };
