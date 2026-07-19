const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("training/index.html", "utf8");
const script = fs.readFileSync("js/training-journey.js", "utf8");
const learningCss = fs.readFileSync("css/learning.css", "utf8");

test("My Learning remains only in the main navigation", () => {
  assert.equal((html.match(/>My Learning<\/a/g) || []).length, 1);
  const primaryNav = html.match(/<nav class="nav"[\s\S]*?<\/nav>/)[0];
  const subnav = html.match(/<nav class="learning-subnav"[\s\S]*?<\/nav>/)[0];
  assert.match(primaryNav, /href="\.\.\/my-learning\/"/);
  assert.doesNotMatch(subnav, /My Learning|my-learning/);
});

test("hero actions focus the selector before offering pathway exploration", () => {
  const hero = html.match(
    /<section class="training-hero[\s\S]*?<\/section>/,
  )[0];
  assert.ok(
    hero.indexOf("Find my starting point") <
      hero.indexOf("Explore the learning pathway"),
  );
  assert.match(
    hero,
    /class="btn btn-primary btn-learning"[\s\S]*?href="#starting-point"/,
  );
  assert.match(hero, /class="btn btn-secondary"[\s\S]*?href="#journey"/);
  assert.match(html, /id="starting-point"[\s\S]*?tabindex="-1"/);
  assert.match(html, /id="journey"[\s\S]*?tabindex="-1"/);
  assert.match(script, /target\.focus\(\{ preventScroll: true \}\)/);
});

test("one compact five-option selector precedes the connected pathway", () => {
  assert.ok(html.indexOf('id="starting-point"') < html.indexOf('id="journey"'));
  assert.equal((html.match(/name="readiness"/g) || []).length, 5);
  for (const label of [
    "New to Python",
    "Know basic Python",
    "Can analyse data with Python",
    "Understand ML fundamentals",
    "Already build AI applications",
  ])
    assert.match(html, new RegExp(label));
  assert.doesNotMatch(html, /<fieldset>[\s\S]*?<fieldset>/);
  assert.match(html, /role="status"[\s\S]*?aria-live="polite"/);
});

test("each readiness option maps to exactly one course in a single configuration", () => {
  const context = {
    window: {},
    document: {
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener: () => {},
    },
  };
  vm.runInNewContext(script, context);
  const api = context.window.sjTrainingJourney;
  assert.equal(api.pathway.length, 5);
  const mappings = [
    ["new-python", "python-foundations"],
    ["basic-python", "data-analysis"],
    ["data-analysis", "machine-learning"],
    ["ml-fundamentals", "generative-ai"],
    ["ai-applications", "reliable-ai"],
  ];
  for (const [readiness, course] of mappings) {
    assert.equal(api.recommendCourse(readiness).id, course);
  }
  assert.equal(
    new Set(api.pathway.map((course) => course.readinessId)).size,
    5,
  );
  assert.equal(api.recommendCourse("unknown"), null);
});

test("pathway removes public stage numbering while keeping five visible course cards", () => {
  assert.equal((html.match(/data-course-node=/g) || []).length, 5);
  assert.equal((html.match(/class="journey-card"/g) || []).length, 5);
  assert.doesNotMatch(
    html,
    /Stage [1-5]|five-stage|data-course-stage|journey-stage/i,
  );
  assert.match(html, /recommended progression, not mandatory completion/);
  assert.doesNotMatch(script, /\.hidden = !selected|panel\.hidden/);
});

test("course cards separate specific eligibility from availability and keep detail links", () => {
  assert.equal((html.match(/class="journey-eligibility"/g) || []).length, 5);
  assert.equal((html.match(/class="journey-statuses"/g) || []).length, 5);
  assert.equal((html.match(/>View course<\/a/g) || []).length, 2);
  assert.equal((html.match(/>Preview course<\/a/g) || []).length, 3);
  assert.match(html, /No prior Python experience required/);
  assert.match(html, /Requires basic Python/);
  assert.match(html, /Requires Python and data-analysis fundamentals/);
  assert.match(html, /Requires ML fundamentals/);
  assert.match(html, /Requires experience building AI applications/);
  assert.doesNotMatch(html, />Enrol now<\/a/);
});

test("recommendations are visually explicit, responsive, reduced-motion safe, and tracked", () => {
  assert.equal((html.match(/Recommended for you/g) || []).length, 5);
  assert.match(learningCss, /input:checked \+ span::before/);
  assert.match(
    learningCss,
    /border: 3px solid var\(--learning-accent-strong\)/,
  );
  assert.match(
    learningCss,
    /@media \(max-width: 700px\)[\s\S]*?grid-template-columns: 1fr/,
  );
  assert.match(learningCss, /@media \(prefers-reduced-motion: reduce\)/);
  for (const eventName of [
    "training_readiness_selected",
    "training_recommended_course_shown",
    "training_recommended_course_viewed",
    "training_pathway_course_viewed",
  ])
    assert.match(script, new RegExp(eventName));
});

test("new presentation rules are scoped to the Training journey page", () => {
  assert.match(
    learningCss,
    /\/\* Eligibility-based pathway \(Training landing page only\) \*\//,
  );
  assert.doesNotMatch(learningCss, /\n\.readiness-(?:selector|options|option)/);
  assert.match(learningCss, /\.training-journey-page \.readiness-options/);
  assert.match(learningCss, /\.training-journey-page #journey \.journey-grid/);
});
