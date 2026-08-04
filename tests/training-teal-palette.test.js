const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const css = fs.readFileSync('css/learning.css', 'utf8');

function declaration(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(match, `missing ${selector}`);
  return match[1];
}

function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => parseInt(value, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

test('course planning and application callouts reuse shared teal tokens', () => {
  assert.match(declaration('.course-section--decision'), /var\(--learning-accent-soft\)/);
  assert.match(declaration('.course-certainty'), /background:\s*var\(--learning-accent-soft\)/);
  assert.match(declaration('.course-certainty'), /border:[^;]*var\(--learning-accent\)/);
  assert.match(declaration('.course-certainty'), /color:\s*var\(--learning-accent-strong\)/);
  assert.match(declaration('.course-certainty-key'), /var\(--learning-accent\)/);
  assert.match(declaration('.application-practical-summary'), /var\(--learning-accent-soft\)/);
  assert.match(declaration('.application-practical-summary'), /var\(--learning-border\)/);
});

test('shared planning components contain no orange or amber literals', () => {
  const scoped = [
    '.course-section--decision',
    '.course-certainty',
    '.course-certainty-key',
    '.application-practical-summary',
  ].map(declaration).join('\n');
  assert.doesNotMatch(scoped, /#(?:fff7ed|ffedd5|fdba74|c2410c)|orange|amber|yellow/i);
});

test('teal certainty text has WCAG AA contrast on the soft surface', () => {
  assert.ok(contrast('#115e59', '#f0fdfa') >= 4.5);
});

test('certainty meaning remains explicit without colour', () => {
  for (const slug of ['python-foundations-for-data-science', 'applied-data-analysis-with-python']) {
    const html = fs.readFileSync(`training/${slug}/index.html`, 'utf8');
    for (const label of ['Confirmed', 'Currently planned', 'Confirmed before payment']) {
      assert.match(html, new RegExp(`>${label}<|<strong>${label}</strong>`, 'i'));
    }
  }
});
