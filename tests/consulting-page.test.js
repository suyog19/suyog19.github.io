const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('consulting/index.html', 'utf8');
const css = fs.readFileSync('css/consulting.css', 'utf8');

test('Consulting page launches exactly the two scoped offers with canonical pricing', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/suyogjoshi\.com\/consulting\/"/);
  assert.match(html, /<meta name="robots" content="index, follow"/);
  assert.equal((html.match(/class="consulting-offer-card"/g) || []).length, 2);
  for (const copy of ['Engineering Advisory Session', 'Repository AI-Readiness Review', '60–90 minutes', '₹4,999 individual', '₹9,999 team / business', 'From ₹25,000']) {
    assert.match(html, new RegExp(copy));
  }
  assert.doesNotMatch(html, /hourly rate|per hour|testimonial|client logo|case stud/i);
  assert.doesNotMatch(html, /Calendly|checkout|book now|CRM|retainer/i);
});

test('offer scope, outputs, evidence and limitations remain explicit', () => {
  for (const phrase of [
    'problem as understood',
    'recommended direction',
    'risks, trade-offs, and immediate next steps',
    'current state, significant findings, strengths, risks, opportunities',
    'Implementation is not automatically included',
    'no review can guarantee correctness, security, or failure-free outcomes',
    'more than 20 years',
  ]) assert.match(html, new RegExp(phrase, 'i'));
  for (const route of [
    '../about/',
    '../writing/series/ai-assisted-software-engineering/',
    '../writing/architecture-matters-more-in-the-ai-era/',
    '../systems/ai-dev-orchestrator/',
  ]) assert.match(html, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('Consulting enquiry links carry only fixed non-sensitive topic identifiers', () => {
  const topics = [...html.matchAll(/href="\.\.\/contact\/\?topic=([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(topics, ['consulting-advisory', 'consulting-repository-review', 'consulting-help-choose', 'consulting-help-choose']);
  assert.doesNotMatch(topics.join(' '), /name|email|company|message|problem|repository[_-]?id|url/i);
});

test('Consulting route uses scoped assets and responsive peer-offer composition', () => {
  for (const asset of ['../css/base.css', '../css/components.css', '../css/pages.css', '../css/consulting.css', '../js/script.js', '../js/consulting-analytics.js']) {
    assert.match(html, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(css, /\.consulting-offer-grid[\s\S]*grid-template-columns: repeat\(2/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.consulting-offer-grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.consulting-enquiry-actions \.btn[\s\S]*width: 100%/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});
