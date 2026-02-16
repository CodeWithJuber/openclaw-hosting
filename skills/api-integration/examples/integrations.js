const { GitHubClient, StripeClient, SlackClient, OpenAIClient } = require('../index');

/**
 * Example: Common API Integrations
 * 
 * This example demonstrates usage of pre-built integration clients
 * for popular services.
 */

/**
 * Example 1: GitHub API
 */
async function githubExample() {
  const github = new GitHubClient({
    token: process.env.GITHUB_TOKEN
  });
  
  // Get user information
  const user = await github.getUser('octocat');
  console.log('User:', user.login, '-', user.name);
  
  // Get user repositories
  const repos = await github.getUserRepos('octocat', { per_page: 5 });
  console.log('Repositories:');
  repos.forEach(repo => {
    console.log(`  - ${repo.name}: ${repo.description || 'No description'}`);
  });
  
  // Get repository details
  const repo = await github.getRepo('facebook', 'react');
  console.log('React repo:', repo.stargazers_count, 'stars');
  
  // Search repositories
  const searchResults = await github.searchRepos('language:typescript stars:>1000', {
    per_page: 5
  });
  console.log('Found', searchResults.total_count, 'repositories');
  
  // Create an issue
  try {
    const issue = await github.createIssue('owner', 'repo', {
      title: 'Bug: Something is broken',
      body: 'Detailed description of the bug...',
      labels: ['bug', 'help wanted']
    });
    console.log('Created issue:', issue.html_url);
  } catch (error) {
    console.error('Failed to create issue:', error.message);
  }
  
  // GraphQL query
  const result = await github.graphql(`
    query {
      viewer {
        login
        repositories(first: 5) {
          nodes {
            name
            stargazerCount
          }
        }
      }
    }
  `);
  console.log('Viewer:', result.viewer.login);
  console.log('Repos:', result.viewer.repositories.nodes.map(r => r.name));
}

/**
 * Example 2: Stripe API
 */
async function stripeExample() {
  const stripe = new StripeClient({
    apiKey: process.env.STRIPE_SECRET_KEY
  });
  
  // Create a customer
  const customer = await stripe.customers.create({
    email: 'customer@example.com',
    name: 'John Doe',
    description: 'Created via API Integration Skill'
  });
  console.log('Created customer:', customer.id);
  
  // Create a payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2000, // $20.00 in cents
    currency: 'usd',
    customer: customer.id,
    automatic_payment_methods: { enabled: true }
  });
  console.log('Created payment intent:', paymentIntent.id);
  console.log('Client secret:', paymentIntent.client_secret);
  
  // Create a subscription
  // First, create a price if needed
  const price = await stripe.prices.create({
    unit_amount: 1000, // $10.00
    currency: 'usd',
    recurring: { interval: 'month' },
    product_data: { name: 'Premium Plan' }
  });
  
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });
  console.log('Created subscription:', subscription.id);
  
  // Create a checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    line_items: [{
      price: price.id,
      quantity: 1
    }],
    mode: 'subscription',
    success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://example.com/cancel'
  });
  console.log('Checkout URL:', session.url);
}

/**
 * Example 3: Slack API
 */
async function slackExample() {
  const slack = new SlackClient({
    token: process.env.SLACK_BOT_TOKEN
  });
  
  // Test authentication
  const auth = await slack.authTest();
  console.log('Authenticated as:', auth.user);
  
  // Send a message
  await slack.chat.postMessage({
    channel: '#general',
    text: 'Hello from OpenClaw API Integration Skill!',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Hello!* This is a formatted message with buttons.'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Click me'
            },
            action_id: 'button_click',
            value: 'click_me'
          }
        ]
      }
    ]
  });
  console.log('Message sent!');
  
  // Get user info
  const users = await slack.users.list({ limit: 10 });
  console.log('Users:', users.members.map(u => u.name));
  
  // Upload a file
  // await slack.files.upload({
  //   channels: '#general',
  //   file: fs.createReadStream('report.pdf'),
  //   title: 'Monthly Report'
  // });
  
  // Add reaction
  await slack.reactions.add({
    channel: 'C1234567890',
    timestamp: '1234567890.123456',
    name: 'thumbsup'
  });
}

/**
 * Example 4: OpenAI API
 */
async function openaiExample() {
  const openai = new OpenAIClient({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  // Chat completion
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the capital of France?' }
    ],
    temperature: 0.7,
    max_tokens: 150
  });
  
  console.log('Response:', completion.choices[0].message.content);
  
  // Streaming completion
  console.log('\nStreaming response:');
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'Tell me a short joke' }
    ],
    stream: true
  });
  
  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
  console.log('\n');
  
  // Create embeddings
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: 'The quick brown fox jumps over the lazy dog'
  });
  console.log('Embedding dimensions:', embeddings.data[0].embedding.length);
  
  // List models
  const models = await openai.models.list();
  console.log('Available models:', models.data.length);
  
  // Generate image (DALL-E)
  // const image = await openai.images.generate({
  //   model: 'dall-e-3',
  //   prompt: 'A cute baby sea otter floating on its back',
  //   n: 1,
  //   size: '1024x1024'
  // });
  // console.log('Image URL:', image.data[0].url);
  
  // Text to speech
  // const speech = await openai.audio.speech.create({
  //   model: 'tts-1',
  //   voice: 'alloy',
  //   input: 'Hello, this is a test of text to speech.'
  // });
  // fs.writeFileSync('speech.mp3', speech);
}

/**
 * Example 5: Combining Multiple Services
 */
async function combinedIntegrationExample() {
  // Scenario: When a new GitHub issue is created with "billing" label,
  // create a Stripe customer and notify Slack
  
  const github = new GitHubClient({ token: process.env.GITHUB_TOKEN });
  const stripe = new StripeClient({ apiKey: process.env.STRIPE_SECRET_KEY });
  const slack = new SlackClient({ token: process.env.SLACK_BOT_TOKEN });
  
  // Get recent issues with "billing" label
  const issues = await github.getIssues('owner', 'repo', {
    labels: 'billing',
    state: 'open'
  });
  
  for (const issue of issues) {
    // Extract email from issue body (simplified)
    const emailMatch = issue.body?.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (!emailMatch) continue;
    
    const email = emailMatch[0];
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name: issue.user.login,
      metadata: {
        github_issue: issue.number,
        github_user: issue.user.login
      }
    });
    
    // Notify Slack
    await slack.chat.postMessage({
      channel: '#billing',
      text: `New billing customer from GitHub issue #${issue.number}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*New Billing Customer*\n*Issue:* <https://github.com/owner/repo/issues/${issue.number}|#${issue.number} ${issue.title}>\n*Email:* ${email}\n*Stripe Customer:* \`${customer.id}\``
          }
        }
      ]
    });
    
    // Add comment to GitHub issue
    await github.createIssue('owner', 'repo', {
      title: `Re: ${issue.title}`,
      body: `Stripe customer created: ${customer.id}`
    });
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  githubExample().catch(console.error);
}

module.exports = {
  githubExample,
  stripeExample,
  slackExample,
  openaiExample,
  combinedIntegrationExample
};
