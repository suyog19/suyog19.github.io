const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const event = require('../../data/training-events.json');
const eventRoute = `/training/events/${event.slug}/`;
const beforeEvent = new Date(new Date(event.start).getTime() - 7 * 86400000);

function variant(surface, status, registration = true) {
  const data = structuredClone(event);
  data.status = status;
  if (!registration) data.registration.url = null;
  const code = 'import sys,json; from scripts.generate_training_events import ROOT,render_outputs; data=json.load(sys.stdin); out=render_outputs(data,(ROOT/"index.html").read_text(encoding="utf-8"),(ROOT/"training/index.html").read_text(encoding="utf-8")); sys.stdout.buffer.write(out[ROOT/sys.argv[1]].encode("utf-8"))';
  return execFileSync('python', ['-X', 'utf8', '-c', code, surface === 'homepage' ? 'index.html' : 'training/index.html'], { input: JSON.stringify(data), encoding: 'utf8' });
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(beforeEvent);
  await page.route('https://www.googletagmanager.com/**', r => r.fulfill({ body: '' }));
  await page.route('https://subscribe-forms.beehiiv.com/**', r => r.fulfill({ body: '' }));
});

for (const width of [320, 360, 390, 768, 1440]) {
  for (const [surface, route] of [['homepage', '/'], ['training', '/training/']]) {
    test(`${surface} discovery fits ${width}px and preserves hierarchy`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const card = page.locator('[data-event-discovery]');
      const link = card.locator('[data-discovery-cta]');
      await expect(card).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(link).toHaveAttribute('href', new RegExp(`^${eventRoute}\\?utm_source=${surface}&`));
      expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(48);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await link.focus();
      expect(await link.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
      expect(await card.locator('[aria-live]').count()).toBe(0);
      if (surface === 'homepage') {
        await expect(page.locator('#home-title')).toHaveText('Move fast.Engineer reliably.');
        const box = await card.boundingBox();
        expect(box.height).toBeLessThan(width <= 390 ? 180 : 115);
        expect(box.y + box.height).toBeLessThanOrEqual((await page.locator('#hero').boundingBox()).y + 1);
        if (width <= 390) {
          await page.getByRole('button', { name: 'Toggle navigation' }).click();
          await expect(page.locator('#nav')).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(page.getByRole('button', { name: 'Toggle navigation' })).toHaveAttribute('aria-expanded', 'false');
        }
      } else {
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Practical learning for working professionals.');
        await expect(card.getByRole('heading', { level: 2 })).toHaveText(event.title);
        await expect(card).toContainText(event.audience);
        await expect(page.getByText('No focused public session is scheduled yet.', { exact: true })).toHaveCount(0);
        expect((await card.boundingBox()).y).toBeGreaterThan((await page.locator('.training-hero').boundingBox()).y);
        await card.scrollIntoViewIfNeeded();
      }
      if (surface === 'homepage') {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `test-results/702-${surface}-${width}-firstscreen.png` });
      } else {
        // Leave the existing sticky header above the card in the review capture.
        await card.evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 150));
        const titleBox = await card.getByRole('heading', { level: 2 }).boundingBox();
        const headerBox = await page.locator('.site-header').boundingBox();
        expect(titleBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height);
        await page.screenshot({ path: `test-results/702-${surface}-${width}-card.png` });
      }
      await page.screenshot({ path: `test-results/702-${surface}-${width}.png`, fullPage: true });
      expect(errors).toEqual([]);
    });
  }
}

for (const status of ['upcoming', 'registration-closed', 'completed']) {
  for (const surface of ['homepage', 'training']) {
    test(`${surface} ${status} is correct without JavaScript`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      const route = surface === 'homepage' ? '/' : '/training/';
      await page.route(new URL(route, test.info().project.use.baseURL).href, r => r.fulfill({ contentType: 'text/html', body: variant(surface, status) }));
      await page.goto(new URL(route, test.info().project.use.baseURL).href);
      const card = page.locator('[data-event-discovery]');
      if (status === 'completed') await expect(card).toHaveCount(0);
      else {
        await expect(card).toBeVisible();
        if (status === 'registration-closed') {
          await expect(card.locator('.discovery-closed').first()).toBeVisible();
          await expect(card.getByRole('link', { name: /register/i })).toHaveCount(0);
        }
        await card.scrollIntoViewIfNeeded();
      }
      await page.screenshot({ path: `test-results/702-${surface}-${status}-390.png`, fullPage: true });
      await context.close();
    });
  }
}

