(function () {
  'use strict';
  const devHost = host => host === 'localhost' || host === '127.0.0.1' || host === 'dev.suyogjoshi.com' || host === 'feature-epic-586-course-inte.suyogjoshi-dev.pages.dev';
  const prodHost = host => ['suyogjoshi.com', 'www.suyogjoshi.com'].includes(host);
  const base = devHost(location.hostname) ? 'https://api-dev.suyogjoshi.com' : prodHost(location.hostname) ? 'https://api.suyogjoshi.com' : '';
  function interestUrl(item, source, locationName) { return `/training/register-interest/?courseId=${encodeURIComponent(item.courseId)}&sourceSurface=${source}&ctaLocation=${locationName}`; }
  function updateLink(link, item, source, locationName) { if (item.primaryAction === 'APPLY') { link.href = '/apply/'; link.textContent = 'View course and apply'; link.hidden = false; } else if (item.primaryAction === 'GET_NOTIFIED') { link.href = interestUrl(item, source, locationName); link.textContent = 'Get notified'; link.hidden = false; } else if (item.primaryAction === 'REGISTER_INTEREST') { link.href = interestUrl(item, source, locationName); link.textContent = 'Register interest'; link.hidden = false; } else { link.hidden = true; link.removeAttribute('href'); } }
  function detailActionLinks() { return document.querySelectorAll('.course-hero .btn, .course-detail-hero .btn, [data-enrolment-card] .btn, [data-final-cta] .btn, [data-mobile-course-cta] a'); }
  function failClosed() { document.querySelectorAll('[data-course-action="notify"], [data-course-action="interest"]').forEach(link => { link.hidden = true; link.removeAttribute('href'); }); detailActionLinks().forEach(link => { link.hidden = true; link.removeAttribute('href'); }); }
  async function initialise() {
    if (!base) { failClosed(); return; }
    try {
      const response = await fetch(`${base}/training/course-actions`, { headers: { Accept: 'application/json' }, cache: 'no-store' }); if (!response.ok) throw new Error('actions'); const body = await response.json(); const byId = new Map((body.items || []).map(item => [item.courseId, item]));
      document.querySelectorAll('.journey-card').forEach(card => { const identity = card.querySelector('[data-course-id]'); const item = identity && byId.get(identity.dataset.courseId); const link = card.querySelector('[data-course-action="notify"], [data-course-action="interest"]'); if (item && link) updateLink(link, item, 'TRAINING_JOURNEY', 'CARD'); else if (link) { link.hidden = true; link.removeAttribute('href'); } const status = card.querySelector('.cohort-status'); if (item && status) status.textContent = item.publicStatus === 'APPLICATIONS_OPEN' ? 'Applications open' : item.publicStatus === 'APPLICATIONS_NOT_OPEN' ? 'Applications not open' : item.publicStatus === 'COMING_LATER' ? 'Coming later' : 'Availability unavailable'; });
      const page = document.querySelector('[data-course-detail]'); if (page) { const item = byId.get(page.dataset.courseId); if (!item) { failClosed(); return; } detailActionLinks().forEach(link => updateLink(link, item, 'COURSE_PAGE', (link.dataset.ctaLocation || (link.closest('[data-mobile-course-cta]') ? 'MOBILE' : 'ENROLMENT_PANEL')).toUpperCase())); }
    } catch (_) { failClosed(); }
  }
  window.sjCourseActions = { initialise, interestUrl }; initialise();
}());
