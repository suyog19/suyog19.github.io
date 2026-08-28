const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const search = require('../js/public-search.js');
const index = JSON.parse(fs.readFileSync('data/search-index.json', 'utf8'));
const source = fs.readFileSync('js/public-search.js', 'utf8');
const page = fs.readFileSync('search/index.html', 'utf8');
const writing = fs.readFileSync('writing/index.html', 'utf8');

function titles(query) {
  return search.search(index.items, query).map((item) => item.title);
}

test('representative retrieval queries return sensible public destinations', () => {
  assert.ok(titles('context supply chain').some((title) => title.includes('Context Supply Chain')));
  assert.ok(titles('agents').some((title) => /Agent/i.test(title)));
  assert.ok(titles('serverless').includes('Survey/Poll Serverless System'));
  assert.ok(titles('ML').includes('Practical Machine Learning Foundations'));
  assert.ok(titles('invoice review').includes('AI-Assisted Invoice Review Workflow'));
});

test('ranking is deterministic and favours title matches over summary-only matches', () => {
  const results = search.search(index.items, 'architecture');
  assert.ok(results.length > 1);
  assert.match(results[0].title, /Architecture/i);
  assert.deepEqual(search.search(index.items, 'architecture'), results);
});

test('empty, punctuation-only, and unknown queries return no results', () => {
  assert.deepEqual(search.search(index.items, ''), []);
  assert.deepEqual(search.search(index.items, '---'), []);
  assert.deepEqual(search.search(index.items, 'zzzz-no-such-public-content'), []);
});

test('external articles and course states are explicit in generated metadata', () => {
  const external = index.items.filter((item) => item.external);
  assert.equal(external.length, 14);
  external.forEach((item) => {
    assert.equal(item.type, 'Article');
    assert.match(item.url, /^https:\/\/medium\.com\//);
    assert.ok(item.source && item.source !== 'suyogjoshi.com');
  });
  const courses = index.items.filter((item) => item.type === 'Course');
  assert.equal(courses.length, 5);
  courses.forEach((item) => assert.match(item.state, /^(Launched|Proposed) course/));
});

test('internal results stay on the current site while external destinations remain absolute', () => {
  const internal = index.items.find((item) => !item.external && item.type === 'Article');
  const external = index.items.find((item) => item.external);
  assert.match(search.resultUrl(internal), /^\/writing\//);
  assert.doesNotMatch(search.resultUrl(internal), /^https?:\/\//);
  assert.equal(search.resultUrl(external), external.url);
  assert.equal(search.resultUrl({ external: false, url: 'https://example.com/writing/' }), '/search/');
  assert.equal(search.resultUrl({ external: false, url: 'https://suyogjoshi.com//evil.example/path' }), '/search/');
  assert.equal(search.resultUrl({ external: false, url: 'https://suyogjoshi.com/\\evil.example/path' }), '/search/');
  assert.equal(search.resultUrl({ external: false, url: 'not a URL' }), '/search/');
});

test('external discovery metadata survives Latest Writing rotation', () => {
  const catalogueUrls = [...writing.matchAll(/<a href="(https:\/\/medium\.com\/[^"?]+\?sk=[^"]+)" class="wp-article-row"[\s\S]*?data-discovery-title=/g)]
    .map((match) => match[1]);
  const latestUrls = [...writing.matchAll(/<a href="(https:\/\/medium\.com\/[^"?]+\?sk=[^"]+)" class="wp-latest-row"/g)]
    .map((match) => match[1]);
  assert.equal(new Set(catalogueUrls).size, 14);
  latestUrls.forEach((url) => assert.ok(catalogueUrls.includes(url)));
});

test('search runtime stays local and does not create URL or storage state', () => {
  assert.match(source, /fetchRef\(indexUrl/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|sendBeacon|XMLHttpRequest|URLSearchParams/);
  assert.doesNotMatch(source, /https?:\/\//);
});

test('search page is progressively enhanced with useful no-JavaScript browsing', () => {
  assert.match(page, /data-search-form[^>]*hidden/);
  assert.match(page, /Search runs in this browser over public metadata/);
  assert.match(page, /href="\.\.\/writing\/"/);
  assert.match(page, /href="\.\.\/systems\/"/);
  assert.match(page, /href="\.\.\/training\/"/);
  assert.match(page, /role="status" aria-live="polite"/);
  assert.doesNotMatch(page, /name="q"|action="/);
});

test('Writing explains the RSS utility without overstating the action', () => {
  assert.match(writing, /href="\.\.\/feed\.xml"[^>]*>Follow via RSS<\/a>/);
  assert.match(writing, /Use this feed URL with your preferred RSS reader\./);
  assert.doesNotMatch(writing, /Subscribe to Writing/);
});
