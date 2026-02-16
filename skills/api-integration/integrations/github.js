const { AxiosClient } = require('../clients/axios-client');

/**
 * GitHub API client
 */
class GitHubClient {
  constructor(config = {}) {
    this.token = config.token || process.env.GITHUB_TOKEN;
    this.baseURL = config.baseURL || 'https://api.github.com';
    
    this.client = new AxiosClient({
      baseURL: this.baseURL,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'OpenClaw-API-Integration'
      },
      auth: this.token ? {
        type: 'bearer',
        token: this.token
      } : undefined,
      retry: config.retry || {
        maxRetries: 3,
        retryCondition: (error) => {
          // Retry on rate limit (403 with specific header) or server errors
          return error.response?.status >= 500 || 
                 (error.response?.status === 403 && 
                  error.response?.headers['x-ratelimit-remaining'] === '0');
        }
      },
      respectRateLimits: true
    });
    
    // GraphQL endpoint
    this.graphqlEndpoint = config.graphqlEndpoint || 'https://api.github.com/graphql';
  }
  
  // Users
  async getUser(username) {
    return this.client.get(`/users/${username}`);
  }
  
  async getAuthenticatedUser() {
    return this.client.get('/user');
  }
  
  async getUserRepos(username, options = {}) {
    const params = {
      per_page: options.per_page || 30,
      page: options.page || 1,
      sort: options.sort,
      type: options.type
    };
    return this.client.get(`/users/${username}/repos`, { params });
  }
  
  // Repositories
  async getRepo(owner, repo) {
    return this.client.get(`/repos/${owner}/${repo}`);
  }
  
  async getRepoContents(owner, repo, path = '', ref) {
    const params = ref ? { ref } : {};
    return this.client.get(`/repos/${owner}/${repo}/contents/${path}`, { params });
  }
  
  async createRepo(name, options = {}) {
    const data = { name, ...options };
    if (options.org) {
      return this.client.post(`/orgs/${options.org}/repos`, data);
    }
    return this.client.post('/user/repos', data);
  }
  
  // Issues
  async getIssues(owner, repo, options = {}) {
    const params = {
      state: options.state || 'open',
      per_page: options.per_page || 30,
      page: options.page || 1,
      labels: options.labels?.join(','),
      assignee: options.assignee,
      sort: options.sort,
      direction: options.direction
    };
    return this.client.get(`/repos/${owner}/${repo}/issues`, { params });
  }
  
  async getIssue(owner, repo, issueNumber) {
    return this.client.get(`/repos/${owner}/${repo}/issues/${issueNumber}`);
  }
  
  async createIssue(owner, repo, options) {
    return this.client.post(`/repos/${owner}/${repo}/issues`, options);
  }
  
  async updateIssue(owner, repo, issueNumber, options) {
    return this.client.patch(`/repos/${owner}/${repo}/issues/${issueNumber}`, options);
  }
  
  // Pull Requests
  async getPullRequests(owner, repo, options = {}) {
    const params = {
      state: options.state || 'open',
      per_page: options.per_page || 30,
      page: options.page || 1,
      head: options.head,
      base: options.base,
      sort: options.sort,
      direction: options.direction
    };
    return this.client.get(`/repos/${owner}/${repo}/pulls`, { params });
  }
  
  async getPullRequest(owner, repo, prNumber) {
    return this.client.get(`/repos/${owner}/${repo}/pulls/${prNumber}`);
  }
  
  async createPullRequest(owner, repo, options) {
    return this.client.post(`/repos/${owner}/${repo}/pulls`, options);
  }
  
  // Search
  async searchCode(query, options = {}) {
    const params = {
      q: query,
      sort: options.sort,
      order: options.order,
      per_page: options.per_page || 30,
      page: options.page || 1
    };
    return this.client.get('/search/code', { params });
  }
  
  async searchRepos(query, options = {}) {
    const params = {
      q: query,
      sort: options.sort,
      order: options.order,
      per_page: options.per_page || 30,
      page: options.page || 1
    };
    return this.client.get('/search/repositories', { params });
  }
  
  async searchIssues(query, options = {}) {
    const params = {
      q: query,
      sort: options.sort,
      order: options.order,
      per_page: options.per_page || 30,
      page: options.page || 1
    };
    return this.client.get('/search/issues', { params });
  }
  
  // GraphQL
  async graphql(query, variables = {}) {
    const { GraphQLClient } = require('../graphql/graphql-client');
    const client = new GraphQLClient({
      endpoint: this.graphqlEndpoint,
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return client.query(query, variables);
  }
  
  // Rate limit info
  async getRateLimit() {
    return this.client.get('/rate_limit');
  }
}

module.exports = { GitHubClient };
