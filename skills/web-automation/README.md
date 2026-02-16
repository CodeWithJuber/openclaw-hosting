# Web Automation Skill

A comprehensive, production-ready web automation and scraping toolkit for OpenClaw agents. Built on Playwright and Puppeteer with best practices from 2024-2025 research.

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

## Configuration

See `config/default.json` for all available options.

## Examples

Check the `examples/` directory for common use cases:
- `basic-scraping.js` - Simple data extraction
- `form-automation.js` - Form filling and submission
- `session-management.js` - Login persistence
- `proxy-rotation.js` - Rotating proxies
- `screenshot-pdf.js` - Visual capture

## Best Practices

1. **Always use stealth mode** for production scraping
2. **Rotate proxies** to avoid IP bans
3. **Add delays** between actions to mimic human behavior
4. **Handle errors gracefully** with retries
5. **Respect robots.txt** and rate limits

## License

MIT
