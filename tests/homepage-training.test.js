const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const analytics = fs.readFileSync('js/homepage.js', 'utf8');
const courseActions = fs.readFileSync('js/course-actions.js', 'utf8');

test('homepage places Featured now directly after the asymmetric hero', () => {
  assert.ok(html.indexOf('class="hero-system"') > html.indexOf('id="hero"'));
  assert.ok(html.indexOf('id="featured-now"') > html.indexOf('id="hero"'));
  assert.ok(html.indexOf('id="featured-now"') < html.indexOf('id="start-here"'));
  assert.match(html, />Explore training<\/a>/);
  assert.match(html, />Browse writing<\/a>/);
  const entrySection = html.match(/<section class="entry-points"[\s\S]*?<\/section>/)[0];
  assert.equal((entrySection.match(/entry-point-card/g) || []).length, 3);
  assert.ok(entrySection.indexOf('href="training/"') < entrySection.indexOf('href="writing/"'));
  assert.ok(entrySection.indexOf('href="writing/"') < entrySection.indexOf('href="systems/"'));
});

test('Featured now has one lead and three supporting items with deliberate media', () => {
  const featured = html.match(/<section class="featured-now"[\s\S]*?<\/section>/)[0];
  assert.equal((featured.match(/<article class="feature-card/g) || []).length, 4);
  assert.equal((featured.match(/feature-card--lead/g) || []).length, 1);
  assert.equal((featured.match(/feature-card-media/g) || []).length, 4);
  assert.equal((featured.match(/<img /g) || []).length, 2);
  assert.match(featured, /width="1672" height="941"/);
  assert.equal((featured.match(/loading="lazy" decoding="async"/g) || []).length, 2);
  assert.doesNotMatch(featured, /fetchpriority="high"/);
});

test('homepage shows only the two launched course identities and starts actions closed', () => {
  const cards = html.match(/<article class="feature-card feature-card--course home-course-card"[\s\S]*?<\/article>/g) || [];
  assert.equal(cards.length, 2);
  assert.match(cards[0], /crs_python_foundations/);
  assert.match(cards[1], /crs_applied_python/);
  cards.forEach(card => assert.match(card, /data-course-action="transactional"[^>]*hidden/));
});

test('homepage consolidates writing and instruments the approved hierarchy', () => {
  assert.match(html, /A guided reading path/);
  assert.equal((html.match(/AI-Assisted Software Engineering/g) || []).length, 1);
  const lowerWriting = html.match(/<section class="writing writing--calm"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(lowerWriting, /Not All Engineering Tasks Belong to AI|Architecture Matters More in the AI Era/);
  for (const event of ['home_training_click', 'home_writing_click', 'home_featured_now_view', 'home_featured_click', 'home_training_course_detail_click', 'home_training_course_action_click', 'home_offering_click', 'home_writing_series_click', 'home_system_click']) assert.match(`${html}\n${analytics}\n${courseActions}`, new RegExp(event));
  for (const field of ['content_type', 'content_id', 'feature_position']) assert.match(analytics, new RegExp(field));
  assert.doesNotMatch(analytics, /email|application_id|cohort_id/i);
});

test('homepage imagery excludes portrait, headshot and stock-person sources', () => {
  assert.doesNotMatch(html, /portrait|headshot|unsplash|pexels|stock-photo/i);
  assert.match(html, /role="img" aria-label="A layered system map/);
});
