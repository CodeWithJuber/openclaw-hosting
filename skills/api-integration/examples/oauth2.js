const { OAuth2Client } = require('../auth/oauth2-client');

/**
 * Example: OAuth2 Authentication Flows
 * 
 * This example demonstrates different OAuth2 flows supported by the client.
 */

/**
 * Example 1: Authorization Code Flow with PKCE
 */
async function authorizationCodeFlowExample() {
  const oauth = new OAuth2Client({
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    authorizationEndpoint: 'https://auth.example.com/authorize',
    tokenEndpoint: 'https://auth.example.com/token',
    redirectUri: 'https://your-app.com/callback',
    scopes: ['read', 'write', 'profile']
  });
  
  // Step 1: Generate PKCE parameters
  const { codeVerifier, codeChallenge } = OAuth2Client.generatePKCE();
  
  // Store codeVerifier for later (usually in session)
  // session.codeVerifier = codeVerifier;
  
  // Step 2: Generate authorization URL
  const authUrl = oauth.getAuthorizationUrl({
    state: generateRandomState(),
    codeChallenge
  });
  
  console.log('Redirect user to:', authUrl);
  
  // Step 3: After user authorizes, exchange code for token
  // This happens in your callback handler
  const authorizationCode = 'code-from-callback';
  const tokens = await oauth.exchangeCodeForToken(authorizationCode, codeVerifier);
  
  console.log('Access token:', tokens.access_token);
  console.log('Refresh token:', tokens.refresh_token);
  
  // Step 4: Use refresh token when access token expires
  const newTokens = await oauth.refreshAccessToken(tokens.refresh_token);
  console.log('New access token:', newTokens.access_token);
}

/**
 * Example 2: Client Credentials Flow (Machine-to-Machine)
 */
async function clientCredentialsFlowExample() {
  const oauth = new OAuth2Client({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    tokenEndpoint: 'https://auth.example.com/token',
    scopes: ['api:read', 'api:write']
  });
  
  const tokens = await oauth.clientCredentialsGrant();
  console.log('Access token:', tokens.access_token);
  console.log('Expires in:', tokens.expires_in);
}

/**
 * Example 3: GitHub OAuth Flow
 */
async function githubOAuthExample() {
  const githubOAuth = new OAuth2Client({
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
    redirectUri: 'https://your-app.com/auth/github/callback',
    scopes: ['repo', 'user:email']
  });
  
  // Generate authorization URL
  const authUrl = githubOAuth.getAuthorizationUrl({
    state: generateRandomState()
  });
  
  console.log('GitHub OAuth URL:', authUrl);
}

/**
 * Example 4: Token Refresh with Automatic Handling
 */
async function autoRefreshExample() {
  const { createApiClient } = require('../index');
  
  let accessToken = 'current-access-token';
  const refreshToken = 'stored-refresh-token';
  
  const client = createApiClient({
    baseURL: 'https://api.example.com',
    auth: {
      type: 'bearer',
      token: accessToken,
      refreshToken: refreshToken,
      onTokenRefresh: (newToken) => {
        // Update stored token
        accessToken = newToken;
        // Save to database/session
        saveTokenToDatabase(newToken);
      }
    }
  });
  
  // The client will automatically refresh the token when it expires
  const data = await client.get('/protected-resource');
}

function generateRandomState() {
  return require('crypto').randomBytes(32).toString('hex');
}

function saveTokenToDatabase(token) {
  // Implementation depends on your storage
  console.log('Saving new token:', token);
}

// Run examples if this file is executed directly
if (require.main === module) {
  clientCredentialsFlowExample().catch(console.error);
}

module.exports = {
  authorizationCodeFlowExample,
  clientCredentialsFlowExample,
  githubOAuthExample,
  autoRefreshExample
};
