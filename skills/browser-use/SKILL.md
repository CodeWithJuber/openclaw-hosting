# Browser-Use Skill

A comprehensive browser automation skill for AI agents, enabling intelligent web interaction, form handling, data extraction, and session management. Built on Playwright with support for Chrome, Firefox, and WebKit browsers.

## Overview

This skill provides AI agents with the ability to control browsers programmatically for automation tasks. It supports both headless and headed modes, includes stealth capabilities to avoid detection, and provides robust error handling with automatic retries.

## Features

- **Multi-Browser Support**: Chrome, Firefox, WebKit (Playwright)
- **Navigation & Interaction**: Intelligent page navigation, element interaction, scrolling
- **Form Automation**: Fill forms, handle dropdowns, checkboxes, file uploads
- **Data Extraction**: Scrape structured data with CSS/XPath selectors
- **Screenshot & PDF**: Capture screenshots and generate PDFs
- **Session Management**: Cookie handling, localStorage, authentication persistence
- **Stealth Mode**: Anti-detection measures for bot protection bypass
- **Error Handling**: Automatic retries, timeout management, error recovery
- **Proxy Support**: HTTP/HTTPS/SOCKS proxy rotation

## Installation

```bash
# Install dependencies
npm install playwright
npx playwright install

# Install specific browsers
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

## Quick Start

```javascript
const { BrowserUse } = require('@openclaw/skill-browser-use');

const browser = new BrowserUse();

async function example() {
  // Launch browser
  await browser.launch({ headless: false });
  
  // Navigate to page
  await browser.goto('https://example.com');
  
  // Take screenshot
  await browser.screenshot({ path: 'example.png' });
  
  // Close browser
  await browser.close();
}

example();
```

## Usage Guide

### Browser Control

#### Launch Browser

```javascript
const browser = new BrowserUse();

// Basic launch
await browser.launch();

// With options
await browser.launch({
  browser: 'chromium',  // 'chromium' | 'firefox' | 'webkit'
  headless: true,
  slowMo: 100,  // Slow down operations by 100ms
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Custom User Agent'
});
```

#### Browser Contexts

```javascript
// Create isolated browser context (like incognito)
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  locale: 'en-US',
  timezoneId: 'America/New_York'
});

// Create page in context
const page = await context.newPage();

// Close context
await context.close();
```

### Navigation

```javascript
// Basic navigation
await browser.goto('https://example.com');

// With options
await browser.goto('https://example.com', {
  waitUntil: 'networkidle',  // 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
  timeout: 30000
});

// Navigation actions
await browser.goBack();
await browser.goForward();
await browser.reload();

// Get current URL and title
const url = await browser.getUrl();
const title = await browser.getTitle();
```

### Element Interaction

```javascript
// Click element
await browser.click('#submit-button');
await browser.click('.button', { delay: 100 });

// Double click
await browser.doubleClick('.item');

// Right click
await browser.rightClick('.context-menu-target');

// Hover
await browser.hover('.dropdown-trigger');

// Type text
await browser.type('#username', 'john_doe');
await browser.type('#password', 'secret123', { delay: 50 });

// Fill form field (clears first)
await browser.fill('#email', 'john@example.com');

// Clear field
await browser.clear('#search-input');

// Press key
await browser.press('#search', 'Enter');
await browser.press('body', 'Control+a');

// Select dropdown option
await browser.select('#country', 'USA');
await browser.select('#country', { value: 'US' });
await browser.select('#country', { label: 'United States' });

// Check/uncheck checkbox
await browser.check('#agree-terms');
await browser.uncheck('#newsletter');

// Upload file
await browser.uploadFile('#file-input', '/path/to/file.pdf');
await browser.uploadFile('#file-input', ['/path/to/file1.png', '/path/to/file2.png']);
```

### Waiting

```javascript
// Wait for element to appear
await browser.waitForSelector('.loading', { state: 'hidden' });
await browser.waitForSelector('.content', { state: 'visible', timeout: 5000 });

// Wait for navigation
await browser.waitForNavigation({ waitUntil: 'networkidle' });

// Wait for load state
await browser.waitForLoadState('networkidle');

