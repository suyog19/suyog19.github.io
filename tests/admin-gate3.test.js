const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync('js/admin-gate3.js', 'utf8');
const page = fs.readFileSync('admin/index.html', 'utf8');
const context = { window: {}, Date, Number, Set };
vm.runInNewContext(script, context);
const tools = context.window.sjAdminGate3;
const productionPolicyVersions = [
  'software-signal-terms@1.1.0',
  'software-signal-privacy@1.1.0',
  'software-signal-cancellation-refund@1.1.0',
  'software-signal-course-delivery@1.1.0',
  'software-signal-recording-consent@1.1.0',
  'software-signal-conduct-confidentiality@1.1.0',
  'software-signal-support-grievance@1.1.0',
  'software-signal-transfer@1.1.0',
];

function form(values) { return { get: (name) => values[name] == null ? null : values[name] }; }

test('Cohort decisions uses a separate accessible noindex admin section and preserves existing areas', () => {
  for (const label of ['Contact messages', 'Feedback', 'Courses &amp; cohorts', 'Payments &amp; learner requests', 'Cohort decisions']) assert.match(page, new RegExp('>' + label + '<'));
  assert.match(page, /id="admin-gate3-tab"[^>]*role="tab"[^>]*aria-controls="admin-gate3-panel"/);
  assert.match(page, /id="admin-gate3-panel"[^>]*role="tabpanel"[^>]*aria-labelledby="admin-gate3-tab"/);
  assert.match(page, /noindex, nofollow/);
  assert.match(page, /admin-gate3\.js/);
});

test('decision commands are enabled only by exact backend allowlist', () => {
  const summary = { allowedCommands: ['CONFIRM', 'CANCEL'] };
  assert.equal(tools.allowed(summary, 'CONFIRM'), true);
  assert.equal(tools.allowed(summary, 'POSTPONE'), false);
  assert.equal(tools.allowed({ allowedCommands: ['DELETE'] }, 'DELETE'), false);
  assert.equal(tools.allowed(null, 'CONFIRM'), false);
});

test('confirmation payload uses exact versions and approved bounded policy enums', () => {
  const values = {
    confirmation: 'on', reason: 'Threshold and evidence reviewed', evidenceReference: 'dev-evidence',
    timezone: 'Asia/Kolkata', startsAt: '2099-02-01T04:30:00Z', endsAt: '2099-02-01T06:30:00Z', scheduleVersion: 'development-v1',
    balanceDeadline: '2099-01-20T18:29:59Z', graceUntil: '2099-01-25T18:29:59Z', policyId: 'development-policy', policyVersion: 'development-v1',
    extensionRulesVersion: 'development-v1', creditWaiverRulesVersion: 'development-v1', depositApplicationRule: 'APPLY_NET_PAID_TO_COURSE_FEE', depositDispositionRule: 'ACTION_NEEDED', depositDispositionPolicyVersion: 'development-v1', nonPaymentClosurePolicyVersion: 'development-v1',
  };
  const payload = tools.confirmationPayload(form(values), { cohortVersion: 7, decisionSequence: 2 });
  assert.equal(payload.expectedCohortVersion, 7);
  assert.equal(payload.expectedDecisionSequence, 2);
  assert.equal(payload.confirmation, true);
  assert.equal(payload.finalSchedule.timezone, 'Asia/Kolkata');
  assert.equal(payload.policy.approvalStatus, 'APPROVED_FOR_DEVELOPMENT');
  assert.equal(payload.policy.depositDispositionRule, 'ACTION_NEEDED');
  assert.deepEqual(Array.from(payload.policy.commercialDocumentVersions), []);
  assert.equal(payload.policy.balanceDeadline, '2099-01-20T18:29:59.000Z');
  assert.equal(payload.policy.graceUntil, '2099-01-25T18:29:59.000Z');
  assert.equal('amountDue' in payload, false);
  assert.equal('eligibleCount' in payload, false);
});

