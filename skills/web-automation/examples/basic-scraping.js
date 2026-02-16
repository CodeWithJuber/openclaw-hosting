/**
 * Basic Web Scraping Example
 * Demonstrates simple data extraction from a webpage
 */

const { WebAutomation } = require('../src');

async function basicScrapingExample() {
  const scraper = new WebAutomation({
    headless: true,
    stealth: true,
    debug: true
  });

  try {
    // Example: Scrape product information from an e-commerce site
    const data = await scraper.scrape('https://quotes.toscrape.com/', {
      selectors: {
        quotes: {
          selector: '.quote',
          multiple: true,
          fields: {
            text: '.text',
            author: '.author',
            tags: {
              selector: '.tag',
              multiple: true
            }
          }
        }
      }
    });

    console.log('Scraped Data:');
    console.log(JSON.stringify(data, null, 2));

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('./quotes.json', JSON.stringify(data, null, 2));
    console.log('\nData saved to quotes.json');

  } catch (error) {
    console.error('Scraping failed:', error.message);
  } finally {
    await scraper.close();
  }
}

// Run example
basicScrapingExample();
