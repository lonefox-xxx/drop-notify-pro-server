const puppeteer = require('puppeteer');

async function scrapeWebsite(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the specified URL
    await page.goto(url);

    // Perform scraping operations here
    // Example: Extract the title of the page
    const title = await page.title();
    console.log('Page Title:', title);

    // Example: Extract data from a specific element
    const elementValue = await page.$eval('.example-class', element => element.textContent.trim());
    console.log('Element Value:', elementValue);

    // Close the browser
    await browser.close();
}

// Replace 'https://www.example.com' with the URL you want to scrape
const targetUrl = 'https://www.example.com';
scrapeWebsite(targetUrl);
