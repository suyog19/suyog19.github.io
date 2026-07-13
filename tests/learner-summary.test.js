const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('js/learner-summary.js', 'utf8'), context);
const view = context.window.sjLearnerSummary;

test('action links accept only exact backend-owned destinations', () => {
  assert.equal(view.safeActionHref('/contact/'), '/contact/');
  assert.equal(view.safeActionHref('/contact/?email=victim@example.com'), '/my-learning/');
  assert.equal(view.safeActionHref('https://evil.example/'), '/my-learning/');
  assert.equal(view.safeActionHref('javascript:alert(1)'), '/my-learning/');
});

test('support and course links allow only bounded internal destinations', () => {
  assert.equal(
    view.safeSupportHref('/training/policies/', '/contact/'),
    '/training/policies/'
  );
  assert.equal(
    view.safeSupportHref('/training/policies/?next=evil', '/contact/'),
    '/contact/'
  );
  assert.equal(view.safeCourseHref('/training/python-foundations-ai-data/'), '/training/python-foundations-ai-data/');
  assert.equal(view.safeCourseHref('/training/../admin/'), null);
  assert.equal(view.safeCourseHref('https://evil.example/training/course/'), null);
});

test('boolean labels preserve true, false, and missing truth states', () => {
  assert.equal(view.booleanLabel(true, 'Yes', 'No'), 'Yes');
  assert.equal(view.booleanLabel(false, 'Yes', 'No'), 'No');
  assert.equal(view.booleanLabel(null, 'Yes', 'No'), 'Not available');
  assert.equal(view.booleanLabel(undefined, 'Yes', 'No'), 'Not available');
});

test('acknowledgements render only complete approved records', () => {
  assert.equal(view.acknowledgementLabel([]), 'Not recorded');
  assert.equal(view.acknowledgementLabel(null), 'Not available');
  assert.equal(
    view.acknowledgementLabel([{ documentId: 'unknown', version: '1.0.0' }]),
    'Not available'
  );
  assert.equal(
    view.acknowledgementLabel([{ documentId: 'software-signal-terms-privacy' }]),
    'Not available'
  );
  assert.equal(
    view.acknowledgementLabel([
      { documentId: 'software-signal-terms-privacy', version: '1.0.0' },
      { documentId: 'software-signal-recorded-delivery', version: '1.0.0' },
    ]),
    'Terms and privacy version 1.0.0, Recorded class delivery version 1.0.0'
  );
});
