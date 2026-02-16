/**
 * CAPTCHA Handling Example
 * Demonstrates integration with CAPTCHA solving services
 */

const { WebAutomation } = require('../src');

async function captchaHandlingExample() {
  console.log('=== CAPTCHA Handling Demo ===\n');
  console.log('Note: This example requires valid CAPTCHA service API keys\n');

  // Example 1: Detect CAPTCHA presence
  console.log('--- Example 1: CAPTCHA Detection ---');
  await detectCaptchaExample();

  // Example 2: Integration with CapMonster Cloud
  console.log('\n--- Example 2: CapMonster Cloud Integration ---');
  await capmonsterExample();

  // Example 3: Integration with 2Captcha
  console.log('\n--- Example 3: 2Captcha Integration ---');
  await twocaptchaExample();

  // Example 4: Best practices for avoiding CAPTCHAs
  console.log('\n--- Example 4: CAPTCHA Avoidance Best Practices ---');
  captchaAvoidanceTips();
}

async function detectCaptchaExample() {
  const scraper = new WebAutomation({
    headless: true,
    stealth: true
  });

  try {
    // Navigate to a page that might have CAPTCHA
    await scraper.navigate('https://www.google.com/recaptcha/api2/demo');
    
    // Check for CAPTCHA presence
    const captchaSelectors = [
      '.g-recaptcha',
      '[data-sitekey]',
      '.h-captcha',
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]'
    ];

    let captchaFound = false;
    for (const selector of captchaSelectors) {
      const element = await scraper.page.$(selector);
      if (element) {
        console.log(`CAPTCHA detected: ${selector}`);
        captchaFound = true;
        
        // Get site key if available
        const siteKey = await element.evaluate(el => 
          el.getAttribute('data-sitekey') || el.getAttribute('sitekey')
        );
        
        if (siteKey) {
          console.log(`Site key: ${siteKey}`);
        }
        break;
      }
    }

    if (!captchaFound) {
      console.log('No CAPTCHA detected on this page');
    }

  } catch (error) {
    console.error('Detection failed:', error.message);
  } finally {
    await scraper.close();
  }
}

async function capmonsterExample() {
  // Configuration for CapMonster Cloud
  const captchaConfig = {
    service: 'capmonster',
    apiKey: process.env.CAPMONSTER_API_KEY // Set your API key
  };

  if (!captchaConfig.apiKey) {
    console.log('Skipping - No CapMonster API key found');
    console.log('Set CAPMONSTER_API_KEY environment variable to test');
    return;
  }

  const scraper = new WebAutomation({
    headless: true,
    stealth: true,
    captcha: captchaConfig
  });

  try {
    await scraper.navigate('https://www.google.com/recaptcha/api2/demo');
    
    // Attempt to solve CAPTCHA
    console.log('Attempting to solve CAPTCHA with CapMonster...');
    const token = await scraper.handleCaptcha();
    
    if (token) {
      console.log('CAPTCHA solved successfully!');
      console.log('Token:', token.substring(0, 50) + '...');
      
      // Submit the form with the token
      await scraper.click('#recaptcha-demo-submit');
      console.log('Form submitted');
    }

  } catch (error) {
    console.error('CAPTCHA solving failed:', error.message);
  } finally {
    await scraper.close();
  }
}

async function twocaptchaExample() {
  // Configuration for 2Captcha
  const captchaConfig = {
    service: '2captcha',
    apiKey: process.env.TWOCAPTCHA_API_KEY // Set your API key
  };

  if (!captchaConfig.apiKey) {
    console.log('Skipping - No 2Captcha API key found');
    console.log('Set TWOCAPTCHA_API_KEY environment variable to test');
    return;
  }

  const scraper = new WebAutomation({
    headless: true,
    stealth: true,
    captcha: captchaConfig
  });

  try {
    await scraper.navigate('https://www.google.com/recaptcha/api2/demo');
    
    console.log('Attempting to solve CAPTCHA with 2Captcha...');
    const token = await scraper.handleCaptcha();
    
    if (token) {
      console.log('CAPTCHA solved successfully!');
      console.log('Token:', token.substring(0, 50) + '...');
    }

  } catch (error) {
    console.error('CAPTCHA solving failed:', error.message);
  } finally {
    await scraper.close();
  }
}

function captchaAvoidanceTips() {
  console.log(`
Best Practices to Avoid CAPTCHA Triggers:

1. Use Residential Proxies
   - Rotate IPs from residential pools
   - Avoid datacenter proxies which are easily flagged

2. Implement Human-like Behavior
   - Add random delays between actions (1-5 seconds)
   - Use realistic mouse movements
   - Scroll pages naturally

3. Browser Stealth Configuration
   - Enable stealth mode to hide headless indicators
   - Rotate user agents
   - Set realistic viewport sizes

4. Rate Limiting
   - Don't make requests too quickly
   - Implement exponential backoff
   - Respect robots.txt

5. Session Management
   - Maintain cookies between requests
   - Use persistent sessions
   - Avoid clearing storage frequently

6. Request Patterns
   - Vary request timing
   - Don't follow predictable patterns
   - Add random query parameters

Example Implementation:
`);

  const exampleCode = `
const scraper = new WebAutomation({
  headless: true,
  stealth: true,              // Hide automation indicators
  delay: { min: 2000, max: 5000 },  // Random delays
  proxy: {                    // Use quality proxy
    server: 'http://residential.proxy:8080'
  },
  viewport: {                 // Realistic viewport
    width: 1920, 
    height: 1080 
  }
});

// Add human-like behavior
await scraper.navigate('https://example.com');
await scraper.scroll(500);        // Scroll down
await scraper.humanDelay();       // Random delay
await scraper.click('.button');   // Click element
await scraper.humanDelay();       // Another delay
`;

  console.log(exampleCode);
}

// Manual CAPTCHA solving fallback
async function manualCaptchaFallback(scraper) {
  console.log(`
Manual CAPTCHA Solving Fallback:

When automatic solving fails, you can:

1. Pause and notify
2. Wait for manual input
3. Queue for later processing
`);

  // Example: Pause for manual intervention
  if (!scraper.options.headless) {
    console.log('Browser is visible - solve CAPTCHA manually');
    console.log('Waiting 30 seconds...');
    await scraper.page.waitForTimeout(30000);
  }
}

// Run examples
captchaHandlingExample().catch(console.error);
