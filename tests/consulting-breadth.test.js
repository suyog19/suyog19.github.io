const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('consulting/index.html', 'utf8');
const css = fs.readFileSync('css/consulting.css', 'utf8');

test('Consulting presents two packaged launch offers as useful but non-exhaustive starting points', () => {
  assert.equal((html.match(/class="consulting-offer-card"/g) || []).length, 2);
  assert.match(html, /two standardized launch offers/i);
  assert.match(html, /not an exhaustive list/i);
  assert.match(html, /describe the problem/i);
});

test('Consulting exposes all five canonical problem families in customer language', () => {
  for (const phrase of [
    'AI adoption and workflow decisions',
    'AI-assisted engineering practices',
    'Architecture and technical decisions',
    'Engineering reliability',
    'Engineering effectiveness',
  ]) assert.match(html, new RegExp(phrase, 'i'));
  assert.equal((html.match(/class="consulting-problem-item"/g) || []).length, 5);
});

test('Consulting explains bounded engagement depth without creating more packaged offers', () => {
  for (const phrase of [
    'Need an expert opinion',
    'Advisory Session',
    'Need something investigated',
    'Assessment / Review',
    'Need continued guidance',
    'Advisory Engagement',
    'time-bounded',
    'owns delivery and implementation',
  ]) assert.match(html, new RegExp(phrase, 'i'));
  assert.match(html, /href="\.\.\/contact\/\?topic=consulting-help-choose"/);
  assert.doesNotMatch(html, /unlimited access|staff augmentation|open-ended technical support|anything technical/i);
});

test('breadth and engagement layouts are route-scoped and responsive', () => {
  assert.match(css, /\.consulting-engagement-grid[\s\S]*grid-template-columns: repeat\(3/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.consulting-engagement-grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.consulting-engagement-item \+ \.consulting-engagement-item[\s\S]*border-left/);
});
