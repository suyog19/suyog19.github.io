const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('admin/index.html', 'utf8');
const script = fs.readFileSync('js/admin-communications.js', 'utf8');
const learners = fs.readFileSync('js/admin-learners.js', 'utf8');
const cohorts = fs.readFileSync('js/admin-cohorts.js', 'utf8');
const shell = fs.readFileSync('js/admin.js', 'utf8');

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
