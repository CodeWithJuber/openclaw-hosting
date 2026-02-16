/**
 * Proxy Rotation Example
 * Demonstrates proxy pool management and rotation
 */

const { WebAutomation } = require('../src');
const { ProxyManager } = require('../src/proxy-manager');

async function proxyRotationExample() {
  console.log('=== Proxy Rotation Demo ===\n');

  // Example 1: Single proxy configuration
  console.log('--- Example 1: Single Proxy ---');
  await singleProxyExample();

  // Example 2: Proxy rotation with pool
  console.log('\n--- Example 2: Proxy Pool Rotation ---');
  await proxyPoolExample();

  // Example 3: Proxy manager with health checks
  console.log('\n--- Example 3: Proxy Health Management ---');
  await proxyHealthExample();
}

async function singleProxyExample() {
  // Note: Replace with your actual proxy
  const proxy = {
    server: 'http://proxy.example.com:8080',
    username: 'your-username',
    password: 'your-password'
  };

  const scraper = new WebAutomation({
    headless: true,
    stealth: true,
    proxy: proxy,
    debug: true
  });

  try {
    // This will use the configured proxy
    await scraper.navigate('https://httpbin.org/ip');
    console.log('Request made through proxy');
    
    const content = await scraper.getContent();
    console.log('Response received');
    
  } catch (error) {
    console.log('Proxy example skipped (no valid proxy configured)');
    console.log('To test, configure a valid proxy in the proxy variable');
  } finally {
    await scraper.close();
  }
}

async function proxyPoolExample() {
  // Define proxy pool (replace with your actual proxies)
  const proxies = [
    { server: 'http://proxy1.example.com:8080', username: 'user1', password: 'pass1' },
    { server: 'http://proxy2.example.com:8080', username: 'user2', password: 'pass2' },
    { server: 'http://proxy3.example.com:8080', username: 'user3', password: 'pass3' }
  ];

  // Create proxy manager
  const proxyManager = new ProxyManager({
    proxies: proxies,
    rotationStrategy: 'round-robin',
    maxFailures: 2
  });

  console.log(`Proxy pool size: ${proxyManager.count}`);
  console.log('Rotation strategy: round-robin');

  // Simulate requests with proxy rotation
  for (let i = 0; i < 5; i++) {
    try {
      const proxy = proxyManager.getNextProxy();
      console.log(`Request ${i + 1}: Using proxy ${proxy.server}`);
      
      // In real usage, this proxy would be passed to WebAutomation
      // const scraper = new WebAutomation({ proxy });
      
    } catch (error) {
      console.error('Failed to get proxy:', error.message);
    }
  }

  // Show statistics
  console.log('\nProxy Statistics:');
  console.log(proxyManager.getStats());
}

async function proxyHealthExample() {
  // Create proxy manager with health checking
  const proxyManager = new ProxyManager({
    proxies: [
      // Public proxies for demonstration (replace with private ones)
      'http://proxy1.example.com:8080',
      'http://proxy2.example.com:8080'
    ],
    maxFailures: 2,
    banDuration: 60000 // 1 minute ban
  });

  console.log('Testing proxy health...');
  
  // Note: This requires actual working proxies
  // For demo purposes, we'll simulate the behavior
  
  // Simulate proxy failure
  const testProxy = proxyManager.proxies[0];
  proxyManager.markFailed(testProxy, new Error('Connection timeout'));
  console.log(`Marked proxy as failed: ${proxyManager.getProxyKey(testProxy)}`);
  
  // Check available proxies
  console.log(`Available proxies: ${proxyManager.availableCount}/${proxyManager.count}`);
  
  // Simulate proxy recovery
  proxyManager.markSuccess(testProxy, 500);
  console.log(`Marked proxy as healthy: ${proxyManager.getProxyKey(testProxy)}`);
  console.log(`Available proxies: ${proxyManager.availableCount}/${proxyManager.count}`);

  // Display final stats
  console.log('\nFinal Statistics:');
  const stats = proxyManager.getStats();
  for (const [key, data] of Object.entries(stats)) {
    console.log(`  ${key}: uses=${data.uses}, failures=${data.failures}, banned=${data.isBanned}`);
  }
}

// Advanced example: WebAutomation with automatic proxy rotation
async function advancedProxyRotation() {
  const proxies = [
    { server: 'http://proxy1.example.com:8080' },
    { server: 'http://proxy2.example.com:8080' },
    { server: 'http://proxy3.example.com:8080' }
  ];

  const scraper = new WebAutomation({
    headless: true,
    stealth: true,
    proxies: proxies,
    rotateProxyEvery: 3, // Rotate every 3 requests
    debug: true
  });

  try {
    // Make multiple requests - proxy will rotate automatically
    for (let i = 0; i < 10; i++) {
      await scraper.navigate('https://httpbin.org/ip');
      console.log(`Request ${i + 1} completed`);
      await scraper.sleep(1000);
    }
  } finally {
    await scraper.close();
  }
}

// Run examples
proxyRotationExample().catch(console.error);
