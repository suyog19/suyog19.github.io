const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.resolve(__dirname, '../js/training-availability.js'), 'utf8');

function response(body, ok = true, status = ok ? 200 : 500) {
  return { ok, status, async json() { return body; } };
}

function harness(hostname, replies) {
  const status = { textContent: '' };
  const action = { hidden: true };
  const root = {
    dataset: { courseId: 'crs_python_foundations', courseSlug: 'python-foundations-ai-data' },
    querySelector(selector) { return selector.includes('status') ? status : action; },
  };
  const calls = [];
  const context = {
    document: { querySelector() { return root; } },
    window: { __SJ_DISABLE_AUTO_INIT__: true, location: { hostname } },
    fetch: async (url) => { calls.push(url); return replies[calls.length - 1]; },
    Promise, encodeURIComponent,
  };
  vm.runInNewContext(fs.readFileSync('js/training-release.js', 'utf8'), context);
  vm.runInNewContext(script, context);
  return { action, calls, controller: context.window.sjTrainingAvailability, status };
}

test('published course with an open cohort exposes the dev application action', async () => {
  const page = harness('dev.suyogjoshi.com', [
    response({ course: { courseId: 'crs_python_foundations', publicationStatus: 'PUBLISHED' } }),
    response({ items: [{ courseId: 'crs_python_foundations', availability: 'OPEN' }] }),
  ]);
  await page.controller.initialise();
  assert.equal(page.action.hidden, false);
  assert.equal(page.status.textContent, 'Applications open for review');
  assert.equal(page.calls.length, 2);
});

test('unpublished, closed, and failed responses remain unavailable', async () => {
  for (const replies of [
    [response({}, false, 404), response({}, false, 404)],
    [response({ course: { courseId: 'crs_python_foundations', publicationStatus: 'PUBLISHED' } }), response({ items: [] })],
    [response({}, false), response({}, false)],
  ]) {
    const page = harness('dev.suyogjoshi.com', replies);
    await page.controller.initialise();
    assert.equal(page.action.hidden, true);
    assert.notEqual(page.status.textContent, 'Applications open for review');
  }
});

test('production and unknown hosts never call the dev API or expose applications', async () => {
  for (const hostname of ['suyogjoshi.com', 'www.suyogjoshi.com', 'untrusted.example']) {
    const page = harness(hostname, []);
    await page.controller.initialise();
    assert.equal(page.calls.length, 0);
    assert.equal(page.action.hidden, true);
    assert.equal(page.status.textContent, '');
  }
});

test('public availability distinguishes open, waitlist, full, and closed without inference', () => {
  const { controller } = harness();
  const present = (items) => JSON.parse(JSON.stringify(controller.availabilityPresentation(items, 'crs_one')));
  assert.deepEqual(present([{ courseId: 'crs_one', availability: 'OPEN' }]), { open: true, message: 'Applications open for review' });
  assert.deepEqual(present([{ courseId: 'crs_one', availability: 'WAITLIST_ONLY' }]), { open: false, message: 'Waitlist applications only. A seat is not currently available.' });
  assert.deepEqual(present([{ courseId: 'crs_one', availability: 'FULL' }]), { open: false, message: 'This cohort is full. Compare the other course or contact support about future availability.' });
  assert.deepEqual(present([]), { open: false, message: 'Applications are currently closed' });
});