// Wait for timeout
await browser.waitForTimeout(1000);

// Wait for function
await browser.waitForFunction(() => {
  return document.querySelector('.status').textContent === 'Ready';
});
```

### Form Filling and Submission

```javascript
// Fill multiple fields at once
await browser.fillForm({
  '#firstName': 'John',
  '#lastName': 'Doe',
  '#email': 'john@example.com',
  '#phone': '555-1234',
  '#country': 'USA',
  '#newsletter': true,  // checkbox
  '#gender': 'male'     // radio or select
});

// Fill and submit form
await browser.fillForm({
  '#username': 'john_doe',
  '#password': 'secret123'
}, {
  submit: '#login-button',
  waitForNavigation: true,
  waitForSelector: '.dashboard'
});

// Handle multi-step forms
await browser.fillForm({
  '#step1-field': 'value1'
});
await browser.click('#next-step');
await browser.waitForSelector('#step2-field');
await browser.fillForm({
  '#step2-field': 'value2'
});
await browser.click('#submit');
```

### Data Extraction

```javascript
// Get text content
const text = await browser.getText('.article-content');

// Get attribute
const href = await browser.getAttribute('a.link', 'href');
const src = await browser.getAttribute('img.logo', 'src');

// Get multiple elements
const links = await browser.getElements('a.article-link', {
  text: (el) => el.textContent,
  href: (el) => el.getAttribute('href')
});

// Extract structured data
const products = await browser.extract({
  selector: '.product-item',
  multiple: true,
  fields: {
    name: '.product-name',
    price: {
      selector: '.product-price',
      transform: (text) => parseFloat(text.replace('$', ''))
    },
    image: {
      selector: 'img',
      attribute: 'src'
    },
    inStock: {
      selector: '.stock-status',
      transform: (text) => text === 'In Stock'
    }
  }
});

// Execute JavaScript and get result
const data = await browser.evaluate(() => {
  return {
    title: document.title,
    url: window.location.href,
    cookies: document.cookie
  };
});

// Get page HTML
const html = await browser.getHTML();
const bodyHTML = await browser.getHTML('body');
```

### Screenshot and PDF

```javascript
// Full page screenshot
await browser.screenshot({
  path: 'page.png',
  fullPage: true
});

// Element screenshot
await browser.screenshot({
  path: 'element.png',
  selector: '.chart'
});

// Screenshot with options
await browser.screenshot({
  path: 'screenshot.png',
  type: 'jpeg',
  quality: 80,
  clip: { x: 0, y: 0, width: 800, height: 600 }
});

// Generate PDF
await browser.pdf({
  path: 'page.pdf',
  format: 'A4',
  printBackground: true,
  margin: {
    top: '20px',
    right: '20px',
    bottom: '20px',
    left: '20px'
  }
});

// PDF with header/footer
await browser.pdf({
  path: 'report.pdf',
  format: 'A4',
  headerTemplate: '<div style="font-size: 10px;">Header</div>',
  footerTemplate: '<div style="font-size: 10px;">Page <span class="pageNumber"></span></div>',
  displayHeaderFooter: true
});
```

### Cookie and Session Management

```javascript
// Get all cookies
const cookies = await browser.getCookies();

// Get specific cookie
const cookie = await browser.getCookie('session_id');

// Set cookie
await browser.setCookie({
  name: 'session_id',
  value: 'abc123',
  domain: '.example.com',
  path: '/',
  expires: Date.now() / 1000 + 86400,  // 1 day
  httpOnly: true,
  secure: true,
  sameSite: 'Lax'
});

// Delete cookie
await browser.deleteCookie('session_id');

// Clear all cookies
await browser.clearCookies();

// Save session state
await browser.saveSession('./sessions/user1.json');

// Load session state
await browser.loadSession('./sessions/user1.json');

// localStorage
await browser.setLocalStorage('key', 'value');
const value = await browser.getLocalStorage('key');
await browser.removeLocalStorage('key');
await browser.clearLocalStorage();

