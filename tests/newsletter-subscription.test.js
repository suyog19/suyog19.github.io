const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const writing = fs.readFileSync(path.join(root, 'writing', 'index.html'), 'utf8');
const newsletter = fs.readFileSync(path.join(root, 'newsletter', 'index.html'), 'utf8');
const confirmed = fs.readFileSync(path.join(root, 'newsletter', 'confirmed', 'index.html'), 'utf8');
const privacy = fs.readFileSync(path.join(root, 'privacy', 'index.html'), 'utf8');
const behavior = fs.readFileSync(path.join(root, 'js', 'newsletter.js'), 'utf8');
const formId = '73d5eecc-14a6-4de7-9654-a6b57f593298';

test('newsletter signup uses the production email-only beehiiv embed without client secrets', () => {
  for (const [name, html] of [['home', home], ['newsletter', newsletter]]) {
    assert.match(html, new RegExp(`data-beehiiv-form="${formId}"`), `${name} must use the production form`);
    assert.match(html, /subscribe-forms\.beehiiv\.com\/v3\/loader\.js/);
    assert.match(html, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
    assert.doesNotMatch(html, /api[_-]?key|authorization\s*:/i);
  }
});

test('newsletter discovery remains contextual and preserves a hosted fallback', () => {
  assert.match(home, /href="newsletter\/"/);
  assert.match(writing, /href="\.\.\/newsletter\/"/);
  assert.match(newsletter, /https:\/\/newsletter\.suyogjoshi\.com\/subscribe/);
  assert.match(newsletter, /check your inbox|confirmation email|email you to confirm/i);
  assert.match(newsletter, /href="\.\.\/privacy\/"/);
});

test('signup wording records explicit newsletter consent before the form action', () => {
  for (const [name, html] of [['home', home], ['newsletter', newsletter]]) {
    assert.match(html, /By selecting Subscribe, you ask to receive Software Signal Weekly/,
      `${name} must state the newsletter-specific consent action`);
    assert.match(html, /one practical email every Saturday/);
    assert.match(html, /(?:your )?subscription starts only after confirmation/);
    assert.match(html, /Unsubscribe (?:anytime|at any time)/);
    assert.match(html, /Privacy Notice/);
    const consentIndex = html.indexOf('By selecting Subscribe');
    const unsubscribeIndex = html.indexOf('Unsubscribe', consentIndex);
    const privacyIndex = html.indexOf('Privacy Notice', consentIndex);
    const formIndex = html.indexOf('class="newsletter-embed"', consentIndex);
    assert.ok(consentIndex >= 0 && unsubscribeIndex > consentIndex && privacyIndex > consentIndex,
      `${name} must present unsubscribe and privacy information with the consent statement`);
    assert.ok(unsubscribeIndex < formIndex && privacyIndex < formIndex,
      `${name} must present unsubscribe and privacy information before the form action`);
  }
  assert.match(newsletter, /Email only; no name or profile is required/);
});

test('generated provider frames receive a stable accessible title', () => {
  assert.match(behavior, /querySelectorAll\('\.newsletter-embed'\)/);
  assert.match(behavior, /setAttribute\('title', 'Subscribe to Software Signal Weekly'\)/);
  assert.match(home, /src="js\/newsletter\.js"/);
  assert.match(newsletter, /src="\.\.\/js\/newsletter\.js"/);
});

test('privacy notice discloses newsletter processing and preserves the training snapshot', () => {
  assert.match(privacy, /software-signal-privacy@1\.2\.0/);
  assert.match(privacy, /beehiiv receives your email address/i);
  assert.match(privacy, /double opt-in/i);
  assert.match(privacy, /suppression record/i);
  assert.match(privacy, /eligible deletion/i);
  assert.match(privacy, /software-signal-privacy@1\.1\.0/);
});

test('double-opt-in confirmation destination acknowledges success without another form', () => {
  const main = confirmed.match(/<main[\s\S]*?<\/main>/)[0];
  assert.match(confirmed, /Your subscription is confirmed/);
  assert.match(confirmed, /no need to enter your email again/i);
  assert.match(confirmed, /arrive in your inbox on Saturday/i);
  assert.match(confirmed, /https:\/\/newsletter\.suyogjoshi\.com\//);
  assert.match(confirmed, /href="\.\.\/\.\.\/"/);
  assert.match(confirmed, /name="robots" content="noindex, follow"/);
  assert.doesNotMatch(main, /<form\b|data-beehiiv-form|>Subscribe</i);
});
