const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync('js/admin-payments.js', 'utf8');
const page = fs.readFileSync('admin/index.html', 'utf8');
const context = { window: { sjAdminUi: { money: (value, currency) => Number.isSafeInteger(value) && value >= 0 && /^[A-Z]{3}$/.test(currency || '') ? new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value / 100) : 'Not available' } }, Number };
vm.runInNewContext(script, context);
const tools = context.window.sjAdminPayments;

test('payments uses a separate accessible section without replacing existing views', () => {
  assert.match(page, />Contact messages</);
  assert.match(page, />Feedback</);
  assert.match(page, />Courses &amp; cohorts</);
  assert.match(page, /id="admin-payments-tab"[\s\S]*role="tab"/);
  assert.match(page, /id="admin-payments-panel"[\s\S]*role="tabpanel"/);
  assert.match(page, /noindex, nofollow/);
});

test('balance operations remain available in Payments & learner requests', () => {
  assert.match(page, /Payments &amp; learner requests/);
  for (const label of ['Balance deadline', 'Grace until', 'Current extension', 'Deposit treatment', 'Balance adjustment history']) assert.match(script, new RegExp(label));
  for (const action of ['balance-request', 'balance-adjustment', 'balance-lifecycle', 'RECORD_CREDIT_OR_WAIVER', 'EXTEND_DEADLINE', 'MARK_OVERDUE', 'CLOSE_NON_PAYMENT']) assert.match(script, new RegExp(action));
  assert.match(script, /obligation\.purpose === 'BALANCE'/);
  assert.match(script, /expectedObligationVersion/);
  assert.match(script, /\.\.\.common\(form\)/);
  assert.doesNotMatch(script, /Date\.now\(\).*OVERDUE|new Date\(\).*CLOSE_NON_PAYMENT/);
});

test('identifiers and financial display fail closed without calculation', () => {
  assert.equal(tools.safeId('obl_abc-123'), 'obl_abc-123');
  assert.equal(tools.safeId('../admin'), null);
  assert.equal(tools.safeId('x'.repeat(161)), null);
  assert.match(tools.money(1250, 'INR'), /₹\s?12\.50/);
  assert.equal(tools.money(12.5, 'INR'), 'Not available');
  assert.equal(tools.money(1250, 'inr'), 'Not available');
});

test('commands use only approved Gate 2 admin routes and concurrency fields', () => {
  for (const route of [
    '/admin/training/payment-requests/', '/replace', '/disable',
    '/admin/training/transfer-requests/',
    '/decide', '/apply', '/refunds', '/retry', '/reconcile', '/communications/resend',
  ]) assert.match(script, new RegExp(route.replaceAll('/', '\\/')));
  assert.match(script, /item\.requestType\.toLowerCase\(\) \+ '-requests\/'/);
  assert.match(script, /expectedObligationVersion/);
  assert.match(script, /expectedRequestVersion/);
  assert.match(script, /expectedDecisionVersion/);
  assert.match(script, /expectedSourceEnrolmentVersion/);
  assert.match(script, /expectedTargetCohortVersion/);
  assert.match(script, /'Idempotency-Key'/);
});

test('consequential commands require confirmation, reason and evidence', () => {
  assert.match(script, /name: 'reason'/);
  assert.match(script, /name: 'evidenceReference'/);
  assert.match(script, /I understand the consequence and want to continue/);
  assert.match(script, /confirmation: form\.get\('confirmation'\) === 'on'/);
  assert.doesNotMatch(script, /innerHTML|safeUrl|Authorization|balanceAmount|remainingFee/);
});

test('financial and lifecycle evidence stays separated in the detail view', () => {
  for (const label of ['Unallocated capture', 'Refundable', 'Provider status', 'Settlement', 'Learner change requests', 'Organiser decisions', 'Provider refunds', 'Communication attempts']) {
    assert.match(script, new RegExp(label));
  }
  assert.match(script, /ALLOCATE_VERIFIED_CAPTURE/);
  assert.match(script, /backend-controlled verified capture allocation/);
  assert.match(script, /technicalDetails/);
});

