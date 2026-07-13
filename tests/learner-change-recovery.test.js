const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}
const context = { window: {}, Date, JSON, Number, Error };
vm.runInNewContext(fs.readFileSync('js/learner-change-recovery.js', 'utf8'), context);
const recovery = context.window.sjLearnerChangeRecovery;
const payload = { category: 'Personal circumstances', requestedOutcome: 'CANCEL', explanation: 'Changed schedule', policyAcknowledgement: { documentId: 'software-signal-cancellation-development-policy', version: 'DEV-G2-CANCELLATION-v1' } };

test('network and HTTP 5xx outcomes are ambiguous while client errors are definitive', () => {
  assert.equal(recovery.isAmbiguous(0), true);
  assert.equal(recovery.isAmbiguous(500), true);
  assert.equal(recovery.isAmbiguous(503), true);
  assert.equal(recovery.isAmbiguous(409), false);
});

test('uncertain command preserves its exact payload and key despite edited form data', () => {
  const storage = memoryStorage();
  const crypto = { randomUUID: () => 'fixed-key' };
  const first = recovery.create(storage, crypto, 'enr_one', 'CANCELLATION', payload);
  const edited = { ...payload, category: 'Other circumstances', explanation: 'Edited after uncertainty' };
  const retry = recovery.create(storage, crypto, 'enr_one', 'CANCELLATION', edited);
  assert.equal(JSON.stringify(retry), JSON.stringify(first));
  assert.equal(retry.payload.category, 'Personal circumstances');
  assert.equal(retry.payload.explanation, 'Changed schedule');
  assert.equal(retry.key, 'web_fixed-key');
});

test('unavailable reconciliation retains command until authoritative success or definitive failure', () => {
  const storage = memoryStorage();
  recovery.create(storage, { randomUUID: () => 'retry-key' }, 'enr_one', 'CANCELLATION', payload);
  assert.ok(recovery.read(storage, 'enr_one'));
  recovery.clear(storage, 'enr_one');
  assert.equal(recovery.read(storage, 'enr_one'), null);
});

test('tampered persisted commands fail closed', () => {
  const storage = memoryStorage();
  storage.setItem(recovery.storageKey('enr_one'), JSON.stringify({ kind: 'REFUND', key: 'web_bad', payload: { amountMinorUnits: 1 } }));
  assert.equal(recovery.read(storage, 'enr_one'), null);
});
