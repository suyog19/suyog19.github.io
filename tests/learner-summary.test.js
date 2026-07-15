const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('js/learner-summary.js', 'utf8'), context);
const view = context.window.sjLearnerSummary;

test('every supported learner state has bounded plain-language presentation', () => {
  const codes = [
    'APPLY', 'COMPLETE_PROFILE', 'APPLICATION_RECEIVED', 'UNDER_REVIEW', 'OFFERED',
    'ACCEPTED', 'WAITLISTED', 'RECOMMENDED', 'DECLINED', 'WITHDRAWN',
    'DEPOSIT_DUE', 'PAYMENT_CONFIRMING', 'RESERVED', 'PAYMENT_ACTION_NEEDED',
    'CANCELLATION_REQUESTED', 'REFUND_PROCESSING', 'REFUNDED',
    'BALANCE_ACTION_NEEDED', 'CLOSED_NON_PAYMENT', 'COHORT_CANCELLED',
    'COHORT_POSTPONED', 'BALANCE_OVERDUE_IN_GRACE', 'BALANCE_EXTENDED',
    'BALANCE_DUE', 'BALANCE_CONFIRMING', 'ACTIVATION_PENDING', 'ACTIVE',
  ];
  for (const code of codes) {
    const presentation = view.statusPresentation(code);
    assert.ok(presentation.heading.length > 3, code);
    assert.ok(presentation.explanation.length > 12, code);
    assert.doesNotMatch(
      presentation.heading + ' ' + presentation.explanation + ' ' + (presentation.actionLabel || ''),
      /\b(?:Gate [1-4]|backend|webhook|allocation|provider callback|development|mock|test payment|canonical|projection|reconciliation)\b/i,
      code,
    );
  }
});

test('unknown state fails closed without repeating raw state or action copy', () => {
  const presentation = view.statusPresentation('RAW_INTERNAL_STATE');
  assert.equal(presentation.heading, 'View your current learning status');
  assert.doesNotMatch(presentation.explanation, /RAW_INTERNAL_STATE/);
  assert.equal(presentation.actionLabel, null);
});

test('action links accept only exact backend-owned destinations', () => {
  assert.equal(view.safeActionHref('/contact/'), '/contact/');
  assert.equal(view.safeActionHref('/contact/?email=victim@example.com'), null);
  assert.equal(view.safeActionHref('https://evil.example/'), null);
  assert.equal(view.safeActionHref('javascript:alert(1)'), null);
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

test('initial deposit route requires an explicit offered enrolment with a bounded id', () => {
  assert.equal(
    view.offerPaymentHref({ offer: { status: 'OFFERED', enrolmentId: 'enr_one' } }),
    '/my-learning/payment/?enrolmentId=enr_one',
  );
  assert.equal(view.offerPaymentHref({ offer: { status: 'RESERVED', enrolmentId: 'enr_one' } }), null);
  assert.equal(view.offerPaymentHref({ offer: { status: 'OFFERED', enrolmentId: '../admin' } }), null);
  assert.equal(view.offerPaymentHref({ offer: { status: 'OFFERED' } }), null);
});

test('Gate 2 links require backend action codes and bounded owned enrolment ids', () => {
  const payment = { offer: { enrolmentId: 'enr_one' }, gate2: { action: { code: 'DEPOSIT_DUE' }, enrolment: { status: 'OFFERED' } } };
  assert.equal(view.gate2Href(payment), '/my-learning/payment/?enrolmentId=enr_one');
  assert.equal(view.gate2ChangeHref(payment), '/my-learning/change/?enrolmentId=enr_one');
  assert.equal(view.gate2Href({ ...payment, gate2: { ...payment.gate2, action: { code: 'REFUND_PROCESSING' } } }), '/my-learning/change/?enrolmentId=enr_one');
  assert.equal(view.gate2Href({ ...payment, gate2: { ...payment.gate2, action: { code: 'PAYMENT_ACTION_NEEDED' } } }), '/contact/?topic=learning-payment-review');
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

test('only Gate 1 through Gate 3 action codes are supported in V1', () => {
  assert.equal(view.isV1ActionCode('APPLICATION_RECEIVED'), true);
  assert.equal(view.isV1ActionCode('REFUND_PROCESSING'), true);
  assert.equal(view.isV1ActionCode('BALANCE_DUE'), true);
  assert.equal(view.isV1ActionCode('VIEW_COURSE_RESOURCES'), false);
  assert.equal(view.isGate2ActionCode('DEPOSIT_DUE'), true);
  assert.equal(view.isGate2ActionCode('REFUND_PROCESSING'), true);
  assert.equal(view.isGate2ActionCode('APPLICATION_RECEIVED'), false);
  assert.equal(view.isGate3ActionCode('BALANCE_DUE'), true);
  assert.equal(view.isGate3ActionCode('ACTIVE'), true);
  assert.equal(view.isGate3ActionCode('VIEW_COURSE_RESOURCES'), false);
});

test('Gate 3 links require an exact owned enrolment and bounded backend action', () => {
  const application = { offer: { enrolmentId: 'enr_one' }, gate3: { action: { code: 'PAY_BALANCE' } } };
  assert.equal(view.gate3Href(application), '/my-learning/balance/?enrolmentId=enr_one');
  assert.equal(view.gate3Href({ ...application, gate3: { action: { code: 'CONTACT_SUPPORT' } } }), '/contact/?topic=learning-payment-review');
  assert.equal(view.gate3Href({ ...application, gate3: { action: { code: 'NONE' } } }), null);
  assert.equal(view.gate3Href({ ...application, offer: { enrolmentId: '../admin' } }), null);
  assert.equal(view.gate3Href({ ...application, gate3: { action: { code: 'VIEW_COURSE_RESOURCES' } } }), null);
});

test('course hub links require active enrolment and an allow-listed local route', () => {
  const active = { gate3: { activationStatus: 'ACTIVE', courseHub: { eligible: true, href: '/my-learning/enr_one/' } } };
  assert.equal(view.courseHubHref(active), '/my-learning/enr_one/');
  assert.equal(view.courseHubHref({ gate3: { ...active.gate3, activationStatus: 'ELIGIBLE' } }), null);
  assert.equal(view.courseHubHref({ gate3: { ...active.gate3, courseHub: { eligible: true, href: 'https://teams.example/meeting' } } }), null);
  assert.equal(view.courseHubHref({ gate3: { ...active.gate3, courseHub: { eligible: true, href: '/my-learning/../admin/' } } }), null);
});

test('Gate 3 domain enums use bounded learner-friendly labels', () => {
  assert.equal(view.gate3StatusLabel('decision', 'POSTPONED'), 'Postponed');
  assert.equal(view.gate3StatusLabel('balance', 'OVERDUE_IN_GRACE'), 'Overdue within grace');
  assert.equal(view.gate3StatusLabel('activation', 'ACTIVE'), 'Active');
  assert.equal(view.gate3StatusLabel('joining', 'ELIGIBLE'), 'Available without course-resource links');
  assert.equal(view.gate3StatusLabel('balance', 'UNKNOWN'), 'Not available');
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
