(function () {
  "use strict";
  const page = document.querySelector("[data-event-slug]");
  if (!page) return;
  // Campaign labels only: no arbitrary queries, referral tokens or ad identifiers.
  const query = new URLSearchParams(window.location.search);
  const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const campaign = new URLSearchParams();
  const safeLabel = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
  campaignKeys.forEach((key) => {
    const value = query.get(key);
    if (safeLabel(value)) campaign.set(key, value);
  });
  if (!query.has("utm_source") && safeLabel(query.get("source"))) {
    campaign.set("utm_source", query.get("source"));
  }
  const source = (campaign.get("utm_source") || "direct").toLowerCase();
  const knownSources = ["linkedin", "whatsapp", "facebook", "instagram", "homepage", "training", "direct"];
  const eventSource = knownSources.includes(source) ? source : "other";
  function track(name, location) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, {
      event_slug: page.dataset.eventSlug,
      event_status: page.dataset.eventStatus,
      event_source: eventSource,
      ...(location ? { cta_location: location } : {}),
    });
  }
  track("learning_event_page_view");
  document.querySelectorAll("[data-event-cta]").forEach((link) => {
    if (link.dataset.registrationProvider === "luma") {
      const destination = new URL(link.href);
      if (destination.origin === "https://luma.com") {
        campaign.forEach((value, key) => destination.searchParams.set(key, value));
        link.href = destination.href;
      }
    }
    link.addEventListener("click", () => track("learning_event_register_click", link.dataset.eventCta));
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          track("learning_event_register_view", entry.target.dataset.eventCta);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-event-cta]").forEach((link) => observer.observe(link));
  }
})();