test('production confirmation uses only production approval and contract identifiers', () => {
  const defaults = tools.contract('production');
  assert.equal(defaults.approvalStatus, 'APPROVED_FOR_PRODUCTION');
  assert.equal(Object.values(defaults).some((value) => /development|test/i.test(value)), false);
  const values = {
    confirmation: 'on', reason: 'Production evidence reviewed', evidenceReference: 'prod-evidence',
    timezone: 'Asia/Kolkata', startsAt: '2099-02-01T04:30:00Z', endsAt: '2099-02-01T06:30:00Z',
    balanceDeadline: '2099-01-20T18:29:59Z', graceUntil: '2099-01-25T18:29:59Z',
    depositApplicationRule: 'APPLY_NET_PAID_TO_COURSE_FEE', depositDispositionRule: 'ACTION_NEEDED',
    ...defaults,
  };
  const payload = tools.confirmationPayload(form(values), { cohortVersion: 7, decisionSequence: 0 }, 'production');
  assert.equal(payload.policy.approvalStatus, 'APPROVED_FOR_PRODUCTION');
  assert.equal(payload.policy.policyVersion, 'PROD-G3-BALANCE-v1');
  assert.equal(payload.finalSchedule.scheduleVersion, 'PROD-G3-SCHEDULE-v1');
  assert.deepEqual(Array.from(payload.policy.commercialDocumentVersions), productionPolicyVersions);
  assert.equal(new Set(payload.policy.commercialDocumentVersions).size, 8);
  assert.equal('balanceDeadline' in payload.policy, false);
  assert.equal('graceUntil' in payload.policy, false);
  assert.equal(JSON.stringify(payload).includes('development'), false);
});

test('production commercial policy set rejects empty, missing, reordered, duplicate, or extra identifiers', () => {
  const actual = Array.from(tools.contract('production').commercialDocumentVersions);
  assert.deepEqual(actual, productionPolicyVersions);
  assert.equal(tools.validProductionCommercialDocumentVersions(actual), true);
  for (const invalid of [[], actual.slice(0, 7), actual.slice().reverse(), [...actual, 'extra@1.0.0'], [...actual.slice(0, 7), actual[0]]]) {
    assert.equal(tools.validProductionCommercialDocumentVersions(invalid), false);
  }
  assert.match(script, /server records the authoritative confirmation time/);
  assert.match(script, /sets the balance deadline seven days later/);
  assert.match(script, /applies zero grace/);
});

test('cohort decision identifiers and source avoid unsafe rendering or learner-resource links', () => {
  assert.equal(tools.safeId('coh_one-2'), 'coh_one-2');
  assert.equal(tools.safeId('../admin'), null);
  assert.doesNotMatch(script, /innerHTML|Teams|OneDrive|GitHub learner|VIEW_COURSE_RESOURCES/);
  assert.match(script, /textContent/);
  assert.doesNotMatch(page, /Gate 4|provider resource link/);
});

test('authorization failure clears private state and only stale commands reload authority', () => {
  assert.match(script, /error\.status === 401 \|\| error\.status === 403/);
  assert.match(script, /config\.clearSession/);
  assert.equal(tools.shouldReloadAfterCommand({ status: 409 }), true);
  assert.equal(tools.shouldReloadAfterCommand({ status: 412 }), true);
  assert.equal(tools.shouldReloadAfterCommand({ status: 503, body: { error: 'GATE3_DISABLED' } }), false);
  assert.equal(tools.shouldReloadAfterCommand({ status: 400 }), false);
  assert.match(script, /if \(shouldReloadAfterCommand\(error\)\) await load\(true\); fail\(error\)/);
  assert.match(script, /'Idempotency-Key'/);
  assert.match(script, /expectedCohortVersion/);
  assert.match(script, /expectedDecisionSequence/);
});

test('an in-flight response cannot repopulate private Gate 3 state after session clear', async () => {
  class Element {
    constructor() { this.children = []; this.dataset = {}; this.listeners = {}; this.textContent = ''; }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
  }
  const elements = {
    'admin-gate3-cohorts': new Element(),
    'admin-gate3-detail': new Element(),
    'admin-refresh-gate3': new Element(),
  };
  const guardedContext = {
    window: {}, Date, Number, Set,
    document: {
      createElement: () => new Element(),
      getElementById: (id) => elements[id],
    },
  };
  vm.runInNewContext(script, guardedContext);
  let resolveCourses;
  let sessionActive = true;
  let followupRequests = 0;
  const controller = guardedContext.window.sjAdminGate3.create({
    sessionActive: () => sessionActive,
    request: (path) => {
      if (path === '/admin/training/courses') return new Promise((resolve) => { resolveCourses = resolve; });
      followupRequests += 1;
      return Promise.resolve({ items: [] });
    },
    clearSession: () => {}, setStatus: () => {}, friendlyError: String,
  });
  const pending = controller.load();
  sessionActive = false;
  controller.clear();
  resolveCourses({ items: [{ courseId: 'private-course', title: 'Private course' }] });
  await pending;
  assert.equal(followupRequests, 0);
  assert.equal(elements['admin-gate3-cohorts'].children.length, 0);
  assert.equal(elements['admin-gate3-detail'].children.length, 1);
  assert.equal(elements['admin-gate3-detail'].children[0].textContent, 'Select a cohort to review.');
});
