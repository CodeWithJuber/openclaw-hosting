/**
 * Web Automation Skill Tests
 */

const { WebAutomation, ProxyManager, utils } = require('../src');
const path = require('path');
const fs = require('fs');

describe('WebAutomation', () => {
  let scraper;

  afterEach(async () => {
    if (scraper) {
      await scraper.close();
      scraper = null;
    }
  });

  describe('Initialization', () => {
    test('should create instance with default options', () => {
      scraper = new WebAutomation();
      expect(scraper.options.headless).toBe(true);
      expect(scraper.options.browser).toBe('chromium');
      expect(scraper.options.stealth).toBe(true);
    });

    test('should merge custom options', () => {
      scraper = new WebAutomation({
        headless: false,
        browser: 'firefox',
        timeout: 60000
      });
      expect(scraper.options.headless).toBe(false);
      expect(scraper.options.browser).toBe('firefox');
      expect(scraper.options.timeout).toBe(60000);
    });
  });

  describe('Navigation', () => {
    test('should navigate to URL', async () => {
      scraper = new WebAutomation();
      const response = await scraper.navigate('https://httpbin.org/html');
      expect(response).toBeDefined();
      expect(scraper.getUrl()).toBe('https://httpbin.org/html');
    }, 30000);

    test('should handle navigation errors', async () => {
      scraper = new WebAutomation({ retries: 1 });
      await expect(
        scraper.navigate('https://invalid-domain-that-does-not-exist.com')
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Scraping', () => {
    test('should extract data with selectors', async () => {
      scraper = new WebAutomation();
      const data = await scraper.scrape('https://quotes.toscrape.com/', {
        selectors: {
          title: 'h1'
        }
      });
      expect(data.title).toContain('Quotes');
    }, 30000);

    test('should extract multiple elements', async () => {
      scraper = new WebAutomation();
      const data = await scraper.scrape('https://quotes.toscrape.com/', {
        selectors: {
          quotes: {
            selector: '.quote',
            multiple: true,
            fields: {
              text: '.text'
            }
          }
        }
      });
      expect(Array.isArray(data.quotes)).toBe(true);
      expect(data.quotes.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Form Handling', () => {
    test('should fill form fields', async () => {
      scraper = new WebAutomation();
      await scraper.navigate('https://httpbin.org/forms/post');
      
      await scraper.fillField('input[name="custname"]', 'Test User');
      const value = await scraper.page.inputValue('input[name="custname"]');
      expect(value).toBe('Test User');
    }, 30000);
  });

  describe('Screenshots', () => {
    test('should take screenshot', async () => {
      scraper = new WebAutomation();
      const outputPath = path.join(__dirname, 'test-screenshot.png');
      
      await scraper.screenshot('https://httpbin.org/html', {
        path: outputPath
      });
      
      expect(fs.existsSync(outputPath)).toBe(true);
      fs.unlinkSync(outputPath);
    }, 30000);
  });

  describe('Session Management', () => {
    test('should save and load session', async () => {
      scraper = new WebAutomation();
      const sessionPath = path.join(__dirname, 'test-session.json');
      
      await scraper.navigate('https://httpbin.org/cookies/set/test/value');
      await scraper.saveSession(sessionPath);
      
      expect(fs.existsSync(sessionPath)).toBe(true);
      
      // Create new instance and load session
      const scraper2 = new WebAutomation();
      await scraper2.loadSession(sessionPath);
      await scraper2.navigate('https://httpbin.org/cookies');
      
      const content = await scraper2.getContent();
      expect(content).toContain('test');
      
      await scraper2.close();
      fs.unlinkSync(sessionPath);
    }, 30000);
  });
});

describe('ProxyManager', () => {
  test('should create with proxy list', () => {
    const proxies = [
      { server: 'http://proxy1.com:8080' },
      { server: 'http://proxy2.com:8080' }
    ];
    const manager = new ProxyManager({ proxies });
    expect(manager.count).toBe(2);
  });

  test('should rotate proxies', () => {
    const proxies = [
      { server: 'http://proxy1.com:8080' },
      { server: 'http://proxy2.com:8080' }
    ];
    const manager = new ProxyManager({ proxies });
    
    const proxy1 = manager.getNextProxy();
    const proxy2 = manager.getNextProxy();
    const proxy3 = manager.getNextProxy();
    
    expect(proxy1.server).toBe('http://proxy1.com:8080');
    expect(proxy2.server).toBe('http://proxy2.com:8080');
    expect(proxy3.server).toBe('http://proxy1.com:8080'); // Round-robin
  });

  test('should track proxy failures', () => {
    const proxy = { server: 'http://proxy1.com:8080' };
    const manager = new ProxyManager({ 
      proxies: [proxy],
      maxFailures: 2 
    });
    
    manager.markFailed(proxy, new Error('Timeout'));
    expect(manager.availableCount).toBe(1);
    
    manager.markFailed(proxy, new Error('Timeout'));
    expect(manager.availableCount).toBe(0);
  });
});

describe('Utils', () => {
  test('randomDelay should return value in range', () => {
    const delay = utils.randomDelay(100, 200);
    expect(delay).toBeGreaterThanOrEqual(100);
    expect(delay).toBeLessThanOrEqual(200);
  });

  test('isValidUrl should validate URLs', () => {
    expect(utils.isValidUrl('https://example.com')).toBe(true);
    expect(utils.isValidUrl('not-a-url')).toBe(false);
  });

  test('sanitizeFilename should clean filenames', () => {
    expect(utils.sanitizeFilename('file:name?.txt')).toBe('file_name_.txt');
  });

  test('chunkArray should split array', () => {
    const arr = [1, 2, 3, 4, 5];
    const chunks = utils.chunkArray(arr, 2);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('parseCSV should parse CSV content', () => {
    const csv = 'name,age\nJohn,30\nJane,25';
    const data = utils.parseCSV(csv);
    expect(data).toEqual([
      { name: 'John', age: '30' },
      { name: 'Jane', age: '25' }
    ]);
  });
});
