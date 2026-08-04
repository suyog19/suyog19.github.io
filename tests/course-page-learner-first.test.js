const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const read = (path) => fs.readFileSync(path, 'utf8');
const launched = [
  'python-foundations-for-data-science',
  'applied-data-analysis-with-python',
];

test('launched pages put practical decisions before fit and curriculum', () => {
  for (const slug of launched) {
    const html = read(`training/${slug}/index.html`);
    const positions = ['id="participation"', 'id="application-process"', 'id="fit"', 'id="outcome"', 'id="learning-format"', 'id="support-feedback"', 'id="curriculum"', 'id="instructor"', 'id="fees"', 'id="faq"'].map((marker) => html.indexOf(marker));
    assert.ok(positions.every((position) => position >= 0));
    assert.deepEqual([...positions].sort((a, b) => a - b), positions);
    for (const label of ['Confirmed', 'Currently planned', 'Confirmed before payment']) assert.match(html, new RegExp(label, 'i'));
    for (const hook of ['training_course_participation_plan_view', 'training_course_application_process_view', 'training_course_support_feedback_view']) assert.match(html, new RegExp(hook));
  }
});

test('Python Foundations answers the agreed learner decision questions', () => {
  const html = read('training/python-foundations-for-data-science/index.html');
  for (const phrase of ['October–November 2026', '2–3 hours', 'Hindi or Marathi', 'within two business days', 'within seven business days', '90 days after the final regular session', '75% attendance', 'no coding test', 'exact project may vary by cohort', 'GitHub is not required', 'screen sharing is voluntary', 'remaining balance is not requested before cohort confirmation']) assert.match(html, new RegExp(phrase, 'i'));
  assert.doesNotMatch(html.match(/<meta[^>]+>|<script type="application\/ld\+json">[\s\S]*?<\/script>/g).join(' '), /personal data analyser/i);
});

test('new decision layouts stack at tablet and mobile widths', () => {
  const css = read('css/learning.css');
  assert.match(css, /@media\(max-width:900px\)/);
  assert.match(css, /\.course-decision-grid[^}]*grid-template-columns:1fr/);
  assert.match(css, /course-certainty-key/);
});
