const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('admin/index.html', 'utf8');
const source = fs.readFileSync('js/admin.js', 'utf8');
const css = fs.readFileSync('css/pages.css', 'utf8');

test('issue 359 exposes Courses as a first-class admin destination', () => {
  assert.match(page, /data-admin-view="courses"[^>]*id="admin-courses-tab"[^>]*aria-controls="admin-courses-panel"[^>]*>Courses</);
  assert.match(page, /id="admin-courses-panel"[^>]*role="tabpanel"[^>]*aria-labelledby="admin-courses-tab"/);
  assert.doesNotMatch(page, />Courses &amp; cohorts</);
});

test('course details reuse the existing admin course-list contract', () => {
  assert.match(source, /adminGet\('\/admin\/training\/courses'\)/);
  assert.match(source, /function renderCourseDirectory\(\)/);
  assert.match(source, /function renderCourseDetails\(\)/);
  assert.match(source, /data\.courseDetailId|courseDetailId:/);
  assert.doesNotMatch(source, /\/admin\/training\/courses\/['"]? \+ encodeURIComponent\([^)]*selectedCourse/);
});

test('course detail workspace presents operational, commercial, provider, and record fields', () => {
  for (const label of ['Course identity', 'Commercial details', 'Provider', 'Technical record details']) {
    assert.match(source, new RegExp(label));
  }
  for (const field of ['feeAmountPaise', 'depositAmountPaise', 'minimumCohortSize', 'publicationStatus', 'disclosureVersion', 'updatedAt']) {
    assert.match(source, new RegExp(`course\\.${field}`));
  }
  assert.match(source, /trainingCourseVersion: String\(course\.version\)/);
});

test('course directory and detail workspace follow responsive admin split-view patterns', () => {
  assert.match(css, /\.admin-page \.admin-course-split \{[^}]*grid-template-columns:/);
  assert.match(css, /@media \(max-width: 800px\)[\s\S]*\.admin-page \.admin-course-split \{ grid-template-columns: 1fr; \}/);
  assert.match(source, /setAttribute\('aria-current', String\(course\.courseId === state\.selectedCourseId\)\)/);
  assert.match(source, /setAttribute\('aria-live', 'polite'\)/);
});

test('issue 362 separates focused course review from legacy course and cohort setup', () => {
  assert.match(page, /data-admin-view="course-setup"[^>]*id="admin-course-setup-tab"[^>]*aria-controls="admin-course-setup-panel"/);
  assert.match(source, /setupPanel\.append\(legacyCourses, cohortEditor, legacyCohorts\)/);
  assert.match(source, /courses: \['Courses', 'Review course information/);
  assert.match(source, /'course-setup': \['Course & cohort setup'/);
  assert.match(source, /els\.courseSetupPanel\.hidden = view !== 'course-setup'/);
});

test('issue 362 removes competing controls and de-emphasises technical metadata', () => {
  assert.match(source, /els\.globalSearch\.hidden = view === 'courses' \|\| view === 'course-setup'/);
  assert.match(source, /technical\.className = 'admin-technical-details admin-course-record'/);
  assert.match(source, /Technical record details/);
  assert.match(source, /admin-course-actions/);
  assert.doesNotMatch(source, /detailSection\('Record details'/);
});
