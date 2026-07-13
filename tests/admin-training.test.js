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
    capacity: '10', minimumSize: '5', tentativeStartAt: '2026-09-01T10:00',
    tentativeEndAt: '2026-09-30T10:00', registrationOpensAt: '2026-08-01T10:00',
    registrationClosesAt: '2026-08-31T10:00',
  };
}

test('cohort validation enforces backend numeric and date invariants', () => {
  assert.deepEqual(Object.keys(tools.validateCohort(validCohort())), []);
  assert.equal(tools.validateCohort({ ...validCohort(), minimumSize: '11' }).minimumSize, 'Minimum size cannot exceed capacity.');
  assert.equal(tools.validateCohort({ ...validCohort(), capacity: '1.5' }).capacity, 'Capacity must be a whole number of at least 1.');
  assert.equal(tools.validateCohort({ ...validCohort(), registrationClosesAt: '2026-07-01T10:00' }).registrationClosesAt, 'Registration must close after it opens.');
  assert.equal(tools.validateCohort({ ...validCohort(), tentativeEndAt: '2026-08-01T10:00' }).tentativeEndAt, 'Tentative end must be after tentative start.');
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

test('tab keyboard navigation wraps and supports home/end', () => {
  assert.equal(tools.nextTabIndex(2, 'ArrowRight', 3), 0);
  assert.equal(tools.nextTabIndex(0, 'ArrowLeft', 3), 2);
  assert.equal(tools.nextTabIndex(1, 'Home', 3), 0);
  assert.equal(tools.nextTabIndex(1, 'End', 3), 2);
});
