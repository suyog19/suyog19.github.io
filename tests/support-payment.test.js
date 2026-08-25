const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/support-payment.js', 'utf8');

function load(hostname = 'unknown.example') {
  const attributes = new Map([['aria-disabled', 'true']]);
  const action = {
    textContent: 'Choose an amount to continue',
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
  };
  const status = { textContent: 'Unavailable until the Razorpay path has been verified.' };
  const amountListeners = new Map();
  const amountAttributes = new Map([['disabled', '']]);
  const amountGroup = {
    addEventListener(name, listener) { amountListeners.set(name, listener); },
    removeAttribute(name) { amountAttributes.delete(name); },
  };
  const sponsorListeners = new Map();
  const sponsorAction = {
    addEventListener(name, listener) { sponsorListeners.set(name, listener); },
  };
  const document = {
    querySelector(selector) {
      if (selector === '[data-support-razorpay]') return action;
      if (selector === '#support-once-status') return status;
      if (selector === '[data-support-amounts]') return amountGroup;
      if (selector === '[data-support-github-sponsors]') return sponsorAction;
      return null;
    },
  };
  const window = { location: { hostname } };
  vm.runInNewContext(source, { URL, document, window });
  return { action, amountAttributes, amountListeners, attributes, sponsorAction, sponsorListeners, status, tools: window.sjSupportPayment };
}

test('support handoff accepts only an exact Razorpay Payment Page URL', () => {
  const { tools } = load();
  assert.equal(tools.isExactPaymentPage('https://pages.razorpay.com/pl_AbC123/view'), true);
  for (const value of [
    '',
    'http://pages.razorpay.com/pl_AbC123/view',
    'https://evil.example/pl_AbC123/view',
    'https://pages.razorpay.com/payment-link/pl_AbC123',
    'https://pages.razorpay.com/pl_AbC123/view?amount=100',
    'https://pages.razorpay.com/pl_AbC123/view#paid',
    'https://user:secret@pages.razorpay.com/pl_AbC123/view',
  ]) assert.equal(tools.isExactPaymentPage(value), false, value);
});

test('host selection is closed outside exact development and production hosts', () => {
  const { tools } = load();
  for (const host of ['dev.suyogjoshi.com', 'localhost', '127.0.0.1']) {
    assert.equal(tools.stageForHost(host), 'development');
  }
  for (const host of ['suyogjoshi.com', 'www.suyogjoshi.com']) {
    assert.equal(tools.stageForHost(host), 'production');
  }
  for (const host of ['preview.example', 'suyogjoshi.com.evil.example', '']) {
    assert.equal(tools.stageForHost(host), null);
  }
});

test('unknown hosts preserve the inert unavailable action', () => {
  const { attributes, status } = load('unknown.example');
  assert.equal(attributes.get('aria-disabled'), 'true');
  assert.equal(attributes.has('href'), false);
  assert.match(status.textContent, /Unavailable until/);
});

test('source configuration keeps verified Test and Live destinations stage-separated', () => {
  for (const host of ['dev.suyogjoshi.com', 'localhost', '127.0.0.1']) {
    const state = load(host);
    assert.equal(state.attributes.has('href'), false);
    assert.equal(state.attributes.get('aria-disabled'), 'true');
    assert.equal(state.amountAttributes.has('disabled'), false);
  }
  for (const host of ['suyogjoshi.com', 'www.suyogjoshi.com']) {
    const state = load(host);
    assert.equal(state.attributes.has('href'), false);
    assert.equal(state.attributes.get('aria-disabled'), 'true');
    assert.equal(state.amountAttributes.has('disabled'), false);
    state.amountListeners.get('change')({ target: { value: '500' } });
    assert.equal(state.attributes.get('href'), 'https://pages.razorpay.com/pl_TTcwSP5BE6K7WC/view?support_amount=500');
  }
  for (const host of ['unknown.example']) {
    const { attributes, amountAttributes } = load(host);
    assert.equal(attributes.has('href'), false);
    assert.equal(attributes.get('aria-disabled'), 'true');
    assert.equal(amountAttributes.has('disabled'), true);
  }
});

