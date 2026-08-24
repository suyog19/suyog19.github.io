const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'support', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'support.css'), 'utf8');

test('support page implements the approved hierarchy and public metadata', () => {
  assert.match(html, /<title>Support the Work \| Suyog Joshi<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/suyogjoshi\.com\/support\/"/);
  assert.match(html, /<meta property="og:url" content="https:\/\/suyogjoshi\.com\/support\/"/);
  assert.match(html, /<meta name="twitter:card" content="summary"/);
  assert.match(html, /G-PKL56GJ38H/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);

  const markers = [
    'id="support-title"',
    'id="support-enables-title"',
    'id="support-choices-title"',
    'id="support-once-title"',
    'id="support-regular-title"',
    'id="support-other-title"',
    'id="support-boundary-title"',
  ].map((marker) => html.indexOf(marker));
  assert.ok(markers.every((position) => position >= 0));
  assert.deepEqual(markers, [...markers].sort((a, b) => a - b));
});

test('financial choices remain equal and fail closed until provider stories verify them', () => {
  assert.equal((html.match(/class="support-choice-card"/g) || []).length, 2);
  assert.match(html, /<a[^>]*aria-disabled="true"[^>]*data-support-razorpay[^>]*>Support once with Razorpay<\/a>/);
  assert.match(html, /<button[^>]*disabled[^>]*>Support regularly on GitHub<\/button>/);
  assert.match(html, /Razorpay path has been verified/);
  assert.match(html, /GitHub Sponsors path has been verified/);
  assert.doesNotMatch(html, /href="https:\/\/(?:[^"/]+\.)?rzp\.io/i);
  assert.doesNotMatch(html, /href="https:\/\/github\.com\/sponsors\//i);
  assert.doesNotMatch(html, /recommended|most popular|donate now|buy me a coffee/i);
  assert.match(html, /Each option is activated only after its secure provider path has been verified/);
});

test('non-financial support and commercial boundaries remain explicit', () => {
  for (const route of ['../writing/', '../systems/', '../contact/']) {
    assert.match(html, new RegExp(`href="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  }
  assert.match(html, /Support is voluntary/);
  assert.match(html, /does not purchase training, consulting, influence, priority support, access, or a promised deliverable/);
  assert.match(html, /public work is not gated behind a contribution/);
  assert.match(html, /provider's site under its terms and privacy practices/);
});

test('support uses the established public shell without primary-navigation expansion', () => {
  const primaryNav = html.match(/<nav\b[^>]*aria-label="Primary navigation"[^>]*>[\s\S]*?<\/nav>/);
  assert.ok(primaryNav);
  assert.doesNotMatch(primaryNav[0], />Support<\/a>/);
  for (const asset of ['../css/base.css', '../css/components.css', '../css/pages.css', '../css/support.css', '../js/script.js', '../js/support-payment.js']) {
    assert.match(html, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(html, /<img\b|<iframe\b|<form\b|data-[a-z-]*payment/i);
});

test('support composition is scoped and responsive without a new interaction system', () => {
  for (const selector of ['.support-hero', '.support-split', '.support-choice-grid', '.support-choice-card', '.support-boundary-copy']) {
    assert.match(css, new RegExp(selector.replace('.', '\\.')));
  }
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*?\.support-choice-grid[\s\S]*?grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*?\.support-choice-action \.btn[\s\S]*?width: 100%/);
  const localScripts = [...html.matchAll(/<script[^>]+src="(\.\.[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(localScripts, ['../js/script.js', '../js/support-payment.js']);
});
