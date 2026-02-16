const { chromium, firefox, webkit } = require('playwright');
const { ProxyAgent } = require('proxy-agent');
const axios = require('axios');
const UserAgent = require('user-agents');
const winston = require('winston');

/**
 * Comprehensive Web Automation class for scraping and browser automation
 */
class WebAutomation {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false,
      browser: options.browser || 'chromium',
      stealth: options.stealth !== false,
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 2000,
      delay: options.delay || { min: 1000, max: 3000 },
      proxy: options.proxy || null,
      proxies: options.proxies || [],
      rotateProxyEvery: options.rotateProxyEvery || 1,
      viewport: options.viewport || { width: 1920, height: 1080 },
      userAgent: options.userAgent || null,
      captcha: options.captcha || null,
      debug: options.debug || false,
      onRetry: options.onRetry || null,
      onError: options.onError || null,
      ...options
    };

    this.browser = null;
    this.context = null;
    this.page = null;
    this.requestCount = 0;
    this.currentProxyIndex = 0;
    this.sessionData = null;

    this.logger = winston.createLogger({
      level: this.options.debug ? 'debug' : 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  /**
   * Initialize browser instance
   */
  async init() {
    if (this.browser) return;

    const browserType = this.getBrowserType();
    const launchOptions = {
      headless: this.options.headless,
      args: this.getLaunchArgs()
    };

    // Apply proxy if single proxy configured
    if (this.options.proxy && !this.options.proxies.length) {
      launchOptions.proxy = this.options.proxy;
    }

    this.browser = await browserType.launch(launchOptions);
    
    // Create context with stealth options
    const contextOptions = {
      viewport: this.options.viewport,
      userAgent: this.options.userAgent || new UserAgent().toString(),
      locale: 'en-US',
      timezoneId: 'America/New_York'
    };

    // Load session if available
    if (this.sessionData) {
      contextOptions.storageState = this.sessionData;
    }

    this.context = await this.browser.newContext(contextOptions);

    // Apply stealth scripts
    if (this.options.stealth) {
      await this.applyStealthScripts();
    }

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.options.timeout);

    this.logger.debug('Browser initialized successfully');
  }

  /**
   * Get browser type based on configuration
   */
  getBrowserType() {
    switch (this.options.browser) {
      case 'firefox': return firefox;
      case 'webkit': return webkit;
      default: return chromium;
    }
  }

  /**
   * Get browser launch arguments for stealth and performance
   */
  getLaunchArgs() {
    const args = [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-accelerated-2d-canvas',
      '--disable-accelerated-jpeg-decoding',
      '--disable-accelerated-mjpeg-decode',
      '--disable-accelerated-video-decode',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-features=TranslateUI',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--no-first-run',
      '--enable-automation',
      '--password-store=basic',
      '--use-mock-keychain'
    ];

    return args;
  }

  /**
   * Apply stealth scripts to avoid detection
   */
  async applyStealthScripts() {
    await this.context.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' 
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters)
      );

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // Hide automation-related properties
      delete navigator.__proto__.webdriver;

      // Override canvas fingerprint
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type) {
        if (type === 'image/png' && this.width === 220 && this.height === 30) {
          return 'data:image/png;base64,00';
        }
        return originalToDataURL.apply(this, arguments);
      };
    });
  }

  /**
   * Get next proxy from pool
   */
  getNextProxy() {
    if (!this.options.proxies.length) return this.options.proxy;
    
    const proxy = this.options.proxies[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.options.proxies.length;
    return proxy;
  }

  /**
   * Rotate proxy if needed
   */
  async rotateProxyIfNeeded() {
    this.requestCount++;
    
    if (this.options.proxies.length && this.requestCount % this.options.rotateProxyEvery === 0) {
      const proxy = this.getNextProxy();
      this.logger.debug(`Rotating to proxy: ${proxy.server}`);
      
      // Close current context and create new one with new proxy
      if (this.context) {
        await this.context.close();
      }
      
      this.context = await this.browser.newContext({
        viewport: this.options.viewport,
        userAgent: new UserAgent().toString(),
        proxy: proxy
      });

      if (this.options.stealth) {
        await this.applyStealthScripts();
      }

      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(this.options.timeout);
    }
  }

  /**
   * Add random delay to mimic human behavior
   */
  async humanDelay() {
    const { min, max } = this.options.delay;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page.waitForTimeout(delay);
  }

  /**
   * Navigate to URL with retry logic
   */
  async navigate(url, options = {}) {
    await this.init();
    await this.rotateProxyIfNeeded();

    let lastError;
    for (let attempt = 1; attempt <= this.options.retries; attempt++) {
      try {
        this.logger.debug(`Navigating to ${url} (attempt ${attempt})`);
        
        const response = await this.page.goto(url, {
          waitUntil: options.waitUntil || 'networkidle',
          timeout: options.timeout || this.options.timeout
        });

        if (options.waitFor) {
          await this.page.waitForSelector(options.waitFor, { timeout: this.options.timeout });
        }

        await this.humanDelay();
        return response;
      } catch (error) {
        lastError = error;
        this.logger.warn(`Navigation failed (attempt ${attempt}): ${error.message}`);
        
        if (this.options.onRetry) {
          this.options.onRetry(error, attempt);
        }

        if (attempt < this.options.retries) {
          await this.page.waitForTimeout(this.options.retryDelay * attempt);
        }
      }
    }

    if (this.options.onError) {
      this.options.onError(lastError);
    }
    throw lastError;
  }

  /**
   * Scrape data from a webpage
   */
  async scrape(url, config) {
    await this.navigate(url, { waitFor: config.waitFor });

    const results = {};

    for (const [key, selectorConfig] of Object.entries(config.selectors)) {
      results[key] = await this.extractData(selectorConfig);
    }

    return results;
  }

  /**
   * Extract data based on selector configuration
   */
  async extractData(config) {
    const isMultiple = config.multiple || false;
    const selector = typeof config === 'string' ? config : config.selector;

    if (isMultiple) {
      const elements = await this.page.$$(selector);
      const results = [];

      for (const element of elements) {
        if (config.fields) {
          const item = {};
          for (const [fieldKey, fieldConfig] of Object.entries(config.fields)) {
            item[fieldKey] = await this.extractField(element, fieldConfig);
          }
          results.push(item);
        } else {
          const text = await element.textContent();
          results.push(text?.trim());
        }
      }
      return results;
    } else {
      if (config.fields) {
        const element = await this.page.$(selector);
        if (!element) return null;

        const item = {};
        for (const [fieldKey, fieldConfig] of Object.entries(config.fields)) {
          item[fieldKey] = await this.extractField(element, fieldConfig);
        }
        return item;
      } else {
        return await this.extractField(this.page, config);
      }
    }
  }

  /**
   * Extract a single field value
   */
  async extractField(context, config) {
    const selector = typeof config === 'string' ? config : config.selector;
    const attribute = typeof config === 'object' ? config.attribute : null;
    const transform = typeof config === 'object' ? config.transform : null;

    let value;
    
    if (attribute) {
      const element = await context.$(selector);
      value = element ? await element.getAttribute(attribute) : null;
    } else {
      const element = await context.$(selector);
      value = element ? await element.textContent() : null;
    }

    if (value && typeof value === 'string') {
      value = value.trim();
    }

    if (transform && value) {
      value = transform(value);
    }

    return value;
  }

  /**
   * Fill and submit a form
   */
  async fillForm(url, data, options = {}) {
    await this.navigate(url, { waitFor: options.waitFor });

    // Fill form fields
    for (const [selector, value] of Object.entries(data)) {
      await this.fillField(selector, value);
      await this.humanDelay();
    }

    // Submit form if specified
    if (options.submit) {
      await this.page.click(options.submit);
      
      if (options.waitFor) {
        await this.page.waitForSelector(options.waitFor, { timeout: this.options.timeout });
      }
    }

    return {
      url: this.page.url(),
      content: await this.page.content()
    };
  }

  /**
   * Fill a single form field
   */
  async fillField(selector, value) {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const type = await element.evaluate(el => el.type);

    if (tagName === 'select') {
      await this.page.selectOption(selector, value);
    } else if (tagName === 'input' && type === 'checkbox') {
      if (value) {
        await this.page.check(selector);
      } else {
        await this.page.uncheck(selector);
      }
    } else if (tagName === 'input' && type === 'radio') {
      await this.page.check(selector);
    } else if (tagName === 'input' && type === 'file') {
      await this.page.setInputFiles(selector, value);
    } else {
      await this.page.fill(selector, String(value));
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(url, options = {}) {
    if (url) {
      await this.navigate(url, { waitFor: options.waitFor });
    }

    const screenshotOptions = {
      path: options.path || './screenshot.png',
      fullPage: options.fullPage !== false,
      type: options.type || 'png'
    };

    if (options.selector) {
      const element = await this.page.$(options.selector);
      if (element) {
        await element.screenshot({ path: options.path });
        return options.path;
      }
    }

    await this.page.screenshot(screenshotOptions);
    return screenshotOptions.path;
  }

  /**
   * Generate PDF from page
   */
  async pdf(url, options = {}) {
    if (url) {
      await this.navigate(url, { waitFor: options.waitFor });
    }

    const pdfOptions = {
      path: options.path || './page.pdf',
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    };

    await this.page.pdf(pdfOptions);
    return pdfOptions.path;
  }

  /**
   * Execute JavaScript in page context
   */
  async evaluate(fn, ...args) {
    await this.init();
    return await this.page.evaluate(fn, ...args);
  }

  /**
   * Click an element
   */
  async click(selector, options = {}) {
    await this.page.click(selector);
    if (options.waitFor) {
      await this.page.waitForSelector(options.waitFor, { timeout: this.options.timeout });
    }
    await this.humanDelay();
  }

  /**
   * Wait for selector
   */
  async waitFor(selector, options = {}) {
    await this.page.waitForSelector(selector, {
      timeout: options.timeout || this.options.timeout,
      state: options.state || 'visible'
    });
  }

  /**
   * Scroll to element or position
   */
  async scroll(target) {
    if (typeof target === 'string') {
      await this.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, target);
    } else {
      await this.page.evaluate((pos) => {
        window.scrollTo({ top: pos, behavior: 'smooth' });
      }, target);
    }
    await this.humanDelay();
  }

  /**
   * Handle CAPTCHA if present
   */
  async handleCaptcha() {
    if (!this.options.captcha) {
      throw new Error('CAPTCHA handling not configured');
    }

    // Check for common CAPTCHA types
    const captchaSelectors = [
      '.g-recaptcha',
      '[data-sitekey]',
      '.h-captcha',
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]'
    ];

    for (const selector of captchaSelectors) {
      const element = await this.page.$(selector);
      if (element) {
        this.logger.debug('CAPTCHA detected, attempting to solve...');
        return await this.solveCaptcha(element, selector);
      }
    }

    return false;
  }

  /**
   * Solve CAPTCHA using external service
   */
  async solveCaptcha(element, selector) {
    const { service, apiKey } = this.options.captcha;
    
    // Get site key
    const siteKey = await element.evaluate(el => 
      el.getAttribute('data-sitekey') || el.getAttribute('sitekey')
    );

    const pageUrl = this.page.url();

    // CapMonster Cloud API integration
    if (service === 'capmonster') {
      return await this.solveWithCapMonster(apiKey, siteKey, pageUrl);
    }

    // 2Captcha integration
    if (service === '2captcha') {
      return await this.solveWith2Captcha(apiKey, siteKey, pageUrl);
    }

    throw new Error(`Unsupported CAPTCHA service: ${service}`);
  }

  /**
   * Solve CAPTCHA using CapMonster Cloud
   */
  async solveWithCapMonster(apiKey, siteKey, pageUrl) {
    // Create task
    const createResponse = await axios.post('https://api.capmonster.cloud/createTask', {
      clientKey: apiKey,
      task: {
        type: 'NoCaptchaTaskProxyless',
        websiteURL: pageUrl,
        websiteKey: siteKey
      }
    });

    const taskId = createResponse.data.taskId;
    if (!taskId) {
      throw new Error('Failed to create CAPTCHA task');
    }

    // Poll for result
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const resultResponse = await axios.post('https://api.capmonster.cloud/getTaskResult', {
        clientKey: apiKey,
        taskId: taskId
      });

      if (resultResponse.data.status === 'ready') {
        const token = resultResponse.data.solution.gRecaptchaResponse;
        
        // Inject token into page
        await this.page.evaluate((token) => {
          document.getElementById('g-recaptcha-response').innerHTML = token;
        }, token);

        return token;
      }

      attempts++;
    }

    throw new Error('CAPTCHA solving timeout');
  }

  /**
   * Solve CAPTCHA using 2Captcha
   */
  async solveWith2Captcha(apiKey, siteKey, pageUrl) {
    // Submit CAPTCHA
    const submitResponse = await axios.post('http://2captcha.com/in.php', {
      key: apiKey,
      method: 'userrecaptcha',
      googlekey: siteKey,
      pageurl: pageUrl,
      json: 1
    });

    const captchaId = submitResponse.data.request;
    if (submitResponse.data.status !== 1) {
      throw new Error('Failed to submit CAPTCHA');
    }

    // Poll for result
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const resultResponse = await axios.get(`http://2captcha.com/res.php`, {
        params: {
          key: apiKey,
          action: 'get',
          id: captchaId,
          json: 1
        }
      });

      if (resultResponse.data.status === 1) {
        const token = resultResponse.data.request;
        
        await this.page.evaluate((token) => {
          document.getElementById('g-recaptcha-response').innerHTML = token;
        }, token);

        return token;
      }

      attempts++;
    }

    throw new Error('CAPTCHA solving timeout');
  }

  /**
   * Save current session (cookies, localStorage)
   */
  async saveSession(path) {
    await this.init();
    const storageState = await this.context.storageState();
    require('fs').writeFileSync(path, JSON.stringify(storageState, null, 2));
    this.logger.debug(`Session saved to ${path}`);
  }

  /**
   * Load session from file
   */
  async loadSession(path) {
    if (require('fs').existsSync(path)) {
      this.sessionData = JSON.parse(require('fs').readFileSync(path, 'utf8'));
      this.logger.debug(`Session loaded from ${path}`);
    }
  }

  /**
   * Login and save session
   */
  async login(url, credentials, options = {}) {
    await this.fillForm(url, credentials, {
      submit: options.submitButton || 'button[type="submit"]',
      waitFor: options.successSelector || '.logged-in'
    });

    if (options.sessionPath) {
      await this.saveSession(options.sessionPath);
    }

    return true;
  }

  /**
   * Get current page content
   */
  async getContent() {
    return await this.page.content();
  }

  /**
   * Get current URL
   */
  getUrl() {
    return this.page?.url();
  }

  /**
   * Close browser and cleanup
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.logger.debug('Browser closed');
    }
  }
}

// Export all modules
const { 
  WebAutomationError,
  NavigationError,
  ElementNotFoundError,
  TimeoutError,
  ProxyError,
  CaptchaError,
  ValidationError,
  withRetry,
  CircuitBreaker,
  RateLimiter
} = require('./errors');

const { ProxyManager } = require('./proxy-manager');

const utils = require('./utils');

module.exports = {
  WebAutomation,
  WebAutomationError,
  NavigationError,
  ElementNotFoundError,
  TimeoutError,
  ProxyError,
  CaptchaError,
  ValidationError,
  withRetry,
  CircuitBreaker,
  RateLimiter,
  ProxyManager,
  utils
};
