const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const event = require('../../data/training-events.json');
const route = `/training/events/${event.slug}/`;

// Render fixture variants through the real generator; never rewrite served files.
function variant(status, registration = true, resources = null) {
  const data = structuredClone(event);
  data.status = status;
  data.registration.url = registration ? event.registration.url : null;
  data.resources = resources;
  return execFileSync('python', ['-X', 'utf8', '-c', 'import sys,json; from scripts.generate_training_events import render; sys.stdout.buffer.write(render(json.load(sys.stdin)).encode("utf-8"))'], { input: JSON.stringify(data), encoding: 'utf8' });
}

test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', r => r.fulfill({ body: '' }));
});

for (const width of [320, 360, 390, 768, 1440]) {
  test(`event fits at ${width}px with semantic content and usable navigation`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(event.title);
    const primary = page.getByRole('link', { name: 'Register Free', exact: true }).first();
    await expect(primary).toBeVisible();
    await expect(primary).toHaveAttribute('href', event.registration.url);
    await expect(primary).toHaveAccessibleDescription(/Registration opens on Luma/);
    expect((await primary.boundingBox()).height).toBeGreaterThanOrEqual(48);
    await expect(page.getByRole('link', { name: 'Register Free', exact: true })).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to session details' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    expect(await page.locator('time').first().getAttribute('datetime')).toBe(event.start);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/701-event-${width}.png`, fullPage: true });
  });
}

for (const state of ['upcoming', 'registration-closed', 'completed']) {
  test(`${state}: static lifecycle and optional resources without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route(`**${route}`, r => r.fulfill({ contentType: 'text/html', body: variant(state, true) }));
    await page.goto(new URL(route, test.info().project.use.baseURL).href);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(event.title);
    await expect(page.getByRole('link', { name: 'Register Free' })).toHaveCount(state === 'upcoming' ? 2 : 0);
    await expect(page.locator('.event-status')).toContainText(state === 'registration-closed' ? 'Registration closed' : state === 'completed' ? 'Completed' : 'Upcoming');
    await expect(page.getByRole('link', { name: 'Session resources' })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (state === 'upcoming') {
      const box = await page.getByRole('link', { name: 'Register Free' }).first().boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.y + box.height).toBeLessThan(844);
    }
    await page.screenshot({ path: `test-results/700-${state}-390.png`, fullPage: true });
    await context.close();
  });
}

test('active CTA visibility, keyboard and location analytics; bounded campaign handoff', async ({ page }) => {
  await page.goto(`${route}?utm_source=linkedin&utm_campaign=ai-roles-2026&utm_medium=social&utm_content=post&utm_term=ai&email=private&token=secret&gclid=ad-id#private-fragment`);
  const primary = page.locator('[data-event-cta="primary"]');
  await expect(primary).toHaveAttribute('href', `${event.registration.url}?utm_source=linkedin&utm_medium=social&utm_campaign=ai-roles-2026&utm_content=post&utm_term=ai`);
  await primary.focus();
  expect(await primary.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  expect((await primary.boundingBox()).height).toBeGreaterThanOrEqual(48);
  // Prevent external navigation only; exercise normal keyboard click handling.
  await page.locator('[data-event-cta]').evaluateAll(links => links.forEach(link => link.addEventListener('click', e => e.preventDefault())));
  await page.keyboard.press('Enter');
  await page.locator('[data-event-cta="final"]').click();
  await expect.poll(() => page.evaluate(() => dataLayer.filter(v => v[1] === 'learning_event_register_view').length)).toBe(2);
  const analytics = await page.evaluate(() => dataLayer.filter(v => v[0] === 'event').map(v => [v[1], v[2]]));
  expect(analytics).toContainEqual(['learning_event_page_view', { event_slug: event.slug, event_status: 'upcoming', event_source: 'linkedin' }]);
  for (const cta_location of ['primary', 'final']) {
    expect(analytics).toContainEqual(['learning_event_register_click', { event_slug: event.slug, event_status: 'upcoming', event_source: 'linkedin', cta_location }]);
    expect(analytics.filter(([name, params]) => name === 'learning_event_register_view' && params.cta_location === cta_location)).toHaveLength(1);
  }
  expect(JSON.stringify(analytics)).not.toContain('private');
  const config = await page.evaluate(() => dataLayer.find(v => v[0] === 'config')[2]);
  expect(config).toEqual({ page_location: `https://suyogjoshi.com${route}`, page_referrer: '' });
});

test('unsafe campaigns are discarded and source alias stays bounded', async ({ page }) => {
  await page.goto(`${route}?utm_source=person%40example.com&utm_campaign=${'a'.repeat(101)}&utm_medium=https%3A%2F%2Fexample.com&source=linkedin`);
  await expect(page.locator('[data-event-cta="primary"]')).toHaveAttribute('href', event.registration.url);
  await page.goto(`${route}?source=whatsapp&email=private`);
  await expect(page.locator('[data-event-cta="primary"]')).toHaveAttribute('href', `${event.registration.url}?utm_source=whatsapp`);
  const analytics = await page.evaluate(() => dataLayer.filter(v => v[0] === 'event').map(v => v[2]));
  expect(analytics.every(v => v.event_source === 'whatsapp')).toBe(true);
});

test('both CTAs navigate natively to Luma with no referrer query leakage', async ({ page }) => {
  const requests = [];
  await page.route('https://luma.com/**', async r => {
    requests.push({ url: r.request().url(), headers: await r.request().allHeaders() });
    await r.fulfill({ contentType: 'text/html', body: '<h1>Registration destination fixture</h1>' });
  });
  for (const location of ['primary', 'final']) {
    await page.goto(`${route}?utm_source=training&email=private`);
    const link = page.locator(`[data-event-cta="${location}"]`);
    await link.focus();
    await link.press('Enter');
    await expect(page).toHaveURL(`${event.registration.url}?utm_source=training`);
  }
  expect(requests).toHaveLength(2);
  expect(requests.every(r => !r.headers.referer && !r.url.includes('private'))).toBe(true);
});

test('blocked analytics and observer do not block native registration', async ({ page }) => {
  await page.addInitScript(() => { delete window.IntersectionObserver; });
  await page.goto(route);
  await page.evaluate(() => { delete window.gtag; });
  await page.route('https://luma.com/**', r => r.fulfill({ body: 'Registration destination fixture' }));
  await page.getByRole('link', { name: 'Register Free', exact: true }).first().click();
  await expect(page).toHaveURL(event.registration.url);
});
