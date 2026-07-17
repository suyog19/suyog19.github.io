(function () {
  'use strict';
  const courses = {
    1: ['Python Foundations for Data Science', 'python-foundations-ai-data/', 'No prior programming is required.'],
    2: ['Applied Data Analysis with Python', 'applied-python-ai-ml/', 'You should already be able to write and debug small Python programs.'],
    3: ['Practical Machine Learning Foundations', 'practical-machine-learning-foundations/', 'Independent tabular data analysis is the expected foundation.'],
    4: ['Generative AI Application Development', 'generative-ai-application-development/', 'Practical Python application, API, JSON, testing, and Git skills are expected.'],
    5: ['Engineering Reliable AI Systems', 'engineering-reliable-ai-systems/', 'Prior AI/ML application experience and strong engineering foundations are expected.'],
  };
  function event(name, parameters) { if (typeof window.gtag === 'function') window.gtag('event', name, parameters || {}); }
  const journey = document.getElementById('journey');
  if (journey && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { event('training_journey_view'); observer.disconnect(); } }, { threshold: .25 });
    observer.observe(journey);
  }
  document.addEventListener('click', (click) => {
    const profile = click.target.closest('[data-starting-profile]');
    if (profile) {
      document.querySelectorAll('[data-starting-profile]').forEach((button) => button.setAttribute('aria-pressed', String(button === profile)));
      const stage = profile.dataset.stage; const course = courses[stage]; const result = document.querySelector('[data-starting-result]');
      result.innerHTML = '<p class="learning-status-marker">Recommended starting point: Stage ' + stage + '</p><h3>' + course[0] + '</h3><p>' + course[2] + '</p><a class="btn btn-primary btn-learning" href="' + course[1] + '">Open course ' + (Number(stage) > 2 ? 'preview' : 'details') + '</a>';
      result.focus(); event('training_starting_point_selected', { starting_profile: profile.dataset.startingProfile, course_stage: Number(stage) });
    }
    const courseAction = click.target.closest('[data-course-action]');
    if (courseAction) event(({ details: 'training_course_details_click', preview: 'training_course_preview_click', interest: 'training_register_interest_click', notify: 'training_notify_me_click' })[courseAction.dataset.courseAction], { course_id: courseAction.dataset.courseId, course_stage: Number(courseAction.dataset.courseStage) || undefined, course_lifecycle_status: courseAction.dataset.courseLifecycle, cohort_availability: courseAction.dataset.cohortAvailability });
    const tracked = click.target.closest('[data-training-event]'); if (tracked) event(tracked.dataset.trainingEvent, { cta_location: tracked.dataset.ctaLocation });
  });
}());
