(function () {
  "use strict";
  const form = document.querySelector("[data-interest-form]");
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const devHost = ["dev.suyogjoshi.com", "localhost", "127.0.0.1", "feature-epic-586-course-inte.suyogjoshi-dev.pages.dev"].includes(location.hostname);
  const apiBase = devHost ? "https://api-dev.suyogjoshi.com" : ["suyogjoshi.com", "www.suyogjoshi.com"].includes(location.hostname) ? "https://api.suyogjoshi.com" : "";
  const allowedSource = ["TRAINING_JOURNEY", "COURSE_PAGE", "DIRECT"];
  const allowedCta = [
    "CARD",
    "HERO",
    "ENROLMENT_PANEL",
    "FINAL",
    "MOBILE",
    "DIRECT",
  ];
  const selector = document.querySelector("[data-course-selection]");
  const details = document.querySelector("[data-selected-course]");
  const fields = document.querySelector("[data-interest-fields]");
  const pipeline = form.querySelector("[data-pipeline-fields]");
  const topics = form.querySelector("[data-topic-options]");
  const consentText = form.querySelector("[data-consent-statement]");
  const summary = form.querySelector("[data-error-summary]");
  const success = document.querySelector("[data-interest-success]");
  const submit = form.querySelector('button[type="submit"]');
  let selected = null;
  let submitting = false;
  const value = (name) => form.elements.namedItem(name);
  const closed = (candidate, allowed) =>
    allowed.includes(candidate) ? candidate : "DIRECT";
  function fail(message) {
    selected = null;
    fields.hidden = true;
    submit.disabled = true;
    details.textContent = "";
    const h = document.createElement("h1");
    h.textContent = "Course interest unavailable";
    const p = document.createElement("p");
    p.textContent = message;
    const retry = document.createElement("button");
    retry.type = "button"; retry.className = "btn btn-secondary"; retry.textContent = "Retry"; retry.addEventListener("click", load);
    const journey = document.createElement("a");
    journey.className = "btn btn-secondary"; journey.href = "../"; journey.textContent = "Return to training journey";
    details.append(h, p, retry, journey);
  }
  function render(course) {
    selected = course;
    details.textContent = "";
    const eyebrow = document.createElement("p");
    eyebrow.className = "learning-eyebrow";
    eyebrow.textContent = `Software Signal Learning · Stage ${course.stage}`;
    const h = document.createElement("h1");
    h.textContent =
      course.primaryAction === "GET_NOTIFIED"
        ? "Get notified"
        : "Register interest";
    const title = document.createElement("p");
    title.className = "course-detail-lead";
    title.textContent = course.publicTitle;
    details.append(eyebrow, h, title);
    if (
      !["GET_NOTIFIED", "REGISTER_INTEREST"].includes(course.primaryAction) ||
      !course.consentStatement ||
      !course.consentVersion
    ) {
      fail(
        course.primaryAction === "APPLY"
          ? "Applications are open. Continue through the course application journey."
          : "Interest capture is not currently available.",
      );
      return;
    }
    fields.hidden = false;
    submit.disabled = false;
    pipeline.hidden = course.primaryAction !== "REGISTER_INTEREST";
    pipeline.querySelectorAll("[required]").forEach((el) => {
      el.required = !pipeline.hidden;
    });
    value("courseId").value = course.courseId;
    value("consentVersion").value = course.consentVersion;
    consentText.textContent = course.consentStatement;
    submit.textContent =
      course.primaryAction === "GET_NOTIFIED"
        ? "Notify me when applications open"
        : "Record my interest";
    topics.textContent = "";
    (course.topicOptions || []).forEach((topic) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "topicInterests";
      input.value = topic;
      const span = document.createElement("span");
      span.textContent = topic;
      label.append(input, " ", span);
      topics.append(label);
    });
  }
  async function load() {
    fields.hidden = true;
    submit.disabled = true;
    if (!apiBase) { fail("Course actions are unavailable on this host."); return; }
    try {
      const response = await fetch(`${apiBase}/training/course-actions`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("actions");
      const body = await response.json();
      const items = Array.isArray(body.items) ? body.items : [];
      selector.textContent = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select a course";
      selector.append(placeholder);
      items.forEach((course) => {
        const option = document.createElement("option");
        option.value = course.courseId;
        option.textContent = `Stage ${course.stage} — ${course.publicTitle}`;
        selector.append(option);
      });
      const course = items.find(
        (item) => item.courseId === params.get("courseId"),
      );
      if (!course) {
        fail("Select a supported course to continue.");
        return;
      }
      selector.value = course.courseId;
      render(course);
    } catch (_) {
      fail(
        "We could not load the current course action. Retry later or return to the training journey.",
      );
    }
  }
  selector.addEventListener("change", () => {
    if (!selector.value) return;
    const next = new URL(location.href);
    next.searchParams.set("courseId", selector.value);
    location.assign(next);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selected || submitting || !form.reportValidity()) return;
    submitting = true;
    submit.disabled = true;
    summary.hidden = true;
    const campaign = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(
      (key) => {
        if (params.has(key)) campaign[key] = params.get(key).slice(0, 100);
      },
    );
    const body = {
      courseId: selected.courseId,
      name: value("name").value.trim(),
      email: value("email").value.trim(),
      consent: true,
      consentVersion: selected.consentVersion,
      sourceSurface: closed(params.get("sourceSurface"), allowedSource),
      ctaLocation: closed(params.get("ctaLocation"), allowedCta),
      campaign,
      website: value("website").value,
    };
    if (selected.primaryAction === "REGISTER_INTEREST")
      Object.assign(body, {
        background: value("background").value.trim(),
        capability: value("capability").value.trim(),
        intendedOutcome: value("intendedOutcome").value.trim(),
        preferredTimeframe: value("preferredTimeframe").value || null,
        topicInterests: Array.from(
          form.querySelectorAll('[name="topicInterests"]:checked'),
        ).map((el) => el.value),
        instructorQuestion: value("instructorQuestion").value.trim() || null,
      });
    try {
      const response = await fetch(`${apiBase}/course-interests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        if ([409, 422].includes(response.status)) await load();
        throw new Error("submit");
      }
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (_) {
      summary.textContent =
        "We could not record this request. Your entries are still here; review the current course action and try again.";
      summary.hidden = false;
      summary.focus();
    } finally {
      submitting = false;
      submit.disabled = !selected;
    }
  });
  window.sjCourseInterest = { closed };
  load();
})();
