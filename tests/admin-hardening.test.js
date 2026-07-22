const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('admin/index.html', 'utf8');
const shell = fs.readFileSync('js/admin.js', 'utf8');
const communications = fs.readFileSync('js/admin-communications.js', 'utf8');
const cohorts = fs.readFileSync('js/admin-cohorts.js', 'utf8');
const validation = fs.readFileSync('docs/issue-344-admin-ux-validation.md', 'utf8');

test('issue 344 keeps private admin activity out of indexing, referrers, URLs, and analytics', () => {
  assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(page, /<meta name="referrer" content="no-referrer">/);
  assert.doesNotMatch(page, /googletagmanager|gtag\s*\(|G-PKL56GJ38H/);
  const newModules = ['js/admin-learners.js', 'js/admin-cohorts.js', 'js/admin-today.js', 'js/admin-communications.js'].map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(newModules, /location\.(?:hash|search)|history\.(?:pushState|replaceState)|gtag\s*\(/);
});

test('issue 344 strengthens contextual focus, mobile navigation, and table semantics', () => {
  assert.match(page, /id="admin-section-title" tabindex="-1"/);
  assert.match(shell, /admin-section-title'\)\.focus\(\)/);
  assert.match(shell, /navigation\.classList\.remove\('is-open'\)/);
  assert.match(shell, /navToggle\.setAttribute\('aria-expanded', 'false'\)/);
  assert.match(cohorts, /node\('caption', 'Cohort learner roster'\)/);
  assert.match(communications, /node\('caption', 'Communication eligibility preview'\)/);
});

test('issue 344 stale communication confirmation fails closed and successful sends refresh context', () => {
  assert.match(communications, /COMMUNICATION_PREVIEW_STALE/);
  assert.match(communications, /preview = null; setFormEnabled\(false\)/);
  assert.match(communications, /failure\.status === 409 \|\| failure\.status === 412/);
  assert.match(shell, /refreshContext: \(\) => Promise\.allSettled/);
  for (const controller of ['sjAdminLearnersController', 'sjAdminCohortsController', 'sjAdminTodayController']) assert.match(shell, new RegExp(`window\\.${controller}\\.load\\(\\)`));
});

test('issue 344 emergency responsive rules remain scoped and preserve actionable controls', () => {
  const css = fs.readFileSync('css/pages.css', 'utf8');
  assert.match(css, /@media \(max-width: 480px\)/);
  assert.match(css, /\.admin-page \.admin-status-summary \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.admin-page \.admin-form-actions, \.admin-page \.admin-pagination \{ align-items: stretch; flex-direction: column; \}/);
  assert.match(css, /\.admin-page \.admin-table-scroll \{ overflow-x: auto; \}/);
});

test('issue 344 records complete traceability, scenario evidence, rollback, and honest deferrals', () => {
  for (const issue of ['#337', '#338', '#339', '#340', '#341', '#342', '#343', '#345', '#623', '#624', '#625', '#622', '#354']) assert.match(validation, new RegExp(issue.replace('#', '\\#')));
  for (const heading of ['Representative task scenarios', 'Accessibility and responsive evidence', 'Security and privacy evidence', 'Failure and concurrency matrix', 'Legacy migration and rollback']) assert.match(validation, new RegExp(heading));
  assert.match(validation, /Live keyboard, screen-reader, contrast, 400% zoom, and device screenshots are[\s\S]*deferred to #354/);
  assert.match(validation, /retaining backend PR #627/);
});
