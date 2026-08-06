const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const html = fs.readFileSync('apply/index.html', 'utf8');
const source = fs.readFileSync('js/course-application.js', 'utf8');

test('application keeps essential facts visible and secondary details collapsed', () => {
  for (const phrase of ['Free application', '5–10 minutes', 'no coding test', 'five business days', 'October–November 2026', 'Approximately 8 weeks', '5–6 total hours', 'confirmed before payment']) assert.match(html, new RegExp(phrase, 'i'));
  assert.match(html, /<details class="application-course-details">/);
  assert.match(html, /<summary>View course details and eligibility<\/summary>/);
  assert.doesNotMatch(html, /<details[^>]+open/);
  assert.doesNotMatch(html, /id="application-practical-summary"[^>]+hidden/);
  assert.match(source, /practicalSummary\.hidden/);
});

test('one optional learner note replaces the three readiness prompts', () => {
  assert.match(html, /id="application-note"[^>]+maxlength="500"[^>]+aria-describedby="application-note-hint application-note-error"/);
  assert.match(html, /leaving this blank will not affect your application/i);
  assert.doesNotMatch(html, /id="application-(?:experience|goal|availability)"/);
  assert.doesNotMatch(html, /What weekly time can you reliably set aside/i);
});

test('combined confirmation keeps explicit legal meaning and visible policy links', () => {
  assert.equal((html.match(/id="application-confirmation"/g) || []).length, 1);
  assert.match(html, /aria-labelledby="application-confirmation-copy"/);
  assert.match(html, /id="application-confirmation-copy"><label for="application-confirmation">[^<]+<\/label> <a/);
  for (const phrase of ['18 or older', 'Terms of Enrolment', 'Privacy Notice', 'Recording Policy', 'Course Conduct and Confidentiality Policy']) assert.match(html, new RegExp(phrase));
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g) || []).length, 4);
  assert.doesNotMatch(html, /software-signal-(?:terms|privacy|course-delivery|recording-consent|conduct-confidentiality)@/);
  assert.doesNotMatch(html, /immutable commercial snapshot/i);
  assert.doesNotMatch(html, /name="(?:mobile|phone|whatsapp)"/i);
});

test('success guidance includes review, later offer, My Learning, email recovery, and support', () => {
  for (const phrase of ['Application received', 'five business days', 'cohort offer may arrive later', 'Go to My Learning', 'confirmation email should arrive shortly', 'Contact application support']) assert.match(html + source, new RegExp(phrase, 'i'));
});
