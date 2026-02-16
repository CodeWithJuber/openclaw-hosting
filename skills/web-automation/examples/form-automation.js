/**
 * Form Automation Example
 * Demonstrates form filling and submission
 */

const { WebAutomation } = require('../src');

async function formAutomationExample() {
  const scraper = new WebAutomation({
    headless: false, // Set to true for production
    stealth: true,
    delay: { min: 500, max: 1500 }
  });

  try {
    // Example 1: Simple login form
    console.log('Filling login form...');
    const loginResult = await scraper.fillForm(
      'https://httpbin.org/forms/post',
      {
        'input[name="custname"]': 'John Doe',
        'input[name="custtel"]': '555-1234',
        'input[name="custemail"]': 'john@example.com',
        'input[name="size"][value="large"]': true, // Radio button
        'input[name="topping"][value="cheese"]': true, // Checkbox
        'textarea[name="comments"]': 'Please handle with care'
      },
      {
        submit: 'button[type="submit"]',
        waitFor: 'pre' // Wait for response
      }
    );

    console.log('Form submitted successfully!');
    console.log('Current URL:', loginResult.url);

    // Example 2: Complex form with multiple steps
    console.log('\n--- Multi-step Form Example ---');
    
    await scraper.navigate('https://httpbin.org/forms/post');
    
    // Step 1: Fill personal info
    await scraper.fillField('input[name="custname"]', 'Jane Smith');
    await scraper.fillField('input[name="custtel"]', '555-5678');
    
    // Step 2: Select options
    await scraper.click('input[name="size"][value="medium"]');
    await scraper.click('input[name="topping"][value="bacon"]');
    
    // Step 3: Add comments
    await scraper.fillField('textarea[name="comments"]', 'Extra cheese please!');
    
    // Step 4: Submit
    await scraper.click('button[type="submit"]', { waitFor: 'pre' });
    
    console.log('Multi-step form completed!');

  } catch (error) {
    console.error('Form automation failed:', error.message);
  } finally {
    await scraper.close();
  }
}

// Run example
formAutomationExample();
