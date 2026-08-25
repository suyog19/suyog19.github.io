const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/script.js', 'utf8');

function load(pathname, analytics) {
  let clickListener;
  const document = {
    getElementById() { return null; },
    addEventListener(name, listener) { if (name === 'click') clickListener = listener; },
  };
  const window = {
    location: { href: `https://suyogjoshi.com${pathname}`, origin: 'https://suyogjoshi.com', pathname },
    gtag: analytics,
  };
  vm.runInNewContext(source, { URL, document, window });
  return { clickListener, tools: window.sjSupportEntryAnalytics, window };
}

function footerClick(href) {
  return {
    target: {
      closest(selector) {
        if (selector !== '.site-footer a') return null;
        return { getAttribute: (name) => name === 'href' ? href : null };
      },
    },
  };
}

test('footer Support entry emits only coarse location and source section', () => {
  const calls = [];
  const state = load('/writing/example/', (...args) => calls.push(args));
  state.clickListener(footerClick('../../support/'));
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [[
    'event',
    'support_entry_click',
    { entry_location: 'footer', source_section: 'writing' },
  ]]);
  assert.doesNotMatch(JSON.stringify(calls), /example|href|url|path|title|referrer|query/i);
});

test('source sections are bounded and never expose a raw path', () => {
  const { tools } = load('/');
  const cases = new Map([
    ['/', 'home'],
    ['/writing/', 'writing'],
    ['/systems/demo/', 'systems'],
    ['/training', 'training'],
    ['/newsletter/confirmed/', 'newsletter'],
    ['/about/', 'about'],
    ['/contact/', 'contact'],
    ['/research/topic/', 'research'],
    ['/search/', 'search'],
    ['/unexpected/private-looking/value/', 'other_public'],
  ]);
  for (const [pathname, expected] of cases) assert.equal(tools.sourceSection(pathname), expected);
});

test('non-Support, cross-origin, and Support self-links are ignored', () => {
  const calls = [];
  const state = load('/about/', (...args) => calls.push(args));
  state.clickListener(footerClick('../privacy/'));
  state.clickListener(footerClick('https://evil.example/support/'));
  const selfState = load('/support/', (...args) => calls.push(args));
  selfState.clickListener(footerClick('./'));
  assert.deepEqual(calls, []);
});

test('missing analytics does not interfere with footer navigation', () => {
  const state = load('/writing/');
  assert.doesNotThrow(() => state.clickListener(footerClick('../support/')));
});
