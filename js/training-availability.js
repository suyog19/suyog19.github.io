(function () {
  'use strict';

  const root = document.querySelector('[data-course-availability]');
  if (!root) return;

  const status = root.querySelector('[data-course-availability-status]');
  const action = root.querySelector('[data-course-availability-action]');
  const courseId = root.dataset.courseId || '';
  const courseSlug = root.dataset.courseSlug || '';

  function applicationsEnabled(hostname) {
    return hostname === 'dev.suyogjoshi.com'
      || hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname === '[::1]'
      || /^[a-z0-9-]+\.suyogjoshi-dev\.pages\.dev$/.test(hostname || '');
  }

  function apiBaseUrl(hostname) {
    return applicationsEnabled(hostname) ? 'https://api-dev.suyogjoshi.com' : '';
  }

  function render(open, message) {
    status.textContent = message;
    action.hidden = !open;
  }

  async function initialise() {
    const baseUrl = apiBaseUrl(window.location.hostname);
    if (!baseUrl || !courseId || !courseSlug) return;

    render(false, 'Checking application availability…');
    try {
      const encodedSlug = encodeURIComponent(courseSlug);
      const responses = await Promise.all([
        fetch(baseUrl + '/training/courses/' + encodedSlug, { headers: { Accept: 'application/json' } }),
        fetch(baseUrl + '/training/courses/' + encodedSlug + '/cohorts', { headers: { Accept: 'application/json' } }),
      ]);
      if (responses.some((response) => response.status === 404)) {
        render(false, 'Applications not currently open');
        return;
      }
      if (!responses.every((response) => response.ok)) throw new Error('COURSE_UNAVAILABLE');
      const [courseBody, cohortsBody] = await Promise.all(responses.map((response) => response.json()));
      const course = courseBody.course;
      const open = Boolean(
        course
        && course.courseId === courseId
        && course.publicationStatus === 'PUBLISHED'
        && Array.isArray(cohortsBody.items)
        && cohortsBody.items.some((cohort) => cohort.courseId === courseId && cohort.availability === 'OPEN')
      );
      render(open, open ? 'Applications open for review' : 'Applications not currently open');
    } catch (_) {
      render(false, 'Application availability could not be confirmed');
    }
  }

  window.sjTrainingAvailability = { apiBaseUrl, applicationsEnabled, initialise };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
