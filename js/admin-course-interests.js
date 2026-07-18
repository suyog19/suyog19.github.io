(function () {
  "use strict";
  const list = document.getElementById("admin-course-interest-list");
  if (!list) return;
  const detail = document.getElementById("admin-course-interest-detail");
  const filters = document.getElementById("admin-course-interest-filters");
  const sendForm = document.getElementById("admin-course-interest-send");
  const eligibilityResult = sendForm.querySelector("[data-eligibility-result]");
  const sendButton = sendForm.querySelector('[type="submit"]');
  const base = ["dev.suyogjoshi.com", "localhost", "127.0.0.1", "feature-epic-586-course-inte.suyogjoshi-dev.pages.dev"].includes(location.hostname)
    ? "https://api-dev.suyogjoshi.com"
    : ["suyogjoshi.com", "www.suyogjoshi.com"].includes(location.hostname) ? "https://api.suyogjoshi.com" : "";
  let sending = false;
  function token() {
    return sessionStorage.getItem("sj_admin_access_token") || "";
  }
  async function request(path, options) {
    const authToken = token();
    if (!base || !authToken) throw new Error("Authentication required");
    const headers = Object.assign(
      { Accept: "application/json", Authorization: `Bearer ${authToken}` },
      (options && options.headers) || {},
    );
    const response = await fetch(
      base + path,
      Object.assign({}, options || {}, { headers }),
    );
    const body = await response.json().catch(() => ({}));
    if (token() !== authToken || shell.hidden) {
      clearPrivate();
      throw new Error("Authentication changed");
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) { clearPrivate(); sessionStorage.removeItem("sj_admin_access_token"); }
      const error = new Error(body.message || "Request failed");
      error.status = response.status;
      throw error;
    }
    return body;
  }
  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function clearPrivate() { clear(list); clear(detail); eligibilityResult.textContent = ""; sendButton.disabled = true; }
  function text(tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = value == null ? "Not available" : String(value);
    if (className) node.className = className;
    return node;
  }
  async function load() {
    clear(list);
    list.append(text("p", "Loading interests…", "admin-empty"));
    const query = new URLSearchParams(new FormData(filters));
    try {
      const items = [];
      let cursor = "";
      do {
        const pageQuery = new URLSearchParams(query);
        pageQuery.set("limit", "100");
        if (cursor) pageQuery.set("cursor", cursor);
        const page = await request("/admin/training/course-interests?" + pageQuery);
        items.push(...(page.items || []));
        cursor = page.nextCursor || "";
      } while (cursor);
      clear(list);
      if (!items.length) {
        list.append(text("p", "No course interests to show.", "admin-empty"));
        return;
      }
      items.forEach((item) => {
        const button = text(
          "button",
          `${item.courseTitleSnapshot} · ${item.derivedIntent} · ${item.status}${item.notificationStatus ? ` · ${item.notificationStatus}` : ""}`,
          "admin-list-item",
        );
        button.type = "button";
        button.addEventListener("click", () => show(item.interestId));
        list.append(button);
      });
    } catch (_) {
      clear(list);
      list.append(text("p", "Unable to load course interests.", "admin-empty"));
    }
  }
  async function show(id) {
    try {
      const body = await request(
        "/admin/training/course-interests/" + encodeURIComponent(id),
      );
      const item = body.interest;
      clear(detail);
      detail.append(
        text("h4", item.courseTitleSnapshot),
        text("p", `${item.derivedIntent} · ${item.status}`),
      );
      const dl = document.createElement("dl");
      Object.entries(item)
        .filter(
          ([key]) =>
            ![
              "interestId",
              "courseTitleSnapshot",
              "derivedIntent",
              "status",
            ].includes(key),
        )
        .forEach(([key, value]) => {
          dl.append(
            text("dt", key),
            text(
              "dd",
              typeof value === "object" ? JSON.stringify(value) : value,
            ),
          );
        });
      detail.append(dl);
      if (item.status !== "WITHDRAWN") {
        const button = text("button", "Withdraw record", "btn btn-secondary");
        button.type = "button";
        button.addEventListener("click", async () => {
          const reason = prompt("Reason for withdrawal");
          if (!reason) return;
          await request(
            `/admin/training/course-interests/${encodeURIComponent(id)}/withdraw`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Idempotency-Key": crypto.randomUUID(),
              },
              body: JSON.stringify({
                expectedVersion: Number(item.version),
                confirmation: true,
                reason,
              }),
            },
          );
          await load();
          clear(detail);
        });
        detail.append(button);
      }
      async function recover(operation, label) {
        const reason = prompt(`Reason to ${label.toLowerCase()}`);
        if (!reason || !confirm(`${label} using canonical delivery evidence?`)) return;
        await request(
          `/admin/training/course-interests/${encodeURIComponent(id)}/notifications/${operation}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify({
              logicalKey: item.notificationLogicalKey,
              confirmation: true,
              reason,
            }),
          },
        );
        await show(id);
        await load();
      }
      if (item.notificationCanResend) {
        const resend = text("button", "Safely resend original notification", "btn btn-secondary");
        resend.type = "button";
        resend.addEventListener("click", () => recover("resend", "Resend notification"));
        detail.append(resend);
      }
      if (item.notificationCanReconcile) {
        const reconcile = text("button", "Repair fulfilment projection", "btn btn-secondary");
        reconcile.type = "button";
        reconcile.addEventListener("click", () => recover("reconcile", "Repair projection"));
        detail.append(reconcile);
      }
    } catch (_) {
      clear(detail);
      detail.append(text("p", "Unable to load this record.", "admin-empty"));
    }
  }
  async function loadOptions() {
    try {
      const courses = await request("/admin/training/courses");
      const courseSelect = sendForm.elements.courseId;
      const cohortSelect = sendForm.elements.cohortId;
      courseSelect.replaceChildren();
      cohortSelect.replaceChildren();
      for (const item of courses.items || []) {
        courseSelect.add(new Option(item.title, item.courseId));
        const cohorts = await request(
          "/admin/training/cohorts?courseId=" +
            encodeURIComponent(item.courseId),
        );
        (cohorts.items || []).forEach((cohort) => {
          const option = new Option(
            `${item.title} · ${cohort.label}`,
            cohort.cohortId,
          );
          option.dataset.courseId = item.courseId;
          cohortSelect.add(option);
        });
      }
    } catch (_) {
      eligibilityResult.textContent = "Course options unavailable.";
    }
  }
  async function check() {
    const courseId = sendForm.elements.courseId.value;
    const cohortId = sendForm.elements.cohortId.value;
    try {
      const result = await request(
        `/admin/training/course-interests/applications-open-notifications/eligibility?courseId=${encodeURIComponent(courseId)}&cohortId=${encodeURIComponent(cohortId)}`,
      );
      eligibilityResult.textContent = result.allowed
        ? `${result.eligibleCount} eligible; ${result.alreadyFulfilledCount} already fulfilled.`
        : `Not allowed: ${result.reasonCode}`;
      sendButton.disabled = !result.allowed;
    } catch (_) {
      eligibilityResult.textContent = "Eligibility unavailable.";
      sendButton.disabled = true;
    }
  }
  filters.addEventListener("submit", (event) => {
    event.preventDefault();
    load();
  });
  document
    .getElementById("admin-refresh-course-interests")
    .addEventListener("click", load);
  sendForm
    .querySelector("[data-check-eligibility]")
    .addEventListener("click", check);
  sendForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (
      sending ||
      sendButton.disabled ||
      !confirm(
        "Send the fixed applications-open message to all eligible requesters?",
      )
    )
      return;
    sending = true;
    sendButton.disabled = true;
    const body = {
      courseId: sendForm.elements.courseId.value,
      cohortId: sendForm.elements.cohortId.value,
      reason: sendForm.elements.reason.value,
      confirmation: true,
    };
    try {
      const result = await request(
        "/admin/training/course-interests/applications-open-notifications",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify(body),
        },
      );
      eligibilityResult.textContent = `${result.createdCount} notifications created; ${result.skippedCount} skipped.`;
      sendButton.disabled = true;
      await load();
    } catch (_) {
      eligibilityResult.textContent = "The fixed send was not created.";
    } finally {
      sending = false;
    }
  });
  const shell = document.getElementById("admin-shell");
  const initialiseAuthenticated = () => { if (token() && !shell.hidden) { load(); loadOptions(); } else { clearPrivate(); } };
  new MutationObserver(initialiseAuthenticated).observe(shell, { attributes: true, attributeFilter: ["hidden"] });
  initialiseAuthenticated();
})();
