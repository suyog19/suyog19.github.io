(function () {
  'use strict';
  const root = document.querySelector('[data-course-detail]');
  if (!root) return;
  const pipeline = Boolean(root.dataset.pipelineState);
  const launchedEventContract = ['training_course_primary_cta_click', 'training_course_readiness_open', 'training_course_readiness_result', 'training_course_outcomes_view', 'training_course_capstone_view', 'training_course_curriculum_view', 'training_course_phase_open', 'training_course_lecture_open', 'training_course_curriculum_expand_all', 'training_course_fees_view', 'training_course_policy_click', 'training_course_instructor_click', 'training_course_application_started', 'training_course_notification_requested', 'training_course_journey_click', 'training_course_next_stage_click'];
  const pipelineEventContract = ['pipeline_interest_cta_click', 'pipeline_capstone_view', 'pipeline_curriculum_view', 'pipeline_status_section_view', 'pipeline_adjacent_course_click', 'pipeline_journey_click'];
  const allowedEvents = new Set(['training_course_page_view', 'training_course_primary_cta_view', 'pipeline_course_page_view', 'pipeline_interest_cta_view', 'pipeline_readiness_open', 'pipeline_readiness_result', 'pipeline_lecture_expand', 'pipeline_curriculum_expand_all', ...launchedEventContract, ...pipelineEventContract]);
  const base = { course_id: root.dataset.courseId, course_stage: Number(root.dataset.courseStage), course_slug: root.dataset.courseSlug, cohort_availability: root.dataset.cohortAvailability, pipeline_state: root.dataset.pipelineState };
  const pipelinePresentation = state => ({
    'pipeline-interest-open': { badge: 'IN PIPELINE', action: 'Register interest', enabled: true },
    'pipeline-interest-paused': { badge: 'IN PIPELINE', action: null, enabled: false },
    'launch-announced': { badge: 'LAUNCH PLANNED', action: 'Get launch updates', enabled: true },
    'applications-open': { badge: 'LAUNCHED', action: 'Apply', enabled: true, useLaunchedCard: true },
  }[state] || { badge: 'STATUS UNAVAILABLE', action: null, enabled: false });
  window.sjCourseLifecycle = { pipelinePresentation };
  const emit = (name, params) => {
    if (typeof window.gtag === 'function' && allowedEvents.has(name)) window.gtag('event', name, Object.assign({}, base, params || {}, { viewport_category: innerWidth < 600 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop' }));
  };
  emit(pipeline ? 'pipeline_course_page_view' : 'training_course_page_view');
  document.querySelectorAll('[data-observe-event]').forEach(el => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { emit(el.dataset.observeEvent); observer.disconnect(); } }, { threshold: .25 });
    observer.observe(el);
  });
  const primary = document.querySelector('[data-enrolment-card] .btn');
  if (primary && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { emit(pipeline ? 'pipeline_interest_cta_view' : 'training_course_primary_cta_view', { cta_location: 'card' }); observer.disconnect(); } });
    observer.observe(primary);
  }
  document.addEventListener('toggle', event => {
    if (event.target.matches('.course-lecture[open]')) {
      const phase = event.target.closest('[data-phase]')?.dataset.phase;
      emit(pipeline ? 'pipeline_lecture_expand' : 'training_course_lecture_open', { lecture_number: Number(event.target.dataset.lecture), curriculum_phase: phase });
      if (!pipeline) emit('training_course_phase_open', { curriculum_phase: phase });
    }
    if (event.target.matches('.readiness-check[open]')) emit(pipeline ? 'pipeline_readiness_open' : 'training_course_readiness_open');
  }, true);
  document.addEventListener('click', event => {
    const control = event.target.closest('[data-curriculum-action]');
    if (control) {
      const open = control.dataset.curriculumAction === 'expand';
      document.querySelectorAll('.course-lecture').forEach(detail => { detail.open = open; });
      emit(pipeline ? 'pipeline_curriculum_expand_all' : 'training_course_curriculum_expand_all', { action: open ? 'expand' : 'collapse' });
    }
    const readiness = event.target.closest('[data-readiness-result]');
    if (readiness) {
      const output = document.querySelector('[data-readiness-output]'); output.hidden = false;
      output.innerHTML = readiness.dataset.readinessResult === 'ready' ? root.dataset.readyCopy : root.dataset.foundationCopy;
      emit(pipeline ? 'pipeline_readiness_result' : 'training_course_readiness_result', { readiness_result: readiness.dataset.readinessResult });
    }
    const tracked = event.target.closest('[data-course-event]');
    if (tracked) emit(tracked.dataset.courseEvent, { cta_location: tracked.dataset.ctaLocation });
  });
  const card = document.querySelector('[data-enrolment-card]');
  const bar = document.querySelector('[data-mobile-course-cta]');
  const final = document.querySelector('[data-final-cta]');
  if (card && bar) {
    const update = () => { const cardPassed = card.getBoundingClientRect().bottom < 0; const finalVisible = final && final.getBoundingClientRect().top < innerHeight && final.getBoundingClientRect().bottom > 0; bar.hidden = !cardPassed || finalVisible; };
    addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
  }
  document.querySelectorAll('.course-section').forEach(section => { section.style.scrollMarginTop = '8rem'; });
}());
