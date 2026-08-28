const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('writing/index.html', 'utf8');
const css = fs.readFileSync('css/pages.css', 'utf8');
const works = JSON.parse(fs.readFileSync('data/writing-works.json', 'utf8'));
const curation = JSON.parse(fs.readFileSync('data/writing-curation.json', 'utf8'));
const latest = html.match(/<!-- Latest Writing -->[\s\S]*?<\/section>/)?.[0] || '';

const externalArticles = [
  {
    title: 'The Frontend Passed. The Experience Didn’t.',
    publicationText: 'Published on Medium',
    url: 'https://medium.com/@suyog19/the-frontend-passed-the-experience-didnt-c7ae9e6a5140?sk=6913d5adfb68854f16718b4d7cd31347',
  },
  {
    title: 'Cursor Just Launched Its Own Git Forge. It’s Built for AI Agents.',
    publicationText: 'Published in Generative AI',
    url: 'https://medium.com/generative-ai/cursor-just-launched-its-own-git-forge-its-built-for-ai-agents-a6ac940b0a02?sk=e37eedbb64566ebae0b8c61c0018ff39',
  },
  {
    title: 'Agent Plugins 1.0: Engineering Process Is Becoming Installable',
    publicationText: 'Published in Generative AI',
    url: 'https://medium.com/generative-ai/agent-plugins-1-0-engineering-process-is-becoming-installable-ec1d4f751550?sk=d187ebce0263a86a6d317710fcef6199',
  },
  {
    title: 'Your Repository Has a Truth Problem',
    publicationText: 'Published in Analyst’s Corner',
    url: 'https://medium.com/analysts-corner/your-repository-has-a-truth-problem-bfc2f89b0346?sk=8b1551f76713d53216d4e2a0b50fab6b',
  },
  {
    title: 'Your Coding Agent Shouldn’t Work Alone',
    publicationText: 'Published in Towards AI',
    url: 'https://medium.com/towards-artificial-intelligence/your-coding-agent-shouldnt-work-alone-4e910cc835b9?sk=fbb2b54fb4b7996cb953e40cce9cb359',
  },
  {
    title: 'I Stopped Trusting My Coding Agent to Read the Docs',
    publicationText: 'Published on Medium',
    url: 'https://medium.com/@suyog19/i-stopped-trusting-my-coding-agent-to-read-the-docs-92e504c07a42?sk=6b9c4ee576da1eb765bf437febc3c6e3',
  },
  {
    title: 'Business Rules as Context: The Missing Layer in AI-Assisted Development',
    publicationText: 'Published on Medium',
    url: 'https://medium.com/@suyog19/business-rules-as-context-the-missing-layer-in-ai-assisted-development-0e5a2c52299e?sk=4cf8826542a0d7a149dbe8205a978a77',
  },
  {
    title: 'I Took an Idea to Soft Launch in a Day. Speed Wasn’t the Interesting Part.',
    publicationText: 'Published in Level Up Coding',
    url: 'https://medium.com/gitconnected/i-took-an-idea-to-soft-launch-in-a-day-speed-wasnt-the-interesting-part-63a2459d3b52?sk=8b1e74050b31dc8d93e2c6a5edf9efcc',
  },
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
  assert.equal((latest.match(/class="wp-latest-item"/g) || []).length, 6);
  assert.equal((latest.match(/class="wp-latest-cover"/g) || []).length, 6);
  assert.equal((latest.match(/<img[^>]+width="[^"]+"[^>]+height="[^"]+"/g) || []).length, 6);
  assert.match(latest, /href="recent\/"[^>]*>View all recent writing/);
});

test('normalized Work records own external destinations independently of landing-page curation', () => {
  assert.equal(works.works.length, 41);
  const businessRules = works.works.find((work) => work.id === 'business-rules-as-context');
  assert.equal(businessRules.publications.length, 2);
  assert.equal(new Set(works.works.map((work) => work.id)).size, works.works.length);
  for (const item of [...latest.matchAll(/<a href="(https:[^"]+)" class="wp-latest-row"[^>]+target="_blank"[^>]+rel="noopener noreferrer"[^>]+aria-label="[^"]+opens in a new tab/g)]) {
    assert.ok(works.works.some((work) => work.publications.some((publication) => publication.url === item[1])));
  }
});

test('reader recommendations are merged into Choose Your Path without removing taxonomy', () => {
  assert.equal(curation.readerPaths.length, 4);
  curation.readerPaths.forEach((path) => {
    assert.ok(path.workIds.length >= 4 && path.workIds.length <= 6);
    path.workIds.forEach((id) => assert.ok(works.works.some((work) => work.id === id)));
  });
  assert.match(html, /Ordered series/);
  assert.match(html, /Writing to systems/);
  assert.match(html, /Topic Clusters/);
});

test('cover styling preserves title measure across mobile widths', () => {
  assert.match(css, /\.wp-latest-cover \{[\s\S]*?aspect-ratio: 1\.91 \/ 1;[\s\S]*?object-fit: cover;/);
  assert.match(css, /@media \(max-width: 480px\) \{[\s\S]*?\.wp-latest-row \{[\s\S]*?grid-template-columns: 5\.5rem minmax\(0, 1fr\);/);
  assert.match(css, /@media \(max-width: 360px\) \{[\s\S]*?\.wp-latest-row \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\);[\s\S]*?\.wp-latest-cover \{[\s\S]*?display: none;/);
  assert.match(css, /\.wp-latest-row \{[\s\S]*?color: var\(--color-text\);/);
});
