# Web Automation Skill

## Overview

This skill provides comprehensive web automation capabilities for AI agents, enabling browser automation, web scraping, form handling, and data extraction. Built on industry-standard tools (Playwright/Puppeteer) with production-ready patterns for reliability and stealth.

## Capabilities

### 1. Browser Automation
- Launch and control headless/headed browsers
- Navigate pages and handle redirects
- Execute JavaScript in page context
- Manage multiple browser contexts

### 2. Web Scraping
- Extract structured data using CSS/XPath selectors
- Handle dynamic content (SPA, AJAX)
- Automatic waiting and retry logic
- Data transformation and validation

### 3. Form Automation
- Fill forms with various input types
- Handle dropdowns, checkboxes, radio buttons
- File uploads
- Form submission and validation

### 4. Session Management
- Persistent cookies and localStorage
- Authentication state preservation
- Multi-account support via contexts

### 5. Screenshot & PDF Generation
- Full-page screenshots
- Element-specific captures
- PDF generation from pages
- Custom viewport sizing

### 6. Proxy Rotation
- Built-in proxy pool management
- Automatic IP rotation
- Per-request proxy selection
- Proxy health monitoring

### 7. Anti-Detection (Stealth)
- Hide headless browser indicators
- Rotate user agents and headers
- Mimic human behavior patterns
- Canvas/WebGL fingerprint randomization

### 8. CAPTCHA Handling
- Integration with solving services (2Captcha, CapMonster)
- Automatic detection and solving
- Fallback strategies

## Usage

### Basic Scraping

```javascript
const { WebAutomation } = require('./src');

const scraper = new WebAutomation();

const data = await scraper.scrape('https://example.com/products', {
  selectors: {
    products: {
      selector: '.product-item',
      multiple: true,
      fields: {
        name: '.product-name',
        price: '.product-price',
        image: { selector: 'img', attribute: 'src' }
      }
    }
  }
});
```

### Form Filling

```javascript
const result = await scraper.fillForm('https://example.com/login', {
  '#username': 'myuser',
  '#password': 'mypass',
  '#remember': true  // checkbox
}, {
  submit: '#login-button',
  waitFor: '.dashboard'  // wait for redirect
});
```

### With Proxy Rotation

```javascript
const scraper = new WebAutomation({
  proxies: [
    { server: 'http://proxy1.example.com:8080', username: 'user1', password: 'pass1' },
    { server: 'http://proxy2.example.com:8080', username: 'user2', password: 'pass2' }
  ],
  rotateProxyEvery: 5  // requests
});
```

### Session Persistence

```javascript
// Save session after login
await scraper.login('https://example.com', credentials);
await scraper.saveSession('./sessions/user1.json');

// Later, restore session
await scraper.loadSession('./sessions/user1.json');
const data = await scraper.scrape('https://example.com/protected');
```

### Screenshot Capture

```javascript
await scraper.screenshot('https://example.com', {
  path: './screenshots/page.png',
  fullPage: true,
  waitFor: '.content-loaded'
});
```

### PDF Generation

```javascript
await scraper.pdf('https://example.com', {
  path: './exports/page.pdf',
  format: 'A4',
  margin: { top: '20px', bottom: '20px' }
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headless` | boolean | true | Run browser in headless mode |
| `browser` | string | 'chromium' | Browser type (chromium/firefox/webkit) |
| `stealth` | boolean | true | Enable anti-detection measures |
| `timeout` | number | 30000 | Default navigation timeout (ms) |
| `retries` | number | 3 | Number of retries on failure |
| `delay` | object | { min: 1000, max: 3000 } | Random delay between actions |
| `proxy` | object | null | Single proxy configuration |
| `proxies` | array | [] | Proxy pool for rotation |
| `rotateProxyEvery` | number | 1 | Rotate proxy every N requests |
| `viewport` | object | { width: 1920, height: 1080 } | Browser viewport |
| `userAgent` | string | null | Custom user agent |
| `captcha` | object | null | CAPTCHA service configuration |

## Error Handling

The skill implements comprehensive error handling:

```javascript
const scraper = new WebAutomation({
  retries: 3,
  retryDelay: 2000,
  onRetry: (error, attempt) => console.log(`Retry ${attempt}: ${error.message}`),
  onError: (error) => console.error('Final error:', error)
});
```

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

## Dependencies

- `playwright` - Primary browser automation
- `puppeteer-extra` - Extended Puppeteer features
- `puppeteer-extra-plugin-stealth` - Anti-detection
- `proxy-agent` - Proxy handling
- `axios` - HTTP requests for CAPTCHA services

## Troubleshooting

### Common Issues

1. **Detected as bot**: Enable stealth mode, use proxies, add delays
2. **Timeout errors**: Increase timeout, check network, use retries
3. **Proxy failures**: Verify proxy health, implement fallback
4. **Memory issues**: Close browsers, limit concurrent pages

### Debug Mode

```javascript
const scraper = new WebAutomation({
  headless: false,  // See browser actions
  slowMo: 100,      // Slow down operations
  debug: true       // Verbose logging
});
```

## References

- [Playwright Documentation](https://playwright.dev/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Web Scraping Best Practices 2024](https://www.ipway.com/blog/web-scraping-playwright-guide/)
- [CAPTCHA Handling Guide](https://capmonster.cloud/en/blog/)
