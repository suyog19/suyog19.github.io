const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const baseURL = process.env.REGRESSION_BASE_URL || 'http://127.0.0.1:8080';
const iteration = process.env.ISSUE_608_ITERATION || 'i1';
const evidenceRoot = process.env.ISSUE_608_EVIDENCE_ROOT || 'test-results/issue-608';
const output = path.resolve(evidenceRoot, iteration);

async function capture(page, name, fullPage = false) {
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(750);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage, animations: 'disabled' });
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  for (const [width, height] of [[1440, 900], [1024, 768], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await capture(page, `608-${iteration}-home-${width}x${height}-default`);
    await capture(page, `608-${iteration}-home-${width}x${height}-fullpage`, true);
    await page.close();
  }
  await browser.close();
  console.log(`Captured deterministic #608 ${iteration} renders in ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
