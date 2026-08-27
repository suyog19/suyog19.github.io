const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('website-services/index.html', 'utf8');
const css = fs.readFileSync('css/website-services.css', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');

test('Website Services publishes the canonical route and launch prices', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/suyogjoshi\.com\/website-services\/"/);
  assert.match(html, /<meta name="robots" content="index, follow"/);
  for (const copy of ['Landing / Campaign Page', 'from ₹9,999', 'Starter Presence', '₹19,999', 'Business Website', '₹39,999', 'Website Redesign', 'from ₹25,000', 'Website Care', 'from ₹1,999\/month', 'Custom Website starts from ₹60,000', 'Website Enhancement starts from ₹5,000']) assert.match(html, new RegExp(copy));
  assert.equal((html.match(/class="ws-package"/g) || []).length, 5);
});

test('packages are outcome-led and boundaries remain explicit', () => {
  for (const phrase of ['Choose by the job your website needs to do', 'not rigid page-count bundles', 'build-and-handover', 'Customer owns the infrastructure', 'Website Care is optional', 'Full e-commerce platforms', 'SaaS or product applications', 'Full professional copywriting is separately scoped']) assert.match(html, new RegExp(phrase, 'i'));
  assert.match(html, /Formal WCAG certification, penetration testing, guaranteed SEO rankings, guaranteed conversion, zero downtime[\s\S]*separately scoped/i);
  assert.doesNotMatch(html, /client logo|book now|checkout|quote calculator|create account/i);
  assert.match(html, /testimonials or case studies supplied by you/i);
});

test('enquiry links carry only fixed non-sensitive topics', () => {
  const topics = [...html.matchAll(/href="\.\.\/contact\/\?topic=([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(topics)], ['website-services-help-choose', 'website-services-landing', 'website-services-starter', 'website-services-business', 'website-services-redesign', 'website-services-care']);
  assert.doesNotMatch(topics.join(' '), /name|email|company|message|website[_-]?url|business[_-]?detail/i);
});

test('route uses scoped assets, responsive layouts, and secondary Home discovery', () => {
  for (const asset of ['../css/base.css', '../css/components.css', '../css/pages.css', '../css/website-services.css', '../js/script.js', '../js/website-services-analytics.js']) assert.match(html, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(css, /@media \(max-width: 800px\)[\s\S]*\.ws-package[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.ws-enquiry-action \.btn[\s\S]*width: 100%/);
  assert.match(css, /\.ws-process\s*\{[^}]*list-style:\s*none/);
  assert.match(css, /@media \(max-width: 480px\)[\s\S]*?\.ws-process\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.equal((html.match(/<ol class="ws-process"[\s\S]*?<\/ol>/) || [''])[0].match(/<li>/g)?.length, 9);
  assert.match(html, /<strong>Discover<\/strong><p>We learn about your work, audience, current situation, and goals\.<\/p>/);
  assert.match(html, /<strong>Stabilize<\/strong><p>We monitor the launch and fix covered post-launch defects\.<\/p>/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(home, /href="website-services\/"/);
  assert.match(home.slice(home.indexOf('<nav class="nav"'), home.indexOf('</nav>')), /href="website-services\/"[^>]*>Website Services<\/a>/);
});
