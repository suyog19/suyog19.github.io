const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('writing/index.html', 'utf8');
const css = fs.readFileSync('css/pages.css', 'utf8');
const latest = html.match(/<!-- Latest Writing -->[\s\S]*?<\/section>/)?.[0] || '';

const externalArticles = [
  {
    title: 'The Rise of Multi-Model Software Engineering',
    publication: 'Level Up Coding',
    url: 'https://medium.com/gitconnected/the-rise-of-multi-model-software-engineering-afa2c27b29bc?sk=bf073a9753b436a016e31bb619389bfc',
    latestOnly: true,
  },
  {
    title: 'When AI Writes the Code, What Makes a Language Good?',
    publication: 'Towards AI',
    url: 'https://medium.com/towards-artificial-intelligence/when-ai-writes-the-code-what-makes-a-language-good-05a220034686?sk=123ed72ce3e0098570ed95140f1fb975',
    latestOnly: true,
  },
  {
    title: 'I Built an AI Software Team. The Hard Part Wasn’t Coding.',
    publication: 'Level Up Coding',
    url: 'https://medium.com/gitconnected/i-built-an-ai-software-team-the-hard-part-wasnt-coding-225382309c08?sk=7b471a2acfa79394053eba2851d1278c',
  },
  {
    title: 'Why Multi-Agent Coding Fails',
    publication: 'Towards AI',
    url: 'https://medium.com/towards-artificial-intelligence/why-multi-agent-coding-fails-6b3a45746477?sk=b085842583c07888997f98f3cf9544e2',
  },
  {
    title: 'I Made Architecture Documentation Fail the Build When It Lies',
    publication: 'Level Up Coding',
    url: 'https://medium.com/gitconnected/i-made-architecture-documentation-fail-the-build-when-it-lies-ee92ff8287be?sk=214958e0f39257ad4678975a7e8ebaa1',
  },
  {
    title: 'AI Is Quietly Changing How Junior Engineers Become Senior',
    publication: 'Level Up Coding',
    url: 'https://medium.com/gitconnected/ai-is-quietly-changing-how-junior-engineers-become-senior-952f128b0888?sk=84d73ea9017579353d8df3faa573f428',
  },
];

test('Latest Writing is a finite visual stream immediately after the hero', () => {
  assert.ok(html.indexOf('<!-- Latest Writing -->') > html.indexOf('<!-- Writing Hero -->'));
  assert.ok(html.indexOf('<!-- Latest Writing -->') < html.indexOf('<!-- Choose Your Path -->'));
  assert.equal((latest.match(/class="wp-latest-item"/g) || []).length, 8);
  assert.equal((latest.match(/class="wp-latest-cover"/g) || []).length, 8);
  assert.equal((latest.match(/data-hosting="external"/g) || []).length, 6);
  assert.equal((latest.match(/data-hosting="internal"/g) || []).length, 2);
  assert.equal((latest.match(/<img[^>]+width="[^"]+"[^>]+height="[^"]+"/g) || []).length, 8);
});

test('external writing uses Friend URLs with publication and accessible link semantics', () => {
  for (const article of externalArticles) {
    const escapedUrl = article.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(latest, new RegExp(`href="${escapedUrl}"[^>]+target="_blank"[^>]+rel="noopener noreferrer"[^>]+aria-label="[^"]+opens in a new tab`));
    assert.match(latest, new RegExp(`Published in ${article.publication}`));
    if (!article.latestOnly) {
      assert.ok((html.match(new RegExp(article.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length >= 2, `${article.title} must also appear in a topic cluster`);
    }
  }
});

test('reader recommendations are merged into Choose Your Path without removing taxonomy', () => {
  assert.doesNotMatch(html, /Recommended Starting Points/);
  assert.equal((html.match(/class="wp-path-start"/g) || []).length, 4);
  assert.equal((html.match(/class="wp-path-explore"/g) || []).length, 4);
  assert.match(html, /Start With the Main Series/);
  assert.match(html, /Writing to systems/);
  assert.match(html, /Topic Clusters/);
});

test('cover styling preserves title measure across mobile widths', () => {
  assert.match(css, /\.wp-latest-cover \{[\s\S]*?aspect-ratio: 1\.91 \/ 1;[\s\S]*?object-fit: cover;/);
  assert.match(css, /@media \(max-width: 480px\) \{[\s\S]*?\.wp-latest-row \{[\s\S]*?grid-template-columns: 5\.5rem minmax\(0, 1fr\);/);
  assert.match(css, /@media \(max-width: 360px\) \{[\s\S]*?\.wp-latest-row \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);[\s\S]*?\.wp-latest-cover \{[\s\S]*?display: none;/);
  assert.match(css, /\.wp-latest-row \{[\s\S]*?color: var\(--color-text\);/);
});
