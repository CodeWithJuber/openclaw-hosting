/**
 * Screenshot and PDF Generation Example
 * Demonstrates visual capture capabilities
 */

const { WebAutomation } = require('../src');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../output');

async function screenshotPdfExample() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('=== Screenshot & PDF Generation Demo ===\n');

  // Example 1: Basic screenshot
  console.log('--- Example 1: Basic Screenshot ---');
  await basicScreenshot();

  // Example 2: Full page screenshot
  console.log('\n--- Example 2: Full Page Screenshot ---');
  await fullPageScreenshot();

  // Example 3: Element screenshot
  console.log('\n--- Example 3: Element Screenshot ---');
  await elementScreenshot();

  // Example 4: PDF generation
  console.log('\n--- Example 4: PDF Generation ---');
  await pdfGeneration();

  // Example 5: Multiple viewport screenshots
  console.log('\n--- Example 5: Responsive Screenshots ---');
  await responsiveScreenshots();

  console.log('\n=== All examples completed! ===');
  console.log(`Output saved to: ${OUTPUT_DIR}`);
}

async function basicScreenshot() {
  const scraper = new WebAutomation({
    headless: true,
    viewport: { width: 1920, height: 1080 }
  });

  try {
    const outputPath = path.join(OUTPUT_DIR, 'basic-screenshot.png');
    
    await scraper.screenshot('https://httpbin.org/html', {
      path: outputPath,
      fullPage: false
    });

    console.log(`Screenshot saved: ${outputPath}`);
    
    const stats = fs.statSync(outputPath);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('Screenshot failed:', error.message);
  } finally {
    await scraper.close();
  }
}

async function fullPageScreenshot() {
  const scraper = new WebAutomation({
    headless: true,
    viewport: { width: 1920, height: 1080 }
  });

  try {
    const outputPath = path.join(OUTPUT_DIR, 'fullpage-screenshot.png');
    
    await scraper.screenshot('https://quotes.toscrape.com/', {
      path: outputPath,
      fullPage: true
    });

    console.log(`Full page screenshot saved: ${outputPath}`);

  } catch (error) {
    console.error('Full page screenshot failed:', error.message);
  } finally {
    await scraper.close();
  }
}

async function elementScreenshot() {
  const scraper = new WebAutomation({
    headless: true
  });

  try {
    await scraper.navigate('https://quotes.toscrape.com/');
    
    const outputPath = path.join(OUTPUT_DIR, 'element-screenshot.png');
    
    // Screenshot specific element
    await scraper.screenshot(null, {
      path: outputPath,
      selector: '.quote:first-child',
      fullPage: false
    });

    console.log(`Element screenshot saved: ${outputPath}`);

  } catch (error) {
    console.error('Element screenshot failed:', error.message);
  } finally {
    await scraper.close();
  }
}

async function pdfGeneration() {
  const scraper = new WebAutomation({
    headless: true
  });

  try {
    const outputPath = path.join(OUTPUT_DIR, 'page.pdf');
    
    await scraper.pdf('https://quotes.toscrape.com/', {
      path: outputPath,
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    console.log(`PDF saved: ${outputPath}`);
    
    const stats = fs.statSync(outputPath);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('PDF generation failed:', error.message);
  } finally {
    await scraper.close();
  }
}

async function responsiveScreenshots() {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];

  for (const viewport of viewports) {
    const scraper = new WebAutomation({
      headless: true,
      viewport: { width: viewport.width, height: viewport.height }
    });

    try {
      const outputPath = path.join(OUTPUT_DIR, `responsive-${viewport.name}.png`);
      
      await scraper.screenshot('https://quotes.toscrape.com/', {
        path: outputPath,
        fullPage: false
      });

      console.log(`${viewport.name} screenshot saved: ${outputPath}`);

    } catch (error) {
      console.error(`${viewport.name} screenshot failed:`, error.message);
    } finally {
      await scraper.close();
    }
  }
}

// Batch screenshot example
async function batchScreenshots(urls) {
  const scraper = new WebAutomation({
    headless: true,
    viewport: { width: 1920, height: 1080 }
  });

  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const outputPath = path.join(OUTPUT_DIR, `batch-${i + 1}.png`);
      
      console.log(`Capturing: ${url}`);
      
      await scraper.screenshot(url, {
        path: outputPath,
        fullPage: true,
        waitFor: 'body'
      });

      console.log(`  Saved: ${outputPath}`);
    }
  } finally {
    await scraper.close();
  }
}

// Run examples
screenshotPdfExample();

// Uncomment to test batch screenshots:
// batchScreenshots([
//   'https://example.com',
//   'https://httpbin.org',
//   'https://quotes.toscrape.com'
// ]);
