const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const support = fs.readFileSync(path.join(root, 'support', 'index.html'), 'utf8');

function position(fragment) {
  const index = support.indexOf(fragment);
  assert.ok(index >= 0, `missing expected support-page content: ${fragment}`);
  return index;
}

test('support page is a canonical public page with the existing site shell', () => {
  assert.match(support, /<link rel="canonical" href="https:\/\/suyogjoshi\.com\/support\/"/);
  assert.match(support, /<meta property="og:url" content="https:\/\/suyogjoshi\.com\/support\/"/);
  assert.match(support, /G-PKL56GJ38H/);
  assert.match(support, /href="\.\.\/css\/base\.css"/);
  assert.match(support, /href="\.\.\/css\/components\.css"/);
  assert.match(support, /href="\.\.\/css\/pages\.css"/);
  assert.match(support, /src="\.\.\/js\/script\.js"/);
});

test('support context appears before payment choices and stays explicitly optional', () => {
  const context = position('Support the work.');
  const optional = position('Support is entirely optional');
  const oneTime = position('Support once');
  const recurring = position('Support regularly');

  assert.ok(context < oneTime);
  assert.ok(optional < oneTime);
  assert.ok(oneTime < recurring);
  assert.match(support, /does not become paywalled/i);
});

test('GitHub Sponsors is the recurring route and uses safe external-link semantics', () => {
  assert.match(
    support,
    /href="https:\/\/github\.com\/sponsors\/suyog19" target="_blank" rel="noopener noreferrer"[^>]*>Sponsor on GitHub<\/a>/
  );
  assert.match(support, /ongoing monthly support/i);
});

test('Razorpay remains fail-closed until the approved test Payment Page is supplied', () => {
  assert.match(support, /data-support-provider="razorpay"/);
  assert.match(support, /aria-disabled="true"/);
  assert.match(support, /Razorpay test link pending/);
  assert.doesNotMatch(support, /href="https:\/\/rzp\.io\//);
});

test('the static support page does not collect payment data or expose payment secrets', () => {
  assert.doesNotMatch(support, /<form\b/i);
  assert.doesNotMatch(support, /type="(?:card|number|password)"/i);
  assert.doesNotMatch(support, /api[_-]?key|key[_-]?secret|authorization\s*:/i);
  assert.match(support, /does not collect or store your card, UPI, or banking details/i);
});

test('non-financial support and commercial boundaries are visible', () => {
  assert.match(support, /Other ways to help/);
  assert.match(support, /No payment required/);
  assert.match(support, /Support is not a purchase/);
  assert.match(support, /does not purchase consulting, training, priority support/i);
});

test('fundraising dark-pattern language is absent', () => {
  assert.doesNotMatch(support, /countdown|limited time|act now|only \d+ left|urgent|unlock this content/i);
  assert.doesNotMatch(support, /progress(?: bar| meter)|percent funded|goal almost reached/i);
});
