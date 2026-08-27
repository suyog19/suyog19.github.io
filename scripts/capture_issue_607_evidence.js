const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const baseURL = process.env.REGRESSION_BASE_URL || 'http://127.0.0.1:8080';
const output = path.resolve('docs/evidence/issue-607/screenshots');

async function capture(page, route, name, { fullPage = false, action } = {}) {
  await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 0));
  if (action) await action(page);
  await page.screenshot({
    path: path.join(output, `${name}.png`),
    fullPage,
    animations: 'disabled',
  });
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await capture(desktop, '/', '607-i2-home-1440x900-default');
  await capture(desktop, '/', '607-i2-home-1440x900-fullpage', { fullPage: true });
  await capture(desktop, '/framework/', '607-i2-framework-1440x900-default');
  await capture(mobile, '/', '607-i2-home-390x844-default');
  await capture(mobile, '/', '607-i2-home-390x844-menu-open', {
    action: page => page.getByRole('button', { name: 'Toggle navigation' }).click(),
  });
  await capture(mobile, '/research/', '607-i2-research-390x844-default');
  await browser.close();
  console.log(`Captured six deterministic #607 renders in ${output}`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
