const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const excludedDirectories = new Set(['.git', 'node_modules', 'playwright-report', 'test-results']);
const excludedRoutes = new Set([
  'admin/index.html',
  'apply/index.html',
  'card/index.html',
  'learn/index.html',
  'my-learning/index.html',
  'my-learning/balance/index.html',
  'my-learning/change/index.html',
  'my-learning/payment/index.html',
  'training/applied-python-ai-ml/index.html',
  'training/policies/privacy/index.html',
  'training/python-foundations-ai-data/index.html',
]);

function htmlFiles(directory = repositoryRoot) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory() && !excludedDirectories.has(entry.name)) return htmlFiles(absolute);
    if (!entry.isFile() || entry.name !== 'index.html') return [];
    return [path.relative(repositoryRoot, absolute).split(path.sep).join('/')];
  });
}

function expectedRootHref(file, route) {
  const depth = path.posix.dirname(file) === '.' ? 0 : path.posix.dirname(file).split('/').length;
  return `${'../'.repeat(depth)}${route}/`;
}

function expectedSupportHref(file) {
  if (file === '404.html') return '/support/';
  return expectedRootHref(file, 'support');
}

test('every public page exposes the approved professional-platform navigation', () => {
  const files = htmlFiles();
  const publicPages = files.filter((file) => !excludedRoutes.has(file));

  assert.equal(files.length, 83, 'update the public-route classification when routes change');
  assert.equal(publicPages.length, 72);
  assert.ok(publicPages.includes('newsletter/index.html'), 'the newsletter entry point must remain in the public route set');
  assert.ok(publicPages.includes('newsletter/confirmed/index.html'), 'the newsletter confirmation utility must remain in the public route set');
  assert.ok(publicPages.includes('search/index.html'), 'the durable public search utility must remain in the public route set');
  assert.ok(publicPages.includes('support/index.html'), 'the canonical Support page must remain in the public route set');
  assert.ok(publicPages.includes('support/thank-you/index.html'), 'the Support return state must retain the public shell');
  assert.ok(publicPages.includes('consulting/index.html'), 'the canonical Consulting page must remain in the public route set');
  assert.ok(publicPages.includes('website-services/index.html'), 'the canonical Website Services page must remain in the public route set');
  assert.ok(publicPages.includes('framework/index.html'), 'the canonical Framework surface must remain in the public route set');
  assert.ok(publicPages.includes('research/index.html'), 'the canonical Research surface must remain in the public route set');

  for (const file of publicPages) {
    const html = fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
    const primaryNav = html.match(/<nav\b[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?<\/nav>/);
    assert.ok(primaryNav, `${file} must include primary navigation`);

    const labels = [...primaryNav[0].matchAll(/<a\b[^>]*>(Software Signal|Consulting|Learning|Website Services|Writing|About|Subscribe)<\/a>/g)].map(match => match[1]);
    assert.deepEqual(labels, ['Software Signal', 'Consulting', 'Learning', 'Website Services', 'Writing', 'About', 'Subscribe'], `${file} must use the approved public navigation order`);

    const learningLinks = [...primaryNav[0].matchAll(/<a\b([^>]*)>Learning<\/a>/g)];
    assert.equal(learningLinks.length, 1, `${file} must include exactly one Learning link`);

    const href = learningLinks[0][1].match(/\bhref="([^"]+)"/);
    assert.ok(href, `${file} Learning link must have an href`);
    assert.equal(href[1], expectedRootHref(file, 'training'), `${file} Learning link must resolve by directory depth`);
  }
});

test('Learning pages expose the active Learning navigation state', () => {
  for (const file of htmlFiles().filter((candidate) => candidate.startsWith('training/') && !excludedRoutes.has(candidate))) {
    const html = fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
    const primaryNav = html.match(/<nav\b[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?<\/nav>/);
    assert.ok(primaryNav, `${file} must include primary navigation`);
    assert.match(
      primaryNav[0],
      /<a\b(?=[^>]*\bhref="[^"]+")(?=[^>]*\baria-current="page")[^>]*>Learning<\/a>/,
      `${file} must mark Learning as the current page`,
    );
  }
});

test('every existing public-shell footer exposes one restrained Support link', () => {
  const footerPages = [...htmlFiles(), '404.html'].filter((file) => {
    const html = fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
    return /<footer\b[^>]*class="[^"]*\bsite-footer\b/.test(html);
  });

  assert.equal(footerPages.length, 68, 'update the footer contract when public shells change');

  for (const file of footerPages) {
    const html = fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
    const footer = html.match(/<footer\b[^>]*class="[^"]*\bsite-footer\b[^>]*>[\s\S]*?<\/footer>/);
    assert.ok(footer, `${file} must retain its public-shell footer`);

    const supportLinks = [...footer[0].matchAll(/<a\b([^>]*)>Support<\/a>/g)];
    assert.equal(supportLinks.length, 1, `${file} must include exactly one restrained Support footer link`);

    const href = supportLinks[0][1].match(/\bhref="([^"]+)"/);
    assert.ok(href, `${file} Support footer link must have an href`);
    assert.equal(href[1], expectedSupportHref(file), `${file} Support link must resolve by directory depth`);
  }
});

test('the Support footer self-link exposes its current-page state', () => {
  const html = fs.readFileSync(path.join(repositoryRoot, 'support/index.html'), 'utf8');
  const footer = html.match(/<footer\b[^>]*class="[^"]*\bsite-footer\b[^>]*>[\s\S]*?<\/footer>/);
  assert.ok(footer, 'Support must retain its public-shell footer');
  assert.match(
    footer[0],
    /<a\b(?=[^>]*\bhref="\.\.\/support\/")(?=[^>]*\baria-current="page")[^>]*>Support<\/a>/,
    'the Support footer link must expose its current-page state',
  );
});

test('private and compatibility routes stay outside the public navigation contract', () => {
  for (const file of [...excludedRoutes].filter((candidate) => candidate !== 'card/index.html')) {
    const html = fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
    assert.doesNotMatch(html, /aria-label="Primary navigation"/, `${file} must retain its specialised shell`);
    assert.match(html, /<meta name="robots" content="[^"]*noindex/, `${file} must remain noindex`);
  }
});

test('digital card retains its focused indexable shell', () => {
  const html = fs.readFileSync(path.join(repositoryRoot, 'card/index.html'), 'utf8');
  assert.doesNotMatch(html, /aria-label="Primary navigation"/, 'card must not become a miniature public-site shell');
  assert.match(html, /<meta name="robots" content="index, follow">/, 'card must remain deliberately indexable');
  assert.match(html, /<link rel="canonical" href="https:\/\/suyogjoshi\.com\/card\/">/);
});

test('the public menu switches to its mobile layout before it wraps', () => {
  const css = fs.readFileSync(path.join(repositoryRoot, 'css/components.css'), 'utf8');
  assert.match(
    css,
    /@media \(max-width: 1040px\) \{[\s\S]*?\.nav \{[\s\S]*?display: none;[\s\S]*?\.nav\.is-open \{[\s\S]*?display: block;/,
  );
});
