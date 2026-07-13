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

test('only an explicit OFFERED state is actionable', () => {
  assert.equal(view.hasActionableOffer({ status: 'OFFERED' }), true);
  assert.equal(view.hasActionableOffer({ status: 'WITHDRAWN' }), false);
  assert.equal(view.hasActionableOffer({}), false);
  assert.equal(view.hasActionableOffer(null), false);
});

test('Gate 2 links require backend action codes and bounded owned enrolment ids', () => {
  const payment = { offer: { enrolmentId: 'enr_one' }, gate2: { action: { code: 'DEPOSIT_DUE' }, enrolment: { status: 'OFFERED' } } };
  assert.equal(view.gate2Href(payment), '/my-learning/payment/?enrolmentId=enr_one');
  assert.equal(view.gate2ChangeHref(payment), '/my-learning/change/?enrolmentId=enr_one');
  assert.equal(view.gate2Href({ ...payment, gate2: { ...payment.gate2, action: { code: 'REFUND_PROCESSING' } } }), '/my-learning/change/?enrolmentId=enr_one');
  assert.equal(view.gate2Href({ ...payment, gate2: { ...payment.gate2, action: { code: 'PAYMENT_ACTION_NEEDED' } } }), '/contact/');
  assert.equal(view.gate2Href({ ...payment, offer: { enrolmentId: '../admin' } }), null);
  assert.equal(view.gate2Href({ ...payment, gate2: { ...payment.gate2, action: { code: 'BALANCE_DUE' } } }), null);
  assert.equal(view.gate2ChangeHref({ ...payment, gate2: { ...payment.gate2, learnerChange: { status: 'REQUESTED' } } }), null);
  assert.equal(view.gate2Href({ ...payment, gate2: { ...payment.gate2, action: { code: 'RESERVED' }, learnerChange: { status: 'DECIDED', decision: 'TRANSFER_OFFERED' } } }), '/my-learning/change/?enrolmentId=enr_one');
  assert.equal(view.gate2Href({ ...payment, gate2: { ...payment.gate2, action: { code: 'RESERVED' }, enrolment: { status: 'CANCELLED' } } }), '/my-learning/change/?enrolmentId=enr_one');
});

test('Gate 2 domain enums use bounded learner-friendly labels', () => {
  assert.equal(view.gate2StatusLabel('enrolment', 'RESERVED'), 'Seat reserved');
  assert.equal(view.gate2StatusLabel('request', 'REQUESTED'), 'Submitted');
  assert.equal(view.gate2StatusLabel('decision', 'APPROVED'), 'Approved');
  assert.equal(view.gate2StatusLabel('refund', 'PROCESSING'), 'Refund processing');
  assert.equal(view.gate2StatusLabel('refund', 'UNRECOGNISED'), 'Action needed');
});

test('correction links require explicit eligibility and bounded owned identifiers', () => {
  assert.equal(view.correctionHref({ canReplace: false }), null);
  assert.equal(view.correctionHref({ canReplace: true, applicationId: 'app_abc', course: { courseId: 'crs_python_foundations' } }), '/apply/?courseId=crs_python_foundations&applicationId=app_abc');
  assert.equal(view.correctionHref({ canReplace: true, applicationId: '../admin', course: { courseId: 'crs_python_foundations' } }), null);
  assert.equal(view.correctionHref({ canReplace: true, applicationId: 'app_abc', course: { courseId: 'https://evil.example' } }), null);
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
