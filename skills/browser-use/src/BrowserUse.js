/**
 * BrowserUse - Main browser automation class
 * 
 * Provides comprehensive browser control for AI agents including:
 * - Multi-browser support (Chrome, Firefox, WebKit)
 * - Navigation and element interaction
 * - Form filling and submission
 * - Screenshot and PDF generation
 * - Cookie and session management
 * - Stealth mode for anti-detection
 * - Proxy rotation and error handling
 */

const { chromium, firefox, webkit } = require('playwright');
const UserAgent = require('user-agents');
const winston = require('winston');
const { BrowserError, TimeoutError, ElementNotFoundError } = require('./errors');
const { sleep, retry } = require('./utils');

class BrowserUse {
  constructor(options = {}) {
    this.options = {
      browser: 'chromium',
      headless: true,
      slowMo: 0,
      viewport: { width: 1920, height: 1080 },
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      stealth: false,
      proxy: null,
      proxies: [],
      logger: null,
      ...options
    };

    this.browser = null;
    this.context = null;
    this.page = null;
    this.currentProxyIndex = 0;
    this.isLaunched = false;

    // Setup logger
    this.logger = this.options.logger || winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  /**
   * Launch the browser
   * @param {Object} launchOptions - Launch configuration
   * @returns {Promise<void>}
   */
  async launch(launchOptions = {}) {
    const options = { ...this.options, ...launchOptions };
    
    try {
      const browserType = this._getBrowserType(options.browser);
      
      const launchConfig = {
        headless: options.headless,
        slowMo: options.slowMo,
        ...this._getStealthOptions(options),
        ...this._getProxyOptions(options)
      };

      this.logger.info(`Launching ${options.browser} browser...`);
      this.browser = await browserType.launch(launchConfig);

      // Create context with viewport and other options
      const contextOptions = {
        viewport: options.viewport,
        locale: options.locale || 'en-US',
        timezoneId: options.timezoneId,
        userAgent: options.userAgent || this._getRandomUserAgent(options),
        ...this._getStealthContextOptions(options)
      };

      this.context = await this.browser.newContext(contextOptions);
      this.page = await this.context.newPage();
      
      // Setup default timeout
      this.page.setDefaultTimeout(options.timeout);
      this.page.setDefaultNavigationTimeout(options.timeout);

      // Setup dialog handler
      this._setupDialogHandler();

      this.isLaunched = true;
      this.logger.info('Browser launched successfully');
    } catch (error) {
      this.logger.error('Failed to launch browser:', error);
      throw new BrowserError(`Failed to launch browser: ${error.message}`);
    }
  }

  /**
   * Close the browser
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.browser) {
        await this.browser.close();
        this.logger.info('Browser closed');
      }
    } catch (error) {
      this.logger.error('Error closing browser:', error);
    } finally {
      this.browser = null;
      this.context = null;
      this.page = null;
      this.isLaunched = false;
    }
  }

  /**
   * Navigate to a URL
   * @param {string} url - URL to navigate to
   * @param {Object} options - Navigation options
   * @returns {Promise<void>}
   */
  async goto(url, options = {}) {
    this._ensureLaunched();
    
    const navOptions = {
      waitUntil: options.waitUntil || 'load',
      timeout: options.timeout || this.options.timeout
    };

    try {
      this.logger.info(`Navigating to: ${url}`);
      await this.page.goto(url, navOptions);
    } catch (error) {
      throw new BrowserError(`Navigation failed: ${error.message}`);
    }
  }

  /**
   * Go back in browser history
   * @param {Object} options - Navigation options
   * @returns {Promise<void>}
   */
  async goBack(options = {}) {
    this._ensureLaunched();
    await this.page.goBack({
      waitUntil: options.waitUntil || 'load',
      timeout: options.timeout || this.options.timeout
    });
  }

  /**
   * Go forward in browser history
   * @param {Object} options - Navigation options
   * @returns {Promise<void>}
   */
  async goForward(options = {}) {
    this._ensureLaunched();
    await this.page.goForward({
      waitUntil: options.waitUntil || 'load',
      timeout: options.timeout || this.options.timeout
    });
  }

  /**
   * Reload the current page
   * @param {Object} options - Reload options
   * @returns {Promise<void>}
   */
  async reload(options = {}) {
    this._ensureLaunched();
    await this.page.reload({
      waitUntil: options.waitUntil || 'load',
      timeout: options.timeout || this.options.timeout
    });
  }

  /**
   * Get current URL
   * @returns {Promise<string>}
   */
  async getUrl() {
    this._ensureLaunched();
    return this.page.url();
  }

  /**
   * Get page title
   * @returns {Promise<string>}
   */
  async getTitle() {
    this._ensureLaunched();
    return this.page.title();
  }

  /**
   * Click an element
   * @param {string} selector - CSS selector
   * @param {Object} options - Click options
   * @returns {Promise<void>}
   */
  async click(selector, options = {}) {
    this._ensureLaunched();
    
    try {
      await this.page.click(selector, {
        delay: options.delay,
        button: options.button || 'left',
        clickCount: options.clickCount || 1,
        timeout: options.timeout || this.options.timeout
      });
    } catch (error) {
      throw new ElementNotFoundError(`Failed to click element "${selector}": ${error.message}`);
    }
  }

  /**
   * Double click an element
   * @param {string} selector - CSS selector
   * @param {Object} options - Click options
   * @returns {Promise<void>}
   */
  async doubleClick(selector, options = {}) {
    return this.click(selector, { ...options, clickCount: 2 });
  }

  /**
   * Right click an element
   * @param {string} selector - CSS selector
   * @param {Object} options - Click options
   * @returns {Promise<void>}
   */
  async rightClick(selector, options = {}) {
    return this.click(selector, { ...options, button: 'right' });
  }

  /**
   * Hover over an element
   * @param {string} selector - CSS selector
   * @param {Object} options - Hover options
   * @returns {Promise<void>}
   */
  async hover(selector, options = {}) {
    this._ensureLaunched();
    
    try {
      await this.page.hover(selector, {
        timeout: options.timeout || this.options.timeout
      });
    } catch (error) {
      throw new ElementNotFoundError(`Failed to hover over element "${selector}": ${error.message}`);
    }
  }

  /**
   * Type text into an input field
   * @param {string} selector - CSS selector
   * @param {string} text - Text to type
   * @param {Object} options - Type options
   * @returns {Promise<void>}
   */
  async type(selector, text, options = {}) {
    this._ensureLaunched();
    
    try {
      await this.page.type(selector, text, {
        delay: options.delay || 0,
        timeout: options.timeout || this.options.timeout
      });
    } catch (error) {
      throw new ElementNotFoundError(`Failed to type into element "${selector}": ${error.message}`);
    }
  }

  /**
   * Fill a form field (clears existing content)
   * @param {string} selector - CSS selector
   * @param {string} value - Value to fill
   * @param {Object} options - Fill options
   * @returns {Promise<void>}
   */
  async fill(selector, value, options = {}) {
    this._ensureLaunched();
    
    try {
      await this.page.fill(selector, value, {
        timeout: options.timeout || this.options.timeout
      });
    } catch (error) {
      throw new ElementNotFoundError(`Failed to fill element "${selector}": ${error.message}`);
    }
  }

  /**
   * Clear a form field
   * @param {string} selector - CSS selector
   * @param {Object} options - Clear options
   * @returns {Promise<void>}
   */
  async clear(selector, options = {}) {
    this._ensureLaunched();
    
    try {
      await this.page.fill(selector, '', {
        timeout: options.timeout || this.options.timeout
      });
    } catch (error) {
      throw new ElementNotFoundError(`Failed to clear element "${selector}": ${error.message}`);
    }
  }

  /**
   * Press a key
   * @param {string} selector - CSS selector
   * @param {string} key - Key to press
   * @param {Object} options - Press options
   * @returns {Promise<void>}
   */
  async press(selector, key, options = {}) {
    this._ensureLaunched();
    
    try {
      await this.page.press(selector, key, {
        delay: options.delay,
        timeout: options.timeout || this.options.timeout
      });
    } catch (error) {
      throw new ElementNotFoundError(`Failed to press key on element "${selector}": ${error.message}`);
    }
  }

  /**
   * Select option from dropdown
   * @param {string} selector - CSS selector
   * @param {string|Object} value - Value, label, or index to select
   * @param {Object} options - Select options
   * @returns {Promise<void>}
   */
  async select(selector, value, options = {}) {
    this._ensureLaunched();
    
    try {
      if (typeof value === 'string') {
        await this.page.selectOption(selector, value);
      } else if (value.value) {
        await this.page.selectOption(selector, { value: value.value });
      } else if (value.label) {
        await this.page.selectOption(selector, { label: value.label });
      } else if (value.index !== undefined) {
        await this.page.selectOption(selector, { index: value.index });
      }
    } catch (error) {
      throw new ElementNotFoundError(`Failed to select option in element "${selector}": ${error.message}`);
    }
  }

  /**
   * Check a checkbox
   * @param {string} selector - CSS selector
   * @param {Object} options - Check options
   * @returns {Promise<void>}
   */
  async check(selector, options = {}) {
    this._ensureLaunched();
    
    try {
      await this.page.check(selector, {
        timeout: options.timeout || this.options.timeout
      });
    } catch (error) {
      throw new ElementNotFoundError(`Failed to check element "${selector}": ${error.message}`);
    }
  }

  /**
   * Uncheck a checkbox
   * @param {string} selector - CSS selector
   * @param {Object} options - Uncheck options
   * @returns {Promise<void>}
   */
  async uncheck(selector, options = {}) {
    this._ensureLaunched();
    
    try {
      await this.page.uncheck(selector, {
        timeout: options.timeout || this.options.timeout
      });
    } catch (error) {
      throw new ElementNotFoundError(`Failed to uncheck element "${selector}": ${error.message}`);
    }
  }

  /**
   * Upload file(s)
   * @param {string} selector - CSS selector
   * @param {string|string[]} filePath - File path(s) to upload
   * @param {Object} options - Upload options
   * @returns {Promise<void>}
   */
  async uploadFile(selector, filePath, options = {}) {
    this._ensureLaunched();
    
    try {
      const input = await this.page.locator(selector);
      await input.setInputFiles(filePath);
    } catch (error) {
      throw new ElementNotFoundError(`Failed to upload file to element "${selector}": ${error.message}`);
    }
  }

  /**
   * Wait for element to be visible/hidden
   * @param {string} selector - CSS selector
   * @param {Object} options - Wait options
   * @returns {Promise<void>}
   */
  async waitForSelector(selector, options = {}) {
    this._ensureLaunched();
    
    const state = options.state || 'visible';
    const timeout = options.timeout || this.options.timeout;
    
    try {
      await this.page.waitForSelector(selector, { state, timeout });
    } catch (error) {
      throw new TimeoutError(`Timeout waiting for element "${selector}" to be ${state}`);
    }
  }

  /**
   * Wait for navigation to complete
   * @param {Object} options - Wait options
   * @returns {Promise<void>}
   */
  async waitForNavigation(options = {}) {
    this._ensureLaunched();
    
    await this.page.waitForNavigation({
      waitUntil: options.waitUntil || 'load',
      timeout: options.timeout || this.options.timeout
    });
  }

  /**
   * Wait for page load state
   * @param {string} state - Load state: 'load', 'domcontentloaded', 'networkidle'
   * @param {Object} options - Wait options
   * @returns {Promise<void>}
   */
  async waitForLoadState(state = 'load', options = {}) {
    this._ensureLaunched();
    
    await this.page.waitForLoadState(state, {
      timeout: options.timeout || this.options.timeout
    });
  }

  /**
   * Wait for timeout
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  async waitForTimeout(ms) {
    this._ensureLaunched();
    await this.page.waitForTimeout(ms);
  }

  /**
   * Wait for function to return true
   * @param {Function} fn - Function to evaluate
   * @param {Object} options - Wait options
   * @returns {Promise<void>}
   */
  async waitForFunction(fn, options = {}) {
    this._ensureLaunched();
    
    await this.page.waitForFunction(fn, {
      timeout: options.timeout || this.options.timeout,
      polling: options.polling || 'raf'
    });
  }

  /**
   * Fill multiple form fields
   * @param {Object} fields - Field selectors and values
   * @param {Object} options - Fill options
   * @returns {Promise<void>}
   */
  async fillForm(fields, options = {}) {
    this._ensureLaunched();
    
    for (const [selector, value] of Object.entries(fields)) {
      if (typeof value === 'boolean') {
        // Handle checkbox
        if (value) {
          await this.check(selector);
        } else {
          await this.uncheck(selector);
        }
      } else {
        await this.fill(selector, String(value));
      }
    }
    
    // Submit form if specified
    if (options.submit) {
      await this.click(options.submit);
      
      if (options.waitForNavigation) {
        await this.waitForNavigation();
      }
      
      if (options.waitForSelector) {
        await this.waitForSelector(options.waitForSelector);
      }
    }
  }

  /**
   * Get text content of element
   * @param {string} selector - CSS selector
   * @param {Object} options - Get options
   * @returns {Promise<string>}
   */
  async getText(selector, options = {}) {
    this._ensureLaunched();
    
    try {
      const element = await this.page.locator(selector).first();
      return await element.textContent();
    } catch (error) {
      throw new ElementNotFoundError(`Failed to get text from element "${selector}": ${error.message}`);
    }
  }

  /**
   * Get attribute of element
   * @param {string} selector - CSS selector
   * @param {string} attribute - Attribute name
   * @param {Object} options - Get options
   * @returns {Promise<string|null>}
   */
  async getAttribute(selector, attribute, options = {}) {
    this._ensureLaunched();
    
    try {
      const element = await this.page.locator(selector).first();
      return await element.getAttribute(attribute);
    } catch (error) {
      throw new ElementNotFoundError(`Failed to get attribute from element "${selector}": ${error.message}`);
    }
  }

  /**
   * Get multiple elements
   * @param {string} selector - CSS selector
   * @param {Object} fields - Field extraction configuration
   * @returns {Promise<Array>}
   */
  async getElements(selector, fields = {}) {
    this._ensureLaunched();
    
    const elements = await this.page.locator(selector).all();
    const results = [];
    
    for (const element of elements) {
      const item = {};
      
      for (const [key, config] of Object.entries(fields)) {
        if (typeof config === 'function') {
          item[key] = await config(element);
        } else if (typeof config === 'string') {
          // Simple text extraction
          const child = await element.locator(config).first();
          item[key] = await child.textContent().catch(() => null);
        } else if (config.attribute) {
          // Attribute extraction
          item[key] = await element.getAttribute(config.attribute);
        } else if (config.selector) {
          const child = await element.locator(config.selector).first();
          if (config.attribute) {
            item[key] = await child.getAttribute(config.attribute);
          } else if (config.transform) {
            const text = await child.textContent().catch(() => '');
            item[key] = config.transform(text);
          } else {
            item[key] = await child.textContent().catch(() => null);
          }
        }
      }
      
      results.push(item);
    }
    
    return results;
  }

  /**
   * Extract structured data from page
   * @param {Object} config - Extraction configuration
   * @returns {Promise<Array|Object>}
   */
  async extract(config) {
    this._ensureLaunched();
    
    const { selector, multiple = false, fields } = config;
    
    if (multiple) {
      return this.getElements(selector, fields);
    } else {
      // Single element extraction
      const result = {};
      
      for (const [key, fieldConfig] of Object.entries(fields)) {
        if (typeof fieldConfig === 'string') {
          result[key] = await this.getText(fieldConfig);
        } else if (fieldConfig.attribute) {
          result[key] = await this.getAttribute(
            fieldConfig.selector || selector,
            fieldConfig.attribute
          );
        } else if (fieldConfig.transform) {
          const text = await this.getText(fieldConfig.selector);
          result[key] = fieldConfig.transform(text);
        } else {
          result[key] = await this.getText(fieldConfig.selector);
        }
      }
      
      return result;
    }
  }

  /**
   * Execute JavaScript in page context
   * @param {Function|string} fn - Function or script to execute
   * @param {Array} args - Arguments to pass to function
   * @returns {Promise<any>}
   */
  async evaluate(fn, args = []) {
    this._ensureLaunched();
    return await this.page.evaluate(fn, ...args);
  }

  /**
   * Get page HTML
   * @param {string} selector - Optional CSS selector for specific element
   * @returns {Promise<string>}
   */
  async getHTML(selector = null) {
    this._ensureLaunched();
    
    if (selector) {
      const element = await this.page.locator(selector).first();
      return await element.innerHTML();
    }
    
    return await this.page.content();
  }

  /**
   * Take screenshot
   * @param {Object} options - Screenshot options
   * @returns {Promise<Buffer|string>}
   */
  async screenshot(options = {}) {
    this._ensureLaunched();
    
    const screenshotOptions = {
      type: options.type || 'png',
      fullPage: options.fullPage || false,
      ...options
    };
    
    if (options.selector) {
      // Element screenshot
      const element = await this.page.locator(options.selector).first();
      return await element.screenshot(screenshotOptions);
    }
    
    return await this.page.screenshot(screenshotOptions);
  }

  /**
   * Generate PDF
   * @param {Object} options - PDF options
   * @returns {Promise<Buffer>}
   */
  async pdf(options = {}) {
    this._ensureLaunched();
    
    const pdfOptions = {
      format: options.format || 'A4',
      printBackground: options.printBackground !== false,
      margin: options.margin || { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      ...options
    };
    
    return await this.page.pdf(pdfOptions);
  }

  /**
   * Get all cookies
   * @returns {Promise<Array>}
   */
  async getCookies() {
    this._ensureLaunched();
    return await this.context.cookies();
  }

  /**
   * Get specific cookie
   * @param {string} name - Cookie name
   * @returns {Promise<Object|null>}
   */
  async getCookie(name) {
    const cookies = await this.getCookies();
    return cookies.find(c => c.name === name) || null;
  }

  /**
   * Set a cookie
   * @param {Object} cookie - Cookie object
   * @returns {Promise<void>}
   */
  async setCookie(cookie) {
    this._ensureLaunched();
    await this.context.addCookies([cookie]);
  }

  /**
   * Delete a cookie
   * @param {string} name - Cookie name
   * @returns {Promise<void>}
   */
  async deleteCookie(name) {
    this._ensureLaunched();
    await this.context.clearCookies();
  }

  /**
   * Clear all cookies
   * @returns {Promise<void>}
   */
  async clearCookies() {
    this._ensureLaunched();
    await this.context.clearCookies();
  }

  /**
   * Save session state to file
   * @param {string} path - File path
   * @returns {Promise<void>}
   */
  async saveSession(path) {
    this._ensureLaunched();
    
    const state = await this.context.storageState();
    const fs = require('fs').promises;
    await fs.writeFile(path, JSON.stringify(state, null, 2));
  }

  /**
   * Load session state from file
   * @param {string} path - File path
   * @returns {Promise<void>}
   */
  async loadSession(path) {
    const fs = require('fs').promises;
    const state = JSON.parse(await fs.readFile(path, 'utf8'));
    
    if (this.context) {
      await this.context.close();
    }
    
    this.context = await this.browser.newContext({ storageState: state });
    this.page = await this.context.newPage();
  }

  /**
   * Set localStorage item
   * @param {string} key - Key
   * @param {string} value - Value
   * @returns {Promise<void>}
   */
  async setLocalStorage(key, value) {
    this._ensureLaunched();
    await this.page.evaluate((k, v) => localStorage.setItem(k, v), key, value);
  }

  /**
   * Get localStorage item
   * @param {string} key - Key
   * @returns {Promise<string|null>}
   */
  async getLocalStorage(key) {
    this._ensureLaunched();
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  /**
   * Remove localStorage item
   * @param {string} key - Key
   * @returns {Promise<void>}
   */
  async removeLocalStorage(key) {
    this._ensureLaunched();
    await this.page.evaluate((k) => localStorage.removeItem(k), key);
  }

  /**
   * Clear localStorage
   * @returns {Promise<void>}
   */
  async clearLocalStorage() {
    this._ensureLaunched();
    await this.page.evaluate(() => localStorage.clear());
  }

  /**
   * Set sessionStorage item
   * @param {string} key - Key
   * @param {string} value - Value
   * @returns {Promise<void>}
   */
  async setSessionStorage(key, value) {
    this._ensureLaunched();
    await this.page.evaluate((k, v) => sessionStorage.setItem(k, v), key, value);
  }

  /**
   * Get sessionStorage item
   * @param {string} key - Key
   * @returns {Promise<string|null>}
   */
  async getSessionStorage(key) {
    this._ensureLaunched();
    return await this.page.evaluate((k) => sessionStorage.getItem(k), key);
  }

  /**
   * Switch to frame
   * @param {string|number} selector - Frame selector or index
   * @returns {Promise<void>}
   */
  async switchToFrame(selector) {
    this._ensureLaunched();
    
    if (typeof selector === 'number') {
      const frames = this.page.frames();
      if (selector >= frames.length) {
        throw new BrowserError(`Frame index ${selector} out of bounds`);
      }
      this.page = frames[selector];
    } else {
      const frame = this.page.frame(selector);
      if (!frame) {
        throw new BrowserError(`Frame "${selector}" not found`);
      }
      this.page = frame;
    }
  }

  /**
   * Switch back to main frame
   * @returns {Promise<void>}
   */
  async switchToMainFrame() {
    this._ensureLaunched();
    this.page = this.page.mainFrame();
  }

  /**
   * Get all frames
   * @returns {Promise<Array>}
   */
  async getFrames() {
    this._ensureLaunched();
    return this.page.frames();
  }

  /**
   * Setup dialog handler
   * @private
   */
  _setupDialogHandler() {
    this.page.on('dialog', async (dialog) => {
      this.logger.info(`Dialog appeared: ${dialog.type()} - ${dialog.message()}`);
      
      if (this._dialogHandler) {
        await this._dialogHandler(dialog);
      } else {
        // Default: accept alerts, dismiss confirms/prompts
        if (dialog.type() === 'alert') {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
      }
    });
  }

  /**
   * Set custom dialog handler
   * @param {Function} handler - Dialog handler function
   */
  onDialog(handler) {
    this._dialogHandler = handler;
  }

  /**
   * Handle dialog with specific action
   * @param {string} action - 'accept' or 'dismiss'
   * @param {string} text - Text for prompt dialogs
   */
  async handleDialog(action, text = '') {
    this.onDialog(async (dialog) => {
      if (action === 'accept') {
        await dialog.accept(text);
      } else {
        await dialog.dismiss();
      }
    });
  }

  /**
   * Rotate to next proxy
   * @returns {Promise<void>}
   */
  async rotateProxy() {
    if (this.options.proxies.length === 0) {
      throw new BrowserError('No proxies configured');
    }
    
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.options.proxies.length;
    
    // Restart browser with new proxy
    await this.close();
    await this.launch({
      proxy: this.options.proxies[this.currentProxyIndex]
    });
  }

  /**
   * Get current proxy
   * @returns {Object|null}
   */
  getCurrentProxy() {
    if (this.options.proxies.length > 0) {
      return this.options.proxies[this.currentProxyIndex];
    }
    return this.options.proxy;
  }

  /**
   * Execute function with retry logic
   * @param {Function} fn - Function to execute
   * @param {Object} options - Retry options
   * @returns {Promise<any>}
   */
  async withRetry(fn, options = {}) {
    const maxRetries = options.maxRetries || this.options.retries;
    const retryDelay = options.retryDelay || this.options.retryDelay;
    const shouldRetry = options.shouldRetry || (() => true);
    
    return retry(fn, {
      maxRetries,
      retryDelay,
      shouldRetry
    });
  }

  /**
   * Get browser type
   * @private
   * @param {string} browser - Browser name
   * @returns {Object}
   */
  _getBrowserType(browser) {
    switch (browser) {
      case 'chromium':
        return chromium;
      case 'firefox':
        return firefox;
      case 'webkit':
        return webkit;
      default:
        return chromium;
    }
  }

  /**
   * Get stealth launch options
   * @private
   * @param {Object} options - Options
   * @returns {Object}
   */
  _getStealthOptions(options) {
    if (!options.stealth) return {};
    
    return {
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    };
  }

  /**
   * Get stealth context options
   * @private
   * @param {Object} options - Options
   * @returns {Object}
   */
  _getStealthContextOptions(options) {
    if (!options.stealth) return {};
    
    return {
      javaScriptEnabled: true,
      bypassCSP: true
    };
  }

  /**
   * Get proxy options
   * @private
   * @param {Object} options - Options
   * @returns {Object}
   */
  _getProxyOptions(options) {
    const proxy = options.proxy || (options.proxies && options.proxies[0]);
    
    if (!proxy) return {};
    
    return {
      proxy: {
        server: proxy.server,
        username: proxy.username,
        password: proxy.password
      }
    };
  }

  /**
   * Get random user agent
   * @private
   * @param {Object} options - Options
   * @returns {string}
   */
  _getRandomUserAgent(options) {
    if (options.stealth && options.stealth.randomizeUserAgent !== false) {
      const userAgent = new UserAgent();
      return userAgent.toString();
    }
    
    return options.userAgent;
  }

  /**
   * Ensure browser is launched
   * @private
   */
  _ensureLaunched() {
    if (!this.isLaunched) {
      throw new BrowserError('Browser not launched. Call launch() first.');
    }
  }

  /**
   * Get available device names for emulation
   * @returns {Array<string>}
   */
  getDevices() {
    const { devices } = require('playwright');
    return Object.keys(devices);
  }

  /**
   * Launch with mobile device emulation
   * @param {string} deviceName - Device name from getDevices()
   * @param {Object} options - Additional options
   * @returns {Promise<void>}
   */
  async launchMobile(deviceName, options = {}) {
    const { devices } = require('playwright');
    const device = devices[deviceName];
    
    if (!device) {
      throw new BrowserError(`Device "${deviceName}" not found. Use getDevices() to see available devices.`);
    }
    
    await this.launch({
      ...options,
      viewport: device.viewport,
      userAgent: device.userAgent,
      deviceScaleFactor: device.deviceScaleFactor,
      isMobile: device.isMobile,
      hasTouch: device.hasTouch
    });
  }
}

module.exports = { BrowserUse };