test('valid stage configuration activates same-tab navigation without customer data', () => {
  const state = load();
  const destination = 'https://pages.razorpay.com/pl_AbC123/view';
  assert.equal(state.tools.activate({ querySelector: (selector) => ({ '[data-support-razorpay]': state.action, '#support-once-status': state.status, '[data-support-amounts]': { removeAttribute() {}, addEventListener: (name, listener) => state.amountListeners.set(name, listener) } })[selector] }, 'localhost', { development: destination, production: '' }), true);
  assert.equal(state.attributes.has('href'), false);
  assert.equal(state.attributes.get('rel'), 'external');
  assert.equal(state.attributes.has('target'), false);
  assert.equal(state.attributes.get('aria-disabled'), 'true');
  assert.match(state.status.textContent, /Razorpay confirms/);
  state.amountListeners.get('change')({ target: { value: '500' } });
  assert.equal(state.attributes.get('href'), destination + '?support_amount=500');
  assert.equal(state.attributes.has('aria-disabled'), false);
  assert.equal(state.action.textContent, 'Support with ₹500');
});

test('only presets are placed in a Razorpay amount query; Custom keeps the base page', () => {
  const { tools } = load();
  const destination = 'https://pages.razorpay.com/pl_AbC123/view';
  assert.equal(tools.destinationForAmount(destination, '250'), destination + '?support_amount=250');
  assert.equal(tools.destinationForAmount(destination, '500'), destination + '?support_amount=500');
  assert.equal(tools.destinationForAmount(destination, '1000'), destination + '?support_amount=1000');
  assert.equal(tools.destinationForAmount(destination, 'custom'), destination);
  for (const value of ['', '1', '249', '1001', '500&email=x', 500, null]) {
    assert.equal(tools.destinationForAmount(destination, value), null);
  }
});

test('cross-stage and malformed destinations remain closed', () => {
  const { tools } = load();
  const destination = 'https://pages.razorpay.com/pl_AbC123/view';
  assert.equal(tools.resolveDestination('dev.suyogjoshi.com', { development: '', production: destination }), null);
  assert.equal(tools.resolveDestination('suyogjoshi.com', { development: destination, production: '' }), null);
  assert.equal(tools.resolveDestination('unknown.example', { development: destination, production: destination }), null);
});

test('frontend contains no checkout embed, callback, secret, customer data, or transaction persistence', () => {
  assert.doesNotMatch(source, /checkout\.razorpay|callback|key_secret|payment_id|signature|localStorage|sessionStorage|fetch\(|XMLHttpRequest|email=|phone=/i);
});

test('source records only the approved stage-specific Test and Live pages', () => {
  assert.match(source, /development:\s*'https:\/\/pages\.razorpay\.com\/pl_TTdbTEtwC4vyYF\/view'/);
  assert.match(source, /production:\s*'https:\/\/pages\.razorpay\.com\/pl_TTcwSP5BE6K7WC\/view'/);
  assert.doesNotMatch(source, /6x2ZLHMT/);
});

test('GitHub Sponsors intent analytics are coarse, allow-listed, and outcome-neutral', () => {
  const state = load();
  const calls = [];
  assert.equal(state.tools.trackSponsorIntent({
    querySelector: (selector) => selector === '[data-support-github-sponsors]' ? state.sponsorAction : null,
  }, (...args) => calls.push(args)), true);
  state.sponsorListeners.get('click')();
  assert.equal(JSON.stringify(calls), JSON.stringify([[
    'event',
    'support_sponsorship_intent',
    { provider: 'github_sponsors', cadence: 'recurring', source_page: 'support' },
  ]]));
  assert.doesNotMatch(JSON.stringify(calls), /amount|tier|user|login|url|success|complete|payment/i);
});

test('missing analytics does not interfere with the native Sponsors link', () => {
  const state = load();
  assert.equal(state.sponsorListeners.has('click'), true);
  assert.doesNotThrow(() => state.sponsorListeners.get('click')());
});
