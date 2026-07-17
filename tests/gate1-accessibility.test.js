const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const entryPoints = [
  'training/index.html',
  'training/python-foundations-for-data-science/index.html',
  'training/applied-data-analysis-with-python/index.html',
  'learn/index.html',
  'my-learning/index.html',
  'apply/index.html',
  'admin/index.html',
];

test('Gate 1 eyebrow text keeps full muted-color contrast', () => {
  const css = fs.readFileSync('css/pages.css', 'utf8');
  assert.match(
    css,
    /\.training-hero \.eyebrow,\s*\.learner-page \.eyebrow,\s*\.admin-page \.eyebrow\s*{\s*opacity:\s*1;\s*}/,
  );
});

test('Gate 1 brand links derive accessible names from visible text', () => {
  for (const file of entryPoints) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /class="brand-lockup"[^>]*aria-label=/, file);
    assert.match(html, /class="brand-text">suyogjoshi\.com<\/span>/, file);
  }
});
