const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('issue 338 admin shell exposes task-oriented navigation and compact session context', () => {
  const html = read('admin/index.html');
  for (const view of ['today', 'learners', 'cohorts', 'courses', 'applications', 'payments', 'cohort-decisions', 'interest-requests', 'messages', 'feedback']) {
    assert.match(html, new RegExp(`data-admin-view="${view}"`));
  }
  assert.match(html, />Daily work</);
  assert.match(html, />Inbox</);
  assert.match(html, />Legacy operations</);
  assert.match(html, /temporary legacy area|Temporary access/i);
  assert.match(html, />Sign out</);
  assert.match(html, /id="admin-environment"/);
  assert.doesNotMatch(html, /Manual admin access|Messages and feedback|Read-only operational view/);
});

test('issue 338 keeps every existing operational destination reachable during migration', () => {
  const html = read('admin/index.html');
  const js = read('js/admin.js');
  for (const destination of ['courses', 'applications', 'payments', 'cohort-decisions', 'interest-requests', 'messages', 'feedback']) {
    assert.match(html, new RegExp(`data-admin-view="${destination}"`));
    assert.match(js, new RegExp(`['"]${destination}['"]`));
  }
  assert.match(js, /location\.hash \|\| '#today'/);
  assert.match(js, /view === 'overview'\) view = 'today'/);
});

test('issue 338 provides shared accessible workspace presentation patterns', () => {
  const css = read('css/pages.css');
  for (const pattern of ['admin-status-summary', 'admin-next-action', 'admin-exception-banner', 'admin-timeline', 'admin-roster', 'admin-technical-details']) {
    assert.match(css, new RegExp(`\\.admin-page \\.${pattern}`));
  }
  assert.match(css, /\.admin-page \.admin-tab:focus-visible/);
  assert.match(read('admin/index.html'), /id="admin-status" role="status" aria-live="polite"/);
});

test('admin actions use the shared dialog and avoid browser prompts and confirms', () => {
  const sources = ['js/admin.js', 'js/admin-course-interests.js'].map(read).join('\n');
  assert.match(read('admin/index.html'), /<dialog class="admin-dialog"/);
  assert.match(read('js/admin-ui.js'), /showModal\(\)/);
  assert.doesNotMatch(sources, /(?:window\.)?prompt\s*\(|(?:window\.)?confirm\s*\(/);
});

test('friendly labels, currency formatting, and technical disclosures are shared admin utilities', () => {
  const ui = read('js/admin-ui.js');
  assert.match(ui, /UNDER_REVIEW: 'In review'/);
  assert.match(ui, /Intl\.NumberFormat\('en-IN'/);
  assert.match(ui, /admin-technical-details/);
  assert.doesNotMatch(read('js/admin-payments.js').split('\n').slice(0, 8).join('\n'), /minor units/);
});

test('representative non-admin pages remain isolated from admin assets and roots', () => {
  const pages = [
    'index.html', 'writing/index.html', 'writing/ai-code-review-is-not-just-code-review/index.html',
    'learn/index.html', 'training/python-foundations-ai-data/index.html',
    'my-learning/index.html', 'apply/index.html', 'my-learning/payment/index.html', 'contact/index.html'
  ].filter((file) => fs.existsSync(path.join(root, file)));
  assert.ok(pages.length >= 6, 'representative public and learner pages should exist');
  for (const page of pages) {
    const html = read(page);
    assert.doesNotMatch(html, /admin-(?:ui|payments|gate3|course-interests)\.js|class="admin-page"|id="admin-navigation"/, page);
  }
});

test('new presentation CSS is scoped to the admin page root', () => {
  const css = read('css/pages.css');
  const start = css.indexOf('/* Administration workspace');
  const block = css.slice(start, css.indexOf('/* End issue 293', start)).replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = block.split('\n').map((line) => line.trim()).filter((line) => line.endsWith('{') && !line.startsWith('@'));
  for (const selector of selectors) {
    const cleaned = selector.slice(0, -1).trim();
    if (cleaned.startsWith('from') || cleaned.startsWith('to')) continue;
    for (const part of cleaned.split(',')) assert.match(part.trim(), /^\.admin-page\b/, part);
  }
});

test('admin login layout stays single-column and only the SJ mark gets badge styling', () => {
  const html = read('admin/index.html');
  const css = read('css/pages.css');
  assert.match(html, /class="admin-brand-mark" aria-hidden="true">SJ<\/span>/);
  assert.match(html, /class="brand-text">suyogjoshi\.com<\/span>/);
  assert.match(css, /\.admin-page \.admin-login-panel \{ display: block;/);
  assert.match(css, /\.admin-page \.admin-brand-mark \{/);
  assert.doesNotMatch(css.slice(css.indexOf('/* Administration workspace'), css.indexOf('/* End issue 293')), /\.admin-page \.admin-brand span \{/);
});
