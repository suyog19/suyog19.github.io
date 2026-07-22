const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('admin/index.html', 'utf8');
const script = fs.readFileSync('js/admin-cohorts.js', 'utf8');
const shell = fs.readFileSync('js/admin.js', 'utf8');

test('issue 341 exposes an operational cohort directory with bounded filters', () => {
  assert.match(page, /id="admin-cohort-search" role="search"/);
  assert.match(page, /id="admin-cohort-query"[^>]*maxlength="160"[^>]*autocomplete="off"/);
  for (const decision of ['PENDING', 'CONFIRMED', 'POSTPONED', 'CANCELLED']) assert.match(page, new RegExp(`value="${decision}"`));
  assert.match(script, /URLSearchParams\(\{ limit: '25' \}\)/);
  assert.match(script, /\/admin\/training\/operations\/cohorts\?/);
  assert.doesNotMatch(script, /\/admin\/training\/(?:payments|applications)|Promise\.all/);
});

test('issue 341 displays backend-authoritative configuration and operational health separately', () => {
  for (const field of ['lifecycleStatus', 'decisionState', 'minimumSize', 'capacity', 'counts.reserved', 'counts.active', 'actionableCounts.payment', 'actionableCounts.communication', 'actionableCounts.refund', 'attentionReason', 'nextImportantAt']) {
    const parts = field.split('.');
    assert.match(script, new RegExp(parts[parts.length - 1]));
  }
  assert.doesNotMatch(script, /thresholdReached\s*=|reserved\s*[+\-*/]|capacity\s*[-+]/);
  assert.match(script, /Not available/);
});

test('issue 341 uses explicit opaque cursor paging and safe selection context', () => {
  assert.match(script, /params\(append \? nextCursor : ''\)/);
  assert.match(script, /more\.addEventListener\('click', \(\) => load\(\{ append: true \}\)\)/);
  assert.match(script, /\^\[A-Za-z0-9_-\]\{1,160\}\$/);
  assert.match(script, /admin:cohort-workspace-selected/);
  assert.doesNotMatch(script, /location\.(?:hash|search)|history\.(?:pushState|replaceState)|innerHTML/);
});

test('issue 341 handles loading, empty, projection-limit, session, refresh, and responsive states', () => {
  assert.match(page, /id="admin-cohorts-meta" aria-live="polite"/);
  assert.match(script, /setAttribute\('aria-busy', 'true'\)/);
  assert.match(script, /error\.status === 503/);
  assert.match(script, /error\.status === 401 \|\| error\.status === 403/);
  assert.match(page, /id="admin-refresh-cohorts"/);
  assert.match(fs.readFileSync('css/pages.css', 'utf8'), /#admin-cohort-search \{ grid-template-columns: 1fr; \}/);
  assert.match(shell, /sjAdminCohortsController\.load/);
  assert.match(shell, /sjAdminCohortsController\.clear/);
});
