const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const html = fs.readFileSync('apply/index.html', 'utf8');
const source = fs.readFileSync('js/course-application.js', 'utf8');

test('application starts with the approved practical and readiness summary', () => {
  for (const phrase of ['Free application', '5–10 minutes', 'no coding test', 'five business days', 'October–November 2026', 'Approximately 8 weeks', '5–6 total hours', 'confirmed before payment']) assert.match(html, new RegExp(phrase, 'i'));
  assert.match(source, /practicalSummary\.hidden/);
});

test('all three readiness prompts have accessible helper text', () => {
  for (const field of ['experience', 'goal', 'availability']) {
    assert.match(html, new RegExp(`id="application-${field}"[^>]+aria-describedby="application-${field}-hint"`));
    assert.match(html, new RegExp(`id="application-${field}-hint"`));
  }
  assert.match(html, /never programmed before/i);
});

test('legal meaning remains while technical jargon and mobile capture stay absent', () => {
  for (const id of ['application-adult', 'application-terms', 'application-recording']) assert.match(html, new RegExp(id));
  assert.doesNotMatch(html, /immutable commercial snapshot/i);
  assert.doesNotMatch(html, /name="(?:mobile|phone|whatsapp)"/i);
});

test('success guidance includes review, later offer, My Learning, email recovery, and support', () => {
  for (const phrase of ['Application received', 'five business days', 'cohort offer may arrive later', 'Go to My Learning', 'confirmation email should arrive shortly', 'Contact application support']) assert.match(html + source, new RegExp(phrase, 'i'));
});
