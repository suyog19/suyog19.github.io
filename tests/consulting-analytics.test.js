const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/consulting-analytics.js', 'utf8');

function action(value) {
  const listeners = new Map();
  return {
    addEventListener(name, listener) { listeners.set(name, listener); },
    getAttribute(name) { return name === 'data-consulting-offer' ? value : null; },
    listeners,
  };
}

function load(pathname = '/consulting/', analytics) {
  const actions = [action('advisory'), action('repository_review'), action('help_choose')];
  const document = { querySelectorAll: () => actions };
  const window = { location: { pathname }, gtag: analytics };
  vm.runInNewContext(source, { document, window });
  return { actions, tools: window.sjConsultingAnalytics };
}

test('Consulting analytics emits only allow-listed page and offer intent data', () => {
  const calls = [];
  const state = load('/consulting/', (...args) => calls.push(args));
  state.actions.forEach((item) => item.listeners.get('click')());
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ['event', 'consulting_page_view', { page_type: 'consulting' }],
    ['event', 'consulting_offer_cta_selected', { offer: 'engineering_advisory_session', source_page: 'consulting' }],
    ['event', 'consulting_offer_cta_selected', { offer: 'repository_ai_readiness_review', source_page: 'consulting' }],
    ['event', 'consulting_offer_cta_selected', { offer: 'help_choose', source_page: 'consulting' }],
  ]);
  assert.doesNotMatch(JSON.stringify(calls), /name|email|company|message|problem|repository_id|query|referrer/i);
});

test('unknown offers and non-Consulting routes emit nothing', () => {
  const calls = [];
  assert.equal(load('/contact/', (...args) => calls.push(args)).actions[0].listeners.size, 0);
  const state = load('/consulting/', (...args) => calls.push(args));
  const unknown = action('unknown');
  state.tools.initialise({ querySelectorAll: () => [unknown] }, { pathname: '/consulting/' }, () => (...args) => calls.push(args));
  assert.equal(unknown.listeners.size, 0);
});

test('missing analytics does not interfere with native links', () => {
  const state = load();
  assert.doesNotThrow(() => state.actions.forEach((item) => item.listeners.get('click')()));
});
