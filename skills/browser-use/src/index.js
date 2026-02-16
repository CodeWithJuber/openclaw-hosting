/**
 * Browser-Use Skill - Main Entry Point
 * 
 * A comprehensive browser automation library for AI agents.
 * Built on Playwright with support for Chrome, Firefox, and WebKit.
 */

const { BrowserUse } = require('./BrowserUse');
const { BrowserContext } = require('./BrowserContext');
const { Page } = require('./Page');
const { errors } = require('./errors');
const { utils } = require('./utils');
const { stealth } = require('./stealth');

module.exports = {
  BrowserUse,
  BrowserContext,
  Page,
  errors,
  utils,
  stealth,
  
  // Convenience factory function
  createBrowser: (options = {}) => new BrowserUse(options)
};
