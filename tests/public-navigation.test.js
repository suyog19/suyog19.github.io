const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const excludedRoutes = new Set([
  'admin/index.html',
  'apply/index.html',
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
    if (entry.isDirectory() && entry.name !== '.git') return htmlFiles(absolute);
    if (!entry.isFile() || entry.name !== 'index.html') return [];
    return [path.relative(repositoryRoot, absolute).split(path.sep).join('/')];
  });
}

function expectedTrainingHref(file) {
  const from = path.posix.dirname(file);
  const relative = path.posix.relative(from === '.' ? '' : from, 'training');
  return relative ? `${relative}/` : './';
}

function expectedSupportHref(file) {
  if (file === '404.html') return '/support/';
  const from = path.posix.dirname(file);
  const relative = path.posix.relative(from === '.' ? '' : from, 'support');
  return relative ? `${relative}/` : './';
}

test('every public page exposes Training exactly once in primary navigation', () => {
  const files = htmlFiles();
  const publicPages = files.filter((file) => !excludedRoutes.has(file));

  assert.equal(files.length, 76, 'update the public-route classification when routes change');
  assert.equal(publicPages.length, 66);
  assert.ok(publicPages.includes('newsletter/index.html'), 'the newsletter entry point must remain in the public route set');
  assert.ok(publicPages.includes('newsletter/confirmed/index.html'), 'the newsletter confirmation utility must remain in the public route set');
  assert.ok(publicPages.includes('search/index.html'), 'the durable public search utility must remain in the public route set');
  assert.ok(publicPages.includes('support/index.html'), 'the canonical Support page must remain in the public route set');
  assert.ok(publicPages.includes('support/thank-you/index.html'), 'the Support return state must retain the public shell');

  for (const file of publicPages) {
    const html = fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
    const primaryNav = html.match(/<nav\b[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?<\/nav>/);
    assert.ok(primaryNav, `${file} must include primary navigation`);

    const labels = [...primaryNav[0].matchAll(/<a\b[^>]*>(Training|Writing|Systems|About|Contact)<\/a>/g)].map(match => match[1]);
    assert.deepEqual(labels, ['Training', 'Writing', 'Systems', 'About', 'Contact'], `${file} must use the standard public navigation order`);

    const trainingLinks = [...primaryNav[0].matchAll(/<a\b([^>]*)>Training<\/a>/g)];
    assert.equal(trainingLinks.length, 1, `${file} must include exactly one Training link`);

    const href = trainingLinks[0][1].match(/\bhref="([^"]+)"/);
    assert.ok(href, `${file} Training link must have an href`);
    assert.equal(href[1], expectedTrainingHref(file), `${file} Training link must resolve by directory depth`);
  }
});

test('Training pages expose the active Training navigation state', () => {
  for (const file of htmlFiles().filter((candidate) => candidate.startsWith('training/') && !excludedRoutes.has(candidate))) {
    const html = fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
    const primaryNav = html.match(/<nav\b[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?<\/nav>/);
    assert.ok(primaryNav, `${file} must include primary navigation`);
    assert.match(
      primaryNav[0],
      /<a\b(?=[^>]*\bhref="[^"]+")(?=[^>]*\baria-current="page")[^>]*>Training<\/a>/,
      `${file} must mark Training as the current page`,
    );
  }
});

test('every existing public-shell footer exposes one restrained Support link', () => {
  const footerPages = [...htmlFiles(), '404.html'].filter((file) => {
    const html = fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
    return /<footer\b[^>]*class="[^"]*\bsite-footer\b/.test(html);
  });

  assert.equal(footerPages.length, 62, 'update the footer contract when public shells change');

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
    /<a\b(?=[^>]*\bhref="\.\/")(?=[^>]*\baria-current="page")[^>]*>Support<\/a>/,
    'the Support footer link must expose its current-page state',
  );
});

test('private and compatibility routes stay outside the public navigation contract', () => {
  for (const file of excludedRoutes) {
    const html = fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
    assert.doesNotMatch(html, /aria-label="Primary navigation"/, `${file} must retain its specialised shell`);
    assert.match(html, /<meta name="robots" content="[^"]*noindex/, `${file} must remain noindex`);
  }
});

test('the public menu switches to its mobile layout before it wraps', () => {
  const css = fs.readFileSync(path.join(repositoryRoot, 'css/components.css'), 'utf8');
  assert.match(
    css,
    /@media \(max-width: 800px\) \{[\s\S]*?\.nav \{[\s\S]*?display: none;[\s\S]*?\.nav\.is-open \{[\s\S]*?display: block;/,
  );
});
