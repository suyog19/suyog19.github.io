const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const manifest = JSON.parse(fs.readFileSync('data/social-previews.json', 'utf8'));
const assetRoot = 'https://suyogjoshi.com/assets/social-previews/';

function pngDimensions(filename) {
  const data = fs.readFileSync(path.join('assets/social-previews', filename));
  assert.equal(data.subarray(1, 4).toString('ascii'), 'PNG');
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

test('the approved social-preview catalogue contains the deliberate 15-page scope', () => {
  assert.equal(manifest.entries.length, 15);
  assert.deepEqual(new Set(manifest.entries.map((entry) => entry.variant)), new Set(['core', 'learning']));
  assert.equal(manifest.entries.filter((entry) => entry.variant === 'learning').length, 6);
  assert.equal(manifest.entries.filter((entry) => entry.label.includes('TOPIC HUB')).length, 4);
  assert.equal(manifest.entries.filter((entry) => entry.label.includes('COURSE')).length, 5);
});

for (const entry of manifest.entries) {
  test(`${entry.page} has a complete, truthful large-card contract`, () => {
    const html = fs.readFileSync(entry.page, 'utf8');
    const image = `${assetRoot}${entry.filename}`;
    assert.match(html, new RegExp(`<meta property="og:image" content="${image.replaceAll('.', '\\.')}"`));
    assert.match(html, /<meta property="og:image:width" content="1200"/);
    assert.match(html, /<meta property="og:image:height" content="630"/);
    assert.ok(html.includes(`<meta property="og:image:alt" content="${entry.alt}"`));
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
    assert.ok(html.includes(`<meta name="twitter:image" content="${image}"`));
    assert.ok(html.includes(`<meta name="twitter:image:alt" content="${entry.alt}"`));
    assert.deepEqual(pngDimensions(entry.filename), [1200, 630]);
  });
}

test('course preview copy remains durable as commercial and cohort state changes', () => {
  const mutable = /applications? (?:open|closed)|cohort|schedule|fee|price|seat|capacity|launch|discount|recording|certificate/i;
  for (const entry of manifest.entries.filter((item) => item.label.includes('COURSE'))) {
    assert.doesNotMatch(`${entry.title} ${entry.support || ''} ${entry.alt}`, mutable, entry.filename);
    assert.equal(entry.variant, 'learning');
  }
});

test('utility, protected, demo, System-detail, Research, and article preview decisions stay restrained', () => {
  const pages = new Set(manifest.entries.map((entry) => entry.page));
  for (const excluded of [
    'search/index.html',
    'training/policies/index.html',
    'training/register-interest/index.html',
    'systems/ai-workflow-lab/invoice-review-demo/index.html',
    'systems/ai-dev-orchestrator/index.html',
  ]) assert.equal(pages.has(excluded), false);

  const research = fs.readFileSync('research/ai-teaching-workflows/index.html', 'utf8');
  assert.match(research, /ai-assisted-teaching-workflows-research\.png/);
  assert.doesNotMatch(research, /assets\/social-previews/);
  const article = fs.readFileSync('writing/the-context-supply-chain-how-organizational-knowledge-reaches-ai-output/index.html', 'utf8');
  assert.match(article, /writing\/the-context-supply-chain-how-organizational-knowledge-reaches-ai-output\/cover\.png/);
});

test('the audit records visual variants, reuse, exclusions, and platform cache limits', () => {
  const audit = fs.readFileSync('docs/plans/issue-392-social-preview-audit.md', 'utf8');
  for (const phrase of [
    'Core editorial variant',
    'Software Signal Learning variant',
    'Preserve unchanged',
    'No custom preview',
    '72px safe inset',
    'platforms may cache',
  ]) assert.match(audit, new RegExp(phrase, 'i'));
});
