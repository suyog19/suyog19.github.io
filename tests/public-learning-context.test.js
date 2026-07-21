const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const source = fs.readFileSync('js/public-learning-context.js', 'utf8');
const coursePages = [
  'python-foundations-for-data-science', 'applied-data-analysis-with-python',
  'practical-machine-learning-foundations', 'generative-ai-application-development',
  'engineering-reliable-ai-systems',
];

test('all canonical course pages load fail-safe authenticated context after public actions', () => {
  for (const slug of coursePages) {
    const html = fs.readFileSync(`training/${slug}/index.html`, 'utf8');
    assert.ok(html.indexOf('js/course-actions.js') < html.indexOf('js/public-learning-context.js'), slug);
    assert.match(html, /js\/learner-auth\.js/);
    assert.match(html, /js\/learner-summary\.js/);
  }
});

test('public context is opt-in, course-isolated, private-data-free, and fails back silently', () => {
  assert.match(source, /if \(!auth \|\| !view \|\| !page \|\| !auth\.token\(\)\) return/);
  assert.match(source, /course\.courseId === page\.dataset\.courseId/);
  assert.match(source, /catch \(_\) \{ \/\* Public content remains the complete fallback\. \*\//);
  assert.doesNotMatch(source, /verifiedEmail|applicationId|enrolmentId|amountDue|gtag|dataLayer/);
  assert.match(source, /Open your course area/);
  assert.match(source, /View your enrolment/);
});