for (const [surface, route, location] of [['homepage', '/', 'homepage_announcement'], ['training', '/training/', 'training_featured_event']]) {
  test(`${surface} impressions, keyboard click and website-to-Luma attribution`, async ({ page }) => {
    await page.goto(`${route}?email=private&token=secret`);
    const card = page.locator('[data-event-discovery]');
    await card.scrollIntoViewIfNeeded();
    const views = () => page.evaluate(() => dataLayer.filter(v => v[1] === 'learning_event_discovery_view').length);
    await expect.poll(views).toBe(1);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await card.scrollIntoViewIfNeeded();
    await expect.poll(views).toBe(1);
    await page.evaluate(() => { window.recorded = []; const original = window.gtag; window.gtag = (...args) => { window.recorded.push(args); original(...args); }; });
    // Capture the actual click before allowing normal navigation below.
    await card.locator('a').evaluate(el => el.addEventListener('click', e => e.preventDefault(), { once: true }));
    await card.locator('a').focus();
    await page.keyboard.press('Enter');
    const click = await page.evaluate(() => window.recorded.find(v => v[1] === 'learning_event_discovery_click'));
    expect(click[2]).toEqual({ event_slug: event.slug, event_status: 'upcoming', source_surface: surface.toUpperCase(), cta_location: location.toUpperCase(), page_location: `https://suyogjoshi.com${route}`, page_referrer: '' });
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${eventRoute}\\?utm_source=${surface}&utm_medium=website&utm_content=${location}$`));
    await expect(page.locator('[data-event-cta="primary"]')).toHaveAttribute('href', `${event.registration.url}?utm_source=${surface}&utm_medium=website&utm_content=${location}`);
  });
}

test('clock guard closes discovery and removes completed promotion before display', async ({ page }) => {
  for (const [instant, state] of [[event.registration.closes_at, 'registration-closed'], [event.end, 'completed']]) {
    await page.clock.setFixedTime(new Date(instant));
    for (const route of ['/', '/training/']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-event-discovery-state', state);
      if (state === 'completed') await expect(page.locator('[data-event-discovery]')).toBeHidden();
      else await expect(page.locator('[data-event-discovery]').getByRole('link', { name: /register/i })).toHaveCount(0);
    }
  }
});

for (const width of [390, 1440]) {
for (const route of ['/', '/training/']) {
test(`long-open ${route} expires with visible keyboard focus at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.clock.install({ time: new Date(new Date(event.end).getTime() - 1000) });
  await page.goto(route);
  await page.locator('[data-discovery-cta]').scrollIntoViewIfNeeded();
  await page.locator('[data-discovery-cta]').focus();
  await page.clock.fastForward(1001);
  await expect(page.locator('[data-event-discovery]')).toBeHidden();
  const heading = page.locator('main h1');
  await expect(heading).toBeFocused();
  const box = await heading.boundingBox();
  const header = await page.locator('.site-header').boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(header.y + header.height);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
});
}
}

test('editorial closed state never reopens and unavailable registration has no promise', async ({ page }) => {
  await page.route('**/training/', r => r.fulfill({ contentType: 'text/html', body: variant('training', 'registration-closed') }));
  await page.goto('/training/');
  await expect(page.locator('html')).toHaveAttribute('data-event-discovery-state', 'registration-closed');
  await expect(page.locator('[data-event-discovery]').getByRole('link', { name: 'View session', exact: true })).toBeVisible();
  await page.unroute('**/training/');
  await page.route('**/training/', r => r.fulfill({ contentType: 'text/html', body: variant('training', 'upcoming', false) }));
  await page.goto('/training/');
  await expect(page.locator('[data-event-discovery]').getByRole('link', { name: /register/i })).toHaveCount(0);
});
