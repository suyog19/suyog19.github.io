const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync("js/course-interest.js", "utf8");
const context = {
  URLSearchParams,
  window: {},
  document: { querySelector: () => null },
};
vm.createContext(context);
vm.runInContext(source, context);

const { buildPayload } = context.window.sjCourseInterest;
const baseCourse = {
  courseId: "crs_ml_foundations",
  consentVersion: "pipeline-course-interest-v1",
  primaryAction: "REGISTER_INTEREST",
};

test("pipeline interest payload keeps the backend contract with explicit placeholders", () => {
  const params = new URLSearchParams(
    "sourceSurface=COURSE_PAGE&ctaLocation=ENROLMENT_PANEL&utm_source=course",
  );
  const payload = buildPayload(
    baseCourse,
    {
      name: "",
      email: " learner@example.com ",
      consent: true,
      instructorQuestion: " A goal and a question ",
      website: "",
    },
    params,
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(payload)),
    {
      courseId: "crs_ml_foundations",
      name: "Learner",
      email: "learner@example.com",
      consent: true,
      consentVersion: "pipeline-course-interest-v1",
      sourceSurface: "COURSE_PAGE",
      ctaLocation: "ENROLMENT_PANEL",
      campaign: { utm_source: "course" },
      website: "",
      background: "N/A",
      capability: "N/A",
      intendedOutcome: "N/A",
      instructorQuestion: "A goal and a question",
    },
  );
});

test("empty optional pipeline note maps to null", () => {
  const payload = buildPayload(
    baseCourse,
    {
      name: "Asha",
      email: "asha@example.com",
      consent: true,
      instructorQuestion: "   ",
      website: "",
    },
    new URLSearchParams(),
  );
  assert.equal(payload.name, "Asha");
  assert.equal(payload.instructorQuestion, null);
  assert.equal(payload.sourceSurface, "DIRECT");
  assert.equal(payload.ctaLocation, "DIRECT");
  assert.ok(!("preferredTimeframe" in payload));
  assert.ok(!("topicInterests" in payload));
});

test("notification payload does not send pipeline-only fields", () => {
  const payload = buildPayload(
    {
      ...baseCourse,
      courseId: "crs_applied_python",
      primaryAction: "GET_NOTIFIED",
    },
    {
      name: "Asha",
      email: "asha@example.com",
      consent: true,
      instructorQuestion: "Not applicable",
      website: "",
    },
    new URLSearchParams(),
  );
  for (const field of [
    "background",
    "capability",
    "intendedOutcome",
    "preferredTimeframe",
    "topicInterests",
    "instructorQuestion",
  ]) {
    assert.ok(!(field in payload), `${field} must not be sent`);
  }
});

test("payload never fabricates consent", () => {
  const payload = buildPayload(
    baseCourse,
    {
      name: "",
      email: "learner@example.com",
      consent: false,
      instructorQuestion: "",
      website: "",
    },
    new URLSearchParams(),
  );
  assert.equal(payload.consent, false);
});
