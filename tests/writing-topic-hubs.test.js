const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const slugs = [
  'ai-assisted-software-engineering',
  'engineering-context-and-knowledge',
  'ai-agents-and-review',
  'agile-process-and-engineering-leadership',
];
const writing = fs.readFileSync('writing/index.html', 'utf8');
const css = fs.readFileSync('css/pages.css', 'utf8');
const works = JSON.parse(fs.readFileSync('data/writing-works.json', 'utf8')).works;
const curation = JSON.parse(fs.readFileSync('data/writing-curation.json', 'utf8'));

test('Writing promotes exactly four mature clusters to stable topic hubs', () => {
  assert.equal((writing.match(/href="topics\/[^"]+\/" class="wp-theme-explore"/g) || []).length, 4);
  for (const slug of slugs) assert.match(writing, new RegExp(`href="topics/${slug}/"`));
});

for (const slug of slugs) {
  test(`${slug} is a crawlable, structured editorial hub`, () => {
    const html = fs.readFileSync(`writing/topics/${slug}/index.html`, 'utf8');
    assert.match(html, new RegExp(`<link rel="canonical" href="https://suyogjoshi.com/writing/topics/${slug}/"`));
    assert.match(html, /<h1 class="wp-hero-heading">[^<]+<\/h1>/);
    assert.match(html, /"@type": "CollectionPage"/);
    assert.match(html, /"@type": "ItemList"/);
    const expected = works.filter((work) => work.topicIds.includes(slug)).length;
    assert.match(html, new RegExp(`"numberOfItems": ${expected}`));
    assert.equal((html.match(/class="wp-article-item"/g) || []).length, expected);
    assert.match(html, /href="\.\.\/\.\.\/\.\.\/writing\/" class="nav-link" aria-current="page"/);
    for (const link of html.matchAll(/<a[^>]+href="https:\/\/medium\.com\/(?!@)[^>]+>/g)) {
      assert.match(link[0], /target="_blank"/);
      assert.match(link[0], /rel="noopener noreferrer"/);
      assert.match(link[0], /aria-label="[^"]+opens in a new tab/);
    }
  });
}

test('topic hub presentation is scoped and responsive', () => {
  assert.match(css, /\.topic-hub-hero\s*\{/);
  assert.match(css, /\.topic-hub-grid\s*\{/);
  assert.match(css, /\.topic-hub-path\s*\{[\s\S]*?list-style: none;[\s\S]*?padding-left: 0;/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.topic-hub-grid/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.topic-hub-path-item/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.topic-hub/);
});

test('landing Topic previews are explicit stable Work-id curation with at most four Works', () => {
  curation.topics.forEach((topic) => {
    assert.ok(topic.previewWorkIds.length <= 4);
    topic.previewWorkIds.forEach((id) => assert.ok(works.some((work) => work.id === id)));
  });
});

test('maintenance note records promotion and update rules', () => {
  const plan = fs.readFileSync('docs/plans/issue-533-writing-topic-hubs.md', 'utf8');
  assert.match(plan, /Maintenance rule/i);
  assert.match(plan, /promot/i);
  assert.match(plan, /update/i);
});
