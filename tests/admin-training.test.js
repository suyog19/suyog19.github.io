const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('js/admin-training.js', 'utf8'), context);
const tools = context.window.sjAdminTraining;

function validCohort() {
  return {
    courseId: 'crs_python', label: 'August cohort', timezone: 'Asia/Kolkata',
    capacity: '10', minimumSize: '5', tentativeStartAt: '2026-09-01',
    tentativeEndAt: '2026-09-30', registrationOpensAt: '2026-08-01',
    registrationClosesAt: '2026-08-31',
  };
}

test('cohort validation enforces backend numeric and date invariants', () => {
  assert.deepEqual(Object.keys(tools.validateCohort(validCohort())), []);
  assert.equal(tools.validateCohort({ ...validCohort(), minimumSize: '11' }).minimumSize, 'Minimum size cannot exceed capacity.');
  assert.equal(tools.validateCohort({ ...validCohort(), capacity: '1.5' }).capacity, 'Capacity must be a whole number of at least 1.');
  assert.equal(tools.validateCohort({ ...validCohort(), registrationClosesAt: '2026-07-01' }).registrationClosesAt, 'Registration must close after it opens.');
  assert.equal(tools.validateCohort({ ...validCohort(), tentativeEndAt: '2026-08-01' }).tentativeEndAt, 'Tentative end must be after tentative start.');
});

test('date-only cohort controls preserve inclusive day boundaries in ISO payloads', () => {
  const opening = new Date(tools.dateToIso('2026-08-01', false));
  const closing = new Date(tools.dateToIso('2026-08-01', true));
  assert.equal(opening.getHours(), 0);
  assert.equal(opening.getMinutes(), 0);
  assert.equal(closing.getHours(), 23);
  assert.equal(closing.getMinutes(), 59);
  assert.equal(closing.getSeconds(), 59);
  assert.equal(closing.getMilliseconds(), 999);
  assert.equal(tools.isoToDateInput(opening.toISOString()), '2026-08-01');
  assert.equal(tools.isoToDateInput(closing.toISOString()), '2026-08-01');
  assert.equal(tools.dateToIso('2026-02-30', false), null);
  assert.deepEqual(Object.keys(tools.validateCohort({
    ...validCohort(), tentativeStartAt: '2026-09-01', tentativeEndAt: '2026-09-01',
  })), []);
});

test('admin cohort editor uses date-only inputs', () => {
  const html = fs.readFileSync('admin/index.html', 'utf8');
  for (const id of ['admin-cohort-start', 'admin-cohort-end', 'admin-registration-open', 'admin-registration-close']) {
    assert.match(html, new RegExp('id="' + id + '" type="date"'));
  }
  assert.doesNotMatch(html, /type="datetime-local"/);
});

test('idempotency key is stable for an ambiguous retry and rotates on payload change', () => {
  let generated = 0;
  const tracker = tools.createIdempotencyTracker((scope) => scope + '-' + (++generated));
  const first = tracker.key('create', { label: 'A' });
  assert.equal(tracker.key('create', { label: 'A' }), first);
  assert.notEqual(tracker.key('create', { label: 'B' }), first);
  tracker.clear('create');
  assert.equal(tracker.key('create', { label: 'B' }), 'create-3');
  tracker.clearAll();
  assert.equal(tracker.key('create', { label: 'B' }), 'create-4');
});

test('shared admin idempotency keys are opaque, bounded, and backend-valid for long scopes', () => {
  let generated = 0;
  const tracker = tools.createIdempotencyTracker(() => tools.opaqueIdempotencyKey({
    randomUUID: () => `00000000-0000-4000-8000-${String(++generated).padStart(12, '0')}`,
  }));
  const scope = 'communication-resend:' + 'a'.repeat(36) + ':' + 'logical-key-'.repeat(7);
  const first = tracker.key(scope, { reason: 'Approved resend' });
  assert.ok(first.length > 0 && first.length <= 128);
  assert.match(first, /^[A-Za-z0-9._:-]+$/);
  assert.doesNotMatch(first, /communication|logical|Approved|a{20}/);
  assert.equal(tracker.key(scope, { reason: 'Approved resend' }), first);
  const changed = tracker.key(scope, { reason: 'Different reason' });
  assert.notEqual(changed, first);
  tracker.clear(scope);
  assert.notEqual(tracker.key(scope, { reason: 'Different reason' }), changed);
});

