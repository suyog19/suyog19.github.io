(function () {
  'use strict';

  const ID = /^[A-Za-z0-9_-]{1,160}$/;
  const INTENTS = new Set(['SEND_DEPOSIT_PAYMENT_LINK', 'REMIND_REMAINING_FEE', 'SEND_COHORT_UPDATE']);
  const DECISIONS = { RESEND: 'Send the current canonical message again', REPLACE_EXPIRED: 'Create and send a current payment link', SUPPRESS: 'Do not send' };
  const REASONS = {
    DEPOSIT_NOT_DUE: 'A deposit is not currently due.', DEPOSIT_SETTLED_OR_BLOCKED: 'The deposit is settled, closed, or otherwise blocked.', CURRENT_LINK_UNAVAILABLE: 'There is no authoritative current payment link.', LINK_STATE_UNCERTAIN: 'The payment-link state is uncertain and must be reviewed.', CURRENT_COMMUNICATION_UNAVAILABLE: 'The current canonical deposit message cannot be sent again.', BALANCE_NOT_DUE: 'A remaining fee is not currently due.', BALANCE_SETTLED_OR_BLOCKED: 'The remaining fee is settled, closed, or otherwise blocked.', CURRENT_REMINDER_UNAVAILABLE: 'The current canonical reminder is unavailable.', CURRENT_COHORT_UPDATE_UNAVAILABLE: 'There is no current canonical cohort update to send.', JOINING_INFORMATION_NOT_SUPPORTED: 'Joining information is not yet supported by this action.'
  };

  function node(tag, value, className) { const element = document.createElement(tag); if (className) element.className = className; element.textContent = value || ''; return element; }
  function safeId(value) { return ID.test(value || '') ? value : ''; }
  function reason(value) { return REASONS[value] || (value ? window.sjAdminUi.label(value) : 'Eligible'); }

  function create(config) {
    const dialog = document.getElementById('admin-communication-dialog');
    const form = document.getElementById('admin-communication-form');
    const title = document.getElementById('admin-communication-title');
    const previewRoot = document.getElementById('admin-communication-preview');
    const reasonInput = document.getElementById('admin-communication-reason');
    const evidenceInput = document.getElementById('admin-communication-evidence');
    const confirmation = document.getElementById('admin-communication-confirm');
    const execute = document.getElementById('admin-communication-execute');
    const close = document.getElementById('admin-communication-close');
    const error = document.getElementById('admin-communication-error');
    let request = null;
    let preview = null;
    let generation = 0;

    function label(intent) { return { SEND_DEPOSIT_PAYMENT_LINK: 'Send deposit payment link', REMIND_REMAINING_FEE: 'Remind about remaining fee', SEND_COHORT_UPDATE: 'Send cohort update' }[intent] || 'Approved communication'; }
    function setError(message) { error.textContent = message || ''; error.hidden = !message; }
    function setFormEnabled(enabled) { reasonInput.disabled = !enabled; evidenceInput.disabled = !enabled; confirmation.disabled = !enabled; execute.disabled = !enabled || !confirmation.checked; }

    function itemRow(item) {
      const tr = document.createElement('tr');
      const recipient = node('td', safeId(item.enrolmentId) || 'Recipient unavailable');
      if (safeId(item.learnerId)) recipient.appendChild(node('span', 'Learner ' + item.learnerId, 'admin-list-meta'));
      const eligibility = node('td', item.eligible === true ? 'Eligible' : 'Excluded');
      const action = node('td', DECISIONS[item.decision] || 'Platform review required');
      const details = document.createElement('td');
      details.appendChild(node('strong', typeof item.subject === 'string' ? item.subject : 'Canonical subject unavailable'));
      details.appendChild(node('span', typeof item.purpose === 'string' ? item.purpose : 'Approved operational communication', 'admin-list-meta'));
      if (Number.isSafeInteger(item.amountDue) && /^[A-Z]{3}$/.test(item.currency || '')) details.appendChild(node('span', window.sjAdminUi.money(item.amountDue, item.currency), 'admin-list-meta'));
      if (item.deadline) details.appendChild(node('span', 'Deadline ' + window.sjAdminUi.date(item.deadline), 'admin-list-meta'));
      details.appendChild(node('span', 'Link: ' + window.sjAdminUi.label(item.linkDisposition), 'admin-list-meta'));
      const why = node('td', reason(item.reason));
      tr.append(recipient, eligibility, action, details, why); return tr;
    }

    function renderPreview(data) {
      previewRoot.replaceChildren();
      const summary = node('div', '', 'admin-status-summary');
      [['Eligible', data.eligibleCount], ['Excluded', data.excludedCount], ['Scope', window.sjAdminUi.label(data.scope)]].forEach(([name, value]) => { const item = node('div', ''); item.appendChild(node('span', name, 'admin-list-meta')); item.appendChild(node('strong', String(value))); summary.appendChild(item); });
      previewRoot.appendChild(summary);
      if (data.nextCursor || !data.previewToken) {
        previewRoot.appendChild(node('p', 'This audience preview is incomplete and cannot be executed. Narrow the cohort or contact support.', 'admin-exception-banner'));
      }
      const wrap = node('div', '', 'admin-table-scroll'); const table = node('table', '', 'admin-roster');
      const head = document.createElement('thead'); const row = document.createElement('tr'); ['Recipient', 'Eligibility', 'Platform decision', 'Canonical message', 'Reason'].forEach((value) => row.appendChild(node('th', value))); head.appendChild(row);
      const body = document.createElement('tbody'); (Array.isArray(data.items) ? data.items : []).forEach((item) => body.appendChild(itemRow(item))); table.append(head, body); wrap.appendChild(table); previewRoot.appendChild(wrap);
      if (data.exclusionReasons && Object.keys(data.exclusionReasons).length) previewRoot.appendChild(window.sjAdminUi.technicalDetails(data.exclusionReasons, 'Exclusion counts and reasons'));
      const executable = Boolean(data.previewToken && !data.nextCursor && Number.isSafeInteger(data.eligibleCount) && data.eligibleCount > 0);
      setFormEnabled(executable);
      if (!executable && data.eligibleCount === 0) previewRoot.appendChild(node('p', 'No recipient is currently eligible. Nothing can be sent from this preview.', 'admin-exception-banner'));
    }

    async function open(intent, enrolmentId, cohortId) {
      if (!INTENTS.has(intent) || (!safeId(enrolmentId) && !safeId(cohortId))) return;
      generation += 1; const current = generation;
      request = { intent, ...(safeId(enrolmentId) ? { enrolmentId } : { cohortId, limit: 1000 }) };
      preview = null; form.reset(); close.textContent = 'Cancel'; execute.textContent = 'Confirm and send'; setError(''); setFormEnabled(false);
      title.textContent = label(intent); previewRoot.replaceChildren(node('p', 'Checking current eligibility, recipients, and safe delivery action…', 'admin-empty'));
      dialog.showModal();
      try {
        const data = await config.request('/admin/training/communication-intents/preview', { method: 'POST', body: JSON.stringify(request) });
        if (current !== generation) return;
        preview = data; renderPreview(data);
      } catch (failure) {
        if (failure.status === 401 || failure.status === 403) { dialog.close(); config.clearSession('Your admin session is no longer authorized. Sign in again.'); return; }
        previewRoot.replaceChildren(node('p', 'The authoritative preview could not be loaded. No communication was sent.', 'admin-empty')); setError(config.friendlyError(failure));
      }
    }

    function renderOutcome(data) {
      previewRoot.replaceChildren();
      const summary = node('div', '', 'admin-status-summary');
      [['Accepted or replayed', data.acceptedCount], ['Skipped after revalidation', data.skippedCount], ['Excluded by preview', data.excludedCount]].forEach(([name, value]) => { const item = node('div', ''); item.appendChild(node('span', name, 'admin-list-meta')); item.appendChild(node('strong', String(value))); summary.appendChild(item); }); previewRoot.appendChild(summary);
      const outcomes = Array.isArray(data.outcomes) ? data.outcomes : [];
      if (outcomes.length) previewRoot.appendChild(window.sjAdminUi.technicalDetails(outcomes, 'Per-recipient delivery outcomes'));
      previewRoot.appendChild(node('p', 'Communication delivery does not change payment, enrolment, refund, cohort, or activation status.', 'admin-list-meta'));
      setFormEnabled(false); reasonInput.closest('.form-field').hidden = true; evidenceInput.closest('.form-field').hidden = true; confirmation.parentElement.hidden = true; execute.hidden = true; close.textContent = 'Done';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault(); setError('');
      if (!preview || !preview.previewToken || preview.nextCursor || !confirmation.checked || !form.reportValidity()) return;
      const body = { ...request, previewToken: preview.previewToken, reason: reasonInput.value.trim(), evidenceReference: evidenceInput.value.trim() };
      if (!body.reason || !body.evidenceReference) return;
      execute.disabled = true; execute.setAttribute('aria-busy', 'true'); execute.textContent = 'Sending…';
      try {
        const data = await config.request('/admin/training/communication-intents/execute', { method: 'POST', body: JSON.stringify(body), headers: { 'Idempotency-Key': config.idempotencyKey('communication-intent', body) } });
        renderOutcome(data); config.clearIdempotency('communication-intent'); config.setStatus('Communication request completed. Review the per-recipient outcome.', 'success');
      } catch (failure) {
        const code = (failure.body || {}).code;
        const message = code === 'COMMUNICATION_PREVIEW_STALE' ? 'The preview is stale because operational state changed. Close this window and preview the action again.' : config.friendlyError(failure);
        setError(message); if (failure.status && failure.status < 500) config.clearIdempotency('communication-intent'); execute.disabled = false; execute.textContent = 'Confirm and send';
      } finally { execute.removeAttribute('aria-busy'); }
    });
    confirmation.addEventListener('change', () => { execute.disabled = !confirmation.checked || !preview || !preview.previewToken || Boolean(preview.nextCursor); });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { generation += 1; request = null; preview = null; reasonInput.closest('.form-field').hidden = false; evidenceInput.closest('.form-field').hidden = false; confirmation.parentElement.hidden = false; execute.hidden = false; form.reset(); setError(''); });
    document.addEventListener('click', (event) => { const button = event.target.closest('[data-communication-intent]'); if (button) open(button.dataset.communicationIntent, button.dataset.communicationEnrolment, button.dataset.communicationCohort); });

    return { open, clear: () => { generation += 1; request = null; preview = null; if (dialog.open) dialog.close(); } };
  }

  window.sjAdminCommunications = { create };
}());
