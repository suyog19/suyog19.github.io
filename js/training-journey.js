(function () {
  'use strict';
  const courses = {
    1: ['Python Foundations for Data Science', 'python-foundations-for-data-science/', 'You are still building programming fluency, so Stage 1 gives you the foundation needed for later data work. No prior programming is required.'],
    2: ['Applied Data Analysis with Python', 'applied-data-analysis-with-python/', 'You already know basic Python, so Stage 1 is not required.'],
    3: ['Practical Machine Learning Foundations', 'practical-machine-learning-foundations/', 'You can analyse tabular data independently, so Stages 1 and 2 are not required.'],
    4: ['Generative AI Application Development', 'generative-ai-application-development/', 'You already build Python applications with APIs and tests, so Stages 1 to 3 are not required.'],
    5: ['Engineering Reliable AI Systems', 'engineering-reliable-ai-systems/', 'You have built an AI or ML application and have strong engineering foundations, so Stages 1 to 4 are not required.'],
  };
  function recommendStartingStage(values) {
    if (values.aiReadiness === 'yes' && values.pythonReadiness === 'applications') return 5;
    if (values.pythonReadiness === 'applications') return 4;
    if (values.dataReadiness === 'yes' && values.pythonReadiness === 'fundamentals') return 3;
    if (values.pythonReadiness === 'fundamentals') return 2;
    return 1;
  }
  function event(name, parameters) { if (typeof window.gtag === 'function') window.gtag('event', name, parameters || {}); }
  const journey = document.getElementById('journey');
  const stationLabels = ['Foundations', 'Data practice', 'Machine learning', 'GenAI applications', 'Reliable AI systems'];
  let selectStation = function () {};
  if (journey) {
    const panels = Array.from(journey.querySelectorAll('.journey-grid > li'));
    const panelList = journey.querySelector('.journey-grid');
    if (panelList && panels.length === 5) {
      const map = document.createElement('div');
      const stations = document.createElement('ol');
      map.className = 'journey-map'; stations.className = 'journey-stations'; stations.setAttribute('role', 'tablist'); stations.setAttribute('aria-label', 'Capability route');
      panels.forEach((panel, index) => {
        const stage = index + 1; const stationItem = document.createElement('li'); const station = document.createElement('button');
        const panelId = 'journey-panel-' + stage; const stationId = 'journey-station-' + stage;
        const card = panel.querySelector('.journey-card'); const marker = card.querySelector('.journey-stage'); const statuses = card.querySelector('.journey-statuses'); const title = card.querySelector('h3'); const capability = card.querySelector('.journey-capability'); const suitability = card.querySelector('p:not(.journey-capability)'); const actions = card.querySelector('.journey-actions'); const primaryAction = actions.querySelector('[data-course-action="notify"], [data-course-action="interest"]');
        marker.textContent = 'Stage ' + stage + ' · ' + stationLabels[index]; marker.setAttribute('aria-label', marker.textContent); [marker, title, capability, suitability, statuses, actions].forEach((element) => card.appendChild(element)); if (primaryAction) actions.insertBefore(primaryAction, actions.firstChild);
        stationItem.className = 'journey-station-item'; station.type = 'button'; station.className = 'journey-station'; station.id = stationId; station.dataset.journeyStage = String(stage); station.setAttribute('role', 'tab'); station.setAttribute('aria-controls', panelId); station.setAttribute('aria-selected', 'false'); station.tabIndex = -1;
        station.innerHTML = '<span class="journey-station-number">' + stage + '</span><span class="journey-station-label">' + stationLabels[index] + '</span><span class="journey-entry-label" hidden>Your entry point</span>';
        stationItem.appendChild(station); stations.appendChild(stationItem); panel.id = panelId; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', stationId);
      });
      panelList.parentNode.insertBefore(map, panelList); map.appendChild(stations); map.appendChild(panelList);
      const stationControls = Array.from(stations.querySelectorAll('[role="tab"]'));
      selectStation = function (stage, focus) {
        const selectedIndex = Math.max(0, Math.min(4, Number(stage) - 1));
        stationControls.forEach((station, index) => { const selected = index === selectedIndex; station.setAttribute('aria-selected', String(selected)); station.tabIndex = selected ? 0 : -1; panels[index].hidden = !selected; });
        if (focus) stationControls[selectedIndex].focus();
      };
      stations.addEventListener('click', (click) => { const station = click.target.closest('[data-journey-stage]'); if (station) { selectStation(station.dataset.journeyStage, false); event('training_journey_station_selected', { course_stage: Number(station.dataset.journeyStage) }); } });
      stations.addEventListener('keydown', (key) => {
        const station = key.target.closest('[data-journey-stage]'); if (!station) return; const current = Number(station.dataset.journeyStage); let next;
        if (['ArrowRight', 'ArrowDown'].includes(key.key)) next = current === 5 ? 1 : current + 1;
        else if (['ArrowLeft', 'ArrowUp'].includes(key.key)) next = current === 1 ? 5 : current - 1;
        else if (key.key === 'Home') next = 1; else if (key.key === 'End') next = 5; else if (['Enter', ' '].includes(key.key)) next = current; else return;
        key.preventDefault(); selectStation(next, true); event('training_journey_station_selected', { course_stage: next });
      });
      selectStation(1, false); map.classList.add('is-enhanced');
    }
  }
  if (journey && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { event('training_journey_view'); observer.disconnect(); } }, { threshold: .25 });
    observer.observe(journey);
  }
  const assessment = document.querySelector('[data-starting-assessment]');
  if (assessment) assessment.addEventListener('submit', (submit) => {
    submit.preventDefault();
    if (!assessment.reportValidity()) return;
    const values = Object.fromEntries(new FormData(assessment));
    const stage = recommendStartingStage(values); const course = courses[stage]; const result = document.querySelector('[data-starting-result]');
    document.querySelectorAll('.journey-station').forEach((station) => { const recommended = station.dataset.journeyStage === String(stage); station.dataset.recommended = String(recommended); const label = station.querySelector('.journey-entry-label'); if (label) label.hidden = !recommended; });
    selectStation(stage, false);
    result.innerHTML = '<p class="learning-status-marker">Your recommended starting point</p><h3>You are ready to begin at Stage ' + stage + ': ' + course[0] + '.</h3><p>' + course[2] + '</p><a class="btn btn-primary btn-learning" href="' + course[1] + '">Open course ' + (stage > 2 ? 'preview' : 'details') + '</a>';
    result.focus(); event('training_starting_point_result', { python_readiness: values.pythonReadiness, data_readiness: values.dataReadiness, ai_readiness: values.aiReadiness, course_stage: stage });
  });
  document.addEventListener('click', (click) => {
    const courseAction = click.target.closest('[data-course-action]');
    if (courseAction) event(({ details: 'training_course_details_click', preview: 'training_course_preview_click', interest: 'training_register_interest_click', notify: 'training_notify_me_click' })[courseAction.dataset.courseAction], { course_id: courseAction.dataset.courseId, course_stage: Number(courseAction.dataset.courseStage) || undefined, course_lifecycle_status: courseAction.dataset.courseLifecycle, cohort_availability: courseAction.dataset.cohortAvailability });
    const tracked = click.target.closest('[data-training-event]'); if (tracked) event(tracked.dataset.trainingEvent, { cta_location: tracked.dataset.ctaLocation });
  });
  window.sjTrainingJourney = { recommendStartingStage };
}());
