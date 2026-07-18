const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const read = (path) => fs.readFileSync(path, "utf8");
const catalog = JSON.parse(read("data/training-courses.json"));

const courses = [
  {
    id: "crs_ml_foundations",
    stage: 3,
    slug: "practical-machine-learning-foundations",
    title: "Practical Machine Learning Foundations",
    lectures: 16,
    hours: 24,
    capstone: "Build, evaluate, and critique a predictive system",
    boundary: ["deep learning", "LLM", "production MLOps"],
    faqs: [
      "How much statistics",
      "unsupervised learning",
      "scikit-learn pipelines",
      "class imbalance",
      "hyperparameter tuning",
    ],
  },
  {
    id: "crs_genai_apps",
    stage: 4,
    slug: "generative-ai-application-development",
    title: "Generative AI Application Development",
    lectures: 14,
    hours: 21,
    capstone: "Build and evaluate a grounded knowledge assistant",
    boundary: [
      "foundation-model training",
      "unrestricted-agent",
      "production-system engineering",
    ],
    faqs: [
      "machine-learning experience",
      "model provider",
      "vector databases",
      "prompt injection",
      "answer abstention",
    ],
  },
  {
    id: "crs_reliable_ai",
    stage: 5,
    slug: "engineering-reliable-ai-systems",
    title: "Engineering Reliable AI Systems",
    lectures: 14,
    hours: 21,
    capstone: "Engineer a controlled AI workflow",
    boundary: [
      "first AI course",
      "cloud certification",
      "policy-only governance",
    ],
    faqs: [
      "prior AI-application experience",
      "evaluation release gate",
      "failure injection",
      "coding required",
      "Responsible AI and AI Governance",
    ],
  },
];

test("pipeline catalog is transition-ready and prohibits offers", () => {
  for (const expected of courses) {
    const course = catalog.courses.find(
      (item) => item.courseId === expected.id,
    );
    assert.equal(course.lifecycleStatus, "pipeline");
    assert.equal(course.pipelineState, "pipeline-interest-open");
    assert.equal(course.lectureCount, expected.lectures);
    assert.equal(course.sessionDurationMinutes, 90);
    assert.equal(course.detailStatus, "proposed");
    assert.equal(course.offerSchemaPermitted, false);
    assert.equal(
      course.interestFormPath,
      `/training/register-interest/?courseId=${expected.id}`,
    );
    assert.match(course.primaryActionLabel, /Register interest/);
  }
});

test("journey uses the dedicated course-specific interest route", () => {
  const html = read("training/index.html");
  for (const course of courses)
    assert.match(
      html,
      new RegExp(`register-interest/\\?courseId=${course.id}`),
    );
  assert.doesNotMatch(
    html,
    /contact\/\?topic=interest-(practical|generative|engineering)/,
  );
});

test("three pipeline pages use one complete shared static-first structure", () => {
  for (const expected of courses) {
    const html = read(`training/${expected.slug}/index.html`);
    assert.equal((html.match(/<h1/g) || []).length, 1);
    assert.match(html, new RegExp(`<h1[^>]*>${expected.title}</h1>`));
    assert.match(html, /course-detail-grid/);
    assert.match(html, /course-pipeline-card/);
    assert.match(html, /learning-subnav/);
    assert.match(html, /My Learning/);
    assert.match(html, /aria-label="Breadcrumb"/);
    assert.equal((html.match(/<div><dt>/g) || []).length, 9);
    assert.equal((html.match(/class="course-phase"/g) || []).length, 4);
    assert.equal(
      (html.match(/class="course-lecture"/g) || []).length,
      expected.lectures,
    );
    assert.deepEqual(
      [...html.matchAll(/data-lecture="(\d+)"/g)].map((match) =>
        Number(match[1]),
      ),
      Array.from({ length: expected.lectures }, (_, index) => index + 1),
    );
    assert.match(html, /Current curriculum design/);
    assert.match(html, /What still needs to be confirmed before launch/);
    assert.match(html, /Not announced/);
    assert.match(html, /No payment or enrolment commitment/);
    assert.match(html, /Registering interest is not an application/);
    assert.match(html, new RegExp(expected.capstone, "i"));
    assert.match(
      html,
      new RegExp(`${expected.hours} instructor-led hours`, "i"),
    );
    for (const term of expected.boundary)
      assert.match(html, new RegExp(term, "i"));
    for (const question of expected.faqs)
      assert.match(html, new RegExp(question, "i"));
    assert.doesNotMatch(
      html,
      /<script type="application\/ld\+json">[^<]*"Offer"/,
    );
    assert.doesNotMatch(html, />\s*(Apply|Enroll|Reserve a seat)\s*</i);
  }
});

test("interest form is course-specific, consented, bounded and recoverable", () => {
  const html = read("training/register-interest/index.html");
  const js = read("js/course-interest.js");
  for (const field of [
    "name",
    "email",
    "background",
    "capability",
    "intendedOutcome",
    "consent",
    "preferredTimeframe",
    "topicInterests",
    "instructorQuestion",
  ])
    assert.match(html + js, new RegExp(field));
  assert.match(js, /training\/course-actions/);
  assert.match(js, /submitting/);
  assert.match(js, /\[409, 422\]/);
  assert.match(js, /selected\.consentVersion/);
  assert.doesNotMatch(js, /sourcePageUrl|courseTitle:|courseStage:/);
  assert.match(js, /campaign/);
  assert.match(js, /preserve entered data|Your entries are still here/i);
  assert.match(html, /data-consent-statement/);
  assert.match(
    html,
    /No application, waitlist, payment, offer, seat, enrolment, or certificate record/,
  );
});

test("pipeline analytics expose stable identity and interaction events", () => {
  const detail = read("js/course-detail.js");
  const interest = read("js/course-interest.js");
  for (const event of [
    "pipeline_course_page_view",
    "pipeline_interest_cta_view",
    "pipeline_interest_cta_click",
    "pipeline_readiness_open",
    "pipeline_readiness_result",
    "pipeline_capstone_view",
    "pipeline_curriculum_view",
    "pipeline_lecture_expand",
    "pipeline_curriculum_expand_all",
    "pipeline_status_section_view",
    "pipeline_adjacent_course_click",
    "pipeline_journey_click",
  ])
    assert.match(detail + interest, new RegExp(event));
  for (const key of [
    "course_id",
    "course_stage",
    "course_slug",
    "pipeline_state",
    "cta_location",
    "readiness_result",
    "lecture_number",
    "viewport_category",
  ])
    assert.match(detail, new RegExp(key));
});

test("pipeline lifecycle presentation is bounded and fails safely", () => {
  const source = read("js/course-detail.js");
  const context = {
    innerWidth: 1200,
    window: {},
    document: {
      querySelector: (selector) =>
        selector === "[data-course-detail]"
          ? {
              dataset: {
                courseId: "test",
                courseStage: "3",
                courseSlug: "test",
                cohortAvailability: "register-interest",
                pipelineState: "pipeline-interest-open",
              },
            }
          : null,
      querySelectorAll: () => [],
      addEventListener: () => {},
    },
    addEventListener: () => {},
  };
  vm.runInNewContext(source, context);
  const present = context.window.sjCourseLifecycle.pipelinePresentation;
  assert.equal(present("pipeline-interest-open").action, "Register interest");
  assert.equal(present("pipeline-interest-paused").enabled, false);
  assert.equal(present("launch-announced").badge, "LAUNCH PLANNED");
  assert.equal(present("applications-open").useLaunchedCard, true);
  assert.equal(present("unknown").enabled, false);
});
