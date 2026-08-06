(function () {
  "use strict";

  const DEFAULT_LEARNER_NAME = "Learner";
  const REQUIRED_PIPELINE_PLACEHOLDER = "N/A";
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const allowedSource = ["TRAINING_JOURNEY", "COURSE_PAGE", "DIRECT"];
  const allowedCta = [
    "CARD",
    "HERO",
    "ENROLMENT_PANEL",
    "FINAL",
    "MOBILE",
    "DIRECT",
  ];

  const closed = (candidate, allowed) =>
    allowed.includes(candidate) ? candidate : "DIRECT";

  function buildPayload(course, values, params) {
    const campaign = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(
      (key) => {
        if (params.has(key)) campaign[key] = params.get(key).slice(0, 100);
      },
    );
    const body = {
      courseId: course.courseId,
      name: values.name.trim() || DEFAULT_LEARNER_NAME,
      email: values.email.trim(),
      consent: values.consent === true,
      consentVersion: course.consentVersion,
      sourceSurface: closed(params.get("sourceSurface"), allowedSource),
      ctaLocation: closed(params.get("ctaLocation"), allowedCta),
      campaign,
      website: values.website,
    };
    if (course.primaryAction === "REGISTER_INTEREST") {
      Object.assign(body, {
        background: REQUIRED_PIPELINE_PLACEHOLDER,
        capability: REQUIRED_PIPELINE_PLACEHOLDER,
        intendedOutcome: REQUIRED_PIPELINE_PLACEHOLDER,
        instructorQuestion: values.instructorQuestion.trim() || null,
      });
    }
    return body;
  }

  window.sjCourseInterest = {
    buildPayload,
    closed,
    DEFAULT_LEARNER_NAME,
    REQUIRED_PIPELINE_PLACEHOLDER,
  };

  const form = document.querySelector("[data-interest-form]");
  if (!form) return;

  const params = new URLSearchParams(location.search);
  const devHost = [
    "dev.suyogjoshi.com",
    "localhost",
    "127.0.0.1",
    "feature-epic-586-course-inte.suyogjoshi-dev.pages.dev",
  ].includes(location.hostname);
  const apiBase = devHost
    ? "https://api-dev.suyogjoshi.com"
    : ["suyogjoshi.com", "www.suyogjoshi.com"].includes(location.hostname)
      ? "https://api.suyogjoshi.com"
      : "";
  const selector = document.querySelector("[data-course-selection]");
  const picker = document.querySelector("[data-course-picker]");
  const courseSummary = form.querySelector("[data-course-summary]");
  const currentCourse = form.querySelector("[data-current-course]");
  const changeCourse = form.querySelector("[data-change-course]");
  const details = document.querySelector("[data-selected-course]");
  const fields = document.querySelector("[data-interest-fields]");
  const pipelineNote = form.querySelector("[data-pipeline-note]");
  const consentText = form.querySelector("[data-consent-statement]");
  const summary = form.querySelector("[data-error-summary]");
  const success = document.querySelector("[data-interest-success]");
  const successCourse = success.querySelector("[data-success-course]");
  const returnCourse = document.querySelector("[data-return-course]");
  const submit = form.querySelector('button[type="submit"]');
  let selected = null;
  let submitting = false;

  const value = (name) => form.elements.namedItem(name);

  function setFieldError(name, message) {
    const control = value(name);
    const error = document.getElementById(`${name}-error`);
    control.setAttribute("aria-invalid", "true");
    error.textContent = message;
    error.hidden = false;
  }

  function clearFieldError(name) {
    const control = value(name);
    const error = document.getElementById(`${name}-error`);
    control.removeAttribute("aria-invalid");
    error.textContent = "";
    error.hidden = true;
  }

  function validate() {
    clearFieldError("email");
    clearFieldError("consent");
    const email = value("email").value.trim();
    let firstInvalid = null;
    if (!email) {
      setFieldError("email", "Enter your email address.");
      firstInvalid = value("email");
    } else if (!EMAIL_PATTERN.test(email)) {
      setFieldError("email", "Enter a valid email address.");
      firstInvalid = value("email");
    }
    if (!value("consent").checked) {
      setFieldError("consent", "Select the checkbox to receive updates about this course.");
      firstInvalid = firstInvalid || value("consent");
    }
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function fail(message) {
    selected = null;
    fields.hidden = true;
    courseSummary.hidden = true;
    picker.hidden = false;
    submit.disabled = true;
    details.textContent = "";
    const h = document.createElement("h1");
    h.textContent = "Course updates unavailable";
    const p = document.createElement("p");
    p.textContent = message;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-secondary";
    retry.textContent = "Retry";
    retry.addEventListener("click", load);
    const journey = document.createElement("a");
    journey.className = "btn btn-secondary";
    journey.href = "../";
    journey.textContent = "Return to training journey";
    details.append(h, p, retry, journey);
  }

  function render(course) {
    const previousContract = selected && [
      selected.primaryAction,
      selected.consentVersion,
      selected.consentStatement,
    ].join("|");
    selected = course;
    details.textContent = "";
    const eyebrow = document.createElement("p");
    eyebrow.className = "learning-eyebrow";
    eyebrow.textContent = `Software Signal Learning · Stage ${course.stage}`;
    const h = document.createElement("h1");
    h.textContent = "Get course updates";
    const title = document.createElement("p");
    title.className = "course-detail-lead";
    title.textContent = course.publicTitle;
    const reassurance = document.createElement("p");
    reassurance.className = "interest-intro";
    reassurance.textContent = "Leave your email and we’ll contact you only when there is a meaningful update about this course.";
    details.append(eyebrow, h, title, reassurance);
    const validItem = window.sjCourseActions && window.sjCourseActions.validItem;
    if (
      !validItem ||
      !validItem(course) ||
      !["GET_NOTIFIED", "REGISTER_INTEREST"].includes(course.primaryAction)
    ) {
      fail(
        course.primaryAction === "APPLY"
          ? "Applications are open. Continue through the course application journey."
          : "Course updates are not currently available.",
      );
      return;
    }
    fields.hidden = false;
    picker.hidden = true;
    courseSummary.hidden = false;
    submit.disabled = false;
    pipelineNote.hidden = course.primaryAction !== "REGISTER_INTEREST";
    currentCourse.textContent = course.publicTitle;
    value("courseId").value = course.courseId;
    value("consentVersion").value = course.consentVersion;
    consentText.textContent = course.consentStatement;
    const currentContract = [
      course.primaryAction,
      course.consentVersion,
      course.consentStatement,
    ].join("|");
    if (previousContract && previousContract !== currentContract) {
      value("consent").checked = false;
      clearFieldError("consent");
    }
    if (returnCourse && course.slug) {
      returnCourse.href = `../${encodeURIComponent(course.slug)}/`;
    }
    submit.textContent = "Notify me about this course";
  }

  async function load() {
    fields.hidden = true;
    submit.disabled = true;
    summary.hidden = true;
    if (!apiBase) {
      fail("Course actions are unavailable on this host.");
      return;
    }
    try {
      const response = await fetch(`${apiBase}/training/course-actions`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("actions");
      const body = await response.json();
      const items = Array.isArray(body.items) ? body.items : [];
      const validItem = window.sjCourseActions && window.sjCourseActions.validItem;
      if (!validItem || items.some((item) => !validItem(item))) {
        throw new Error("invalid actions");
      }
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
        selector.focus();
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

  changeCourse.addEventListener("click", () => {
    picker.hidden = false;
    courseSummary.hidden = true;
    changeCourse.setAttribute("aria-expanded", "true");
    selector.focus();
  });

  selector.addEventListener("change", () => {
    if (!selector.value) return;
    const next = new URL(location.href);
    next.searchParams.set("courseId", selector.value);
    location.assign(next);
  });

  value("email").addEventListener("input", () => clearFieldError("email"));
  value("consent").addEventListener("change", () => clearFieldError("consent"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selected || submitting || !validate()) return;
    submitting = true;
    submit.disabled = true;
    summary.hidden = true;
    const body = buildPayload(
      selected,
      {
        name: value("name").value,
        email: value("email").value,
        consent: value("consent").checked,
        instructorQuestion: value("instructorQuestion").value,
        website: value("website").value,
      },
      params,
    );
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
      successCourse.textContent = selected.publicTitle;
      form.hidden = true;
      details.hidden = true;
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

  load();
})();
