const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('homepage opening retains the Software Signal motto and founder relationship', () => {
  assert.match(home, /Software Signal[^<]*· founded by Suyog Joshi/);
  assert.match(home, /Move fast\.<br><span>Engineer reliably\.<\/span>/);
});

test('homepage opening gives a first-time visitor a plain-language proposition', () => {
  const opening = home.match(/<section class="home-opening[\s\S]*?<\/section>/)?.[0] || '';

  assert.match(opening, /software professionals and teams/i);
  assert.match(opening, /AI (?:performs|takes on) more engineering work/i);
  assert.match(opening, /(?:sound )?judgment, reliability, (?:and|or) accountability/i);
  for (const surface of ['Framework', 'Research', 'Consulting', 'Learning']) {
    assert.match(opening, new RegExp(surface));
  }
});

test('homepage bridge preserves the deeper thesis and existing routes', () => {
  assert.match(home, /Not a catalogue of AI tools\./);
  assert.match(home, /Why Software Signal exists/);
  assert.match(home, /The Reliable Engineering Framework/);
  assert.match(home, /Research is the knowledge engine/);
  assert.match(home, /href="framework\/"[^>]*data-home-event="home_framework_click"/);
  assert.match(home, /href="#ways-to-engage"/);
  assert.match(home, /href="research\/"/);
});
