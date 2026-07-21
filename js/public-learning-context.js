(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const view = window.sjLearnerSummary;
  const page = document.querySelector('[data-course-detail]');
  if (!auth || !view || !page || !auth.token()) return;

  function relationship(application) {
    const presentation = view.resolvePresentation(application);
    const href = presentation.primaryAction && presentation.primaryAction.href || '/my-learning/';
    const labels = {
      APPLICATION_RECEIVED: 'View application status', UNDER_REVIEW: 'View application status',
      OFFERED: 'Review your offer', DEPOSIT_DUE: 'Complete your deposit',
      RESERVED: 'View your enrolment', ACTIVE: view.courseHubHref(application) ? 'Open your course area' : 'View your enrolment',
    };
    return { href, label: labels[presentation.journeyStage] || 'View your learning status', presentation };
  }

  async function initialise() {
    try {
      if (window.sjCourseActionsReady) await window.sjCourseActionsReady;
      const summary = await auth.request('/me/learning-summary', { method: 'GET' });
      const applications = Array.isArray(summary.applications) ? summary.applications : [];
      const application = applications.find((item) => item && item.course && item.course.courseId === page.dataset.courseId);
      if (!application) return;
      const current = relationship(application);
      const hero = page.querySelector('.course-detail-hero .container');
      if (hero) {
        const banner = document.createElement('aside');
        banner.className = 'learner-public-context';
        banner.setAttribute('aria-label', 'Your relationship to this course');
        banner.textContent = current.presentation.journeyStage === 'ACTIVE'
          ? 'You are enrolled in this course. ' : 'You have a current learning journey for this course. ';
        const link = document.createElement('a'); link.href = current.href; link.textContent = current.label; banner.appendChild(link); hero.prepend(banner);
      }
      page.querySelectorAll('[data-cta-location]').forEach((link) => {
        link.href = current.href; link.textContent = current.label;
        link.setAttribute('aria-label', current.label + ' for ' + (application.course.title || 'this course'));
        link.hidden = false;
      });
    } catch (_) { /* Public content remains the complete fallback. */ }
  }
  window.sjPublicLearningContext = { initialise, relationship };
  initialise();
}());
