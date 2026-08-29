const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const publicPages = [
  'index.html',
  'writing/index.html',
  'newsletter/index.html',
  'website-services/index.html',
  'writing/how-modern-llm-systems-really-work/index.html',
];

test('representative shared headers use the canonical responsive logo as one named home link', () => {
  for (const page of publicPages) {
    const html = fs.readFileSync(page, 'utf8');
    assert.doesNotMatch(html, /<span class="brand-mark" aria-hidden="true">SS<\/span>/);
    assert.match(html, /class="brand-lockup" aria-label="Software Signal by Suyog Joshi — Home"/);
    assert.match(html, /software-signal-logo-website\.svg/);
    assert.match(html, /software-signal-mark-website\.svg/);
    assert.match(html, /<img class="brand-logo"[^>]+alt="">/);
    assert.match(html, /rel="apple-touch-icon" sizes="180x180"/);
  }
});

test('generic social metadata uses the Software Signal fallback', () => {
  const html = fs.readFileSync('newsletter/index.html', 'utf8');
  const image = 'https://suyogjoshi.com/assets/brand/software-signal-social-default.png';
  assert.ok(html.includes(`<meta property="og:image" content="${image}">`));
  assert.ok(html.includes(`<meta name="twitter:image" content="${image}">`));
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<meta property="og:image:width" content="1200">/);
  assert.match(html, /<meta property="og:image:height" content="630">/);
});

test('existing page-specific social artwork retains precedence', () => {
  const article = fs.readFileSync('writing/ai-governance-without-bureaucracy/index.html', 'utf8');
  assert.match(article, /writing\/ai-governance-without-bureaucracy\/cover\.png/);
  assert.doesNotMatch(article, /software-signal-social-default\.png/);

  const home = fs.readFileSync('index.html', 'utf8');
  assert.match(home, /assets\/social-previews\/home\.png/);
  assert.doesNotMatch(home, /software-signal-social-default\.png/);
});

test('default social card has the required platform dimensions', () => {
  const data = fs.readFileSync('assets/brand/software-signal-social-default.png');
  assert.equal(data.subarray(1, 4).toString('ascii'), 'PNG');
  assert.deepEqual([data.readUInt32BE(16), data.readUInt32BE(20)], [1200, 630]);
});
