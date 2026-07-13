const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const pages = [
  ['training/index.html', 'https://suyogjoshi.com/training/'],
  ['training/python-foundations-ai-data/index.html', 'https://suyogjoshi.com/training/python-foundations-ai-data/'],
  ['training/applied-python-ai-ml/index.html', 'https://suyogjoshi.com/training/applied-python-ai-ml/'],
  ['training/policies/index.html', 'https://suyogjoshi.com/training/policies/'],
  ['training/provider/index.html', 'https://suyogjoshi.com/training/provider/'],
];

test('training pages include canonical SEO, GA4, and correct asset depth', () => {
  for (const [relative, canonical] of pages) {
    const html = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.match(html, new RegExp(`rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, /G-PKL56GJ38H/);
    assert.match(html, /<meta name="description"/);
    const depth = relative.split('/').length - 1;
    const prefix = '../'.repeat(depth);
    assert.match(html, new RegExp(`href="${prefix}css/base\\.css"`));
    assert.match(html, new RegExp(`src="${prefix}js/script\\.js"`));
  }
});

test('course schema matches approved platform facts', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/training-courses.json'), 'utf8'));
  assert.deepEqual(data.provider, {
    name: 'Suyog Joshi', brand: 'Software Signal',
    location: 'Pune, Maharashtra, India', contact: 'contact@suyogjoshi.com',
  });
  assert.deepEqual(data.courses.map(({ slug, feeAmountPaise, depositAmountPaise, minimumCohortSize }) => ({
    slug, feeAmountPaise, depositAmountPaise, minimumCohortSize,
  })), [
    { slug: 'python-foundations-ai-data', feeAmountPaise: 400000, depositAmountPaise: 100000, minimumCohortSize: 10 },
    { slug: 'applied-python-ai-ml', feeAmountPaise: 800000, depositAmountPaise: 200000, minimumCohortSize: 5 },
  ]);
});

test('draft experience does not enable applications or payment', () => {
  const combined = pages.map(([relative]) => fs.readFileSync(path.join(root, relative), 'utf8')).join('\n');
  assert.match(combined, /Applications not yet open/);
  assert.doesNotMatch(combined, /href="[^\"]*(apply|checkout|payment)/i);
  assert.doesNotMatch(combined, /Razorpay|payment-button|checkout\.js/i);
});

test('all training URLs are present in the sitemap', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  for (const [, canonical] of pages) assert.match(sitemap, new RegExp(canonical));
});