// sessionStorage
await browser.setSessionStorage('key', 'value');
const sessionValue = await browser.getSessionStorage('key');
```

### Stealth Mode

```javascript
// Enable stealth mode to avoid detection
const browser = new BrowserUse();

await browser.launch({
  stealth: true,
  headless: true
});

// Stealth options
await browser.launch({
  stealth: {
    // Hide webdriver
    hideWebDriver: true,
    // Randomize user agent
    randomizeUserAgent: true,
    // Hide automation flags
    hideAutomationFlags: true,
    // Add fake plugins
    addPlugins: true,
    // Emulate human behavior
    emulateHuman: true
  }
});
```

### Proxy Configuration

```javascript
// Single proxy
const browser = new BrowserUse();
await browser.launch({
  proxy: {
    server: 'http://proxy.example.com:8080',
    username: 'user',
    password: 'pass'
  }
});

// SOCKS proxy
await browser.launch({
  proxy: {
    server: 'socks5://proxy.example.com:1080'
  }
});

// Proxy rotation
const browser = new BrowserUse({
  proxies: [
    { server: 'http://proxy1.example.com:8080', username: 'user1', password: 'pass1' },
    { server: 'http://proxy2.example.com:8080', username: 'user2', password: 'pass2' },
    { server: 'http://proxy3.example.com:8080', username: 'user3', password: 'pass3' }
  ]
});

// Rotate proxy manually
await browser.rotateProxy();

// Get current proxy
const currentProxy = browser.getCurrentProxy();
```

### Error Handling and Retries

```javascript
const browser = new BrowserUse({
  retries: 3,
  retryDelay: 1000,
  timeout: 30000
});

// With custom retry logic
await browser.withRetry(async () => {
  await browser.goto('https://unreliable-site.com');
  await browser.click('#load-data');
  return await browser.getText('#result');
}, {
  maxRetries: 5,
  retryDelay: 2000,
  shouldRetry: (error) => error.message.includes('timeout')
});

// Try-catch with recovery
try {
  await browser.goto('https://example.com');
} catch (error) {
  console.error('Navigation failed:', error.message);
  // Fallback or recovery logic
}
```

### Frames and Iframes

```javascript
// Switch to frame by selector
await browser.switchToFrame('#iframe-id');

// Switch to frame by index
await browser.switchToFrame(0);

// Switch to frame by name
await browser.switchToFrame('frame-name');

// Interact within frame
await browser.click('#button-in-frame');

// Switch back to main frame
await browser.switchToMainFrame();

// Get all frames
const frames = await browser.getFrames();
```

### Dialog Handling

```javascript
// Setup dialog handler
browser.onDialog(async (dialog) => {
  console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
  
  if (dialog.type() === 'alert') {
    await dialog.accept();
  } else if (dialog.type() === 'confirm') {
    await dialog.accept();
    // or await dialog.dismiss();
  } else if (dialog.type() === 'prompt') {
    await dialog.accept('input value');
  }
});

// Or handle specific dialog
await browser.handleDialog('accept');
await browser.handleDialog('dismiss');
await browser.handleDialog('accept', 'input value');
```

### Mobile Emulation

```javascript
// Emulate mobile device
await browser.launch({
  device: 'iPhone 14 Pro Max'
});

// Or custom mobile viewport
await browser.launch({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)...'
});

// Available devices
const devices = browser.getDevices();
// ['iPhone 14', 'iPhone 14 Pro Max', 'Pixel 7', 'Galaxy S23', ...]
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `browser` | string | 'chromium' | Browser type: 'chromium', 'firefox', 'webkit' |
| `headless` | boolean | true | Run in headless mode |
| `slowMo` | number | 0 | Slow down operations by N milliseconds |
| `viewport` | object | {1920, 1080} | Browser viewport size |
| `userAgent` | string | null | Custom user agent string |
| `locale` | string | 'en-US' | Browser locale |
| `timezoneId` | string | null | Timezone ID |
| `downloadsPath` | string | null | Path for downloaded files |
| `stealth` | boolean/object | false | Enable stealth mode |
| `proxy` | object | null | Proxy configuration |
| `proxies` | array | [] | Proxy pool for rotation |
| `retries` | number | 3 | Number of retries on failure |
| `retryDelay` | number | 1000 | Delay between retries (ms) |
| `timeout` | number | 30000 | Default timeout (ms) |
| `ignoreHTTPSErrors` | boolean | false | Ignore HTTPS certificate errors |

