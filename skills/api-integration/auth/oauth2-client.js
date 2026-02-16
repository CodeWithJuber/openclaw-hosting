const crypto = require('crypto');

/**
 * OAuth2 client supporting multiple flows
 */
class OAuth2Client {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.authorizationEndpoint = config.authorizationEndpoint;
    this.tokenEndpoint = config.tokenEndpoint;
    this.redirectUri = config.redirectUri;
    this.scopes = config.scopes || [];
  }
  
  /**
   * Generate authorization URL for Authorization Code flow
   */
  getAuthorizationUrl(options = {}) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' ')
    });
    
    if (options.state) {
      params.append('state', options.state);
    }
    
    if (options.codeChallenge) {
      params.append('code_challenge', options.codeChallenge);
      params.append('code_challenge_method', 'S256');
    }
    
    return `${this.authorizationEndpoint}?${params.toString()}`;
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code, codeVerifier) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri
    });
    
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }
    
    return this.tokenRequest(params);
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken
    });
    
    return this.tokenRequest(params);
  }
  
  /**
   * Client Credentials flow
   */
  async clientCredentialsGrant() {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: this.scopes.join(' ')
    });
    
    return this.tokenRequest(params);
  }
  
  /**
   * Password Credentials flow (legacy, not recommended)
   */
  async passwordGrant(username, password) {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username,
      password,
      scope: this.scopes.join(' ')
    });
    
    return this.tokenRequest(params);
  }
  
  /**
   * Make token request
   */
  async tokenRequest(params) {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token request failed: ${error}`);
    }
    
    return response.json();
  }
  
  /**
   * Generate PKCE code verifier and challenge
   */
  static generatePKCE() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return { codeVerifier, codeChallenge };
  }
}

module.exports = { OAuth2Client };
