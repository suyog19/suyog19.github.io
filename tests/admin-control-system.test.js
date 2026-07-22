const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('css/pages.css', 'utf8');
const page = fs.readFileSync('admin/index.html', 'utf8');

test('issue 365 gives every text-like admin control one scoped size contract', () => {
  assert.match(css, /\.admin-page input:not\(\[type="hidden"\]\):not\(\[type="checkbox"\]\):not\(\[type="radio"\]\), \.admin-page select, \.admin-page textarea \{[^}]*min-height: 2\.875rem;[^}]*font-size: 1rem;[^}]*padding: \.7rem \.85rem;/);
  assert.match(css, /\.admin-page input[^\n]+:focus, \.admin-page select:focus, \.admin-page textarea:focus \{/);
  assert.match(css, /\.admin-page textarea \{ min-height: 7rem;/);
  assert.doesNotMatch(css, /\.admin-page input:not\(\[type="hidden"\]\)(?!:not\(\[type="checkbox"\]\))/);
});

test('issue 365 normalizes admin action height and prevents header wrapping', () => {
  assert.match(css, /\.admin-page \.btn \{[^}]*display: inline-flex;[^}]*min-height: 2\.875rem;[^}]*white-space: nowrap;/);
  assert.match(css, /\.admin-page \.admin-section-header > \.btn, \.admin-page \.admin-view-toolbar > \.btn \{ flex: 0 0 auto; \}/);
  assert.match(css, /\.admin-page \.admin-form-actions \{ align-items: center; \}/);
});

test('issue 365 covers legacy filter forms and narrow layouts consistently', () => {
  assert.match(css, /\.admin-page \.admin-filter-form \{ display: flex; flex-wrap: wrap;[^}]*align-items: flex-end;/);
  assert.match(css, /\.admin-page \.admin-filter-form > label \{[^}]*flex: 1 1 12rem;/);
  assert.match(css, /@media \(max-width: 480px\)[\s\S]*\.admin-page \.admin-filter-form > label, \.admin-page \.admin-filter-form > \.btn \{ width: 100%; flex-basis: 100%; \}/);
  for (const view of ['today', 'learners', 'cohorts', 'courses', 'messages', 'feedback', 'interest-requests', 'course-setup', 'applications', 'payments', 'cohort-decisions']) {
    assert.match(page, new RegExp(`data-admin-view="${view}"`));
  }
});
