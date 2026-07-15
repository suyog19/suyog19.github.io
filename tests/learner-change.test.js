const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const page = fs.readFileSync('my-learning/change/index.html', 'utf8');
const script = fs.readFileSync('js/learner-change.js', 'utf8');
const auth = fs.readFileSync('js/learner-auth.js', 'utf8');

test('change journey is private, non-indexed and excludes learner ids from analytics', () => {
  assert.match(page, /name="robots" content="noindex, nofollow"/);
  assert.match(page, /http-equiv="Cache-Control" content="no-store"/);
  assert.match(page, /page_path:'\/my-learning\/change\/'/);
  assert.doesNotMatch(page, /enrolmentId=/);
  assert.match(auth, /'\/my-learning\/change\/'/);
});

test('request input is bounded and acknowledgement describes non-promissory review', () => {
  assert.match(page, /minlength="3" maxlength="1000"[^>]*required/);
  assert.match(page, /does not promise or calculate a refund, credit or transfer/);
  assert.match(page, /organiser's decision and any payment-provider refund are separate stages/);
  assert.doesNotMatch(page, /name="amount"|name="currency"|name="refundAmount"/);
});

test('client submits only the two approved owner routes with idempotency', () => {
  assert.match(script, /kind\.toLowerCase\(\) \+ '-requests'/);
  assert.match(script, /'Idempotency-Key': envelope\.key/);
  assert.match(script, /policyAcknowledgement:/);
  assert.match(script, /requestedOutcome: outcome/);
  assert.doesNotMatch(script, /amountMinorUnits|providerPaymentReference|creditAmount/);
});

test('status copy separates request, decision and refund execution truth', () => {
  assert.match(script, /\['Your request is under review'/);
  assert.match(script, /\['Request approved'/);
  assert.match(script, /\['Your request was not approved'/);
  assert.match(script, /\['Refund being processed'/);
  assert.match(script, /\['Refund complete'/);
  assert.match(script, /\['Refund needs attention'/);
  assert.match(script, /Refund processing is a separate stage/);
  assert.match(script, /This place is already closed or transferred/);
  assert.match(script, /notification could not be confirmed[\s\S]*status shown here are unchanged/);
});

test('ambiguous submission reconciles authoritative truth before same-key retry', () => {
  assert.match(script, /recovery\.isAmbiguous\(error\.status\)/);
  assert.match(script, /requiresReconciliation = true;[\s\S]*await initialise\(\)/);
  assert.match(script, /if \(requiresReconciliation \|\| envelope\)[\s\S]*await initialise\(\)/);
  assert.match(script, /same request key will be reused/);
});
