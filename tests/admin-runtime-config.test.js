const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync('js/admin-runtime-config.js', 'utf8');
const admin = fs.readFileSync('js/admin.js', 'utf8');
const page = fs.readFileSync('admin/index.html', 'utf8');
const css = fs.readFileSync('css/pages.css', 'utf8');
const context = { window: {}, Number };
vm.runInNewContext(script, context);
const tools = context.window.sjAdminRuntimeConfig;

test('configuration is a dedicated authenticated admin destination', () => {
  assert.match(page, /data-admin-view="configuration"/);
  assert.match(page, /id="admin-configuration-panel"[\s\S]*role="tabpanel"/);
  assert.match(page, /admin-runtime-config\.js/);
  assert.match(admin, /sjAdminRuntimeConfigController = window\.sjAdminRuntimeConfig\.create/);
  assert.match(admin, /sessionActive: \(\) => Boolean\(state\.token\)/);
  assert.match(admin, /sjAdminRuntimeConfigController\.clear\(\)/);
});

test('closed catalogue contains exactly the seven supported Boolean controls', () => {
  const keys = [
    'training.applications.enabled',
    'training.course_interest.capture_enabled',
    'training.gate1.email_delivery_enabled',
    'training.payments.enabled',
    'training.gate2.email_delivery_enabled',
    'training.gate3.cohort_enabled',
    'training.gate3.email_delivery_enabled',
  ];
  keys.forEach((key) => assert.ok(tools.definitionFor(key), key));
  assert.equal(tools.definitionFor('AWS_SECRET_ACCESS_KEY'), null);
  assert.equal(tools.definitionFor('arbitrary.environment.variable'), null);
  assert.match(script, /incoming\.length !== Object\.keys\(definitions\)\.length/);
});

test('configuration envelopes fail closed on unknown types, stages, and versions', () => {
  const valid = {
    key: 'training.applications.enabled',
    value: false,
    valueType: 'BOOLEAN',
    version: 1,
    environment: 'dev',
  };
  assert.equal(tools.validConfiguration(valid), true);
  assert.equal(tools.validConfiguration({ ...valid, value: 'false' }), false);
  assert.equal(tools.validConfiguration({ ...valid, valueType: 'STRING' }), false);
  assert.equal(tools.validConfiguration({ ...valid, version: 0 }), false);
  assert.equal(tools.validConfiguration({ ...valid, environment: 'staging' }), false);
  assert.equal(tools.validConfiguration({ ...valid, key: 'unknown' }), false);
});

test('writes validate first and use optimistic concurrency with a closed reason', () => {
  assert.match(script, /\/validate'/);
  assert.match(script, /method: 'POST', body: JSON\.stringify\(\{ value: proposedValue \}\)/);
  assert.match(script, /method: 'PATCH'/);
  assert.match(script, /expectedVersion: item\.version/);
  assert.match(script, /name: 'reason'/);
  assert.match(script, /PLANNED_CHANGE/);
  assert.match(script, /EMERGENCY_DISABLEMENT/);
  assert.doesNotMatch(script, /localStorage|sessionStorage|Authorization|Bearer/);
});

test('production mutations show explicit before and after confirmation', () => {
  assert.match(script, /Production change/);
  assert.match(script, /Before:/);
  assert.match(script, /After:/);
  assert.match(script, /Confirm enable/);
  assert.match(script, /Confirm disable/);
  assert.match(script, /if \(!confirmed\) return/);
});

test('history is audit-only and restore creates a new witnessed change', () => {
  assert.match(script, /\/history\?limit=100/);
  assert.match(script, /actorId/);
  assert.match(script, /occurredAt/);
  assert.match(script, /reasonCode/);
  assert.match(script, /\/restore'/);
  assert.match(script, /historyVersion/);
  assert.match(script, /reason: 'RESTORE_PRIOR_VALUE'/);
  assert.match(script, /history will not be rewritten/);
});

test('dependency, stale-version, authentication and retry states are actionable', () => {
  assert.match(script, /correctiveAction/);
  assert.match(script, /error\.status === 409 \|\| error\.status === 412/);
  assert.match(script, /error\.status === 401 \|\| error\.status === 403/);
  assert.match(script, /Current values were reloaded/);
  assert.match(page, /id="admin-refresh-configuration"/);
  assert.match(page, /role="alert"/);
});

test('responsive and accessible configuration presentation is scoped', () => {
  assert.match(css, /\.admin-configuration-grid/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(page, /aria-labelledby="admin-configuration-tab"/);
  assert.match(page, /aria-live="polite"/);
  assert.match(script, /toggle\.type = 'button'/);
  assert.match(script, /restore\.type = 'button'/);
  assert.match(script, /details\.className = 'admin-configuration-history'/);
  assert.equal(tools.changeLabel(false, true), 'Disabled → Enabled');
});
