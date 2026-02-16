/**
 * BrowserContext - Manages isolated browser contexts
 */

class BrowserContext {
  constructor(browser, options = {}) {
    this.browser = browser;
    this.options = options;
    this.context = null;
    this.pages = [];
  }

  /**
   * Create new context
   * @returns {Promise<Object>}
   */
  async create() {
    this.context = await this.browser.newContext(this.options);
    return this.context;
  }

  /**
   * Create new page in context
   * @returns {Promise<Object>}
   */
  async newPage() {
    if (!this.context) {
      await this.create();
    }
    
    const page = await this.context.newPage();
    this.pages.push(page);
    return page;
  }

  /**
   * Get all pages in context
   * @returns {Array}
   */
  getPages() {
    return this.pages;
  }

  /**
   * Close context
   * @returns {Promise<void>}
   */
  async close() {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.pages = [];
    }
  }

  /**
   * Add cookies to context
   * @param {Array} cookies - Cookies to add
   * @returns {Promise<void>}
   */
  async addCookies(cookies) {
    this._ensureContext();
    await this.context.addCookies(cookies);
  }

  /**
   * Clear all cookies
   * @returns {Promise<void>}
   */
  async clearCookies() {
    this._ensureContext();
    await this.context.clearCookies();
  }

  /**
   * Get all cookies
   * @returns {Promise<Array>}
   */
  async getCookies() {
    this._ensureContext();
    return await this.context.cookies();
  }

  /**
   * Grant permissions
   * @param {Array} permissions - Permissions to grant
   * @param {Object} options - Grant options
   * @returns {Promise<void>}
   */
  async grantPermissions(permissions, options = {}) {
    this._ensureContext();
    await this.context.grantPermissions(permissions, options);
  }

  /**
   * Clear permissions
   * @returns {Promise<void>}
   */
  async clearPermissions() {
    this._ensureContext();
    await this.context.clearPermissions();
  }

  /**
   * Set geolocation
   * @param {Object} geolocation - Geolocation { latitude, longitude }
   * @returns {Promise<void>}
   */
  async setGeolocation(geolocation) {
    this._ensureContext();
    await this.context.setGeolocation(geolocation);
  }

  /**
   * Set extra HTTP headers
   * @param {Object} headers - Headers object
   * @returns {Promise<void>}
   */
  async setExtraHTTPHeaders(headers) {
    this._ensureContext();
    await this.context.setExtraHTTPHeaders(headers);
  }

  /**
   * Route requests
   * @param {string|Function} url - URL pattern or filter function
   * @param {Function} handler - Route handler
   * @returns {Promise<void>}
   */
  async route(url, handler) {
    this._ensureContext();
    await this.context.route(url, handler);
  }

  /**
   * Unroute requests
   * @param {string|Function} url - URL pattern or filter function
   * @param {Function} handler - Route handler
   * @returns {Promise<void>}
   */
  async unroute(url, handler) {
    this._ensureContext();
    await this.context.unroute(url, handler);
  }

  /**
   * Wait for event
   * @param {string} event - Event name
   * @param {Object} options - Wait options
   * @returns {Promise<any>}
   */
  async waitForEvent(event, options = {}) {
    this._ensureContext();
    return await this.context.waitForEvent(event, options);
  }

  /**
   * Ensure context exists
   * @private
   */
  _ensureContext() {
    if (!this.context) {
      throw new Error('Context not created. Call create() first.');
    }
  }
}

module.exports = { BrowserContext };
