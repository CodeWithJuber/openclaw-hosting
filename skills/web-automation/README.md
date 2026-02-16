# Web Automation Skill

A comprehensive, production-ready web automation and scraping toolkit for OpenClaw agents.

## Features

- **Multi-Browser Support**: Chromium, Firefox, WebKit via Playwright
- **Stealth Mode**: Anti-detection techniques to avoid bot blocking
- **Proxy Rotation**: Built-in proxy management for IP rotation
- **Session Management**: Persistent cookies and authentication state
- **Form Handling**: Intelligent form filling and submission
- **Data Extraction**: Structured data extraction with retry logic
- **Screenshot & PDF**: Full-page and element-specific captures
- **CAPTCHA Handling**: Integration with solving services
- **Error Recovery**: Automatic retries with exponential backoff

## Quick Start

```bash
# Install dependencies
npm install

# Install browser binaries
npx playwright install chromium
```

```javascript
const { WebAutomation } = require('./src');

const scraper = new WebAutomation({
  headless: true,
  proxy: { server: 'http://proxy.example.com:8080' }
});

const data = await scraper.scrape('https://example.com', {
  selectors: {
    title: 'h1',
    price: '.price'
  }
});
```

## Project Structure

```
skills/web-automation/
├── src/
│   ├── index.js           # Main WebAutomation class
│   ├── errors.js          # Error classes and utilities
│   ├── utils.js           # Helper functions
│   ├── proxy-manager.js   # Proxy rotation management
│   └── exports.js         # Module exports
├── examples/
│   ├── basic-scraping.js      # Simple data extraction
│   ├── form-automation.js     # Form filling and submission
│   ├── session-management.js  # Login persistence
│   ├── proxy-rotation.js      # Rotating proxies
│   ├── screenshot-pdf.js      # Visual capture
│   └── captcha-handling.js    # CAPTCHA solving
├── config/
│   ├── default.json           # Default configuration
│   ├── proxies.example.json   # Proxy configuration template
│   └── README.md              # Configuration guide
├── tests/
│   └── web-automation.test.js # Test suite
├── package.json
├── README.md
└── SKILL.md               # Detailed skill documentation
```

## Configuration

See `config/default.json` for all available options.

### Environment Variables

- `WEB_AUTO_BROWSER` - Browser type (chromium/firefox/webkit)
- `WEB_AUTO_HEADLESS` - Run in headless mode (true/false)
- `CAPMONSTER_API_KEY` - CapMonster Cloud API key
- `TWOCAPTCHA_API_KEY` - 2Captcha API key

## Examples

### Basic Scraping
```javascript
const { WebAutomation } = require('./src');

const scraper = new WebAutomation();
const data = await scraper.scrape('https://quotes.toscrape.com/', {
  selectors: {
    quotes: {
      selector: '.quote',
      multiple: true,
      fields: {
        text: '.text',
        author: '.author'
      }
    }
  }
});
```

### Form Automation
```javascript
const result = await scraper.fillForm('https://example.com/login', {
  '#username': 'myuser',
  '#password': 'mypass'
}, {
  submit: '#login-button',
  waitFor: '.dashboard'
});
```

### With Proxy Rotation
```javascript
const scraper = new WebAutomation({
  proxies: [
    { server: 'http://proxy1.example.com:8080' },
    { server: 'http://proxy2.example.com:8080' }
  ],
  rotateProxyEvery: 5
});
```

### Session Persistence
```javascript
// Save session after login
await scraper.login('https://example.com', credentials);
await scraper.saveSession('./sessions/user1.json');

// Later, restore session
await scraper.loadSession('./sessions/user1.json');
```

### Screenshot Capture
```javascript
await scraper.screenshot('https://example.com', {
  path: './screenshots/page.png',
  fullPage: true
});
```

### PDF Generation
```javascript
await scraper.pdf('https://example.com', {
  path: './exports/page.pdf',
  format: 'A4'
});
```

## Running Examples

```bash
# Basic scraping
npm run example:basic

# Form automation
npm run example:form

# Session management
npm run example:session

# Proxy rotation
npm run example:proxy

# Screenshot and PDF
npm run example:screenshot
```

## Running Tests

```bash
npm test
```

## Best Practices

1. **Always use stealth mode** for production scraping
2. **Rotate proxies** to avoid IP bans
3. **Add delays** between actions to mimic human behavior
4. **Handle errors gracefully** with retries
5. **Respect robots.txt** and rate limits

## Cost Optimization

- Use headless mode to reduce resource usage
- Implement request caching for repeated scrapes
- Use proxy rotation strategically (not every request)
- Batch operations when possible
- Close browsers promptly after use

## Security Considerations

- Never hardcode credentials in scripts
- Use environment variables for sensitive data
- Respect robots.txt and terms of service
- Implement rate limiting to avoid overwhelming targets
- Handle CAPTCHAs ethically and legally

## License

MIT
