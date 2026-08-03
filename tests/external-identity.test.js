const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const read = path => fs.readFileSync(path, 'utf8');
const profiles = [
  'https://www.linkedin.com/in/suyog-joshi',
  'https://github.com/suyog19',
  'https://medium.com/@suyog19'
];

test('About exposes exactly the verified public identities with safe relationship attributes', () => {
  const about = read('about/index.html');
  const profileSection = about.match(/<section class="ap-site-story" aria-labelledby="public-profiles-title">[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(profileSection);
  for (const profile of profiles) {
    assert.equal((profileSection.match(new RegExp(profile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1);
  }
  assert.equal((profileSection.match(/rel="me noopener noreferrer"/g) || []).length, profiles.length);
  assert.doesNotMatch(profileSection, /mailto:|tel:|address|birth/i);
});

test('visible verified profiles agree with Person sameAs', () => {
  for (const file of ['index.html', 'about/index.html']) {
    const source = read(file);
    for (const profile of profiles) assert.match(source, new RegExp(profile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  const validator = read('scripts/validate_site_identity.py');
  for (const profile of profiles) assert.match(validator, new RegExp(profile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('public systems link to their exact repositories with safe external behavior', () => {
  const pairs = [
    ['systems/ai-dev-orchestrator/index.html', 'https://github.com/suyog19/ai-dev-orchestrator'],
    ['systems/survey-poll-serverless/index.html', 'https://github.com/suyog19/survey-poll-app']
  ];
  for (const [file, repository] of pairs) {
    const source = read(file);
    assert.match(source, new RegExp(`href="${repository}" target="_blank" rel="noopener noreferrer"`));
  }
});

test('Training provider connects the approved identity and professional evidence', () => {
  const provider = read('training/provider/index.html');
  assert.match(provider, /href="\.\.\/\.\.\/about\/">Suyog Joshi<\/a>/);
  assert.match(provider, /not presented as a separate legal company/);
  for (const profile of profiles) {
    assert.match(provider, new RegExp(`href="${profile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" target="_blank" rel="me noopener noreferrer"`));
  }
});

test('Medium original-source notes follow one bounded disclosure contract', () => {
  const files = [
    'writing/understanding-the-ai-ecosystem/index.html',
    'writing/ai-ml-data-science-explained-simply/index.html',
    'writing/how-modern-llm-systems-really-work/index.html',
    'writing/how-i-used-two-ais-to-build-a-software-engineering-system/index.html'
  ];
  const copy = 'This article was originally published on Medium and is being adapted here as part of my long-term knowledge hub.';
  for (const file of files) {
    const source = read(file);
    assert.match(source, /<link rel="canonical" href="https:\/\/suyogjoshi\.com\/writing\//);
    assert.equal((source.match(/class="article-original-note"/g) || []).length, 1);
    assert.ok(source.includes(copy));
    assert.match(source, /href="https:\/\/medium\.com\/@suyog19\/[^"]+" target="_blank" rel="noopener noreferrer">Read original on Medium<\/a>/);
  }
  const policy = read('docs/issue-393-external-identity.md');
  assert.match(policy, /self-referencing canonical URL/);
  assert.match(policy, /Medium's canonical-link\/import controls/);
});
