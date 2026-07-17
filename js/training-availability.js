(function () {
  'use strict';

  const root = document.querySelector('[data-course-availability]');
  if (!root) return;

  const status = root.querySelector('[data-course-availability-status]');
  const action = root.querySelector('[data-course-availability-action]');
  const closedAction = root.querySelector('[data-course-availability-closed-action]');
  const courseId = root.dataset.courseId || '';
  const courseSlug = root.dataset.courseSlug || '';

  function applicationsEnabled(hostname) {
    return Boolean(window.sjTrainingRelease
      && window.sjTrainingRelease.capabilityEnabled('applications', hostname));
  }

  function apiBaseUrl(hostname) {
    return window.sjTrainingRelease
      ? window.sjTrainingRelease.apiBaseUrl('applications', hostname)
      : '';
  }

  function render(open, message) {
    status.textContent = message;
    action.hidden = !open;
    if (closedAction) closedAction.hidden = open;
  }

  function availabilityPresentation(items, courseId) {
    const cohorts = Array.isArray(items) ? items.filter((item) => item && item.courseId === courseId) : [];
    if (cohorts.some((item) => item.availability === 'OPEN')) return { open: true, message: 'Applications open for review' };
    if (cohorts.some((item) => item.availability === 'WAITLIST_ONLY')) return { open: false, message: 'Waitlist applications only. A seat is not currently available.' };
    if (cohorts.some((item) => item.availability === 'FULL')) return { open: false, message: 'This cohort is full. Compare the other course or contact support about future availability.' };
    return { open: false, message: 'Applications are currently closed' };
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
      const availability = course && course.courseId === courseId && course.publicationStatus === 'PUBLISHED'
        ? availabilityPresentation(cohortsBody.items, courseId)
        : { open: false, message: 'Applications are currently closed' };
      render(availability.open, availability.message);
    } catch (_) {
      render(false, 'Application availability could not be confirmed');
    }
  }

  window.sjTrainingAvailability = { apiBaseUrl, applicationsEnabled, availabilityPresentation, initialise };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
