const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const writing = fs.readFileSync(path.join(root, 'writing', 'index.html'), 'utf8');
const newsletter = fs.readFileSync(path.join(root, 'newsletter', 'index.html'), 'utf8');
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
  assert.match(newsletter, /check your inbox|confirmation email/i);
  assert.match(newsletter, /href="\.\.\/privacy\/"/);
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
