const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const css = fs.readFileSync('css/learning.css', 'utf8');
const pageCss = fs.readFileSync('css/pages.css', 'utf8');

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

test('learning maps its scoped roles to the main website palette', () => {
  const root = declaration('.software-signal-learning');
  assert.match(root, /--learning-accent:\s*var\(--color-signal\)/);
  assert.match(root, /--learning-accent-strong:\s*var\(--color-signal\)/);
  assert.match(root, /--learning-accent-soft:\s*var\(--color-signal-wash\)/);
  assert.match(root, /--learning-border:\s*var\(--color-border\)/);
});

test('course planning and application callouts reuse shared palette roles', () => {
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

test('Petrol Teal certainty text has WCAG AA contrast on the pale brand wash', () => {
  assert.ok(contrast('#174646', '#f1f6f5') >= 4.5);
});

test('active Learning styles contain no retired teal palette literals', () => {
  assert.doesNotMatch(
    `${css}\n${pageCss}`,
    /#(?:0f766e|115e59|f0fdfa|99d5cf|0b4f4a|ccfbf1)|rgba\(15\s*,\s*(?:118|76)\s*,\s*(?:110|71)/i,
  );
});

test('certainty meaning remains explicit without colour', () => {
  for (const slug of ['python-foundations-for-data-science', 'applied-data-analysis-with-python']) {
    const html = fs.readFileSync(`training/${slug}/index.html`, 'utf8');
    for (const label of ['Confirmed', 'Currently planned', 'Confirmed before payment']) {
      assert.match(html, new RegExp(`>${label}<|<strong>${label}</strong>`, 'i'));
    }
  }
});
