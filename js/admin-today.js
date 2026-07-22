(function () {
  'use strict';

  const ID = /^[A-Za-z0-9_-]{1,160}$/;
  const KINDS = new Set(['APPLICATION', 'PAYMENT', 'REFUND', 'COMMUNICATION', 'COHORT']);
  const ACTIONS = new Set(['REVIEW_APPLICATION', 'REVIEW_PAYMENT', 'REVIEW_REFUND', 'REVIEW_COMMUNICATION', 'REVIEW_COHORT_DECISION', 'RECONCILE_COHORT', 'REVIEW_COHORT', 'REVIEW_COHORT_OBLIGATIONS', 'OPEN_COHORT']);

  function node(tag, value, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value || '';
    return element;
  }

  function create(config) {
    const root = document.getElementById('admin-overview');
    const meta = document.getElementById('admin-today-meta');
    const more = document.getElementById('admin-today-more');
    let items = [];
    let nextCursor = '';
    let sequence = 0;

    function fail(error) {
      if (error.status === 401 || error.status === 403) { config.clearSession('Your admin session is no longer authorized. Sign in again.'); return; }
      const message = error.status === 503 ? 'Today could not be evaluated within the safe operational limit. No partial or potentially misleading queue is shown.' : 'Today could not be refreshed. Existing work may be stale; try again before taking action.';
      root.replaceChildren(node('p', message, 'admin-empty'));
      meta.textContent = '';
      more.hidden = true;
      config.setStatus(config.friendlyError(error), 'error');
    }

    function destination(item) {
      const context = item.context || {};
      const learnerId = ID.test(context.learner_id || '') ? context.learner_id : '';
      const cohortId = ID.test(context.cohort_id || '') ? context.cohort_id : '';
      if (learnerId) return { view: 'learners', learnerId };
      if (cohortId) return { view: 'cohorts', cohortId };
      if (item.kind === 'APPLICATION') return { view: 'applications' };
      if (['PAYMENT', 'REFUND', 'COMMUNICATION'].includes(item.kind)) return { view: 'payments' };
      if (item.kind === 'COHORT') return { view: 'cohorts' };
      return null;
    }

    function card(item) {
      if (!item || !KINDS.has(item.kind) || typeof item.subject !== 'string' || typeof item.explanation !== 'string' || !item.nextAction || !ACTIONS.has(item.nextAction.code)) return null;
      const article = node('article', '', 'admin-today-item');
      article.appendChild(node('p', window.sjAdminUi.label(item.kind), 'eyebrow'));
      article.appendChild(node('h4', item.subject));
      article.appendChild(node('p', item.explanation));
      const context = item.context || {};
      const affected = ID.test(context.learner_id || '') ? 'Learner · ' + context.learner_id : ID.test(context.cohort_id || '') ? 'Cohort · ' + context.cohort_id : 'Operational context';
      article.appendChild(node('p', affected, 'admin-list-meta'));
      if (item.deadline) article.appendChild(node('p', 'Due ' + window.sjAdminUi.date(item.deadline), 'admin-today-deadline'));
      const target = destination(item);
      if (target && typeof item.nextAction.label === 'string') {
        const button = node('button', item.nextAction.label, 'btn btn-secondary');
        button.type = 'button'; button.dataset.todayAction = item.nextAction.code; button.dataset.adminView = target.view;
        if (target.learnerId) button.dataset.todayLearner = target.learnerId;
        if (target.cohortId) button.dataset.todayCohort = target.cohortId;
        article.appendChild(button);
      }
      return article;
    }

    function render() {
      root.replaceChildren();
      const groups = new Map();
      items.forEach((item) => { if (!groups.has(item.kind)) groups.set(item.kind, []); const rendered = card(item); if (rendered) groups.get(item.kind).push(rendered); });
      let represented = 0;
      groups.forEach((cards, kind) => {
        if (!cards.length) return;
        represented += cards.length;
        const section = node('section', '', 'admin-today-group');
        section.appendChild(node('h3', window.sjAdminUi.label(kind) + ' work'));
        const list = node('div', '', 'admin-today-items'); cards.forEach((item) => list.appendChild(item)); section.appendChild(list); root.appendChild(section);
      });
      if (!represented) root.appendChild(node('p', 'Nothing currently needs operational attention. Refresh after new applications, payments, communications, or cohort changes.', 'admin-empty'));
      meta.textContent = represented + (represented === 1 ? ' current item shown.' : ' current items shown.') + (nextCursor ? ' More work is available.' : '') + ' Last refreshed ' + new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(new Date()) + '.';
      more.hidden = !nextCursor;
    }

    async function load(options) {
      if (!config.sessionActive()) return;
      const append = options && options.append;
      const current = ++sequence;
      root.setAttribute('aria-busy', 'true');
      meta.textContent = append ? 'Loading more work…' : 'Refreshing Today…';
      const params = new URLSearchParams({ limit: '25' });
      if (append && nextCursor) params.set('cursor', nextCursor);
      try {
        const data = await config.request('/admin/training/operations/today?' + params.toString(), { method: 'GET' });
        if (current !== sequence) return;
        const page = Array.isArray(data.items) ? data.items : [];
        items = append ? items.concat(page) : page;
        nextCursor = typeof data.nextCursor === 'string' ? data.nextCursor : '';
        render(); config.setStatus('', '');
      } catch (error) { if (current === sequence) fail(error); }
      finally { if (current === sequence) root.removeAttribute('aria-busy'); }
    }

    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-today-action]'); if (!action || !ACTIONS.has(action.dataset.todayAction)) return;
      if (ID.test(action.dataset.todayLearner || '') && window.sjAdminLearnersController) window.sjAdminLearnersController.select(action.dataset.todayLearner);
      if (ID.test(action.dataset.todayCohort || '') && window.sjAdminCohortsController) window.sjAdminCohortsController.select(action.dataset.todayCohort);
    });
    more.addEventListener('click', () => load({ append: true }));

    return { load, clear: () => { sequence += 1; items = []; nextCursor = ''; root.replaceChildren(node('p', 'Sign in to see current operational work.', 'admin-empty')); meta.textContent = ''; more.hidden = true; } };
  }

  window.sjAdminToday = { create };
}());
