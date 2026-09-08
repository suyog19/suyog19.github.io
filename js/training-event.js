(function () {
  "use strict";
  const page = document.querySelector("[data-event-slug]");
  if (!page) return;
  function track(name, location) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, {
      event_slug: page.dataset.eventSlug,
      event_status: page.dataset.eventStatus,
      ...(location ? { cta_location: location } : {}),
    });
  }
  track("learning_event_page_view");
  document.querySelectorAll("[data-event-cta]").forEach((link) => {
    link.addEventListener("click", () => track("learning_event_register_click", link.dataset.eventCta));
  });
  const primary = document.querySelector('[data-event-cta="primary"]');
  if (primary && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        track("learning_event_register_view", "primary");
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(primary);
  }
})();
