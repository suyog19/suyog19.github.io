const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const baseURL = process.env.REGRESSION_BASE_URL || 'http://127.0.0.1:8080';
const output = path.resolve(process.env.ISSUE_609_EVIDENCE_ROOT || 'test-results/issue-609');
const pages = ['framework', 'research', 'consulting', 'training', 'website-services',
  'writing', 'systems', 'about', 'newsletter'];
const viewports = [[1440, 900], [1024, 768], [390, 844]];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  for (const pageName of pages) {
    for (const [width, height] of viewports) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const errors = [];
      await page.route('https://api-dev.suyogjoshi.com/training/course-actions', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.goto(`${baseURL}/${pageName}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(pageName === 'newsletter' ? 2500 : 500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: path.join(output, `609-${pageName}-${width}x${height}.png`),
        animations: 'disabled'
      });
      if (errors.length) throw new Error(`${pageName} ${width}x${height}: ${errors.join(' | ')}`);
      await page.close();
    }
  }
  await browser.close();
  console.log(`Captured ${pages.length * viewports.length} deterministic #609 renders in ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
