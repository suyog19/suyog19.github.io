const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync('js/course-actions.js', 'utf8');
const context = { location: { hostname: 'unknown.invalid' }, document: { querySelector: () => null, querySelectorAll: () => [] }, window: {}, Intl, Date, encodeURIComponent };
vm.runInNewContext(source, context);
const view = context.window.sjCourseActions;
const identity = { courseId: 'crs_python_foundations', slug: 'python-foundations-for-data-science', publicStatus: 'APPLICATIONS_OPEN', primaryAction: 'APPLY' };
const cohort = { label: 'October 2026', tentativeStartAt: '2026-10-03T12:30:00Z', tentativeEndAt: '2026-11-22T12:30:00Z', timezone: 'Asia/Kolkata', minimumSize: 10, capacity: 15, capacityRemaining: 4, registrationOpen: true };

test('runtime action mapping stays learner-facing', () => {
  assert.equal(view.detailView(identity, []).title, 'Applications open for an upcoming cohort');
  assert.equal(view.detailView({ ...identity, primaryAction: 'GET_NOTIFIED' }, []).title, 'Applications opening later');
  assert.equal(view.detailView({ ...identity, primaryAction: 'REGISTER_INTEREST' }, []).title, 'Course planned for a later stage');
  assert.equal(view.detailView({ ...identity, primaryAction: 'NONE' }, []).title, 'No cohort currently accepting applications');
});

test('published cohort replaces planning assumptions and full state disables apply', () => {
  assert.equal(view.detailView(identity, [cohort]).title, 'Applications open for the October 2026 cohort');
  const full = view.detailView(identity, [{ ...cohort, capacityRemaining: 0 }]);
  assert.equal(full.title, 'Current cohort is full');
  assert.equal(full.action.primaryAction, 'NONE');
});

test('malformed cohort data is rejected and capacity stays backend-owned', () => {
  assert.equal(view.validCohort({ ...cohort, capacity: 5 }), false);
  assert.equal(view.validCohort({ ...cohort, tentativeStartAt: 'not-a-date' }), false);
  for (const slug of ['python-foundations-for-data-science', 'applied-data-analysis-with-python']) {
    const html = fs.readFileSync(`training/${slug}/index.html`, 'utf8');
    assert.match(html, /data-cohort-window/);
    assert.match(html, /data-cohort-schedule/);
    assert.match(html, /data-cohort-size/);
  }
});

test('static fallback keeps transactional actions closed until runtime authorization', () => {
  for (const slug of ['python-foundations-for-data-science', 'applied-data-analysis-with-python']) {
    const html = fs.readFileSync(`training/${slug}/index.html`, 'utf8');
    const actions = html.match(/<a[^>]+(?:apply\/\?courseId|register-interest\/\?courseId)[^>]*>/g) || [];
    assert.ok(actions.length >= 4);
    assert.ok(actions.every((action) => /\shidden(?:\s|>)/.test(action)));
    assert.match(html, /<noscript>/);
  }
});
