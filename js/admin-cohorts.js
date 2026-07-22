(function () {
  'use strict';

  const ID = /^[A-Za-z0-9_-]{1,160}$/;
  const DECISIONS = new Set(['', 'PENDING', 'CONFIRMED', 'POSTPONED', 'CANCELLED']);
  const ATTENTION = new Set(['', 'true', 'false']);
  const ROSTER_FILTERS = ['ALL', 'DEPOSIT_OUTSTANDING', 'RESERVED', 'DECISION_PENDING', 'BALANCE_DUE', 'BALANCE_OVERDUE', 'BALANCE_IN_GRACE', 'BALANCE_EXTENDED', 'ACTIVE', 'CANCELLED', 'TRANSFERRED', 'REFUNDED', 'CLOSED', 'COMMUNICATION_FAILED', 'ACTION_NEEDED'];

  function node(tag, value, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value || '';
    return element;
  }

  function count(value) { return Number.isSafeInteger(value) && value >= 0 ? String(value) : 'Not available'; }
  function safe(value, fallback) { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }

  function create(config) {
    const form = document.getElementById('admin-cohort-search');
    const query = document.getElementById('admin-cohort-query');
    const decision = document.getElementById('admin-cohort-decision');
    const attention = document.getElementById('admin-cohort-attention');
    const list = document.getElementById('admin-cohorts-directory');
    const meta = document.getElementById('admin-cohorts-meta');
    const more = document.getElementById('admin-cohorts-more');
    const refresh = document.getElementById('admin-refresh-cohorts');
    const workspace = document.getElementById('admin-cohort-workspace');
    let items = [];
    let nextCursor = '';
    let selectedId = '';
    let rosterFilter = 'ALL';
    let rosterCursor = '';
    let rosterItems = [];
    let detailSequence = 0;
    let sequence = 0;
    let timer = null;

    function fail(error) {
      if (error.status === 401 || error.status === 403) { config.clearSession('Your admin session is no longer authorized. Sign in again.'); return; }
      const message = error.status === 503 ? 'The cohort projection exceeded its safe evaluation limit. Narrow the search and try again.' : 'Operational cohorts could not be loaded. Try again.';
      list.replaceChildren(node('p', message, 'admin-empty'));
      meta.textContent = '';
      more.hidden = true;
      config.setStatus(config.friendlyError(error), 'error');
    }

    function card(item) {
      if (!item || !ID.test(item.cohortId || '')) return null;
      const button = node('button', '', 'admin-list-item admin-cohort-card');
      button.type = 'button';
      button.dataset.cohortId = item.cohortId;
      button.setAttribute('aria-current', item.cohortId === selectedId ? 'true' : 'false');
      button.appendChild(node('strong', safe(item.label, 'Cohort name unavailable')));
      button.appendChild(node('span', safe(item.course && item.course.title, 'Course unavailable'), 'admin-list-meta'));
      const states = node('span', window.sjAdminUi.label(item.lifecycleStatus) + ' · ' + window.sjAdminUi.label(item.decisionState), 'admin-cohort-states');
      if (item.attention === true) states.appendChild(node('em', 'Needs attention', 'admin-attention-pill'));
      button.appendChild(states);
      const counts = item.counts || {};
      button.appendChild(node('span', count(counts.reserved) + ' reserved · ' + count(counts.active) + ' active · ' + count(counts.total) + ' total', 'admin-list-meta'));
      button.appendChild(node('span', count(item.minimumSize) + ' minimum · ' + count(item.capacity) + ' capacity', 'admin-list-meta'));
      const actionCounts = item.actionableCounts || {};
      button.appendChild(node('span', count(actionCounts.payment) + ' payment · ' + count(actionCounts.communication) + ' communication · ' + count(actionCounts.refund) + ' refund exceptions', 'admin-list-meta'));
      if (typeof item.attentionReason === 'string') button.appendChild(node('span', item.attentionReason, 'admin-list-meta admin-attention-reason'));
      if (item.nextAction && typeof item.nextAction.label === 'string') button.appendChild(node('span', item.nextAction.label, 'admin-list-meta'));
      button.appendChild(node('span', 'Next important date: ' + window.sjAdminUi.date(item.nextImportantAt), 'admin-list-meta'));
      return button;
    }

    function render() {
      list.replaceChildren();
      const cards = items.map(card).filter(Boolean);
      if (!cards.length) list.appendChild(node('p', 'No cohorts match these filters. Reset the filters or review course setup under Legacy operations.', 'admin-empty'));
      else cards.forEach((item) => list.appendChild(item));
      meta.textContent = cards.length + (cards.length === 1 ? ' cohort shown.' : ' cohorts shown.') + (nextCursor ? ' More results are available.' : '');
      more.hidden = !nextCursor;
    }

    function fact(group, label, value) {
      const item = node('div', '', 'admin-summary-fact');
      item.appendChild(node('dt', label));
      item.appendChild(node('dd', value === null || value === undefined || value === '' ? 'Not available' : String(value)));
      group.appendChild(item);
    }

    function breakdown(title, values) {
      const section = node('section', '', 'admin-cohort-breakdown');
      section.appendChild(node('h4', title));
      const list = node('dl', '', 'admin-breakdown-list');
      Object.entries(values && typeof values === 'object' ? values : {}).forEach(([label, value]) => fact(list, window.sjAdminUi.label(label), count(value)));
      if (!list.children.length) list.appendChild(node('p', 'No records in this category.', 'admin-empty'));
      section.appendChild(list);
      return section;
    }

    function rosterRow(row) {
      if (!row || !ID.test(row.learnerId || '')) return null;
      const tr = document.createElement('tr');
      const identity = document.createElement('td');
      identity.appendChild(node('strong', safe(row.fullName, 'Name unavailable')));
      identity.appendChild(node('span', safe(row.verifiedEmail, row.identityStatus === 'REVIEW_NEEDED' ? 'Identity needs review' : 'Email unavailable'), 'admin-list-meta'));
      const enrolment = node('td', window.sjAdminUi.label(row.enrolmentStatus));
      const payment = node('td', 'Deposit: ' + window.sjAdminUi.label(row.depositStatus) + ' · Balance: ' + window.sjAdminUi.label(row.balanceStatus));
      if (row.balanceDeadline) payment.appendChild(node('span', 'Due ' + window.sjAdminUi.date(row.balanceDeadline), 'admin-list-meta'));
      const communication = node('td', window.sjAdminUi.label(row.communicationStatus));
      const action = document.createElement('td');
      if (row.nextAction && row.nextAction.code === 'OPEN_LEARNER') {
        const button = node('button', safe(row.nextAction.label, 'Open learner'), 'btn btn-secondary');
        button.type = 'button'; button.dataset.rosterLearner = row.learnerId; button.dataset.adminView = 'learners'; action.appendChild(button);
      } else action.appendChild(node('span', 'Review unavailable', 'admin-list-meta'));
      tr.append(identity, enrolment, payment, communication, action);
      return tr;
    }

    function renderWorkspace(detail, append) {
      if (!detail || !ID.test(detail.cohortId || '')) throw new Error('The cohort workspace response was incomplete.');
      if (!append) {
        workspace.replaceChildren();
        const header = node('header', '', 'admin-cohort-header');
        header.appendChild(node('p', safe(detail.course && detail.course.title, 'Course unavailable'), 'eyebrow'));
        header.appendChild(node('h2', safe(detail.label, 'Cohort name unavailable')));
        header.appendChild(node('p', window.sjAdminUi.label(detail.lifecycleStatus) + ' · ' + window.sjAdminUi.label(detail.decisionState)));
        workspace.appendChild(header);
        const summary = node('dl', '', 'admin-status-summary');
        [['Schedule', window.sjAdminUi.date(detail.startsAt)], ['Timezone', detail.timezone], ['Capacity', count(detail.capacity)], ['Minimum threshold', count(detail.minimumSize)], ['Reserved', count((detail.counts || {}).reserved)], ['Active', count((detail.counts || {}).active)], ['Next important date', window.sjAdminUi.date(detail.nextImportantAt)], ['Attention', detail.attentionReason || 'No current exception']].forEach(([label, value]) => fact(summary, label, value));
        workspace.appendChild(summary);
        const breakdowns = node('section', '', 'admin-cohort-breakdowns'); breakdowns.appendChild(node('h3', 'Operational breakdowns'));
        breakdowns.append(breakdown('Enrolment', (detail.breakdowns || {}).enrolment));
        breakdowns.append(breakdown('Deposit', (detail.breakdowns || {}).deposit));
        breakdowns.append(breakdown('Remaining fee', (detail.breakdowns || {}).balance));
        breakdowns.append(breakdown('Communication', (detail.breakdowns || {}).communication));
        workspace.appendChild(breakdowns);
        if (detail.nextAction && detail.nextAction.code === 'REVIEW_COHORT_DECISION') {
          const action = node('section', '', 'admin-next-action'); action.appendChild(node('h3', 'Available next action'));
          const button = node('button', safe(detail.nextAction.label, 'Review cohort decision'), 'btn btn-primary'); button.type = 'button'; button.dataset.cohortDecision = detail.cohortId; button.dataset.adminView = 'cohort-decisions'; action.appendChild(button); workspace.appendChild(action);
        }
        const history = node('section', '', 'admin-cohort-history'); history.appendChild(node('h3', 'Decision history'));
        const timeline = node('ol', '', 'admin-timeline');
        (Array.isArray(detail.decisionHistory) ? detail.decisionHistory : []).forEach((decisionItem) => { const item = document.createElement('li'); item.appendChild(node('strong', window.sjAdminUi.label(decisionItem.type))); item.appendChild(node('span', window.sjAdminUi.date(decisionItem.createdAt), 'admin-list-meta')); timeline.appendChild(item); });
        if (!timeline.children.length) timeline.appendChild(node('li', 'No decision has been recorded.'));
        history.appendChild(timeline); workspace.appendChild(history);
        const roster = node('section', '', 'admin-cohort-roster-section'); roster.appendChild(node('h3', 'Learner roster'));
        const label = node('label', '', 'form-field'); label.appendChild(node('span', 'Show learners'));
        const select = document.createElement('select'); select.id = 'admin-cohort-roster-filter'; select.dataset.rosterFilter = '';
        ROSTER_FILTERS.forEach((value) => { const option = new Option(window.sjAdminUi.label(value), value); option.selected = value === rosterFilter; select.appendChild(option); }); label.appendChild(select); roster.appendChild(label);
        const tableWrap = node('div', '', 'admin-table-scroll'); const table = node('table', '', 'admin-roster');
        const head = document.createElement('thead'); const headerRow = document.createElement('tr'); ['Learner', 'Enrolment', 'Payment', 'Communication', 'Next action'].forEach((value) => headerRow.appendChild(node('th', value))); head.appendChild(headerRow);
        const body = document.createElement('tbody'); body.id = 'admin-cohort-roster-body'; table.append(head, body); tableWrap.appendChild(table); roster.appendChild(tableWrap);
        const moreButton = node('button', 'Load more learners', 'btn btn-secondary'); moreButton.type = 'button'; moreButton.dataset.rosterMore = ''; roster.appendChild(moreButton);
        workspace.appendChild(roster);
        workspace.appendChild(window.sjAdminUi.technicalDetails({ counterReconciliationRequired: detail.counterReconciliationRequired, thresholdReached: detail.thresholdReached, actionableCounts: detail.actionableCounts }, 'Technical cohort evidence'));
      }
      const body = workspace.querySelector('#admin-cohort-roster-body');
      if (body) {
        body.replaceChildren();
        const rows = rosterItems.map(rosterRow).filter(Boolean);
        if (!rows.length) { const tr = document.createElement('tr'); const td = node('td', 'No learners match this roster filter.', 'admin-empty'); td.colSpan = 5; tr.appendChild(td); body.appendChild(tr); }
        else rows.forEach((row) => body.appendChild(row));
      }
      const moreButton = workspace.querySelector('[data-roster-more]'); if (moreButton) moreButton.hidden = !rosterCursor;
    }

    async function loadWorkspace(cohortId, options) {
      const append = options && options.append;
      const current = ++detailSequence;
      workspace.setAttribute('aria-busy', 'true');
      if (!append) workspace.replaceChildren(node('p', 'Loading the cohort workspace…', 'admin-empty'));
      const values = new URLSearchParams({ status: rosterFilter, limit: '25' });
      if (append && rosterCursor) values.set('cursor', rosterCursor);
      try {
        const detail = await config.request('/admin/training/operations/cohorts/' + encodeURIComponent(cohortId) + '?' + values.toString(), { method: 'GET' });
        if (current !== detailSequence || cohortId !== selectedId) return;
        const rows = detail.roster && Array.isArray(detail.roster.items) ? detail.roster.items : [];
        rosterItems = append ? rosterItems.concat(rows) : rows;
        rosterCursor = typeof detail.nextCursor === 'string' ? detail.nextCursor : '';
        renderWorkspace(detail, append);
        config.setStatus('Cohort workspace is current.', 'success');
      } catch (error) { if (current === detailSequence) { workspace.replaceChildren(node('p', error.status === 503 ? 'The cohort is too large to evaluate safely. Narrow the roster filter and try again.' : 'The cohort workspace could not be loaded. Refresh before taking action.', 'admin-empty')); fail(error); } }
      finally { if (current === detailSequence) workspace.removeAttribute('aria-busy'); }
    }

    function params(cursor) {
      const values = new URLSearchParams({ limit: '25' });
      const search = query.value.trim();
      if (search) values.set('query', search);
      if (DECISIONS.has(decision.value) && decision.value) values.set('decision', decision.value);
      if (ATTENTION.has(attention.value) && attention.value) values.set('attention', attention.value);
      if (cursor) values.set('cursor', cursor);
      return values;
    }

    async function load(options) {
      if (!config.sessionActive()) return;
      const append = options && options.append;
      const current = ++sequence;
      list.setAttribute('aria-busy', 'true');
      meta.textContent = append ? 'Loading more cohorts…' : 'Loading operational cohorts…';
      try {
        const data = await config.request('/admin/training/operations/cohorts?' + params(append ? nextCursor : '').toString(), { method: 'GET' });
        if (current !== sequence) return;
        const page = Array.isArray(data.items) ? data.items : [];
        items = append ? items.concat(page) : page;
        nextCursor = typeof data.nextCursor === 'string' ? data.nextCursor : '';
        render();
        if (selectedId) await loadWorkspace(selectedId);
        config.setStatus('', '');
      } catch (error) { if (current === sequence) fail(error); }
      finally { if (current === sequence) list.removeAttribute('aria-busy'); }
    }

    function select(cohortId, fromLearnerId) {
      if (!ID.test(cohortId || '')) return;
      selectedId = cohortId;
      rosterFilter = 'ALL'; rosterCursor = ''; rosterItems = [];
      render();
      window.dispatchEvent(new CustomEvent('admin:cohort-workspace-selected', { detail: { cohortId, fromLearnerId: ID.test(fromLearnerId || '') ? fromLearnerId : null } }));
      config.setStatus('Cohort selected. Opening its workspace…', '');
      loadWorkspace(cohortId);
    }

    form.addEventListener('submit', (event) => { event.preventDefault(); selectedId = ''; load(); });
    form.addEventListener('reset', () => { clearTimeout(timer); setTimeout(() => { selectedId = ''; load(); }, 0); });
    query.addEventListener('input', () => { clearTimeout(timer); if (query.value.trim().length === 1) return; timer = setTimeout(() => load(), 350); });
    more.addEventListener('click', () => load({ append: true }));
    refresh.addEventListener('click', () => load());
    list.addEventListener('click', (event) => { const selected = event.target.closest('[data-cohort-id]'); if (selected) select(selected.dataset.cohortId); });
    window.addEventListener('admin:cohort-selected', (event) => { const detail = event.detail || {}; select(detail.cohortId, detail.fromLearnerId); });
    workspace.addEventListener('change', (event) => {
      if (!event.target.matches('[data-roster-filter]') || !ROSTER_FILTERS.includes(event.target.value)) return;
      rosterFilter = event.target.value; rosterCursor = ''; rosterItems = []; loadWorkspace(selectedId);
    });
    workspace.addEventListener('click', (event) => {
      if (event.target.closest('[data-roster-more]')) { loadWorkspace(selectedId, { append: true }); return; }
      const learner = event.target.closest('[data-roster-learner]');
      if (learner && ID.test(learner.dataset.rosterLearner || '') && window.sjAdminLearnersController) { window.sjAdminLearnersController.select(learner.dataset.rosterLearner); }
      const decisionButton = event.target.closest('[data-cohort-decision]');
      if (decisionButton && ID.test(decisionButton.dataset.cohortDecision || '') && window.sjAdminGate3Controller && window.sjAdminGate3Controller.openForCohort) window.sjAdminGate3Controller.openForCohort(decisionButton.dataset.cohortDecision);
    });

    return { load, select, loadWorkspace, clear: () => { sequence += 1; detailSequence += 1; items = []; nextCursor = ''; selectedId = ''; rosterCursor = ''; rosterItems = []; render(); workspace.replaceChildren(node('p', 'Select a cohort to review its health, roster, and exceptions.', 'admin-empty')); } };
  }

  window.sjAdminCohorts = { create };
}());
