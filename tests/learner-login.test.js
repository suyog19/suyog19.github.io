const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('learner OTP controls are hidden until the request succeeds', () => {
  const page = fs.readFileSync('learn/index.html', 'utf8');
  const css = fs.readFileSync('css/pages.css', 'utf8');
  const script = fs.readFileSync('js/learner-login.js', 'utf8');

  assert.match(page, /<form id="learner-email-form" novalidate>/);
  assert.match(page, /<form id="learner-otp-form" novalidate hidden>/);
  assert.match(css, /\.learner-page \[hidden\]\s*{\s*display:\s*none\s*!important;\s*}/);
  assert.match(script, /emailForm\.hidden\s*=\s*true;\s*otpForm\.hidden\s*=\s*false;/);
});
