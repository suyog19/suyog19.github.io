const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Petrol Teal is the authoritative shared Software Signal palette', () => {
  const base = read('css/base.css');
  assert.match(base, /--color-signal:\s+#1f5a5a;/i);
  assert.match(base, /--color-signal-dark:\s+#174646;/i);
  assert.match(base, /--color-signal-wash:\s+#f1f6f5;/i);

  const learning = read('css/learning.css');
  assert.match(learning, /--learning-accent:\s+var\(--color-signal\)/);
  assert.match(learning, /--learning-accent-strong:\s+var\(--color-signal\)/);
  assert.match(learning, /--learning-accent-soft:\s+var\(--color-signal-wash\)/);
});

test('identity and generated preview sources use one Petrol Teal direction', () => {
  assert.match(read('favicon.svg'), /fill="#1f5a5a"/i);
  const generator = read('scripts/generate_social_previews.py');
  assert.match(generator, /BRAND_ACCENT\s*=\s*"#1f5a5a"/i);
  assert.doesNotMatch(generator, /CORE_ACCENT|LEARNING_ACCENT/);
});

test('homepage dark sections use accessible Petrol Teal wash instead of legacy pink accents', () => {
  const pages = read('css/pages.css');
  for (const selector of [
    '.home-tension .eyebrow',
    '.evidence-type',
    '.home-final .eyebrow',
    '.final-link:hover, .final-primary:hover',
  ]) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(pages, new RegExp(`${escaped}\\s*\\{[^}]*color:\\s*var\\(--color-signal-wash\\)`, 's'));
  }
  assert.doesNotMatch(pages, /#fca5a5/i);
  assert.match(read('index.html'), /css\/pages\.css\?v=652/);

  const luminance = (hex) => {
    const channels = hex.match(/[a-f\d]{2}/gi).map((channel) => parseInt(channel, 16) / 255);
    const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const foreground = luminance('#f1f6f5');
  const background = luminance('#171717');
  assert.ok((foreground + 0.05) / (background + 0.05) >= 4.5, 'dark-surface Petrol Teal text must meet WCAG AA');
});

test('remaining legacy reds are confined to intentional semantic states', () => {
  const files = ['css/components.css', 'css/pages.css', 'css/learning.css'];
  const allowedContext = /invalid|error|failed|missing|low|exception|attention|deadline|warning|over-limit/i;
  for (const file of files) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!/#(?:b91c1c|991b1b|7f1d1d|fef2f2|fff7f7)/i.test(line)) return;
      const context = lines.slice(Math.max(0, index - 6), index + 1).join(' ');
      assert.match(context, allowedContext, `${file}:${index + 1} must document a semantic state`);
    });
  }
});

test('durable design direction records the superseding decision', () => {
  for (const file of ['docs/ux/site-ux-direction.md', 'docs/ux/software-signal-target.md', 'docs/ux/pages/training.md']) {
    const content = read(file);
    assert.match(content, /Petrol Teal/);
    assert.match(content, /supersed/i);
  }
});