## Error Types

```javascript
const {
  BrowserError,
  NavigationError,
  ElementNotFoundError,
  TimeoutError,
  AuthenticationError,
  ValidationError
} = require('@openclaw/skill-browser-use/errors');

try {
  await browser.click('#nonexistent');
} catch (error) {
  if (error instanceof ElementNotFoundError) {
    console.log('Element not found on page');
  } else if (error instanceof TimeoutError) {
    console.log('Operation timed out');
  }
}
```

## Best Practices

1. **Always close browsers**: Use `try/finally` or `await using` to ensure cleanup
2. **Use waits**: Wait for elements before interacting with them
3. **Handle errors**: Implement proper error handling for network issues
4. **Respect rate limits**: Add delays between requests to avoid being blocked
5. **Use stealth mode**: Enable when scraping to avoid detection
6. **Save sessions**: Reuse authentication state to speed up workflows
7. **Use proxies**: Rotate IPs for high-volume scraping
8. **Set timeouts**: Always set reasonable timeouts for operations

## Examples

### Web Scraping

```javascript
const browser = new BrowserUse();

async function scrapeProducts(url) {
  await browser.launch();
  
  try {
    await browser.goto(url);
    
    const products = await browser.extract({
      selector: '.product',
      multiple: true,
      fields: {
        name: '.product-title',
        price: '.price',
        rating: '.rating-value',
        link: { selector: 'a', attribute: 'href' }
      }
    });
    
    return products;
  } finally {
    await browser.close();
  }
}
```

### Automated Login

```javascript
async function login(email, password) {
  const browser = new BrowserUse();
  await browser.launch({ headless: false });
  
  try {
    await browser.goto('https://example.com/login');
    
    await browser.fillForm({
      '#email': email,
      '#password': password
    }, {
      submit: '#login-button',
      waitForNavigation: true
    });
    
    // Save session for reuse
    await browser.saveSession('./sessions/logged-in.json');
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  } finally {
    await browser.close();
  }
}
```

### Form Submission

```javascript
async function submitContactForm(data) {
  const browser = new BrowserUse();
  await browser.launch();
  
  try {
    await browser.goto('https://example.com/contact');
    
    await browser.fillForm({
      '#name': data.name,
      '#email': data.email,
      '#subject': data.subject,
      '#message': data.message,
      '#newsletter': data.subscribeToNewsletter
    });
    
    // Handle file upload if present
    if (data.attachment) {
      await browser.uploadFile('#attachment', data.attachment);
    }
    
    // Submit and wait for success message
    await browser.click('#submit');
    await browser.waitForSelector('.success-message', { timeout: 10000 });
    
    const message = await browser.getText('.success-message');
    return { success: true, message };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}
```

### Taking Screenshots

```javascript
async function captureScreenshots(urls) {
  const browser = new BrowserUse();
  await browser.launch();
  
  const screenshots = [];
  
  try {
    for (const url of urls) {
      await browser.goto(url);
      await browser.waitForLoadState('networkidle');
      
      const filename = `screenshot-${Date.now()}.png`;
      await browser.screenshot({
        path: `./screenshots/${filename}`,
        fullPage: true
      });
      
      screenshots.push({ url, filename });
    }
    
    return screenshots;
  } finally {
    await browser.close();
  }
}
```

## Troubleshooting

### Common Issues

1. **Element not found**: Use `waitForSelector` before interacting
2. **Timeout errors**: Increase timeout or check network connectivity
3. **Detected as bot**: Enable stealth mode and use proxies
4. **Memory issues**: Close browsers promptly, limit concurrent pages
5. **File upload fails**: Check file path and ensure element is visible

### Debug Mode

```javascript
const browser = new BrowserUse();
await browser.launch({
  headless: false,
  slowMo: 100,
  devtools: true  // Open DevTools
});
```

## License

MIT © OpenClaw
