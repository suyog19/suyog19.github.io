const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('js/support-payment.js', 'utf8');

function load(hostname = 'unknown.example') {
  const attributes = new Map([['aria-disabled', 'true']]);
  const action = {
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
  };
  const status = { textContent: 'Unavailable until the Razorpay path has been verified.' };
  const document = {
    querySelector(selector) {
      if (selector === '[data-support-razorpay]') return action;
      if (selector === '#support-once-status') return status;
      return null;
    },
  };
  const window = { location: { hostname } };
  vm.runInNewContext(source, { URL, document, window });
  return { action, attributes, status, tools: window.sjSupportPayment };
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

test('missing provider configuration preserves the inert unavailable action', () => {
  const { attributes, status } = load('dev.suyogjoshi.com');
  assert.equal(attributes.get('aria-disabled'), 'true');
  assert.equal(attributes.has('href'), false);
  assert.match(status.textContent, /Unavailable until/);
});

test('valid stage configuration activates same-tab navigation without customer data', () => {
  const state = load();
  const destination = 'https://pages.razorpay.com/pl_AbC123/view';
  assert.equal(state.tools.activate({ querySelector: (selector) => selector === '[data-support-razorpay]' ? state.action : state.status }, 'localhost', { development: destination, production: '' }), true);
  assert.equal(state.attributes.get('href'), destination);
  assert.equal(state.attributes.get('rel'), 'external');
  assert.equal(state.attributes.has('target'), false);
  assert.equal(state.attributes.has('aria-disabled'), false);
  assert.match(state.status.textContent, /does not confirm completion/);
});

test('cross-stage and malformed destinations remain closed', () => {
  const { tools } = load();
  const destination = 'https://pages.razorpay.com/pl_AbC123/view';
  assert.equal(tools.resolveDestination('dev.suyogjoshi.com', { development: '', production: destination }), null);
  assert.equal(tools.resolveDestination('suyogjoshi.com', { development: destination, production: '' }), null);
  assert.equal(tools.resolveDestination('unknown.example', { development: destination, production: destination }), null);
});

test('frontend contains no checkout embed, callback, secret, amount, or transaction persistence', () => {
  assert.doesNotMatch(source, /checkout\.razorpay|callback|key_secret|payment_id|signature|localStorage|sessionStorage|fetch\(|XMLHttpRequest|amount=/i);
});
