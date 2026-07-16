const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync('js/contact.js', 'utf8');
const page = fs.readFileSync('contact/index.html', 'utf8');

test('learning support handoff accepts only bounded topic categories', () => {
  assert.match(page, /id="learning-contact-context"[^>]*hidden/);
  for (const category of ['learning-course-selection', 'learning-application', 'learning-payment-review', 'learning-course-access']) {
    assert.match(script, new RegExp("'" + category + "'"));
  }
  assert.match(script, /new URLSearchParams\(search \|\| ''\)\.get\('topic'\)/);
  assert.doesNotMatch(script, /get\('(?:email|applicationId|enrolmentId|paymentReference|amount)'\)/);
});

test('learning support guidance warns against sensitive data and duplicate payment', () => {
  assert.match(script, /do not pay again/i);
  assert.match(script, /one-time code, access token/);
  assert.match(script, /card, bank, UPI PIN/);
  assert.match(script, /do not paste private meeting, file or payment links/);
  assert.match(script, /Remove anything sensitive before sending/);
});

test('contact API routing permits only exact production and development hosts', () => {
  const form = { addEventListener() {}, querySelectorAll() { return []; } };
  const context = {
    window: { location: { hostname: 'unknown.example', search: '' } },
    document: { getElementById(id) { return id === 'contact-form' ? form : id === 'form-status' ? {} : null; } },
    URLSearchParams,
  };
  vm.runInNewContext(script, context);
  const route = context.window.sjContact.apiBaseUrl;
  assert.equal(route('suyogjoshi.com'), 'https://api.suyogjoshi.com');
  assert.equal(route('www.suyogjoshi.com'), 'https://api.suyogjoshi.com');
  assert.equal(route('dev.suyogjoshi.com'), 'https://api-dev.suyogjoshi.com');
  assert.equal(route('localhost'), 'https://api-dev.suyogjoshi.com');
  assert.equal(route('preview.suyogjoshi-dev.pages.dev'), '');
  assert.equal(route('unknown.example'), '');
});
