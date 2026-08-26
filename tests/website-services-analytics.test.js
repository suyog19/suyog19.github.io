const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/website-services-analytics.js', 'utf8');

function action(value) {
  const listeners = new Map();
  return { addEventListener(name, listener) { listeners.set(name, listener); }, getAttribute(name) { return name === 'data-website-service' ? value : null; }, listeners };
}

function load(pathname = '/website-services/', analytics) {
  const actions = ['landing_campaign', 'starter_presence', 'business_website', 'website_redesign', 'website_care', 'help_choose'].map(action);
  const document = { querySelectorAll: () => actions };
  const window = { location: { pathname }, gtag: analytics };
  vm.runInNewContext(source, { document, window });
  return { actions, tools: window.sjWebsiteServicesAnalytics };
}

test('Website Services analytics emits only allow-listed intent metadata', () => {
  const calls = [];
  const state = load('/website-services/', (...args) => calls.push(args));
  state.actions.forEach((item) => item.listeners.get('click')());
  assert.equal(calls.length, 7);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), ['event', 'website_services_page_view', { page_type: 'website_services' }]);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1])), ['event', 'website_services_cta_selected', { service: 'landing_campaign_page', source_page: 'website_services' }]);
  assert.doesNotMatch(JSON.stringify(calls), /name|email|phone|company|message|website_url|query|referrer/i);
});

test('unknown services and unrelated routes emit nothing', () => {
  const calls = [];
  assert.equal(load('/contact/', (...args) => calls.push(args)).actions[0].listeners.size, 0);
  const state = load('/website-services/', (...args) => calls.push(args));
  const unknown = action('unknown');
  state.tools.initialise({ querySelectorAll: () => [unknown] }, { pathname: '/website-services/' }, () => (...args) => calls.push(args));
  assert.equal(unknown.listeners.size, 0);
});

test('missing analytics never interferes with native links', () => {
  const state = load();
  assert.doesNotThrow(() => state.actions.forEach((item) => item.listeners.get('click')()));
});
