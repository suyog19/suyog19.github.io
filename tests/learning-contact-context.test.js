const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

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
