(function () {
  "use strict";
  const meta = (name) => document.querySelector(`meta[name="event-discovery-${name}"]`)?.content;
  const declared = meta("status");
  if (!["upcoming", "registration-closed", "completed"].includes(declared)) return;
  const closes = Date.parse(meta("closes"));
  const end = Date.parse(meta("end"));
  let timer;
  function refresh() {
    const now = Date.now();
    const state = declared === "completed" || now >= end ? "completed"
      : declared === "registration-closed" || now >= closes ? "registration-closed" : "upcoming";
    const focusedPromotion = document.activeElement?.closest("[data-event-discovery]");
    document.documentElement.dataset.eventDiscoveryState = state;
    // Preserve a visible keyboard destination after the expired layout is removed.
    if (state === "completed" && focusedPromotion) {
      const heading = document.querySelector("main h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
        const headerBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom || 0;
        window.scrollTo({ top: Math.max(0, window.scrollY + heading.getBoundingClientRect().top - headerBottom - 16), behavior: "instant" });
        heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
      }
    }
    window.clearTimeout(timer);
    const next = state === "upcoming" ? closes : state === "registration-closed" ? end : NaN;
    if (Number.isFinite(next) && next > now) timer = window.setTimeout(refresh, Math.min(next - now, 2147483647));
  }
  // This script runs in the head, before either discovery surface is laid out.
  refresh();
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll("[data-event-discovery]");
    function track(name, card) {
      if (document.documentElement.dataset.eventDiscoveryState === "completed" || typeof window.gtag !== "function") return;
      const link = card.querySelector("[data-discovery-cta]");
      window.gtag("event", name, {
        event_slug: card.dataset.discoverySlug,
        event_status: document.documentElement.dataset.eventDiscoveryState,
        source_surface: card.dataset.eventDiscovery.toUpperCase(),
        cta_location: link.dataset.discoveryCta.toUpperCase(),
        page_location: document.querySelector('link[rel="canonical"]').href,
        page_referrer: "",
      });
    }
    cards.forEach((card) => card.querySelector("[data-discovery-cta]").addEventListener("click", () => track("learning_event_discovery_click", card)));
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= .25) {
            track("learning_event_discovery_view", entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .25 });
      cards.forEach((card) => observer.observe(card));
    }
  });
})();
