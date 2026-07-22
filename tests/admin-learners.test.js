const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('admin/index.html', 'utf8');
const script = fs.readFileSync('js/admin-learners.js', 'utf8');
const shell = fs.readFileSync('js/admin.js', 'utf8');

test('issue 339 provides bounded private learner search and filters', () => {
  assert.match(page, /id="admin-learner-search" role="search"/);
  assert.match(page, /id="admin-learner-query"[^>]*maxlength="160"[^>]*autocomplete="off"/);
  assert.match(page, /Search stays in this private session and is never added to the page URL/);
  assert.match(script, /URLSearchParams\(\{ limit: '25' \}\)/);
  assert.match(script, /value\.length === 1/);
  assert.match(script, /350/);
  assert.doesNotMatch(script, /location\.(?:hash|search)|history\.(?:pushState|replaceState)|gtag\s*\(/);
});

test('issue 339 consumes only the authoritative learner projection and explicit cursor paging', () => {
  assert.match(script, /\/admin\/training\/learners\?/);
  assert.match(script, /params\.set\('cursor', cursor\)/);
  assert.match(script, /more\.addEventListener\('click', \(\) => load\(\{ append: true \}\)\)/);
  assert.doesNotMatch(script, /\/applications|\/payments|Promise\.all/);
  assert.match(script, /Array\.isArray\(data\.items\)/);
});

test('issue 339 renders learner data safely and opens an opaque learner context', () => {
  assert.match(script, /element\.textContent = value \|\| ''/);
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|outerHTML/);
  assert.match(script, /\^\[A-Za-z0-9_-\]\{1,160\}\$/);
  assert.match(script, /admin:learner-selected/);
  assert.match(script, /detail: \{ learnerId: selectedId \}/);
  assert.match(shell, /view === 'learners'.*sjAdminLearnersController\.load/);
  assert.match(shell, /sjAdminLearnersController\.clear\(\)/);
});

test('issue 339 exposes accessible loading, empty, pagination, and refresh states', () => {
  assert.match(page, /id="admin-learners-meta" aria-live="polite"/);
  assert.match(page, /id="admin-learners-list" aria-live="polite"/);
  assert.match(script, /setAttribute\('aria-busy', 'true'\)/);
  assert.match(script, /No learners match this search/);
  assert.match(page, /id="admin-learners-more"[^>]*hidden/);
  assert.match(page, /id="admin-refresh-learners"/);
});
