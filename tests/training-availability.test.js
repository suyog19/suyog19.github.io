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
  const closedAction = { hidden: false };
  const root = {
    dataset: { courseId: 'crs_python_foundations', courseSlug: 'python-foundations-ai-data' },
    querySelector(selector) {
      if (selector.includes('status')) return status;
      return selector.includes('closed-action') ? closedAction : action;
    },
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
  return { action, calls, closedAction, controller: context.window.sjTrainingAvailability, status };
}

test('published course with an open cohort exposes the dev application action', async () => {
  const page = harness('dev.suyogjoshi.com', [
    response({ course: { courseId: 'crs_python_foundations', publicationStatus: 'PUBLISHED' } }),
    response({ items: [{ courseId: 'crs_python_foundations', availability: 'OPEN' }] }),
  ]);
  await page.controller.initialise();
  assert.equal(page.action.hidden, false);
  assert.equal(page.closedAction.hidden, true);
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
    assert.equal(page.closedAction.hidden, false);
    assert.notEqual(page.status.textContent, 'Applications open for review');
  }
});

test('production uses only the production API while unknown hosts remain closed', async () => {
  const production = harness('suyogjoshi.com', [
    response({ course: { courseId: 'crs_python_foundations', publicationStatus: 'PUBLISHED' } }),
    response({ items: [{ courseId: 'crs_python_foundations', availability: 'OPEN' }] }),
  ]);
  await production.controller.initialise();
  assert.equal(production.calls.length, 2);
  assert.equal(production.calls.every((url) => url.startsWith('https://api.suyogjoshi.com/')), true);
  assert.equal(production.action.hidden, false);

  const unknown = harness('untrusted.example', []);
  await unknown.controller.initialise();
  assert.equal(unknown.calls.length, 0);
  assert.equal(unknown.action.hidden, true);
  assert.equal(unknown.status.textContent, '');
});

test('public availability distinguishes open, waitlist, full, and closed without inference', () => {
  const { controller } = harness();
  const present = (items) => JSON.parse(JSON.stringify(controller.availabilityPresentation(items, 'crs_one')));
  assert.deepEqual(present([{ courseId: 'crs_one', availability: 'OPEN' }]), { open: true, message: 'Applications open for review' });
  assert.deepEqual(present([{ courseId: 'crs_one', availability: 'WAITLIST_ONLY' }]), { open: false, message: 'Waitlist applications only. A seat is not currently available.' });
  assert.deepEqual(present([{ courseId: 'crs_one', availability: 'FULL' }]), { open: false, message: 'This cohort is full. Compare the other course or contact support about future availability.' });
  assert.deepEqual(present([]), { open: false, message: 'Applications are currently closed' });
});
