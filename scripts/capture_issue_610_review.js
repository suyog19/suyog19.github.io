const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const baseURL = process.env.REGRESSION_BASE_URL || 'http://127.0.0.1:8080';
const output = path.resolve(process.env.ISSUE_610_CAPTURE_ROOT || 'test-results/issue-610');
const evidencePath = path.resolve(process.env.ISSUE_610_BROWSER_EVIDENCE || 'docs/evidence/issue-610-browser-review.json');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const pages = [
  ['home', '/'], ['framework', '/framework/'], ['research', '/research/'],
  ['consulting', '/consulting/'], ['learning', '/training/'],
  ['website-services', '/website-services/'], ['writing', '/writing/'],
  ['systems', '/systems/'], ['about', '/about/'], ['weekly', '/newsletter/'],
  ['contact', '/contact/'],
  ['article-detail', '/writing/ai-governance-without-bureaucracy/'],
  ['system-detail', '/systems/ai-workflow-lab/'],
];
const viewports = [[1440, 900], [1024, 768], [390, 844]];

function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2));
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const [name, route] of pages) {
    for (const [width, height] of viewports) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const failures = [];
      const origin = new URL(baseURL).origin;
      await page.route(/https:\/\/api(?:-dev)?\.suyogjoshi\.com\/.*/, request =>
        request.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
      page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
      page.on('console', message => {
        const source = message.location().url || '';
        if (message.type() === 'error' && (!source || source.startsWith(origin))) {
          failures.push(`console: ${message.text()}`);
        }
      });
      page.on('response', response => {
        if (response.url().startsWith(origin) && response.status() >= 400) {
          failures.push(`HTTP ${response.status()} ${response.url()}`);
        }
      });
      page.on('requestfailed', request => {
        if (request.url().startsWith(origin)) failures.push(`request failed: ${request.url()}`);
      });
      await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(name === 'weekly' ? 2000 : 350);
      const checks = await page.evaluate(() => {
        const headings = [...document.querySelectorAll('main h1, main h2, main h3, main h4')]
          .map(node => ({ level: Number(node.tagName.slice(1)), text: node.textContent.trim() }));
        const headingJumps = headings.slice(1).filter((heading, index) => heading.level > headings[index].level + 1);
        const missingImageAlt = [...document.querySelectorAll('img:not([alt])')].length;
        const unlabeledFields = [...document.querySelectorAll('input:not([type="hidden"]), textarea, select')]
          .filter(field => getComputedStyle(field).display !== 'none' && field.name !== 'website')
          .filter(field => !field.labels?.length && !field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby'))
          .map(field => field.id || field.name || field.type);
        const smallControls = [...document.querySelectorAll('.btn, button, input:not([type="radio"])')]
          .filter(node => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
              && (rect.width < 24 || rect.height < 24);
          }).map(node => node.textContent.trim() || node.getAttribute('aria-label') || node.id);
        return {
          title: document.title,
          h1Count: document.querySelectorAll('main h1').length,
          landmarks: {
            header: document.querySelectorAll('header.site-header').length,
            main: document.querySelectorAll('main').length,
            footer: document.querySelectorAll('footer').length,
            primaryNavigation: document.querySelectorAll('nav[aria-label="Primary navigation"]').length,
          },
          headingJumps,
          missingImageAlt,
          unlabeledFields,
          smallControls,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      if (checks.h1Count !== 1) failures.push(`expected one main h1; found ${checks.h1Count}`);
      if (Object.values(checks.landmarks).some(count => count !== 1)) failures.push('landmark count mismatch');
      if (checks.headingJumps.length) failures.push(`heading jumps: ${JSON.stringify(checks.headingJumps)}`);
      if (checks.missingImageAlt) failures.push(`${checks.missingImageAlt} images missing alt`);
      if (checks.unlabeledFields.length) failures.push(`unlabelled fields: ${checks.unlabeledFields.join(', ')}`);
      if (checks.smallControls.length) failures.push(`controls below 24px: ${checks.smallControls.join(', ')}`);
      if (checks.horizontalOverflow) failures.push('horizontal overflow');
      await page.screenshot({
        path: path.join(output, `610-${name}-${width}x${height}.png`), animations: 'disabled'
      });
      results.push({ name, route, viewport: `${width}x${height}`, checks, failures });
      await page.close();
    }
  }
  await browser.close();
  const framework = fs.readFileSync(path.resolve('framework/index.html'), 'utf8');
  const research = fs.readFileSync(path.resolve('research/index.html'), 'utf8');
  const frameworkDirectory = framework.match(/<ol class="framework-directory"[\s\S]*?<\/ol>/)?.[0] || '';
  const semanticEquivalent = {
    frameworkBranches: (frameworkDirectory.match(/<li>/g) || []).length,
    northStar: framework.includes('Reliable engineering under increasing machine autonomy.'),
    securityCrossCutting: framework.includes('Security') && framework.includes('Cross-cutting concern'),
    methodsAndFeedback: framework.includes('Methods of Investigation') && framework.includes('Evidence can strengthen, challenge, or change the Framework.'),
    researchCriticalEvidence: research.includes('Contradictory evidence') || research.includes('contradictory evidence'),
  };
  const allFailures = results.flatMap(result => result.failures.map(failure => `${result.name} ${result.viewport}: ${failure}`));
  if (semanticEquivalent.frameworkBranches !== 8 || Object.values(semanticEquivalent).some(value => !value)) {
    allFailures.push(`semantic equivalent mismatch: ${JSON.stringify(semanticEquivalent)}`);
  }
  const evidence = {
    schema: 'issue-610-browser-review/v1', issue: 610, targetRevision: revision,
    environment: { baseURL, browser: 'Playwright Chromium 151.0.7922.34', playwright: '1.62.1', retries: 0 },
    matrix: { pages: pages.map(([, route]) => route), viewports: viewports.map(value => value.join('x')), captures: results.length },
    accessibility: {
      automatedChecks: ['headings', 'landmarks', 'image alternatives', 'form labels', '24px control floor', 'horizontal overflow'],
      signalRedContrastOnWhite: contrast('b91c1c', 'ffffff'),
      signalRedContrastOnNeutral: contrast('b91c1c', 'fafafa'),
      semanticEquivalent,
    },
    consoleAndResources: { siteAttributedFailures: allFailures.filter(value => /console|HTTP|request failed|pageerror/.test(value)) },
    results, failures: allFailures, result: allFailures.length ? 'fail' : 'pass',
  };
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Captured ${results.length} #610 renders; ${allFailures.length} failures; result ${evidence.result}.`);
  if (allFailures.length) console.error(allFailures.join('\n'));
  process.exitCode = allFailures.length ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
