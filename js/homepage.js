(function () {
  'use strict';

  function track(name, element) {
    if (typeof window.gtag !== 'function') return;
    const data = element.dataset;
    window.gtag('event', name, {
      cta_location: data.ctaLocation,
      offering: data.offering,
      course_id: data.courseId,
      course_action: data.courseAction,
      system_id: data.systemId,
      source_surface: 'HOMEPAGE',
    });
  }

  document.addEventListener('click', function (event) {
    const target = event.target.closest('[data-home-event]');
    if (target) track(target.dataset.homeEvent, target);
  });

  const spotlight = document.querySelector('[data-home-impression]');
  if (spotlight && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      if (!entries.some(entry => entry.isIntersecting)) return;
      track(spotlight.dataset.homeImpression, spotlight);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(spotlight);
  }
}());
