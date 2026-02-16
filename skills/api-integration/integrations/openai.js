const { AxiosClient } = require('../clients/axios-client');

/**
 * OpenAI API client
 */
class OpenAIClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.organization = config.organization || process.env.OPENAI_ORG_ID;
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`
    };
    
    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }
    
    this.client = new AxiosClient({
      baseURL: this.baseURL,
      headers,
      timeout: config.timeout || 120000, // 2 minute default for long completions
      retry: config.retry || {
        maxRetries: 3,
        retryCondition: (error) => {
          // Retry on rate limit or server errors
          return error.response?.status === 429 || error.response?.status >= 500;
        }
      }
    });
  }
  
  // Chat completions
  get chat() {
    return {
      completions: {
        create: async (params) => {
          if (params.stream) {
            return this.createStreamingCompletion(params);
          }
          return this.client.post('/chat/completions', params);
        }
      }
    };
  }
  
  // Completions (legacy)
  get completions() {
    return {
      create: async (params) => {
        if (params.stream) {
          return this.createStreamingCompletion(params, '/completions');
        }
        return this.client.post('/completions', params);
      }
    };
  }
  
  // Embeddings
  get embeddings() {
    return {
      create: (params) => this.client.post('/embeddings', params)
    };
  }
  
  // Models
  get models() {
    return {
      list: () => this.client.get('/models'),
      retrieve: (id) => this.client.get(`/models/${id}`),
      del: (id) => this.client.delete(`/models/${id}`)
    };
  }
  
  // Images
  get images() {
    return {
      generate: (params) => this.client.post('/images/generations', params),
      edit: (params) => {
        // Requires multipart/form-data
        const FormData = require('form-data');
        const form = new FormData();
        
        if (params.image) form.append('image', params.image);
        if (params.mask) form.append('mask', params.mask);
        if (params.prompt) form.append('prompt', params.prompt);
        if (params.n) form.append('n', params.n);
        if (params.size) form.append('size', params.size);
        if (params.response_format) form.append('response_format', params.response_format);
        
        return this.client.request({
          method: 'POST',
          url: '/images/edits',
          data: form,
          headers: form.getHeaders()
        });
      },
      createVariation: (params) => {
        const FormData = require('form-data');
        const form = new FormData();
        
        if (params.image) form.append('image', params.image);
        if (params.n) form.append('n', params.n);
        if (params.size) form.append('size', params.size);
        
        return this.client.request({
          method: 'POST',
          url: '/images/variations',
          data: form,
          headers: form.getHeaders()
        });
      }
    };
  }
  
  // Audio
  get audio() {
    return {
      transcriptions: {
        create: (params) => {
          const FormData = require('form-data');
          const form = new FormData();
          
          if (params.file) form.append('file', params.file);
          if (params.model) form.append('model', params.model);
          if (params.prompt) form.append('prompt', params.prompt);
          if (params.response_format) form.append('response_format', params.response_format);
          if (params.temperature) form.append('temperature', params.temperature);
          if (params.language) form.append('language', params.language);
          
          return this.client.request({
            method: 'POST',
            url: '/audio/transcriptions',
            data: form,
            headers: form.getHeaders()
          });
        }
      },
      translations: {
        create: (params) => {
          const FormData = require('form-data');
          const form = new FormData();
          
          if (params.file) form.append('file', params.file);
          if (params.model) form.append('model', params.model);
          if (params.prompt) form.append('prompt', params.prompt);
          if (params.response_format) form.append('response_format', params.response_format);
          if (params.temperature) form.append('temperature', params.temperature);
          
          return this.client.request({
            method: 'POST',
            url: '/audio/translations',
            data: form,
            headers: form.getHeaders()
          });
        }
      },
      speech: {
        create: (params) => this.client.post('/audio/speech', params, {
          responseType: 'arraybuffer'
        })
      }
    };
  }
  
  // Files
  get files() {
    return {
      create: (params) => {
        const FormData = require('form-data');
        const form = new FormData();
        
        if (params.file) form.append('file', params.file);
        if (params.purpose) form.append('purpose', params.purpose);
        
        return this.client.request({
          method: 'POST',
          url: '/files',
          data: form,
          headers: form.getHeaders()
        });
      },
      list: () => this.client.get('/files'),
      retrieve: (id) => this.client.get(`/files/${id}`),
      del: (id) => this.client.delete(`/files/${id}`),
      content: (id) => this.client.get(`/files/${id}/content`),
      retrieveContent: function(id) { return this.content(id); }
    };
  }
  
  // Assistants
  get beta() {
    return {
      assistants: {
        create: (params) => this.client.post('/assistants', params),
        retrieve: (id) => this.client.get(`/assistants/${id}`),
        update: (id, params) => this.client.post(`/assistants/${id}`, params),
        del: (id) => this.client.delete(`/assistants/${id}`),
        list: (params = {}) => this.client.get('/assistants', { params })
      },
      threads: {
        create: (params = {}) => this.client.post('/threads', params),
        retrieve: (id) => this.client.get(`/threads/${id}`),
        update: (id, params) => this.client.post(`/threads/${id}`, params),
        del: (id) => this.client.delete(`/threads/${id}`),
        messages: {
          create: (threadId, params) => this.client.post(`/threads/${threadId}/messages`, params),
          retrieve: (threadId, messageId) => this.client.get(`/threads/${threadId}/messages/${messageId}`),
          list: (threadId, params = {}) => this.client.get(`/threads/${threadId}/messages`, { params })
        },
        runs: {
          create: (threadId, params) => this.client.post(`/threads/${threadId}/runs`, params),
          retrieve: (threadId, runId) => this.client.get(`/threads/${threadId}/runs/${runId}`),
          update: (threadId, runId, params) => this.client.post(`/threads/${threadId}/runs/${runId}`, params),
          list: (threadId, params = {}) => this.client.get(`/threads/${threadId}/runs`, { params }),
          submitToolOutputs: (threadId, runId, params) => 
            this.client.post(`/threads/${threadId}/runs/${runId}/submit_tool_outputs`, params),
          cancel: (threadId, runId) => 
            this.client.post(`/threads/${threadId}/runs/${runId}/cancel`)
        }
      }
    };
  }
  
  // Streaming support
  async createStreamingCompletion(params, endpoint = '/chat/completions') {
    const response = await this.client.request({
      method: 'POST',
      url: endpoint,
      data: { ...params, stream: true },
      responseType: 'stream'
    });
    
    return this.parseStream(response);
  }
  
  async *parseStream(stream) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              yield JSON.parse(data);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

module.exports = { OpenAIClient };
