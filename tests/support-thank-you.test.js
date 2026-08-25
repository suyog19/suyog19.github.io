const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('support/thank-you/index.html', 'utf8');

test('thank-you return state is intentional, bounded, and useful', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/suyogjoshi\.com\/support\/thank-you\/"/);
  assert.match(html, /<meta name="robots" content="noindex,follow"/);
  assert.match(html, /Payment completed through Razorpay/);
  assert.match(html, /does not independently verify or store payment status/);
  assert.match(html, /Razorpay sends an automated receipt/);
  assert.match(html, /googletagmanager\.com\/gtag\/js\?id=G-PKL56GJ38H/);
  assert.match(html, /href="\.\.\/\.\.\/writing\/"/);
  assert.match(html, /href="\.\.\/"/);
  assert.doesNotMatch(html, /payment_id|signature|callback|query|transaction identifier/i);
});
