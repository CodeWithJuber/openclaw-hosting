/**
 * Stealth utilities for anti-detection
 */

/**
 * Stealth scripts to inject into pages
 */
const stealthScripts = {
  // Hide webdriver property
  hideWebDriver: () => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  },

  // Hide automation flags in chrome
  hideChromeAutomation: () => {
    window.chrome = {
      runtime: {},
      loadTimes: () => {},
      csi: () => {},
      app: {}
    };
  },

  // Override permissions API
  overridePermissions: () => {
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' 
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
    );
  },

  // Hide plugins length
  hidePlugins: () => {
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });
  },

  // Override languages
  overrideLanguages: () => {
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en']
    });
  },

  // Hide notification permission
  hideNotificationPermission: () => {
    const original = window.Notification;
    window.Notification = function(title, options) {
      return original.apply(this, arguments);
    };
    window.Notification.permission = 'default';
    window.Notification.requestPermission = () => Promise.resolve('default');
  },

  // Override iframe contentWindow
  overrideIframe: () => {
    try {
      const original = HTMLIFrameElement.prototype.contentWindow;
      Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        get: function() {
          const frame = original.call(this);
          if (frame) {
            Object.defineProperty(frame.navigator, 'webdriver', {
              get: () => undefined
            });
          }
          return frame;
        }
      });
    } catch (e) {}
  },

  // Hide canvas fingerprint
  hideCanvasFingerprint: () => {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    
    const noise = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(1, 1);
      imageData.data[0] = Math.floor(Math.random() * 256);
      imageData.data[1] = Math.floor(Math.random() * 256);
      imageData.data[2] = Math.floor(Math.random() * 256);
      return imageData;
    };
    
    HTMLCanvasElement.prototype.toDataURL = function(...args) {
      const ctx = this.getContext('2d');
      if (ctx) {
        ctx.putImageData(noise(), 0, 0);
      }
      return originalToDataURL.apply(this, args);
    };
  },

  // Hide WebGL fingerprint
  hideWebGLFingerprint: () => {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter(parameter);
    };
  }
};

/**
 * Get all stealth scripts as a single function
 * @returns {Function}
 */
function getAllStealthScripts() {
  return () => {
    Object.values(stealthScripts).forEach(script => {
      try {
        script();
      } catch (e) {}
    });
  };
}

/**
 * Get stealth script as string for injection
 * @returns {string}
 */
function getStealthScriptString() {
  return `
    (() => {
      ${Object.values(stealthScripts).map(fn => `(${fn.toString()})();`).join('\n')}
    })();
  `;
}

/**
 * Apply stealth to page
 * @param {Object} page - Playwright page
 * @returns {Promise<void>}
 */
async function applyStealth(page) {
  await page.addInitScript(getStealthScriptString());
}

/**
 * Generate realistic mouse movements
 * @param {Object} page - Playwright page
 * @param {number} x - Target X coordinate
 * @param {number} y - Target Y coordinate
 * @returns {Promise<void>}
 */
async function humanLikeMouseMove(page, x, y) {
  const steps = Math.floor(Math.random() * 10) + 5;
  const currentPos = await page.evaluate(() => ({
    x: window.mouseX || 0,
    y: window.mouseY || 0
  }));
  
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const easeProgress = progress * (2 - progress); // Ease out
    
    const newX = currentPos.x + (x - currentPos.x) * easeProgress;
    const newY = currentPos.y + (y - currentPos.y) * easeProgress;
    
    // Add slight randomness
    const jitterX = (Math.random() - 0.5) * 2;
    const jitterY = (Math.random() - 0.5) * 2;
    
    await page.mouse.move(newX + jitterX, newY + jitterY);
    await page.waitForTimeout(Math.random() * 50 + 20);
  }
}

/**
 * Generate human-like typing delays
 * @returns {number} Delay in milliseconds
 */
function humanLikeTypingDelay() {
  // Base delay between 50-150ms with occasional longer pauses
  const baseDelay = Math.random() * 100 + 50;
  
  // 10% chance of a longer pause (thinking)
  if (Math.random() < 0.1) {
    return baseDelay + Math.random() * 500 + 200;
  }
  
  return baseDelay;
}

/**
 * Random scroll behavior
 * @param {Object} page - Playwright page
 * @param {number} distance - Scroll distance
 * @returns {Promise<void>}
 */
async function humanLikeScroll(page, distance) {
  const steps = Math.floor(Math.random() * 5) + 3;
  const stepDistance = distance / steps;
  
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), stepDistance);
    await page.waitForTimeout(Math.random() * 100 + 50);
  }
}

module.exports = {
  stealthScripts,
  getAllStealthScripts,
  getStealthScriptString,
  applyStealth,
  humanLikeMouseMove,
  humanLikeTypingDelay,
  humanLikeScroll
};
