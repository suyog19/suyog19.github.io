const { test, expect } = require('@playwright/test');
const event = require('../../data/training-events.json');
const eventRoute = `/training/events/${event.slug}/`;

for (const [width, height] of [[1440, 900], [1280, 720], [768, 1024], [390, 844], [360, 800]]) {
  for (const route of ['/', '/training/', eventRoute]) {
    test(`release gate ${route} at ${width}x${height}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));
      await page.route('https://www.googletagmanager.com/**', r => r.fulfill({ body: '' }));
      await page.route('https://subscribe-forms.beehiiv.com/**', r => r.fulfill({ body: '' }));
      await page.setViewportSize({ width, height });
      await page.goto(route);
      const detail = route === eventRoute;
      const surface = page.locator(detail ? '[data-event-slug]' : '[data-event-discovery]');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://suyogjoshi.com${route}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const links = surface.locator(detail ? '[data-event-cta]' : '[data-discovery-cta]');
      for (const link of await links.all()) {
        await expect(link).toHaveAccessibleName(detail ? 'Register Free' : /View session/);
        await link.focus();
        expect(await link.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
        const href = new URL(await link.getAttribute('href'), `https://suyogjoshi.com${route}`);
        expect(href.origin + href.pathname).toBe(detail ? event.registration.url : `https://suyogjoshi.com${eventRoute}`);
      }
      if (detail) {
        await expect(page.locator('h1')).toHaveText(event.title);
        await expect(surface).toContainText('Saturday, 19 September 2026');
        await expect(surface).toContainText('11:00–11:30 AM IST');
        await expect(surface).toContainText('30-minute');
        await expect(surface).toContainText(event.format);
        await expect(page.locator('.event-status')).toContainText('Upcoming');
      }
      // WCAG contrast for the event's visible text against its actual solid ancestor background.
      const failures = await surface.evaluate(root => {
        const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
        const luminance = c => c.slice(0,3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s,v,i) => s + v * [.2126,.7152,.0722][i], 0);
        return [...root.querySelectorAll('*')].filter(el => el.getClientRects().length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())).flatMap(el => {
          const style = getComputedStyle(el);
          let ancestor = el, bg;
          while (ancestor) { const color = rgb(getComputedStyle(ancestor).backgroundColor); if (color.length === 3 || color[3] === 1) { bg = color; break; } ancestor = ancestor.parentElement; }
          const fg = rgb(style.color), a = luminance(fg), b = luminance(bg || [255,255,255]);
          const ratio = (Math.max(a,b) + .05) / (Math.min(a,b) + .05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
          return ratio + .01 < (large ? 3 : 4.5) ? [{tag:el.tagName, text:el.textContent.trim().slice(0,70), ratio}] : [];
        });
      });
      expect(failures).toEqual([]);
      await surface.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/703-${detail ? 'event' : route === '/' ? 'home' : 'training'}-${width}x${height}.png`, fullPage: true });
    });
  }
}
