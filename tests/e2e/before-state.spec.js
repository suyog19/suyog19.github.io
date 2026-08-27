const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const BASELINE_ORIGIN = 'https://suyogjoshi.com';

async function expectPath(page, expectedPath) {
  await expect.poll(() => new URL(page.url()).pathname).toBe(expectedPath);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main h1').first()).toBeVisible();
}

test.describe('accepted BEFORE-state rendered journeys', () => {
  test('NAV-01 NAV-02: desktop primary destinations render and remain usable', async ({ page }) => {
    const destinations = [
      ['Software Signal', '/'], ['Consulting', '/consulting/'], ['Learning', '/training/'],
      ['Website Services', '/website-services/'], ['Writing', '/writing/'],
      ['About', '/about/'], ['Subscribe', '/newsletter/'],
    ];
    for (const [name, expectedPath] of destinations) {
      await page.goto('/');
      const link = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name, exact: true });
      await expect(link).toBeVisible();
      await link.click();
      await expectPath(page, expectedPath);
    }
    await page.goto('/about/');
    await page.getByRole('link', { name: /Software Signal by Suyog Joshi/ }).first().click();
    await expectPath(page, '/');
  });

  test('NAV-03 NAV-04 NAV-05: mobile menu opens, closes, restores focus, and navigates', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle navigation' });
    const nav = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.locator('.brand-lockup').click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await nav.getByRole('link', { name: 'Writing' }).click();
    await expectPath(page, '/writing/');
    await expect(page.getByRole('button', { name: 'Toggle navigation' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('HOME-01 HOME-02 HOME-03 HOME-04 WEEKLY-01: homepage critical CTAs reach current destinations', async ({ page }) => {
    const actions = [
      ['Explore training', '/training/'], ['Browse writing', '/writing/'],
      ['Find my starting point', '/training/', '#starting-point'], ['Explore Consulting', '/consulting/'],
      ['Explore Website Services', '/website-services/'], ['About the newsletter', '/newsletter/'],
      ['View systems', '/systems/'],
    ];
    for (const [name, expectedPath, expectedHash] of actions) {
      await page.goto('/');
      await page.getByRole('link', { name }).click();
      await expectPath(page, expectedPath);
      if (expectedHash) {
        expect(new URL(page.url()).hash).toBe(expectedHash);
        await expect(page.locator(expectedHash)).toBeVisible();
      }
    }
    await page.goto('/');
    await page.locator('.project-card').first().click();
    await expectPath(page, '/systems/ai-dev-orchestrator/');
  });

  test('CON-01: Consulting discovery reaches contextual contact flow without submission', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Explore Consulting' }).click();
    await expectPath(page, '/consulting/');
    await page.getByRole('link', { name: 'Enquire about an advisory session' }).click();
    await expectPath(page, '/contact/');
    expect(new URL(page.url()).searchParams.get('topic')).toBe('consulting-advisory');
    await expect(page.getByRole('note')).toContainText('Engineering Advisory Session enquiry');
    await expect(page.locator('#message')).toHaveValue(/Engineering Advisory Session/);
  });

  test('WEB-01: Website Services discovery reaches contextual contact flow without submission', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Explore Website Services' }).click();
    await expectPath(page, '/website-services/');
    await page.getByRole('link', { name: 'Describe what you need' }).click();
    await expectPath(page, '/contact/');
    expect(new URL(page.url()).searchParams.get('topic')).toBe('website-services-help-choose');
    await expect(page.getByRole('note')).toContainText('Not sure which website option fits');
    await expect(page.locator('#message')).toHaveValue(/Website Services option/);
  });

  test('LEARN-01: Learning landing reaches a representative canonical course detail', async ({ page }) => {
    await page.goto('/training/');
    await page.locator('a[href="python-foundations-for-data-science/"]').click();
    await expectPath(page, '/training/python-foundations-for-data-science/');
    await expect(page.locator('h1')).toContainText('Python Foundations for Data Science');
  });

  test('WEEKLY-01 WEEKLY-02: Weekly surface exposes the third-party subscription contract', async ({ page }) => {
    await page.route('https://**/*', route => route.abort());
    await page.goto('/newsletter/');
    await expect(page.locator('.newsletter-intro .eyebrow')).toHaveText('Software Signal Weekly');
    await expect(page.locator('h1')).toContainText('important shifts shaping software engineering');
    const loader = page.locator('script[data-beehiiv-form]');
    await expect(loader).toHaveAttribute('src', 'https://subscribe-forms.beehiiv.com/v3/loader.js');
    await expect(loader).toHaveAttribute('data-beehiiv-form', '73d5eecc-14a6-4de7-9654-a6b57f593298');
    expect(await page.content()).toContain('https://newsletter.suyogjoshi.com/subscribe');
  });

  test('CONTACT-01 CONTACT-02: invalid contact states send no request', async ({ page }) => {
    let messageRequests = 0;
    page.on('request', request => { if (request.url().endsWith('/messages')) messageRequests += 1; });
    await page.goto('/contact/');
    await expect(page.locator('#contact-form')).toBeVisible();
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('alert')).toHaveCount(3);
    for (const field of ['#name', '#email', '#message']) await expect(page.locator(field)).toHaveAttribute('aria-invalid', 'true');
    await page.locator('#name').fill('Test User');
    await page.locator('#email').fill('invalid');
    await page.locator('#message').fill('short');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('#email-error')).toHaveText('Please enter a valid email address.');
    await expect(page.locator('#message-error')).toContainText('at least 20 characters');
    expect(messageRequests).toBe(0);
  });

  test('CONTACT-03: safe valid path uses mocked dev API and renders success', async ({ page }) => {
    let payload;
    await page.route(/https:\/\/api(?:-dev)?\.suyogjoshi\.com\/messages$/, async route => {
      payload = route.request().postDataJSON();
      await route.fulfill({ status: 202, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/contact/');
    await page.locator('#name').fill('Regression Test');
    await page.locator('#email').fill('regression@example.test');
    await page.locator('#message').fill('This is a safe mocked browser regression message.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('#form-status')).toHaveClass(/is-success/);
    await expect(page.locator('#form-status')).toContainText('Thanks');
    expect(payload).toEqual({
      name: 'Regression Test', email: 'regression@example.test',
      message: 'This is a safe mocked browser regression message.',
      type: 'contact', source: 'contact_page', website: '',
    });
  });

  test('WRITE-01 SYS-01 SYS-02: representative evidence journeys reach rendered details', async ({ page }) => {
    await page.goto('/writing/');
    await page.locator('.wp-latest-item[data-hosting="internal"] a').first().click();
    await expect(page.locator('article h1, main h1').first()).toBeVisible();
    expect(new URL(page.url()).pathname).toMatch(/^\/writing\/.+\/$/);
    await page.goto('/systems/');
    await page.getByRole('link', { name: 'View system' }).first().click();
    await expectPath(page, '/systems/ai-workflow-lab/');
    await page.getByRole('link', { name: /Invoice review demo/i }).click();
    await expectPath(page, '/systems/ai-workflow-lab/invoice-review-demo/');
  });

  test('FOOT-01 EXT-01: footer destinations and identity hosts remain exact', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
    await expectPath(page, '/privacy/');
    await page.goto('/');
    const expected = {
      LinkedIn: 'https://www.linkedin.com/in/suyog-joshi',
      Medium: 'https://medium.com/@suyog19', GitHub: 'https://github.com/suyog19',
    };
    for (const [name, url] of Object.entries(expected)) {
      await expect(page.getByRole('contentinfo').getByRole('link', { name })).toHaveAttribute('href', url);
    }
  });

  test('major pages have no site-attributed console, request, or asset failures', async ({ page }) => {
    const routes = ['/', '/consulting/', '/website-services/', '/training/', '/newsletter/', '/contact/', '/writing/', '/systems/'];
    const failures = [];
    const localOrigin = new URL(test.info().project.use.baseURL).origin;
    await page.route(/https:\/\/api(?:-dev)?\.suyogjoshi\.com\/.*/, route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    page.on('console', message => {
      const location = message.location().url || '';
      if (message.type() === 'error' && (!location || location.startsWith(localOrigin))) failures.push(`console ${location}: ${message.text()}`);
    });
    page.on('response', response => {
      if (response.url().startsWith(localOrigin) && response.status() >= 400) failures.push(`HTTP ${response.status()} ${response.url()}`);
    });
    page.on('requestfailed', request => {
      if (request.url().startsWith(localOrigin)) failures.push(`request failed ${request.url()}: ${request.failure()?.errorText}`);
    });
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
    }
    expect(failures).toEqual([]);
  });
});

test('the complete #604 inventory keeps 66 successful self-canonical routes', async ({ request }) => {
  const inventory = fs.readFileSync(path.join(__dirname, '../../docs/evidence/issue-604-public-route-inventory.csv'), 'utf8');
  const routes = inventory.trim().split(/\r?\n/).slice(1).map(line => line.slice(0, line.indexOf(',')));
  expect(routes).toHaveLength(66);
  const failures = [];
  for (const route of routes) {
    const response = await request.get(route);
    if (response.status() !== 200) failures.push(`${route}: HTTP ${response.status()}`);
    const expectedCanonical = `${BASELINE_ORIGIN}${route}`;
    if (!(await response.text()).includes(`<link rel="canonical" href="${expectedCanonical}"`)) {
      failures.push(`${route}: missing canonical ${expectedCanonical}`);
    }
  }
  expect(failures).toEqual([]);
});
