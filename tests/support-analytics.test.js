const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/support-analytics.js', 'utf8');
const contract = fs.readFileSync('docs/plans/issue-576-support-funnel-analytics.md', 'utf8');

function action(attributes = {}) {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(name, listener) { listeners.set(name, listener); },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null; },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(attributes, name); },
  };
}

function load(pathname = '/support/', analytics) {
  const razorpay = action({ href: 'https://pages.razorpay.com/pl_Example/view' });
  const sponsors = action({ href: 'https://github.com/sponsors/suyog19' });
  const document = {
    querySelector(selector) {
      if (selector === '[data-support-razorpay]') return razorpay;
      if (selector === '[data-support-github-sponsors]') return sponsors;
      return null;
    },
  };
  const window = { location: { pathname }, gtag: analytics };
  vm.runInNewContext(source, { document, window });
  return { razorpay, sponsors, tools: window.sjSupportAnalytics };
}

test('Support page view and provider intents use the documented exact allow-list', () => {
  const calls = [];
  const state = load('/support/', (...args) => calls.push(args));
  state.razorpay.listeners.get('click')();
  state.sponsors.listeners.get('click')();
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ['event', 'support_page_view', { page_type: 'support' }],
    ['event', 'support_one_time_intent', { provider: 'razorpay', cadence: 'one_time', source_page: 'support' }],
    ['event', 'support_sponsorship_intent', { provider: 'github_sponsors', cadence: 'recurring', source_page: 'support' }],
  ]);
  assert.doesNotMatch(JSON.stringify(calls), /amount|email|phone|payment_id|signature|destination|referrer|query|success|complete/i);
});

test('disabled Razorpay handoff does not emit one-time intent', () => {
  const calls = [];
  const state = load('/not-support/', (...args) => calls.push(args));
  const disabled = action({ 'aria-disabled': 'true' });
  assert.equal(state.tools.bindIntent({ querySelector: () => disabled }, '[data-support-razorpay]', 'support_one_time_intent', () => (...args) => calls.push(args), (element) => element.hasAttribute('href') && element.getAttribute('aria-disabled') !== 'true'), true);
  disabled.listeners.get('click')();
  assert.deepEqual(calls, []);
});

test('missing analytics never interferes with native provider actions', () => {
  const state = load();
  assert.doesNotThrow(() => state.razorpay.listeners.get('click')());
  assert.doesNotThrow(() => state.sponsors.listeners.get('click')());
});

test('non-Support routes do not initialise Support page or intent analytics', () => {
  const calls = [];
  const state = load('/support/thank-you/', (...args) => calls.push(args));
  assert.deepEqual(calls, []);
  assert.equal(state.razorpay.listeners.has('click'), false);
  assert.equal(state.sponsors.listeners.has('click'), false);
});

test('contract rejects false provider conversion events and records the review plan', () => {
  assert.match(contract, /documented before implementation|Status: event contract approved for implementation/i);
  assert.match(contract, /no GitHub sponsorship completion metric/i);
  assert.match(contract, /No site event is defined for Razorpay success, failure, or cancellation/i);
  assert.match(contract, /Review after at least 30 days/);
  assert.doesNotMatch(source, /purchase|conversion|sponsor(?:ship)?_complete|payment_(?:success|failure)|razorpay_success/i);
});
