const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadModel() {
  const context = {
    window: {},
    crypto: { getRandomValues(values) { values.set([1, 2, 3, 4]); return values; } },
    Uint32Array,
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/course-application-model.js'), 'utf8'), context);
  return context.window.sjCourseApplication;
}

function validValue() {
  return {
    courseId: 'crs_python_foundations', fullName: 'Learner', timezone: 'Asia/Kolkata',
    adultEligibilityConfirmed: true, termsAccepted: true, recordingAccepted: true,
    answers: { programmingExperience: 'Python basics', learningGoal: 'Build safely', weeklyAvailability: 'Five hours' },
  };
}

test('only approved Gate 1 course identifiers are accepted', () => {
  const model = loadModel();
  assert.equal(model.course('crs_python_foundations').slug, 'python-foundations-ai-data');
  assert.equal(model.course('crs_applied_python').slug, 'applied-python-ai-ml');
  assert.equal(model.course('../admin'), null);
});

test('submission payload is the exact approved contract', () => {
  const model = loadModel();
  const payload = model.payload(validValue());
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    courseId: 'crs_python_foundations',
    answers: { programmingExperience: 'Python basics', learningGoal: 'Build safely', weeklyAvailability: 'Five hours' },
    acknowledgements: [
      { documentId: 'software-signal-terms-privacy', version: '1.0.0' },
      { documentId: 'software-signal-recorded-delivery', version: '1.0.0' },
    ],
  });
  assert.equal(Object.hasOwn(payload, 'phone'), false);
  assert.equal(Object.hasOwn(payload, 'optionalConsent'), false);
  assert.equal(Object.hasOwn(payload, 'payment'), false);
});

test('replacement adds only the optimistic concurrency precondition', () => {
  const model = loadModel();
  const replacement = model.replacementPayload(validValue(), 3);
  assert.equal(replacement.expectedVersion, 3);
  assert.deepEqual(Object.keys(replacement).sort(), ['acknowledgements', 'answers', 'courseId', 'expectedVersion']);
  assert.notEqual(model.fingerprint(validValue()), model.fingerprint(validValue(), { expectedVersion: 3 }));
});

test('validation covers profile, answers, adult status, and acknowledgements', () => {
  const model = loadModel();
  assert.deepEqual(Object.keys(model.validate(validValue(), true)), []);
  const invalid = validValue();
  invalid.answers.learningGoal = '';
  invalid.adultEligibilityConfirmed = false;
  invalid.termsAccepted = false;
  assert.deepEqual(Object.keys(model.validate(invalid, true)).sort(), ['adultEligibilityConfirmed', 'learningGoal', 'termsAccepted']);
});

test('backend contract errors map to specific recovery states', () => {
  const model = loadModel();
  assert.equal(model.errorMessage({ status: 409, body: { error: 'DUPLICATE_ACTIVE_APPLICATION' } }).code, 'DUPLICATE');
  assert.equal(model.errorMessage({ status: 409, body: { error: 'REGISTRATION_CLOSED' } }).code, 'REGISTRATION_CLOSED');
  assert.equal(model.errorMessage({ status: 409, body: { error: 'ACKNOWLEDGEMENT_VERSION_NOT_CURRENT' } }).code, 'ACKNOWLEDGEMENT_REQUIRED');
  assert.equal(model.errorMessage({ status: 409, body: { error: 'APPLICATION_REPLACEMENT_CONFLICT' } }).code, 'REPLACEMENT_CONFLICT');
  assert.equal(model.errorMessage({ status: 503, body: {} }).code, 'UNCERTAIN');
  assert.equal(model.errorMessage({ status: 401, body: {} }).code, 'SESSION_EXPIRED');
});

test('page remains private-by-default and contains no payment integration', () => {
  const html = fs.readFileSync(path.join(root, 'apply/index.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'js/course-application.js'), 'utf8');
  assert.match(html, /noindex, nofollow/);
  assert.match(html, /No payment is collected in Gate 1/);
  assert.doesNotMatch(html + script, /Razorpay|checkout\.js|payment-button/i);
  assert.doesNotMatch(script, /emailId.*gtag|application\.reference.*gtag/);
  assert.match(script, /sessionStorage/);
  assert.match(script, /Idempotency-Key/);
  assert.match(script, /\/replacements/);
  assert.match(script, /Your original remains active until you resubmit/);
});
