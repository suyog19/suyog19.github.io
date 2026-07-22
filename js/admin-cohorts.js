(function () {
  'use strict';

  const ID = /^[A-Za-z0-9_-]{1,160}$/;
  const DECISIONS = new Set(['', 'PENDING', 'CONFIRMED', 'POSTPONED', 'CANCELLED']);
  const ATTENTION = new Set(['', 'true', 'false']);

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
    let items = [];
    let nextCursor = '';
    let selectedId = '';
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
        config.setStatus('', '');
      } catch (error) { if (current === sequence) fail(error); }
      finally { if (current === sequence) list.removeAttribute('aria-busy'); }
    }

    function select(cohortId, fromLearnerId) {
      if (!ID.test(cohortId || '')) return;
      selectedId = cohortId;
      render();
      window.dispatchEvent(new CustomEvent('admin:cohort-workspace-selected', { detail: { cohortId, fromLearnerId: ID.test(fromLearnerId || '') ? fromLearnerId : null } }));
      config.setStatus('Cohort selected. Opening its workspace…', '');
    }

    form.addEventListener('submit', (event) => { event.preventDefault(); selectedId = ''; load(); });
    form.addEventListener('reset', () => { clearTimeout(timer); setTimeout(() => { selectedId = ''; load(); }, 0); });
    query.addEventListener('input', () => { clearTimeout(timer); if (query.value.trim().length === 1) return; timer = setTimeout(() => load(), 350); });
    more.addEventListener('click', () => load({ append: true }));
    refresh.addEventListener('click', () => load());
    list.addEventListener('click', (event) => { const selected = event.target.closest('[data-cohort-id]'); if (selected) select(selected.dataset.cohortId); });
    window.addEventListener('admin:cohort-selected', (event) => { const detail = event.detail || {}; select(detail.cohortId, detail.fromLearnerId); });

    return { load, select, clear: () => { sequence += 1; items = []; nextCursor = ''; selectedId = ''; render(); } };
  }

  window.sjAdminCohorts = { create };
}());
