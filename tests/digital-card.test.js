const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('card/index.html', 'utf8');
const vcard = fs.readFileSync('card/suyog-joshi.vcf', 'utf8');
const qr = fs.readFileSync('assets/card-qr.svg', 'utf8');
const script = fs.readFileSync('js/card.js', 'utf8');

test('digital card exposes the canonical identity-first journey without JavaScript', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/suyogjoshi\.com\/card\/">/);
  assert.match(html, /<h1 id="card-name">Suyog Joshi<\/h1>/);
  assert.match(html, /href="suyog-joshi\.vcf"[^>]+download="Suyog-Joshi\.vcf"[^>]*>Save Contact/);
  assert.match(html, /href="https:\/\/www\.linkedin\.com\/in\/suyog-joshi"/);
  assert.match(html, /href="mailto:contact@suyogjoshi\.com"/);
  assert.match(html, /src="\.\.\/assets\/card-qr\.svg"/);
  assert.match(html, /href="\.\.\/css\/card\.css\?v=600-1"/);
  assert.match(html, />suyogjoshi\.com\/card\/<\/a>/);
  assert.doesNotMatch(html, /<form\b|newsletter|testimonial/i);
});

test('owned vCard contains only approved public professional fields', () => {
  const required = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Suyog Joshi',
    'ORG:Software Signal',
    'TITLE:Software Engineer · AI · Software Architecture',
    'EMAIL;TYPE=INTERNET,WORK:contact@suyogjoshi.com',
    'URL;TYPE=WORK:https://suyogjoshi.com/',
    'URL;TYPE=PROFILE:https://www.linkedin.com/in/suyog-joshi',
    'END:VCARD'
  ];
  for (const field of required) assert.ok(vcard.includes(field), `missing ${field}`);
  assert.doesNotMatch(vcard, /^(TEL|ADR|BDAY|GENDER|UID|PHOTO)[;:]/m);
  assert.match(fs.readFileSync('.gitattributes', 'utf8'), /^card\/\*\.vcf text eol=crlf$/m);
  for (const line of vcard.split(/\r?\n/).filter(Boolean)) {
    assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `vCard line exceeds 75 octets: ${line}`);
  }
  assert.match(vcard, /systems\.\r?\n Digital card:/, 'long NOTE must use vCard whitespace folding');
});

test('QR is a local high-contrast SVG with an explicit quiet zone', () => {
  assert.match(qr, /<svg[^>]+viewBox="0 0 29\.6 29\.6"/);
  assert.match(qr, /fill="#000000"/);
  assert.match(qr, /M3\.2,3\.2/);
  assert.doesNotMatch(qr, /<script|foreignObject/i);
});

function loadCard({ share, clipboard, analytics } = {}) {
  const listeners = {};
  const status = { textContent: '' };
  const button = { addEventListener(name, listener) { listeners[name] = listener; } };
  const document = {
    querySelector(selector) {
      if (selector === '[data-share-card]') return button;
      if (selector === '[data-share-status]') return status;
      return null;
    },
    addEventListener(name, listener) { listeners[`document:${name}`] = listener; }
  };
  const navigator = { share, clipboard };
  const window = { gtag: analytics };
  vm.runInNewContext(script, { document, navigator, window, Set });
  return { listeners, status };
}

test('native share receives only durable public card content', async () => {
  let payload;
  const state = loadCard({ share: async value => { payload = value; } });
  await state.listeners.click();
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    title: 'Suyog Joshi — Digital Card',
    text: 'Save Suyog Joshi’s professional contact details and explore his work.',
    url: 'https://suyogjoshi.com/card/'
  });
  assert.equal(state.status.textContent, 'Card shared.');
});

test('share fallback copies the canonical URL and analytics emits no PII', async () => {
  let copied;
  const calls = [];
  const state = loadCard({
    clipboard: { writeText: async value => { copied = value; } },
    analytics: (...args) => calls.push(args)
  });
  await state.listeners.click();
  assert.equal(copied, 'https://suyogjoshi.com/card/');
  assert.equal(state.status.textContent, 'Card address copied.');

  state.listeners['document:click']({
    target: { closest: () => ({ dataset: { cardEvent: 'card_email_select' } }) }
  });
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['event', 'card_email_select', { source_page: 'digital_card' }]]);
  assert.doesNotMatch(JSON.stringify(calls), /@|linkedin|suyogjoshi\.com\/card|contact/i);
});
