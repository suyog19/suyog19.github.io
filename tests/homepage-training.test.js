const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const analytics = fs.readFileSync('js/homepage.js', 'utf8');
const courseActions = fs.readFileSync('js/course-actions.js', 'utf8');

test('homepage promotes Training before the three primary entry points', () => {
  assert.ok(html.indexOf('id="training-spotlight"') > html.indexOf('id="hero"'));
  assert.ok(html.indexOf('id="training-spotlight"') < html.indexOf('id="start-here"'));
  assert.match(html, />Explore training<\/a>/);
  assert.match(html, />Browse writing<\/a>/);
  const entrySection = html.match(/<section class="entry-points"[\s\S]*?<\/section>/)[0];
  assert.equal((entrySection.match(/entry-point-card/g) || []).length, 3);
  assert.ok(entrySection.indexOf('href="training/"') < entrySection.indexOf('href="writing/"'));
  assert.ok(entrySection.indexOf('href="writing/"') < entrySection.indexOf('href="systems/"'));
});

test('homepage shows only the two launched course identities and starts actions closed', () => {
  const cards = html.match(/<article class="home-course-card"[\s\S]*?<\/article>/g) || [];
  assert.equal(cards.length, 2);
  assert.match(cards[0], /crs_python_foundations/);
  assert.match(cards[1], /crs_applied_python/);
  cards.forEach(card => assert.match(card, /data-course-action="transactional"[^>]*hidden/));
});

test('homepage consolidates writing and instruments the approved hierarchy', () => {
  assert.match(html, /Writing and Guides/);
  assert.equal((html.match(/AI-Assisted Software Engineering/g) || []).length, 1);
  for (const event of ['home_training_click', 'home_writing_click', 'home_training_spotlight_view', 'home_training_course_detail_click', 'home_training_course_action_click', 'home_offering_click', 'home_writing_series_click', 'home_system_click', 'home_consulting_click']) assert.match(`${html}\n${analytics}\n${courseActions}`, new RegExp(event));
  assert.doesNotMatch(analytics, /email|application_id|cohort_id/i);
});

test('homepage Writing section uses a coherent three-image editorial system', () => {
  const writingSection = html.match(/<section class="writing"[\s\S]*?<\/section>/)?.[0] || '';
  const expectedCovers = [
    'writing/series/ai-assisted-software-engineering/series-cover.webp',
    'writing/not-all-engineering-tasks-belong-to-ai/cover.webp',
    'writing/how-to-tame-your-agent/cover.webp',
  ];

  assert.equal((writingSection.match(/<img\b/g) || []).length, 3);
  expectedCovers.forEach(cover => assert.match(writingSection, new RegExp(cover.replaceAll('/', '\\/'))));
  assert.equal((writingSection.match(/loading="lazy"/g) || []).length, 3);
  assert.equal((writingSection.match(/decoding="async"/g) || []).length, 3);
});
