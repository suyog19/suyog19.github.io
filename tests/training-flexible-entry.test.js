const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("training/index.html", "utf8");
const script = fs.readFileSync("js/training-journey.js", "utf8");

test("My Learning remains only in the main navigation", () => {
  assert.equal((html.match(/>My Learning<\/a/g) || []).length, 1);
  const primaryNav = html.match(/<nav class="nav"[\s\S]*?<\/nav>/)[0];
  assert.match(primaryNav, /href="\.\.\/my-learning\/"/);
  assert.match(primaryNav, /class="nav-link learning-header-action"/);
  const subnav = html.match(/<nav class="learning-subnav"[\s\S]*?<\/nav>/)[0];
  const hero = html.match(
    /<section class="training-hero[\s\S]*?<\/section>/,
  )[0];
  assert.doesNotMatch(subnav, /My Learning|my-learning/);
  assert.doesNotMatch(hero, /My Learning|my-learning/);
});

test("hero prioritises starting-point guidance before journey exploration", () => {
  const heroActions = html.match(
    /<div class="training-actions">[\s\S]*?<\/div>/,
  )[0];
  const starting = heroActions.indexOf("Find my starting point");
  const journey = heroActions.indexOf("Explore the learning journey");
  assert.ok(starting > -1 && starting < journey);
  assert.match(
    heroActions,
    /class="btn btn-primary btn-learning"[\s\S]*?href="#starting-point"/,
  );
  assert.match(heroActions, /class="btn btn-secondary"[\s\S]*?href="#journey"/);
});

test("five-stage route stays intact and clearly supports flexible entry", () => {
  assert.equal(
    (html.match(/class="journey-stage" aria-label="Stage [1-5]"/g) || [])
      .length,
    5,
  );
  assert.match(
    html,
    /Start at the stage that matches your current experience\./,
  );
  assert.match(html, /You do not need to begin at Stage 1\./);
  assert.match(html, /not a mandatory\s+sequence/);
});

test("one three-question assessment can recommend every stage", () => {
  assert.equal((html.match(/data-starting-assessment/g) || []).length, 1);
  assert.equal((html.match(/<fieldset>/g) || []).length, 3);
  assert.doesNotMatch(html, /data-starting-profile|class="starting-card"/);

  const context = {
    window: {},
    document: {
      getElementById: () => null,
      querySelector: () => null,
      addEventListener: () => {},
    },
  };
  vm.runInNewContext(script, context);
  const recommend = context.window.sjTrainingJourney.recommendStartingStage;
  assert.equal(
    recommend({
      pythonReadiness: "new",
      dataReadiness: "no",
      aiReadiness: "no",
    }),
    1,
  );
  assert.equal(
    recommend({
      pythonReadiness: "fundamentals",
      dataReadiness: "no",
      aiReadiness: "no",
    }),
    2,
  );
  assert.equal(
    recommend({
      pythonReadiness: "fundamentals",
      dataReadiness: "yes",
      aiReadiness: "no",
    }),
    3,
  );
  assert.equal(
    recommend({
      pythonReadiness: "applications",
      dataReadiness: "yes",
      aiReadiness: "no",
    }),
    4,
  );
  assert.equal(
    recommend({
      pythonReadiness: "applications",
      dataReadiness: "yes",
      aiReadiness: "yes",
    }),
    5,
  );
  assert.match(script, /You are ready to begin at Stage/);
  assert.match(script, /Stages 1 to 4 are not required/);
});

test("course cards state readiness without locking later stages", () => {
  assert.equal(
    (html.match(/<strong>Start here if:<\/strong>/g) || []).length,
    5,
  );
  assert.equal((html.match(/class="course-readiness-note"/g) || []).length, 4);
  assert.match(html, /Stage 1 is not required if you meet these/);
  assert.match(html, /Earlier stages are not required if you meet these/);
});
