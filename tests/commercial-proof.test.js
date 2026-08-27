const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');
const consulting = read('consulting/index.html');
const websites = read('website-services/index.html');
const learning = read('training/index.html');
const components = read('css/components.css');

test('Consulting attaches attributable public work to each buying decision', () => {
  assert.equal((consulting.match(/class="proof-item consulting-offer-proof"/g) || []).length, 2);
  for (const route of [
    '../framework/',
    '../writing/architecture-matters-more-in-the-ai-era/',
    '../systems/ai-dev-orchestrator/',
    '../writing/stronger-evidence-chains-for-ai-assisted-engineering-changes/',
  ]) assert.match(consulting, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(consulting.indexOf('advisory-proof-title') < consulting.indexOf('consulting-advisory'));
  assert.ok(consulting.indexOf('review-proof-title') < consulting.indexOf('consulting-repository-review'));
});

test('Website Services presents real visual work as an explicit self-case-study', () => {
  assert.match(websites, /Self-case-study · Software Signal's own platform/);
  assert.match(websites, /not a client engagement/i);
  assert.match(websites, /No conversion improvement is claimed without measured evidence/);
  for (const asset of ['software-signal-before.webp', 'software-signal-current.webp']) {
    assert.match(websites, new RegExp(asset));
    assert.ok(fs.existsSync(`assets/case-studies/${asset}`));
  }
  assert.equal((websites.match(/<figure class="proof-visual">/g) || []).length, 2);
  assert.match(websites, /width="1440" height="900" loading="lazy" decoding="async"/);
  assert.match(websites, /width="1425" height="891" loading="lazy" decoding="async"/);
});

test('Learning offers inspectable teaching material without registration or payment', () => {
  const proof = learning.match(/<section class="training-section training-proof"[\s\S]*?<\/section>/)[0];
  for (const label of ['Published lesson structure', 'Published project brief', 'Free explanatory sample']) assert.match(proof, new RegExp(label));
  for (const route of ['python-foundations-for-data-science/#curriculum', 'applied-data-analysis-with-python/#outcome', '../writing/ai-ml-data-science-explained-simply/']) assert.match(proof, new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const destinations = [...proof.matchAll(/href="([^"]+)"/g)].map((match) => match[1]).join(' ');
  assert.doesNotMatch(destinations, /contact\/|apply\/|register-interest|payment/i);
});

test('proof architecture is reusable, responsive, and free of fabricated trust decoration', () => {
  for (const selector of ['.proof-grid', '.proof-item', '.proof-provenance', '.proof-links', '.proof-visual-pair']) assert.match(components, new RegExp(selector.replace('.', '\\.')));
  assert.match(components, /@media \(max-width: 800px\)[\s\S]*?\.proof-grid--three[\s\S]*?grid-template-columns: 1fr/);
  assert.match(components, /@media \(max-width: 640px\)[\s\S]*?\.proof-visual-pair[\s\S]*?grid-template-columns: 1fr/);
  const combined = `${consulting}\n${websites}\n${learning}`;
  assert.doesNotMatch(combined, /five-star|star rating|client logo|customer testimonial|conversion increased|revenue increased/i);
});
