/**
 * Session Management Example
 * Demonstrates login persistence and session handling
 */

const { WebAutomation } = require('../src');
const fs = require('fs');
const path = require('path');

const SESSION_PATH = path.join(__dirname, '../sessions/demo-session.json');

async function sessionManagementExample() {
  // Ensure sessions directory exists
  if (!fs.existsSync(path.dirname(SESSION_PATH))) {
    fs.mkdirSync(path.dirname(SESSION_PATH), { recursive: true });
  }

  // Step 1: Login and save session
  console.log('=== Step 1: Login and Save Session ===');
  await loginAndSaveSession();

  // Step 2: Use saved session for subsequent requests
  console.log('\n=== Step 2: Use Saved Session ===');
  await useSavedSession();

  // Step 3: Demonstrate multi-account support
  console.log('\n=== Step 3: Multi-Account Support ===');
  await multiAccountExample();
}

async function loginAndSaveSession() {
  const scraper = new WebAutomation({
    headless: false,
    stealth: true
  });

  try {
    // Navigate to login page
    await scraper.navigate('https://httpbin.org/cookies/set/sessionId/12345');
    
    // Simulate login by setting cookies
    console.log('Setting session cookies...');
    
    // Save session
    await scraper.saveSession(SESSION_PATH);
    console.log('Session saved to:', SESSION_PATH);
    
    // Verify cookies were set
    const cookies = await scraper.context.cookies();
    console.log('Cookies saved:', cookies.map(c => `${c.name}=${c.value}`));

  } catch (error) {
    console.error('Login failed:', error.message);
  } finally {
    await scraper.close();
  }
}

async function useSavedSession() {
  const scraper = new WebAutomation({
    headless: true,
    stealth: true
  });

  try {
    // Load previous session
    await scraper.loadSession(SESSION_PATH);
    console.log('Session loaded from:', SESSION_PATH);

    // Navigate to a page that requires authentication
    await scraper.navigate('https://httpbin.org/cookies');
    
    // Verify session is still valid
    const content = await scraper.getContent();
    console.log('Page content shows cookies are preserved!');
    console.log('Response includes:', content.includes('sessionId') ? 'sessionId cookie ✓' : 'no session cookie ✗');

  } catch (error) {
    console.error('Session reuse failed:', error.message);
  } finally {
    await scraper.close();
  }
}

async function multiAccountExample() {
  // Simulate managing multiple accounts
  const accounts = [
    { name: 'Account A', sessionPath: path.join(__dirname, '../sessions/account-a.json') },
    { name: 'Account B', sessionPath: path.join(__dirname, '../sessions/account-b.json') }
  ];

  for (const account of accounts) {
    console.log(`\n--- Managing ${account.name} ---`);
    
    const scraper = new WebAutomation({
      headless: true,
      stealth: true
    });

    try {
      // Check if session exists
      if (fs.existsSync(account.sessionPath)) {
        await scraper.loadSession(account.sessionPath);
        console.log(`Loaded existing session for ${account.name}`);
      } else {
        // Simulate login
        await scraper.navigate('https://httpbin.org/cookies/set/user/' + account.name.replace(' ', ''));
        await scraper.saveSession(account.sessionPath);
        console.log(`Created new session for ${account.name}`);
      }

      // Verify session
      await scraper.navigate('https://httpbin.org/cookies');
      console.log(`${account.name} session is active`);

    } catch (error) {
      console.error(`${account.name} failed:`, error.message);
    } finally {
      await scraper.close();
    }
  }

  // Cleanup demo sessions
  console.log('\n--- Cleanup ---');
  accounts.forEach(account => {
    if (fs.existsSync(account.sessionPath)) {
      fs.unlinkSync(account.sessionPath);
      console.log(`Removed ${account.sessionPath}`);
    }
  });
  
  if (fs.existsSync(SESSION_PATH)) {
    fs.unlinkSync(SESSION_PATH);
    console.log(`Removed ${SESSION_PATH}`);
  }
}

// Run example
sessionManagementExample();
