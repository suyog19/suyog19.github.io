const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('admin/index.html', 'utf8');
const script = fs.readFileSync('js/admin-today.js', 'utf8');
const shell = fs.readFileSync('js/admin.js', 'utf8');

test('issue 345 replaces module overview counts with the authoritative Today queue', () => {
  assert.match(page, /id="admin-overview" aria-live="polite"/);
  assert.match(script, /\/admin\/training\/operations\/today\?/);
  assert.match(shell, /if \(window\.sjAdminTodayController\) return;/);
  assert.match(shell, /view === 'today'.*sjAdminTodayController\.load/);
  assert.doesNotMatch(script, /\/admin\/training\/(?:applications|payments|operations\/cohorts)|Promise\.all/);
});

test('issue 345 renders backend priority order, explanation, deadline, and projected action without calculation', () => {
  for (const field of ['item.kind', 'item.subject', 'item.explanation', 'item.deadline', 'item.nextAction.code', 'item.nextAction.label']) assert.ok(script.includes(field));
  assert.doesNotMatch(script, /\.sort\(|priority\s*[<>=]|deadline\s*[<>=]|Date\.now\(\).*deadline/);
  assert.match(script, /Due ['"]? \+ window\.sjAdminUi\.date\(item\.deadline\)/);
  assert.match(script, /ACTIONS\.has\(item\.nextAction\.code\)/);
});

test('issue 345 groups outcomes and opens exact learner or cohort context', () => {
  for (const kind of ['APPLICATION', 'PAYMENT', 'REFUND', 'COMMUNICATION', 'COHORT']) assert.match(script, new RegExp(`'${kind}'`));
  assert.match(script, /groups = new Map\(\)/);
  assert.match(script, /sjAdminLearnersController\.select/);
  assert.match(script, /sjAdminCohortsController\.select/);
  assert.match(script, /Learner · ['"]? \+ context\.learner_id/);
  assert.match(script, /Cohort · ['"]? \+ context\.cohort_id/);
});

test('issue 345 supports authoritative refresh, cursor paging, empty and safe failure states', () => {
  assert.match(script, /URLSearchParams\(\{ limit: '25' \}\)/);
  assert.match(script, /params\.set\('cursor', nextCursor\)/);
  assert.match(page, /id="admin-today-more"[^>]*hidden/);
  assert.match(script, /Nothing currently needs operational attention/);
  assert.match(script, /error\.status === 503/);
  assert.match(script, /error\.status === 401 \|\| error\.status === 403/);
  assert.match(script, /Last refreshed/);
  assert.match(shell, /state\.activeView === 'today'.*sjAdminTodayController\.load/);
});

test('issue 345 uses accessible live, loading, and responsive queue presentation', () => {
  const css = fs.readFileSync('css/pages.css', 'utf8');
  assert.match(page, /id="admin-today-meta" aria-live="polite"/);
  assert.match(script, /setAttribute\('aria-busy', 'true'\)/);
  assert.match(css, /\.admin-page \.admin-today-items \{ display: grid; grid-template-columns: repeat\(auto-fit, minmax\(15rem, 1fr\)\)/);
  assert.doesNotMatch(script, /innerHTML|insertAdjacentHTML|location\.(?:hash|search)|gtag\s*\(/);
});

test('issue 469 routes Today work by action semantics instead of supporting learner context', () => {
  assert.match(script, /REVIEW_APPLICATION: 'applications'/);
  assert.match(script, /REVIEW_PAYMENT: 'payments'/);
  assert.match(script, /REVIEW_REFUND: 'payments'/);
  assert.match(script, /REVIEW_COMMUNICATION: 'payments'/);
  assert.match(script, /const view = ACTION_VIEWS\[action\]/);
  assert.doesNotMatch(script, /if \(learnerId\) return \{ view: 'learners'/);
});

test('issue 469 opens the exact application from the authoritative Today item identifier', () => {
  assert.match(script, /item\.id\.startsWith\('application:'\)/);
  assert.match(script, /button\.dataset\.todayApplication = target\.applicationId/);
  assert.match(script, /sjAdminApplicationsController\.open\(action\.dataset\.todayApplication \|\| ''\)/);
  assert.match(shell, /window\.sjAdminApplicationsController = \{ open: openApplication \}/);
  assert.match(shell, /state\.selectedApplicationId = applicationId/);
});

test('issue 469 safely falls back to Applications and focuses successfully loaded detail', () => {
  assert.match(script, /action\.dataset\.todayAction === 'REVIEW_APPLICATION'/);
  assert.match(script, /sjAdminApplicationsController\.open\(action\.dataset\.todayApplication \|\| ''\)/);
  assert.doesNotMatch(script, /dataset\.todayApplication = item\.id/);
  assert.match(shell, /state\.selectedApplicationId = ''/);
  assert.match(shell, /application reference from Today is unavailable/);
  assert.match(shell, /pendingApplicationFocusId === applicationId/);
  assert.match(shell, /els\.applicationDetail\.focus\(\)/);
  assert.match(shell, /if \(state\.trainingCourses\.length\) loadApplicationDetail\(applicationId\)/);
});