test('authorization failure clears existing private controller state through the admin shell', () => {
  assert.match(script, /error\.status === 401 \|\| error\.status === 403/);
  assert.match(script, /config\.clearSession\('Your admin session is no longer authorized/);
  const admin = fs.readFileSync('js/admin.js', 'utf8');
  assert.match(admin, /clearSession: \(message\) => clearSession\(message\)/);
  assert.match(admin, /sjAdminPaymentsController\.clear\(\)/);
});

test('forms consume only backend-projected command eligibility and refund limits', () => {
  assert.match(script, /current\.availableCommands/);
  assert.match(script, /current\.replacementModes/);
  assert.match(script, /data\.refundOptions/);
  assert.match(script, /max: String\(option\.maximumAmountMinorUnits\)/);
  assert.match(script, /option\.reasonCode/);
  assert.match(script, /option\.decisionIds/);
  assert.match(script, /allocationCommandAvailable === true/);
  assert.match(script, /item\.isFull === false/);
  assert.match(script, /Number\(item\.capacityRemaining\) > 0/);
});

test('refund modes emit only backend-projected exact full or bounded partial amounts', () => {
  const option = { allowedModes: ['FULL', 'PARTIAL_EXCEPTION'], maximumAmountMinorUnits: 5000, fullAmountMinorUnits: 5000 };
  assert.deepEqual({ ...tools.refundModeConfig(option, 'FULL') }, { amountMinorUnits: 5000, editable: false });
  assert.deepEqual({ ...tools.refundModeConfig(option, 'PARTIAL_EXCEPTION') }, { amountMinorUnits: null, editable: true });
  assert.equal(tools.refundModeConfig({ ...option, fullAmountMinorUnits: 4999, maximumAmountMinorUnits: 4000 }, 'FULL'), null);
  assert.equal(tools.refundModeConfig({ ...option, allowedModes: ['FULL'] }, 'PARTIAL_EXCEPTION'), null);
  assert.match(script, /modeConfig\.editable \? Number\(form\.get\('amountMinorUnits'\)\) : modeConfig\.amountMinorUnits/);
  assert.match(script, /readOnly: true/);
});

test('application and deposit resends remain bound to their separate authoritative endpoints', () => {
  const admin = fs.readFileSync('js/admin.js', 'utf8');
  assert.match(admin, /applications\/' \+ encodeURIComponent\(state\.selectedApplicationId\) \+ '\/communications\/resend'/);
  assert.match(script, /enrolments\/' \+ encodeURIComponent\(obligation\.enrolmentId\) \+ '\/communications\/resend'/);
  assert.doesNotMatch(admin, /applications\/[\s\S]{0,100}DEPOSIT_REQUEST/);
  assert.doesNotMatch(script, /applications\/' \+ encodeURIComponent/);
});

test('payment resend identity, eligibility, and application handoff stay authoritative', () => {
  const admin = fs.readFileSync('js/admin.js', 'utf8');
  assert.match(script, /filter\(\(item\) => window\.sjAdminTraining\.resendAllowed\(item\)\)/);
  assert.match(script, /communicationPresentation\(item/);
  assert.match(script, /openForEnrolment/);
  assert.match(script, /if \(loading\) return loadPromise/);
  assert.match(script, /item\.enrolmentId === id && item\.purpose === 'DEPOSIT'/);
  assert.match(admin, /state\.selectedEnrolment && state\.selectedEnrolment\.enrolmentId/);
  assert.match(admin, /Open deposit communication/);
  assert.match(admin, /sjAdminPaymentsController\.openForEnrolment/);
  assert.doesNotMatch(admin, /paymentUrl|providerPaymentReference/);
});

test('resend confirmation exposes purpose, subject, payment-link truth, and immutable warning', () => {
  const admin = fs.readFileSync('js/admin.js', 'utf8');
  for (const phrase of ['Expected subject:', 'Payment link:', 'immutable original content will be resent and cannot be edited']) {
    assert.match(admin + script, new RegExp(phrase));
  }
  assert.match(admin, /presentation\.actionLabel/);
  assert.match(script, /presentation\.actionLabel/);
});
