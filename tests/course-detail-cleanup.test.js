const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const courses = [
  ['python-foundations-for-data-science', 'Stage 1', 'crs_python_foundations'],
  ['applied-data-analysis-with-python', 'Stage 2', 'crs_applied_python'],
  ['practical-machine-learning-foundations', 'Stage 3', 'crs_ml_foundations'],
  ['generative-ai-application-development', 'Stage 4', 'crs_genai_apps'],
  ['engineering-reliable-ai-systems', 'Stage 5', 'crs_reliable_ai'],
];

function section(html, pattern, label) {
  const match = html.match(pattern);
  assert.ok(match, `${label} should be present`);
  return match[0];
}

for (const [slug, stage, courseId] of courses) {
  test(`${slug} uses the simplified shared course-detail structure`, () => {
    const html = fs.readFileSync(path.join(root, 'training', slug, 'index.html'), 'utf8');
    const subnav = section(html, /<nav class="learning-subnav"[\s\S]*?<\/nav>/, 'learning subnav');
    const breadcrumb = section(html, /<nav class="course-breadcrumb"[\s\S]*?<\/nav>/, 'breadcrumb');
    const finalAction = section(html, /<section class="course-final-action" data-final-cta>[\s\S]*?<\/section>/, 'final action');

    assert.match(html, /class="nav-link learning-header-action">My Learning<\/a>/);
    assert.doesNotMatch(subnav, />My Learning<\/a>/);

    assert.equal((breadcrumb.match(/<li/g) || []).length, 2);
    assert.match(breadcrumb, /<li><a href="\.\.\/">Learning journey<\/a><\/li>/);
    assert.match(breadcrumb, new RegExp(`<li aria-current="page">${stage}<\\/li>`));
    assert.doesNotMatch(breadcrumb, /course-detail-title/);
    assert.match(html, /<h1 class="course-detail-title">[^<]+<\/h1>/);

    assert.doesNotMatch(html, /Software Signal Learning · Stage/);
    assert.doesNotMatch(html, /Cohort capacity/);
    assert.doesNotMatch(html, /Start with the right foundation/);
    assert.doesNotMatch(html, /View course and apply/);

    assert.match(finalAction, /<h2>Interested in this course\?<\/h2>/);
    assert.equal((finalAction.match(/<a /g) || []).length, 1);
    assert.match(finalAction, /class="btn btn-primary btn-learning"/);
    assert.match(finalAction, new RegExp(`courseId=${courseId}(?:[&\"]|&amp;)`));
    assert.match(finalAction, /data-cta-location="final"/);
    assert.doesNotMatch(finalAction, /<p>/);
  });
}

test('shared lifecycle controller and styles govern every course action', () => {
  const controller = fs.readFileSync(path.join(root, 'js', 'course-actions.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'css', 'learning.css'), 'utf8');

  assert.match(controller, /primaryAction === 'APPLY'[\s\S]*?link\.textContent = 'Apply'/);
  assert.doesNotMatch(controller, /View course and apply/);
  assert.match(controller, /\[data-final-cta\] \[data-cta-location\]/);
  assert.match(controller, /else \{ link\.hidden = true; link\.removeAttribute\('href'\); \}/);

  assert.match(css, /\.course-enrolment-card \.btn,\.course-final-action \.btn \{[^}]*align-items: center;[^}]*display: inline-flex;[^}]*justify-content: center;[^}]*text-align: center;/);
  assert.match(css, /\.course-final-action \.container\{align-items:stretch;flex-direction:column\}/);
});
