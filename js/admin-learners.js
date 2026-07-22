(function () {
  'use strict';

  const ID = /^[A-Za-z0-9_-]{1,160}$/;
  const ALLOWED_STATUSES = new Set(['', 'APPLICATION_RECEIVED', 'UNDER_REVIEW', 'DEPOSIT_DUE', 'PAYMENT_ACTION_NEEDED', 'RESERVED', 'BALANCE_DUE', 'BALANCE_ACTION_NEEDED', 'COHORT_POSTPONED', 'ACTIVE']);
  const ACTION_DESTINATIONS = {
    REVIEW_APPLICATION: 'applications',
    OPEN_PAYMENT_OPERATIONS: 'payments',
    REVIEW_PAYMENT: 'payments',
    REVIEW_REFUND: 'payments',
    REVIEW_LEARNER_REQUEST: 'payments',
    OPEN_COHORT_OPERATIONS: 'cohorts',
  };

  function node(tag, value, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value || '';
    return element;
  }

  function safeText(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function safeDate(value) {
    const parsed = new Date(value);
    return value && !Number.isNaN(parsed.getTime()) ? window.sjAdminUi.date(value) : 'Update time unavailable';
  }

  function create(config) {
    const form = document.getElementById('admin-learner-search');
    const query = document.getElementById('admin-learner-query');
    const status = document.getElementById('admin-learner-status');
    const list = document.getElementById('admin-learners-list');
    const meta = document.getElementById('admin-learners-meta');
    const more = document.getElementById('admin-learners-more');
    const refresh = document.getElementById('admin-refresh-learners');
    const workspace = document.getElementById('admin-learner-workspace');
    let items = [];
    let nextCursor = '';
    let selectedId = '';
    let currentDetail = null;
    let requestSequence = 0;
    let detailSequence = 0;
    let timer = null;

    function fail(error) {
      if (error.status === 401 || error.status === 403) {
        config.clearSession('Your admin session is no longer authorized. Sign in again.');
        return;
      }
      list.replaceChildren(node('p', 'Learners could not be loaded. Your search is still available; try again.', 'admin-empty'));
      meta.textContent = '';
      more.hidden = true;
      config.setStatus(config.friendlyError(error), 'error');
    }

    function resultCard(item) {
      if (!item || !ID.test(item.learnerId || '')) return null;
      const card = node('button', '', 'admin-list-item admin-learner-card');
      card.type = 'button';
      card.dataset.learnerId = item.learnerId;
      card.setAttribute('aria-current', item.learnerId === selectedId ? 'true' : 'false');
      card.appendChild(node('strong', safeText(item.fullName, 'Name unavailable')));
      card.appendChild(node('span', safeText(item.verifiedEmail, 'Verified email unavailable'), 'admin-list-meta'));
      const context = [item.currentCourse && safeText(item.currentCourse.title, ''), item.currentCohort && safeText(item.currentCohort.label, '')].filter(Boolean).join(' · ');
      card.appendChild(node('span', context || 'Course and cohort not yet assigned', 'admin-list-meta'));
      const statusLine = node('span', window.sjAdminUi.label(item.journeyStatus), 'admin-learner-status');
      if (item.attention === true) statusLine.appendChild(node('em', 'Needs attention', 'admin-attention-pill'));
      card.appendChild(statusLine);
      if (item.nextAction && typeof item.nextAction.label === 'string') card.appendChild(node('span', item.nextAction.label, 'admin-list-meta'));
      card.appendChild(node('span', 'Updated ' + safeDate(item.lastUpdatedAt), 'admin-list-meta'));
      return card;
    }

    function render() {
      list.replaceChildren();
      const cards = items.map(resultCard).filter(Boolean);
      if (!cards.length) list.appendChild(node('p', 'No learners match this search. Check the details or reset the filters.', 'admin-empty'));
      else cards.forEach((card) => list.appendChild(card));
      meta.textContent = cards.length + (cards.length === 1 ? ' learner shown.' : ' learners shown.') + (nextCursor ? ' More results are available.' : '');
      more.hidden = !nextCursor;
    }

    function fact(group, label, value) {
      const item = node('div', '', 'admin-summary-fact');
      item.appendChild(node('dt', label));
      item.appendChild(node('dd', value === null || value === undefined || value === '' ? 'Not available' : String(value)));
      group.appendChild(item);
    }

    function summarySection(title, values) {
      const section = node('section', '', 'admin-learner-section');
      section.appendChild(node('h3', title));
      const facts = node('dl', '', 'admin-status-summary');
      values.forEach(([label, value]) => fact(facts, label, value));
      section.appendChild(facts);
      return section;
    }

    function renderActions(detail) {
      const section = node('section', '', 'admin-learner-section admin-next-action');
      section.appendChild(node('h3', 'Available next actions'));
      const actions = Array.isArray(detail.actions) ? detail.actions : [];
      const valid = actions.filter((action) => action && ACTION_DESTINATIONS[action.code] && typeof action.label === 'string');
      if (!valid.length) section.appendChild(node('p', 'No administrative action is currently authorised. Review the blockers and current evidence below.'));
      valid.forEach((action) => {
        const button = node('button', action.label, 'btn btn-secondary');
        button.type = 'button';
        button.dataset.learnerAction = action.code;
        button.dataset.adminView = ACTION_DESTINATIONS[action.code];
        section.appendChild(button);
      });
      return section;
    }

    function renderBlockers(detail) {
      const blockers = Array.isArray(detail.blockers) ? detail.blockers : [];
      if (!blockers.length) return null;
      const section = node('section', '', 'admin-exception-banner');
      section.appendChild(node('h3', 'What is blocking the next step'));
      const list = document.createElement('ul');
      blockers.forEach((blocker) => {
        if (blocker && typeof blocker.message === 'string') list.appendChild(node('li', blocker.message));
      });
      section.appendChild(list);
      return section;
    }

    function renderTimeline(detail) {
      const section = node('section', '', 'admin-learner-section');
      section.appendChild(node('h3', 'Operational timeline'));
      const timeline = node('ol', '', 'admin-timeline');
      const events = Array.isArray(detail.timeline) ? detail.timeline : [];
      if (!events.length) timeline.appendChild(node('li', 'No operational events are available.'));
      events.forEach((event) => {
        if (!event || typeof event.label !== 'string') return;
        const item = node('li', '');
        item.appendChild(node('strong', event.label));
        item.appendChild(node('span', safeDate(event.occurredAt) + ' · ' + window.sjAdminUi.label(event.status), 'admin-list-meta'));
        timeline.appendChild(item);
      });
      section.appendChild(timeline);
      return section;
    }

    function renderWorkspace(payload) {
      const detail = payload && payload.learner;
      if (!detail || !detail.learner || !ID.test(detail.learner.learnerId || '')) throw new Error('The learner workspace response was incomplete.');
      const identity = detail.learner;
      currentDetail = detail;
      const journey = detail.currentJourney || {};
      const course = detail.currentCourse || {};
      const cohort = detail.currentCohort || {};
      const offer = journey.offer || {};
      const gate2 = journey.gate2 || {};
      const gate3 = journey.gate3 || {};
      const deposit = gate2.obligation || gate2.payment || gate2;
      workspace.replaceChildren();
      const header = node('header', '', 'admin-learner-header');
      header.appendChild(node('p', 'Learner 360', 'eyebrow'));
      header.appendChild(node('h2', safeText(identity.fullName, 'Name unavailable')));
      header.appendChild(node('p', safeText(identity.verifiedEmail, 'Verified email unavailable')));
      header.appendChild(node('p', window.sjAdminUi.label(detail.journeyStatus), 'admin-journey-state'));
      workspace.appendChild(header);
      workspace.appendChild(summarySection('Current journey', [
        ['Course', safeText(course.title, 'Not assigned')],
        ['Cohort', safeText(cohort.label, 'Not assigned')],
        ['Application', window.sjAdminUi.label(journey.applicationStatus)],
        ['Decision', window.sjAdminUi.label((journey.decision || {}).type)],
        ['Enrolment', window.sjAdminUi.label(offer.status)],
        ['Last meaningful update', safeDate(detail.lastUpdatedAt)],
      ]));
      workspace.appendChild(summarySection('Payments and enrolment', [
        ['Deposit status', window.sjAdminUi.label(deposit.status)],
        ['Deposit due', window.sjAdminUi.money(deposit.amountDue, deposit.currency)],
        ['Remaining-fee status', window.sjAdminUi.label(gate3.balanceStatus)],
        ['Remaining fee due', window.sjAdminUi.money(gate3.amountDue, gate3.currency)],
        ['Place status', window.sjAdminUi.label(offer.status)],
        ['Activation', window.sjAdminUi.label(gate3.activationStatus)],
      ]));
      workspace.appendChild(summarySection('Communication and delivery', [
        ['Deposit communication', window.sjAdminUi.label((gate2.communication || {}).status)],
        ['Cohort communication', window.sjAdminUi.label((gate3.communication || {}).status)],
        ['Joining eligibility', window.sjAdminUi.label(gate3.joiningEligibility)],
        ['Cohort decision', window.sjAdminUi.label(gate3.cohortDecision)],
      ]));
      workspace.appendChild(summarySection('Learner requests and refunds', [
        ['Request type', window.sjAdminUi.label((gate2.learnerChange || {}).type)],
        ['Request status', window.sjAdminUi.label((gate2.learnerChange || {}).status)],
        ['Decision', window.sjAdminUi.label((gate2.learnerChange || {}).decision)],
        ['Refund status', window.sjAdminUi.label((gate2.refund || {}).status)],
        ['Refund amount', window.sjAdminUi.money((gate2.refund || {}).amount, deposit.currency)],
        ['Course access', window.sjAdminUi.label(gate3.activationStatus)],
      ]));
      const blockers = renderBlockers(detail); if (blockers) workspace.appendChild(blockers);
      workspace.appendChild(renderActions(detail));
      workspace.appendChild(renderTimeline(detail));
      workspace.appendChild(window.sjAdminUi.technicalDetails({ journeys: detail.journeys || [], currentJourney: journey }, 'References, versions, and audit evidence'));
    }

    async function loadWorkspace(learnerId) {
      const sequence = ++detailSequence;
      workspace.setAttribute('aria-busy', 'true');
      workspace.replaceChildren(node('p', 'Loading the learner workspace…', 'admin-empty'));
      try {
        const payload = await config.request('/admin/training/learners/' + encodeURIComponent(learnerId), { method: 'GET' });
        if (sequence !== detailSequence || learnerId !== selectedId) return;
        renderWorkspace(payload);
        config.setStatus('Learner workspace is current.', 'success');
      } catch (error) {
        if (sequence !== detailSequence) return;
        workspace.replaceChildren(node('p', error.status === 404 ? 'This learner is no longer available in the operational directory.' : 'The learner workspace could not be loaded. Refresh it before taking action.', 'admin-empty'));
        fail(error);
      } finally {
        if (sequence === detailSequence) workspace.removeAttribute('aria-busy');
      }
    }

    function parameters(cursor) {
      const params = new URLSearchParams({ limit: '25' });
      const search = query.value.trim();
      if (search) params.set('query', search);
      if (ALLOWED_STATUSES.has(status.value) && status.value) params.set('status', status.value);
      if (cursor) params.set('cursor', cursor);
      return params;
    }

    async function load(options) {
      if (!config.sessionActive()) return;
      const append = options && options.append;
      const cursor = append ? nextCursor : '';
      const sequence = ++requestSequence;
      list.setAttribute('aria-busy', 'true');
      meta.textContent = append ? 'Loading more learners…' : 'Loading learners…';
      try {
        const data = await config.request('/admin/training/learners?' + parameters(cursor).toString(), { method: 'GET' });
        if (sequence !== requestSequence) return;
        const page = Array.isArray(data.items) ? data.items : [];
        items = append ? items.concat(page) : page;
        nextCursor = typeof data.nextCursor === 'string' ? data.nextCursor : '';
        render();
        if (selectedId) await loadWorkspace(selectedId);
        config.setStatus('', '');
      } catch (error) {
        if (sequence === requestSequence) fail(error);
      } finally {
        if (sequence === requestSequence) list.removeAttribute('aria-busy');
      }
    }

    form.addEventListener('submit', (event) => { event.preventDefault(); selectedId = ''; load(); });
    form.addEventListener('reset', () => { clearTimeout(timer); setTimeout(() => { selectedId = ''; load(); }, 0); });
    query.addEventListener('input', () => {
      clearTimeout(timer);
      const value = query.value.trim();
      if (value.length === 1) return;
      timer = setTimeout(() => { selectedId = ''; load(); }, 350);
    });
    more.addEventListener('click', () => load({ append: true }));
    refresh.addEventListener('click', () => load());
    list.addEventListener('click', (event) => {
      const card = event.target.closest('[data-learner-id]');
      if (!card || !ID.test(card.dataset.learnerId || '')) return;
      select(card.dataset.learnerId);
    });

    function select(learnerId) {
      if (!ID.test(learnerId || '')) return;
      selectedId = learnerId;
      render();
      config.setStatus('Learner selected. Opening their workspace…', '');
      window.dispatchEvent(new CustomEvent('admin:learner-selected', { detail: { learnerId: selectedId } }));
      loadWorkspace(selectedId);
    }

    workspace.addEventListener('click', (event) => {
      const action = event.target.closest('[data-learner-action]');
      if (!action) return;
      const destination = ACTION_DESTINATIONS[action.dataset.learnerAction];
      if (!destination) return;
      if (destination === 'payments') {
        const enrolmentId = (((currentDetail || {}).currentJourney || {}).offer || {}).enrolmentId;
        if (ID.test(enrolmentId || '') && window.sjAdminPaymentsController) window.sjAdminPaymentsController.openForEnrolment(enrolmentId);
      }
      if (destination === 'cohorts') {
        const cohortId = ((currentDetail || {}).currentCohort || {}).cohortId;
        if (ID.test(cohortId || '')) window.dispatchEvent(new CustomEvent('admin:cohort-selected', { detail: { cohortId, fromLearnerId: selectedId } }));
      }
    });

    return { load, select, loadWorkspace, clear: () => { requestSequence += 1; detailSequence += 1; items = []; nextCursor = ''; selectedId = ''; currentDetail = null; render(); workspace.replaceChildren(node('p', 'Select a learner to see their current position, history, and available next actions.', 'admin-empty')); }, selected: () => selectedId };
  }

  window.sjAdminLearners = { create };
}());
