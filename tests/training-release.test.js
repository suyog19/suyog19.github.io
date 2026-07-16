const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function release() {
  const context = { URL, Set, Object, window: {} };
  vm.runInNewContext(fs.readFileSync('js/training-release.js', 'utf8'), context);
  return context.window.sjTrainingRelease;
}

test('production capabilities remain source-controlled closed', () => {
  const control = release();
  for (const host of ['suyogjoshi.com', 'www.suyogjoshi.com']) {
    assert.equal(control.environment(host), 'production');
    assert.equal(control.capabilityEnabled('applications', host), false);
    assert.equal(control.capabilityEnabled('depositPayments', host), false);
    assert.equal(control.capabilityEnabled('balancePayments', host), false);
    assert.equal(control.apiBaseUrl('applications', host), '');
  }
});

test('development keeps exact capabilities and API routing', () => {
  const control = release();
  for (const host of ['dev.suyogjoshi.com', 'localhost', 'preview.suyogjoshi-dev.pages.dev']) {
    assert.equal(control.environment(host), 'development');
    assert.equal(control.capabilityEnabled('applications', host), true);
    assert.equal(control.apiBaseUrl('applications', host), 'https://api-dev.suyogjoshi.com');
  }
  assert.equal(control.environment('untrusted.example'), 'unknown');
  assert.equal(control.capabilityEnabled('applications', 'untrusted.example'), false);
});

test('payment URLs are exact-host, stage-aware, and fail closed', () => {
  const control = release();
  assert.equal(control.safePaymentUrl('https://rzp.io/i/test-one', 'depositPayments', 'localhost'), 'https://rzp.io/i/test-one');
  assert.equal(control.safePaymentUrl('https://pay.test.invalid/requests/one', 'balancePayments', 'localhost'), 'https://pay.test.invalid/requests/one');
  for (const value of [
    'https://rzp.io.evil.example/i/test', 'https://user@rzp.io/i/test',
    'https://rzp.io/i/test?token=value', 'https://rzp.io:444/i/test', 'javascript:alert(1)',
  ]) assert.equal(control.safePaymentUrl(value, 'depositPayments', 'localhost'), null);
  assert.equal(control.safePaymentUrl('https://rzp.io/i/live', 'depositPayments', 'suyogjoshi.com'), null);
  assert.equal(control.safePaymentUrl('https://pay.test.invalid/requests/one', 'depositPayments', 'suyogjoshi.com'), null);
});
