(function () {
  "use strict";
  const root = document.querySelector("[data-course-availability]");
  if (!root) return;
  const status = root.querySelector("[data-course-availability-status]");
  const action = root.querySelector("[data-course-availability-action]");
  const closedAction = root.querySelector(
    "[data-course-availability-closed-action]",
  );
  const courseId = root.dataset.courseId || "";
  function apiBaseUrl(hostname) {
    return ["dev.suyogjoshi.com", "localhost", "127.0.0.1"].includes(hostname)
      ? "https://api-dev.suyogjoshi.com"
      : "https://api.suyogjoshi.com";
  }
  function presentation(item) {
    if (
      !item ||
      !["APPLY", "GET_NOTIFIED", "REGISTER_INTEREST", "NONE"].includes(
        item.primaryAction,
      )
    )
      return {
        label: "Applications not currently open",
        href: "",
        show: false,
      };
    if (item.primaryAction === "APPLY")
      return { label: "Applications open", href: "/apply/", show: true };
    if (item.primaryAction === "GET_NOTIFIED")
      return {
        label: "Applications not currently open",
        href: `/training/register-interest/?courseId=${encodeURIComponent(item.courseId)}&sourceSurface=COURSE_PAGE&ctaLocation=ENROLMENT_PANEL`,
        show: true,
      };
    if (item.primaryAction === "REGISTER_INTEREST")
      return {
        label: "Coming later",
        href: `/training/register-interest/?courseId=${encodeURIComponent(item.courseId)}&sourceSurface=COURSE_PAGE&ctaLocation=ENROLMENT_PANEL`,
        show: true,
      };
    return {
      label:
        item.publicStatus === "COMING_LATER"
          ? "Coming later"
          : "Applications not currently open",
      href: "",
      show: false,
    };
  }
  function render(view) {
    status.textContent = view.label;
    action.hidden = !view.show;
    if (view.show) action.href = view.href;
    if (closedAction) closedAction.hidden = view.show;
  }
  async function initialise() {
    render({ label: "Applications not currently open", show: false });
    try {
      const response = await fetch(
        `${apiBaseUrl(location.hostname)}/training/course-actions`,
        { headers: { Accept: "application/json" }, cache: "no-store" },
      );
      if (!response.ok) throw new Error("unavailable");
      const body = await response.json();
      render(
        presentation(
          (body.items || []).find((item) => item.courseId === courseId),
        ),
      );
    } catch (_) {
      render({ label: "Applications not currently open", show: false });
    }
  }
  window.sjTrainingAvailability = { apiBaseUrl, presentation, initialise };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
})();
