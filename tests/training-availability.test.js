const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");
const script = fs.readFileSync("js/training-availability.js", "utf8");

function harness(hostname, reply) {
  const status = { textContent: "" };
  const action = { hidden: true, href: "" };
  const closedAction = { hidden: false };
  const root = {
    dataset: { courseId: "crs_python_foundations" },
    querySelector(selector) {
      if (selector.includes("status")) return status;
      return selector.includes("closed-action") ? closedAction : action;
    },
  };
  const calls = [];
  const context = {
    document: { querySelector: () => root },
    window: { __SJ_DISABLE_AUTO_INIT__: true },
    location: { hostname },
    fetch: async (url) => {
      calls.push(url);
      return {
        ok: reply.ok !== false,
        async json() {
          return reply.body || {};
        },
      };
    },
    encodeURIComponent,
  };
  vm.runInNewContext(script, context);
  return {
    action,
    calls,
    closedAction,
    status,
    controller: context.window.sjTrainingAvailability,
  };
}

test("backend APPLY action is the only way to expose Apply", async () => {
  const page = harness("dev.suyogjoshi.com", {
    body: {
      items: [
        {
          courseId: "crs_python_foundations",
          primaryAction: "APPLY",
          publicStatus: "APPLICATIONS_OPEN",
        },
      ],
    },
  });
  await page.controller.initialise();
  assert.equal(page.action.hidden, false);
  assert.equal(page.closedAction.hidden, true);
  assert.equal(page.status.textContent, "Applications open");
  assert.equal(page.calls.length, 1);
});

test("interest and none actions render bounded fail-closed presentations", () => {
  const present = harness("dev.suyogjoshi.com", {}).controller.presentation;
  assert.equal(
    present({ courseId: "x", primaryAction: "GET_NOTIFIED" }).href.includes(
      "sourceSurface=COURSE_PAGE",
    ),
    true,
  );
  assert.equal(
    present({ courseId: "x", primaryAction: "REGISTER_INTEREST" }).label,
    "Coming later",
  );
  assert.equal(
    present({ primaryAction: "NONE", publicStatus: "COMING_LATER" }).show,
    false,
  );
  assert.equal(present({ primaryAction: "UNKNOWN" }).show, false);
});

test("network failure never falls back to Apply", async () => {
  const page = harness("suyogjoshi.com", { ok: false });
  await page.controller.initialise();
  assert.equal(page.action.hidden, true);
  assert.equal(page.status.textContent, "Applications not currently open");
  assert.equal(page.calls[0].startsWith("https://api.suyogjoshi.com/"), true);
});