test('opaque key fallback remains bounded and valid without randomUUID', () => {
  const key = tools.opaqueIdempotencyKey(null, 1784639000000, 0.123456789);
  assert.equal(key, 'web-1784639000000-123456789');
  assert.ok(key.length <= 128);
  assert.match(key, /^[A-Za-z0-9._:-]+$/);
});

test('application resend header uses the bounded shared key contract', () => {
  const tracker = tools.createIdempotencyTracker(() => tools.opaqueIdempotencyKey({
    randomUUID: () => '12345678-1234-4123-8123-123456789abc',
  }));
  const headers = tools.idempotencyHeaders(
    tracker,
    'communication-resend:' + 'app_'.padEnd(121, 'x') + ':' + 'logical-key-'.repeat(12),
    { communicationKey: 'APPLICATION_RECEIVED:very-long-logical-key', reason: 'Confirmed by administrator' },
  );
  assert.deepEqual({ ...headers }, { 'Idempotency-Key': 'web-12345678-1234-4123-8123-123456789abc' });
  assert.ok(headers['Idempotency-Key'].length <= 128);
  assert.match(headers['Idempotency-Key'], /^[A-Za-z0-9._:-]+$/);
  const admin = fs.readFileSync('js/admin.js', 'utf8');
  assert.match(admin, /communications\/resend[\s\S]*headers: trainingTools\.idempotencyHeaders\(operationKeys, scope, body\)/);
});

test('tab keyboard navigation wraps and supports home/end', () => {
  assert.equal(tools.nextTabIndex(2, 'ArrowRight', 3), 0);
  assert.equal(tools.nextTabIndex(0, 'ArrowLeft', 3), 2);
  assert.equal(tools.nextTabIndex(1, 'Home', 3), 0);
  assert.equal(tools.nextTabIndex(1, 'End', 3), 2);
});

test('offers and resends fail closed on capacity and uncertain delivery', () => {
  assert.equal(tools.offerableCohort({
    courseId: 'course', lifecycle: 'OPEN', isFull: false, capacityRemaining: 1,
  }, 'course'), true);
  assert.equal(tools.offerableCohort({
    courseId: 'course', lifecycle: 'OPEN', isFull: true, capacityRemaining: 0,
  }, 'course'), false);
  assert.equal(tools.resendAllowed({ canResend: true, status: 'SENT', sk: 'APPLICATION_RECEIVED:key' }), true);
  assert.equal(tools.resendAllowed({ canResend: false, status: 'SENT', sk: 'key' }), false);
  assert.equal(tools.resendAllowed({ canResend: true, status: 'SENT', sk: 'key:RESEND:attempt' }), false);
});

test('detail and request guards preserve structured and session truth', () => {
  assert.equal(tools.detailValue({ reason: 'Reviewed', nested: { score: 2 } }), '{"reason":"Reviewed","nested":{"score":2}}');
  const expected = { applicationId: 'app-1', sessionToken: 'token-1', sequence: 4 };
  assert.equal(tools.requestStillCurrent({ ...expected }, expected), true);
  assert.equal(tools.requestStillCurrent({ ...expected, applicationId: 'app-2' }, expected), false);
  assert.equal(tools.requestStillCurrent({ ...expected, sessionToken: 'token-2' }, expected), false);
  assert.equal(tools.requestStillCurrent({ ...expected, sequence: 5 }, expected), false);
});

test('cohort command retries one transport failure', async () => {
  let attempts = 0;
  const result = await tools.requestWithTransportRetry(async () => {
    attempts += 1;
    if (attempts === 1) throw new TypeError('Failed to fetch');
    return { lifecycle: 'OPEN' };
  });

  assert.equal(attempts, 2);
  assert.equal(result.lifecycle, 'OPEN');
});

test('cohort command does not retry an HTTP response error', async () => {
  let attempts = 0;
  const responseError = Object.assign(new Error('Conflict'), { status: 409 });

  await assert.rejects(
    tools.requestWithTransportRetry(async () => {
      attempts += 1;
      throw responseError;
    }),
    responseError
  );
  assert.equal(attempts, 1);
});

test('cohort command explains a persistent transport failure', async () => {
  let attempts = 0;
  await assert.rejects(
    tools.requestWithTransportRetry(async () => {
      attempts += 1;
      throw new TypeError('Failed to fetch');
    }),
    (error) => error.body.message.includes('development API after retrying')
  );
  assert.equal(attempts, 2);
});
