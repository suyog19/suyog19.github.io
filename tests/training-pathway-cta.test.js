const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('training/index.html', 'utf8');
const journeyScript = fs.readFileSync('js/training-journey.js', 'utf8');
const actionsScript = fs.readFileSync('js/course-actions.js', 'utf8');
const css = fs.readFileSync('css/learning.css', 'utf8');

const cards = html.match(/<article\s+class="journey-card"[\s\S]*?<\/article>/g) || [];

test('each pathway card has exactly one static course navigation CTA', () => {
  assert.equal(cards.length, 5);
  for (const card of cards) {
    assert.equal((card.match(/<a\s/g) || []).length, 1);
    assert.equal((card.match(/class="[^"]*journey-course-cta[^"]*"/g) || []).length, 1);
    assert.doesNotMatch(card, /Notify me|Get notified|Register interest|Apply now|View course and apply/);
  }
  assert.equal((html.match(/>View course<\/a/g) || []).length, 2);
  assert.equal((html.match(/>Preview course<\/a/g) || []).length, 3);
});

test('pathway CTA routes, labels, and accessible names match lifecycle context', () => {
  const expected = [
    ['python-foundations-for-data-science/', 'View course', 'View Python Foundations for Data Science'],
    ['applied-data-analysis-with-python/', 'View course', 'View Applied Data Analysis with Python'],
    ['practical-machine-learning-foundations/', 'Preview course', 'Preview Practical Machine Learning Foundations'],
    ['generative-ai-application-development/', 'Preview course', 'Preview Generative AI Application Development'],
    ['engineering-reliable-ai-systems/', 'Preview course', 'Preview Engineering Reliable AI Systems'],
  ];
  expected.forEach(([href, label, accessibleName], index) => {
    assert.match(cards[index], new RegExp(`href="${href}"`));
    assert.match(cards[index], new RegExp(`>${label}<\\/a`));
    assert.match(cards[index], new RegExp(`aria-label="${accessibleName}"`));
  });
});

test('shared action controller never initialises or mutates pathway cards', () => {
  assert.doesNotMatch(actionsScript, /querySelectorAll\('\.journey-card'\)/);
  assert.doesNotMatch(actionsScript, /TRAINING_JOURNEY/);
  assert.match(actionsScript, /View course and apply/);
  assert.match(actionsScript, /const page = document\.querySelector\('\[data-course-detail\]'\)/);
  assert.match(actionsScript, /detailActionLinks\(\)\.forEach\(link => updateLink/);
  assert.match(actionsScript, /if \(!item\) \{ failClosed\(\); return; \}/);
});

test('API failure leaves a static pathway link untouched while detail actions fail closed', () => {
  const pathwayLink = {
    hidden: false,
    href: 'python-foundations-for-data-science/',
    removeAttribute(name) { if (name === 'href') this.href = null; },
  };
  const detailLink = {
    hidden: false,
    href: '/apply/?courseId=crs_python_foundations',
    removeAttribute(name) { if (name === 'href') this.href = null; },
  };
  const document = {
    querySelector(selector) {
      return selector === '[data-course-detail]' ? { dataset: { courseId: 'crs_python_foundations' } } : null;
    },
    querySelectorAll(selector) {
      if (selector.includes('[data-course-action="notify"]')) return [];
      if (selector.includes('.course-hero')) return [detailLink];
      return [];
    },
  };
  const context = {
    location: { hostname: 'unknown.invalid' },
    document,
    window: {},
    fetch: () => { throw new Error('must not fetch'); },
  };
  vm.runInNewContext(actionsScript, context);
  assert.equal(pathwayLink.href, 'python-foundations-for-data-science/');
  assert.equal(pathwayLink.hidden, false);
  assert.equal(detailLink.href, null);
  assert.equal(detailLink.hidden, true);
});

test('recommendation changes only CTA treatment, never label or destination', () => {
  assert.match(journeyScript, /node\.classList\.toggle\("is-recommended", recommended\)/);
  assert.match(journeyScript, /cta\.classList\.toggle\("journey-course-cta--recommended", recommended\)/);
  assert.doesNotMatch(journeyScript, /courseAction\.(?:textContent|href)\s*=/);
  assert.doesNotMatch(journeyScript, /result\.focus\(\)/);
  assert.match(css, /\.training-journey-page #journey \.journey-actions \.journey-course-cta/);
  assert.match(css, /\.journey-course-cta\.journey-course-cta--recommended/);
  assert.match(css, /li\.is-recommended \.journey-card \{ border-width: 1px; outline: 2px/);
  assert.match(css, /min-height: 2\.75rem/);
  assert.match(css, /\.journey-course-cta:focus-visible/);
});

test('one pathway navigation event carries CTA and recommendation context', () => {
  assert.equal((journeyScript.match(/training_pathway_course_viewed/g) || []).length, 2);
  for (const parameter of ['course_id', 'course_position', 'course_lifecycle_status', 'cta_label', 'recommended']) {
    assert.match(journeyScript, new RegExp(parameter));
  }
  assert.doesNotMatch(journeyScript, /training_(?:notify_me|register_interest|enrolment)_click/);
  assert.match(journeyScript, /View recommended course/);
});
