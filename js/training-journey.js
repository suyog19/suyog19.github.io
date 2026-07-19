(function () {
  'use strict';
  const courses = {
    1: ['Python Foundations for Data Science', 'python-foundations-for-data-science/', 'No prior programming is required.'],
    2: ['Applied Data Analysis with Python', 'applied-data-analysis-with-python/', 'You should already be able to write and debug small Python programs.'],
    3: ['Practical Machine Learning Foundations', 'practical-machine-learning-foundations/', 'Independent tabular data analysis is the expected foundation.'],
    4: ['Generative AI Application Development', 'generative-ai-application-development/', 'Practical Python application, API, JSON, testing, and Git skills are expected.'],
    5: ['Engineering Reliable AI Systems', 'engineering-reliable-ai-systems/', 'Prior AI/ML application experience and strong engineering foundations are expected.'],
  };
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
      const existingRecommendation = document.querySelector('[data-starting-profile][aria-pressed="true"]');
      selectStation(existingRecommendation ? existingRecommendation.dataset.stage : 1, false); map.classList.add('is-enhanced');
    }
  }
  if (journey && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { event('training_journey_view'); observer.disconnect(); } }, { threshold: .25 });
    observer.observe(journey);
  }
  document.addEventListener('click', (click) => {
    const profile = click.target.closest('[data-starting-profile]');
    if (profile) {
      document.querySelectorAll('[data-starting-profile]').forEach((button) => button.setAttribute('aria-pressed', String(button === profile)));
      const stage = profile.dataset.stage; const course = courses[stage]; const result = document.querySelector('[data-starting-result]');
      document.querySelectorAll('.journey-station').forEach((station) => { const recommended = station.dataset.journeyStage === stage; station.dataset.recommended = String(recommended); const label = station.querySelector('.journey-entry-label'); if (label) label.hidden = !recommended; });
      selectStation(stage, false);
      result.innerHTML = '<p class="learning-status-marker">Recommended starting point: Stage ' + stage + '</p><h3>' + course[0] + '</h3><p>' + course[2] + '</p><a class="btn btn-primary btn-learning" href="' + course[1] + '">Open course ' + (Number(stage) > 2 ? 'preview' : 'details') + '</a>';
      result.focus(); event('training_starting_point_selected', { starting_profile: profile.dataset.startingProfile, course_stage: Number(stage) });
    }
    const courseAction = click.target.closest('[data-course-action]');
    if (courseAction) event(({ details: 'training_course_details_click', preview: 'training_course_preview_click', interest: 'training_register_interest_click', notify: 'training_notify_me_click' })[courseAction.dataset.courseAction], { course_id: courseAction.dataset.courseId, course_stage: Number(courseAction.dataset.courseStage) || undefined, course_lifecycle_status: courseAction.dataset.courseLifecycle, cohort_availability: courseAction.dataset.cohortAvailability });
    const tracked = click.target.closest('[data-training-event]'); if (tracked) event(tracked.dataset.trainingEvent, { cta_location: tracked.dataset.ctaLocation });
  });
}());
