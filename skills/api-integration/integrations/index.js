const { GitHubClient } = require('../integrations/github');
const { StripeClient } = require('../integrations/stripe');
const { SlackClient } = require('../integrations/slack');
const { OpenAIClient } = require('../integrations/openai');

module.exports = {
  GitHubClient,
  StripeClient,
  SlackClient,
  OpenAIClient
};
