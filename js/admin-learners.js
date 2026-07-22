(function () {
  'use strict';

  const ID = /^[A-Za-z0-9_-]{1,160}$/;
  const ALLOWED_STATUSES = new Set(['', 'APPLICATION_RECEIVED', 'UNDER_REVIEW', 'DEPOSIT_DUE', 'PAYMENT_ACTION_NEEDED', 'RESERVED', 'BALANCE_DUE', 'BALANCE_ACTION_NEEDED', 'COHORT_POSTPONED', 'ACTIVE']);

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
    let items = [];
    let nextCursor = '';
    let selectedId = '';
    let requestSequence = 0;
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
      selectedId = card.dataset.learnerId;
      render();
      config.setStatus('Learner selected. Opening their workspace…', 'success');
      window.dispatchEvent(new CustomEvent('admin:learner-selected', { detail: { learnerId: selectedId } }));
    });

    return { load, clear: () => { requestSequence += 1; items = []; nextCursor = ''; selectedId = ''; render(); }, selected: () => selectedId };
  }

  window.sjAdminLearners = { create };
}());
