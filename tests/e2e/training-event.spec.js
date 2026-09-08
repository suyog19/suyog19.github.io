const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const event = require('../../data/training-events.json');
const route = `/training/events/${event.slug}/`;

// Render fixture variants through the real generator; never rewrite served files.
function variant(status, registration = true, resources = null) {
  const data = structuredClone(event);
  data.status = status;
  data.registration.url = registration ? 'https://example.com/registration' : null;
  data.resources = resources;
  return execFileSync('python', ['-X', 'utf8', '-c', 'import sys,json; from scripts.generate_training_events import render; sys.stdout.buffer.write(render(json.load(sys.stdin)).encode("utf-8"))'], { input: JSON.stringify(data), encoding: 'utf8' });
}

test.beforeEach(async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', r => r.fulfill({ body: '' }));
});

for (const width of [320, 390, 768, 1440]) {
  test(`event fits at ${width}px with semantic content and usable navigation`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(event.title);
    await expect(page.getByText('Registration opens soon.', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register Free' })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to session details' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    expect(await page.locator('time').first().getAttribute('datetime')).toBe(event.start);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `test-results/700-event-${width}.png`, fullPage: true });
  });
}

for (const state of ['upcoming', 'registration-closed', 'completed']) {
  test(`${state}: static lifecycle and optional resources without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.route(`**${route}`, r => r.fulfill({ contentType: 'text/html', body: variant(state, true) }));
    await page.goto(`http://127.0.0.1:4173${route}`);
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

test('active CTA visibility, keyboard and location analytics; no query forwarding', async ({ page }) => {
  await page.route(`**${route}?*`, r => r.fulfill({ contentType: 'text/html', body: variant('upcoming') }));
  await page.goto(`${route}?utm_source=synthetic&email=private`);
  const primary = page.locator('[data-event-cta="primary"]');
  await expect(primary).toHaveAttribute('href', 'https://example.com/registration');
  await primary.focus();
  expect(await primary.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  expect((await primary.boundingBox()).height).toBeGreaterThanOrEqual(48);
  // Prevent external navigation only; exercise normal keyboard click handling.
  await page.locator('[data-event-cta]').evaluateAll(links => links.forEach(link => link.addEventListener('click', e => e.preventDefault())));
  await page.keyboard.press('Enter');
  await page.locator('[data-event-cta="final"]').click();
  await expect.poll(() => page.evaluate(() => dataLayer.filter(v => v[1] === 'learning_event_register_view').length)).toBe(1);
  const analytics = await page.evaluate(() => dataLayer.filter(v => v[0] === 'event').map(v => [v[1], v[2]]));
  expect(analytics).toContainEqual(['learning_event_page_view', { event_slug: event.slug, event_status: 'upcoming' }]);
  for (const cta_location of ['primary', 'final']) {
    expect(analytics).toContainEqual(['learning_event_register_click', { event_slug: event.slug, event_status: 'upcoming', cta_location }]);
  }
  expect(JSON.stringify(analytics)).not.toContain('private');
});
