const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const page = fs.readFileSync('admin/index.html', 'utf8');
const script = fs.readFileSync('js/admin-communications.js', 'utf8');
const learners = fs.readFileSync('js/admin-learners.js', 'utf8');
const cohorts = fs.readFileSync('js/admin-cohorts.js', 'utf8');
const shell = fs.readFileSync('js/admin.js', 'utf8');
const context = { window: {} };
vm.runInNewContext(script, context);
const responseTools = context.window.sjAdminCommunications;

test('issue 343 exposes business intent actions in learner and cohort context', () => {
  for (const intent of ['SEND_DEPOSIT_PAYMENT_LINK', 'REMIND_REMAINING_FEE', 'SEND_COHORT_UPDATE']) {
    assert.match(script, new RegExp(`'${intent}'`));
    assert.match(learners, new RegExp(`'${intent}'`));
    assert.match(cohorts, new RegExp(`'${intent}'`));
  }
  for (const label of ['Send deposit payment link', 'Remind about remaining fee', 'Send cohort update']) assert.match(learners + cohorts, new RegExp(label));
  assert.doesNotMatch(learners + cohorts, /logicalKey|paymentRequestId|templateVersion|eventFamily/);
});

test('issue 343 always obtains an authoritative preview before enabling execution', () => {
  assert.match(script, /\/admin\/training\/communication-intents\/preview/);
  assert.match(script, /setFormEnabled\(false\)/);
  assert.match(script, /data\.previewToken && !data\.nextCursor/);
  assert.match(script, /eligibleCount\) && data\.eligibleCount > 0/);
  assert.match(script, /This audience preview is incomplete and cannot be executed/);
  assert.match(script, /limit: 1000/);
});

test('issue 343 preview presents recipients, exclusions, canonical content, amounts and backend decision', () => {
  for (const field of ['enrolmentId', 'learnerId', 'eligible', 'decision', 'subject', 'purpose', 'amountDue', 'currency', 'deadline', 'linkDisposition', 'reason']) assert.match(script, new RegExp(`item\.${field}`));
  assert.match(script, /eligibleCount/);
  assert.match(script, /excludedCount/);
  assert.match(script, /exclusionReasons/);
  assert.match(script, /REPLACE_EXPIRED: 'Create and send a current payment link'/);
  assert.doesNotMatch(script, /contenteditable|document\.execCommand|logicalKey|paymentRequestId|paymentUrl/);
});

test('issue 343 execution echoes the preview token with reason, evidence, and stable idempotency', () => {
  assert.match(page, /id="admin-communication-reason"[^>]*maxlength="500"[^>]*required/);
  assert.match(page, /id="admin-communication-evidence"[^>]*maxlength="200"[^>]*required/);
  assert.match(page, /id="admin-communication-confirm" type="checkbox" required/);
  assert.match(script, /previewToken: preview\.previewToken, reason: reasonInput\.value\.trim\(\), evidenceReference: evidenceInput\.value\.trim\(\)/);
  assert.match(script, /\/admin\/training\/communication-intents\/execute/);
  assert.match(script, /'Idempotency-Key': config\.idempotencyKey\('communication-intent', body\)/);
  assert.match(shell, /operationKeys\.key\(scope, body\)/);
});

test('issue 343 handles stale and per-recipient partial outcomes without changing domain truth', () => {
  assert.match(script, /COMMUNICATION_PREVIEW_STALE/);
  for (const field of ['acceptedCount', 'skippedCount', 'excludedCount', 'outcomes']) assert.match(script, new RegExp(`data\.${field}`));
  assert.match(script, /Communication delivery does not change payment, enrolment, refund, cohort, or activation status/);
  assert.match(script, /Per-recipient delivery outcomes/);
  assert.match(shell, /sjAdminCommunicationsController\.clear\(\)/);
});

test('issue 343 dialog is accessible, safely rendered, and responsive', () => {
  assert.match(page, /id="admin-communication-dialog" aria-labelledby="admin-communication-title"/);
  assert.match(page, /id="admin-communication-preview" aria-live="polite"/);
  assert.match(page, /id="admin-communication-error" role="alert"/);
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|outerHTML/);
  assert.match(fs.readFileSync('css/pages.css', 'utf8'), /\.admin-page \.admin-communication-dialog \{ width: min\(72rem/);
});

test('issue 472 unwraps valid authoritative preview and execution envelopes', () => {
  const preview = {
    intent: 'SEND_DEPOSIT_PAYMENT_LINK', scope: 'INDIVIDUAL', eligibleCount: 1, excludedCount: 0,
    items: [{ enrolmentId: 'enrolment_1', eligible: true }], nextCursor: null, previewToken: 'a'.repeat(64),
  };
  const execution = {
    intent: 'SEND_DEPOSIT_PAYMENT_LINK', scope: 'INDIVIDUAL', acceptedCount: 1, skippedCount: 0,
    excludedCount: 0, outcomes: [{ enrolmentId: 'enrolment_1', status: 'ACCEPTED' }],
  };
  assert.equal(responseTools.previewFromResponse({ preview }), preview);
  assert.equal(responseTools.executionFromResponse({ execution }), execution);
  assert.match(script, /renderPreview\(authoritativePreview\)/);
  assert.match(script, /renderOutcome\(authoritativeExecution\)/);
});

test('issue 472 rejects missing and malformed response envelopes without rendering undefined', () => {
  const validPreview = {
    intent: 'SEND_DEPOSIT_PAYMENT_LINK', scope: 'INDIVIDUAL', eligibleCount: 1, excludedCount: 0,
    items: [], nextCursor: null, previewToken: 'b'.repeat(64),
  };
  for (const data of [null, {}, { preview: null }, { preview: [] }, { preview: { ...validPreview, eligibleCount: undefined } }, { preview: { ...validPreview, previewToken: 'invalid' } }]) {
    assert.equal(responseTools.previewFromResponse(data), null);
  }
  for (const data of [null, {}, { execution: null }, { execution: [] }, { execution: { acceptedCount: 1 } }]) {
    assert.equal(responseTools.executionFromResponse(data), null);
  }
  assert.match(script, /invalid communication preview\. No communication was sent/);
  assert.match(script, /delivery response could not be verified\. Delivery may have been accepted/);
  assert.match(script, /preview = null;\s*setFormEnabled\(false\)/);
});

test('issue 472 preserves envelope evidence until a valid execution is verified', () => {
  const invalidExecutionBranch = script.slice(script.indexOf('if (!authoritativeExecution)'), script.indexOf('renderOutcome(authoritativeExecution)'));
  assert.doesNotMatch(invalidExecutionBranch, /clearIdempotency/);
  assert.doesNotMatch(invalidExecutionBranch, /setStatus\([^)]*success/);
  assert.match(script, /renderOutcome\(authoritativeExecution\); config\.clearIdempotency\('communication-intent'\)/);
});
