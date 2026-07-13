(function () {
  'use strict';
  const ID = /^[A-Za-z0-9_-]{1,160}$/;
  function text(tag, value, className) { const node = document.createElement(tag); if (className) node.className = className; node.textContent = value || ''; return node; }
  function money(value, currency) { return Number.isSafeInteger(value) && value >= 0 && /^[A-Z]{3}$/.test(currency || '') ? value + ' minor units ' + currency : 'Not available'; }
  function safeId(value) { return ID.test(value || '') ? value : null; }
  function field(label, name, options) {
    const wrap = text('label', '', 'form-field'); wrap.appendChild(text('span', label));
    let input;
    if (options && options.values) { input = document.createElement('select'); options.values.forEach(([value, title]) => { const option = document.createElement('option'); option.value = value; option.textContent = title; input.appendChild(option); }); }
    else { input = document.createElement(options && options.multiline ? 'textarea' : 'input'); if (options && options.type) input.type = options.type; }
    input.name = name; input.required = !(options && options.optional); if (options && options.min) input.min = options.min; if (options && options.max) input.max = options.max; wrap.appendChild(input); return wrap;
  }
  function commandForm(title, fields, onSubmit) {
    const section = text('section', '', 'admin-payment-command'); section.appendChild(text('h4', title));
    const form = document.createElement('form'); form.className = 'admin-payment-command-form';
    fields.forEach((item) => form.appendChild(field(item.label, item.name, item)));
    const confirm = field('I confirm this test-mode command and reviewed current versions', 'confirmation', { type: 'checkbox' }); form.appendChild(confirm);
    const button = text('button', 'Submit command', 'btn btn-secondary'); button.type = 'submit'; form.appendChild(button);
    form.addEventListener('submit', async (event) => { event.preventDefault(); button.disabled = true; try { await onSubmit(new FormData(form)); } catch (_) { /* controller rendered safe recovery */ } finally { button.disabled = false; } });
    section.appendChild(form); return section;
  }
  function create(config) {
    const list = document.getElementById('admin-payments-list'); const detail = document.getElementById('admin-payment-detail'); const refresh = document.getElementById('admin-refresh-payments');
    let loaded = false; let selected = ''; let loading = false;
    function fail(error) {
      if (error.status === 401 || error.status === 403) { config.clearSession('Your admin session is no longer authorized. Sign in again.'); return; }
      config.setStatus(config.friendlyError(error), 'error');
    }
    async function command(path, scope, body) {
      try {
        await config.request(path, { method: 'POST', body: JSON.stringify(body), headers: { 'Idempotency-Key': config.idempotencyKey(scope, body) } });
        config.setStatus('Command accepted. Refreshing authoritative state...', 'success'); await loadDetail(selected);
      } catch (error) {
        config.setStatus('Command outcome was not accepted as complete. Refreshing authoritative evidence before any retry. ' + config.friendlyError(error), 'error');
        await loadDetail(selected);
        throw error;
      }
    }
    function addPair(dl, label, value) { dl.appendChild(text('dt', label)); dl.appendChild(text('dd', value === null || value === undefined || value === '' ? 'Not available' : String(value))); }
    function renderList(items) {
      list.replaceChildren(); if (!items.length) { list.appendChild(text('p', 'No Gate 2 obligations found.', 'admin-empty')); return; }
      items.forEach((item) => { const button = text('button', (item.status || 'Unknown') + ' · ' + money(item.amountDue, item.currency), 'admin-list-item'); button.type = 'button'; button.dataset.paymentObligationId = item.paymentObligationId; button.appendChild(text('span', item.enrolmentId || 'No enrolment', 'admin-list-meta')); list.appendChild(button); });
    }
    async function load(force) {
      if (!config.sessionActive() || loading || (loaded && !force)) return; loading = true;
      try { const data = await config.request('/admin/training/payments?limit=50', { method: 'GET' }); renderList(Array.isArray(data.items) ? data.items : []); loaded = true; config.setStatus('', ''); }
      catch (error) { fail(error); } finally { loading = false; }
    }
    function renderDetail(data, reconciliation, communications, cohorts) {
      detail.replaceChildren(); const obligation = data.obligation || {}; const snapshot = data.commercialSnapshot || {}; const enrolment = data.enrolment || {};
      detail.appendChild(text('h3', snapshot.courseTitleSnapshot || 'Payment obligation'));
      detail.appendChild(text('p', 'Obligation ' + (obligation.paymentObligationId || 'Not available') + ' · ' + (obligation.status || 'Unknown'), 'eyebrow'));
      const dl = document.createElement('dl'); dl.className = 'admin-detail-list';
      [['Enrolment', obligation.enrolmentId], ['Place status', enrolment.status], ['Obligation version', obligation.version], ['Chargeable', money(obligation.chargeableAmount, obligation.currency)], ['Captured', money(obligation.capturedAmount, obligation.currency)], ['Allocated capture', money(obligation.allocatedCapturedAmount, obligation.currency)], ['Unallocated capture', money(obligation.unallocatedCapturedAmount, obligation.currency)], ['Refunded', money(obligation.refundedAmount, obligation.currency)], ['Net paid', money(obligation.netPaid, obligation.currency)], ['Credit', money(obligation.creditAmount, obligation.currency)], ['Amount due', money(obligation.amountDue, obligation.currency)], ['Refundable', money(obligation.refundableAmount, obligation.currency)], ['Provider status', reconciliation.providerOperationalStatus], ['Settlement', reconciliation.settlementStatus], ['Snapshot', snapshot.commercialSnapshotId + ' v' + snapshot.version], ['Course/cohort', (snapshot.courseTitleSnapshot || '') + ' · ' + (snapshot.cohortLabelSnapshot || '')], ['Deadline', snapshot.requestDeadline], ['Policies', [snapshot.cancellationPolicyVersion, snapshot.refundPolicyVersion, snapshot.transferPolicyVersion].filter(Boolean).join(' · ')]].forEach(([label, value]) => addPair(dl, label, value)); detail.appendChild(dl);
      const collections = [['Payment requests', data.requests], ['Verified capture evidence', data.captures], ['Learner change requests', data.learnerChanges], ['Organiser decisions', data.learnerChangeDecisions], ['Provider refunds', data.refunds], ['Reconciliation history', reconciliation.items], ['Communication attempts', communications.items]];
      collections.forEach(([title, items]) => { const section = text('section', '', 'admin-payment-evidence'); section.appendChild(text('h4', title)); (Array.isArray(items) && items.length ? items : [null]).forEach((item) => section.appendChild(text('pre', item ? JSON.stringify(item, null, 2) : 'None recorded'))); detail.appendChild(section); });
      renderCommands(data, communications, cohorts);
    }
    function common(form) { return { confirmation: form.get('confirmation') === 'on', reason: String(form.get('reason') || '').trim(), evidenceReference: String(form.get('evidenceReference') || '').trim() }; }
    function renderCommands(data, communications, cohorts) {
      const obligation = data.obligation || {}; const current = (data.requests || []).find((item) => item.paymentRequestId === obligation.currentPaymentRequestId); const baseFields = [{ label: 'Operational reason', name: 'reason', multiline: true }, { label: 'Evidence reference', name: 'evidenceReference' }];
      if (current && Array.isArray(current.availableCommands)) {
        const modes = Array.isArray(current.replacementModes) ? current.replacementModes : [];
        if (current.availableCommands.includes('REPLACE') && modes.length) detail.appendChild(commandForm('Replace current test payment link', [{ label: 'Replacement mode', name: 'mode', values: modes.map((mode) => [mode, mode === 'TECHNICAL_REPLACEMENT' ? 'Technical replacement' : 'Post-expiry replacement']) }, ...baseFields], (form) => command('/admin/training/payment-requests/' + encodeURIComponent(current.paymentRequestId) + '/replace', 'replace:' + current.paymentRequestId, { mode: form.get('mode'), expectedRequestVersion: Number(current.version), expectedObligationVersion: Number(obligation.version), ...common(form) })));
        if (current.availableCommands.includes('DISABLE')) {
        detail.appendChild(commandForm('Disable current test payment link', baseFields, (form) => command('/admin/training/payment-requests/' + encodeURIComponent(current.paymentRequestId) + '/disable', 'disable:' + current.paymentRequestId, { expectedRequestVersion: Number(current.version), expectedObligationVersion: Number(obligation.version), ...common(form) })));
        }
      }
      (data.learnerChanges || []).filter((item) => item.status === 'REQUESTED').forEach((item) => detail.appendChild(commandForm('Decide ' + item.requestType.toLowerCase() + ' request', [{ label: 'Decision', name: 'decision', values: [['APPROVED', 'Approve'], ['REJECTED', 'Reject'], ['TRANSFER_OFFERED', 'Transfer offered'], ['ACTION_NEEDED', 'Action needed']] }, ...baseFields], (form) => command('/admin/training/' + item.requestType.toLowerCase() + '-requests/' + encodeURIComponent(item.requestId) + '/decide', 'decide:' + item.requestId, { decision: form.get('decision'), expectedVersion: Number(item.version), ...common(form) }))));
      (data.learnerChangeDecisions || []).filter((item) => item.requestType === 'TRANSFER' && ['APPROVED', 'TRANSFER_OFFERED'].includes(item.decision)).forEach((decision) => {
        const request = (data.learnerChanges || []).find((item) => item.requestId === decision.requestId);
        const choices = (cohorts || []).filter((item) => item.cohortId !== data.enrolment.cohortId && item.lifecycle === 'OPEN' && item.isFull === false && Number(item.capacityRemaining) > 0).map((item) => [item.cohortId, item.label + ' · v' + item.version]);
        if (!request || !choices.length || data.enrolment.status === 'TRANSFERRED') return;
        detail.appendChild(commandForm('Apply approved transfer after required refund', [{ label: 'Target open cohort', name: 'targetCohortId', values: choices }, ...baseFields], (form) => { const cohort = cohorts.find((item) => item.cohortId === form.get('targetCohortId')); return command('/admin/training/transfer-requests/' + encodeURIComponent(request.requestId) + '/apply', 'transfer:' + request.requestId, { targetCohortId: cohort.cohortId, expectedRequestVersion: Number(request.version), expectedDecisionVersion: Number(decision.version), expectedSourceEnrolmentVersion: Number(data.enrolment.version), expectedTargetCohortVersion: Number(cohort.version), ...common(form) }); }));
      });
      const captures = data.captures || [];
      (data.refundOptions || []).forEach((option) => detail.appendChild(commandForm('Initiate backend-bounded test refund for ' + option.providerPaymentReference, [{ label: 'Mode', name: 'mode', values: option.allowedModes.map((mode) => [mode, mode === 'FULL' ? 'Full remaining refundable amount' : 'Approved partial exception']) }, { label: 'Amount in minor units (maximum ' + option.maximumAmountMinorUnits + ')', name: 'amountMinorUnits', type: 'number', min: '1', max: String(option.maximumAmountMinorUnits) }, { label: 'Approved decision evidence', name: 'decisionId', values: option.reasonCode === 'ORGANISER_DECISION' ? option.decisionIds.map((id) => [id, id]) : [['', 'Not applicable to excess capture']] }, ...baseFields], (form) => command('/admin/training/payments/' + encodeURIComponent(obligation.paymentObligationId) + '/refunds', 'refund:' + obligation.paymentObligationId + ':' + option.providerPaymentReference, { mode: form.get('mode'), amountMinorUnits: Number(form.get('amountMinorUnits')), providerPaymentReference: option.providerPaymentReference, reasonCode: option.reasonCode, decisionId: option.reasonCode === 'EXCESS_CAPTURE_REFUND' ? null : form.get('decisionId'), expectedObligationVersion: Number(obligation.version), ...common(form) }))));
      (data.refunds || []).filter((item) => item.status === 'FAILED_RETRYABLE').forEach((item) => detail.appendChild(commandForm('Retry failed test refund ' + item.refundId, baseFields, (form) => command('/admin/training/refunds/' + encodeURIComponent(item.refundId) + '/retry', 'refund-retry:' + item.refundId, { expectedVersion: Number(item.version), ...common(form) }))));
      detail.appendChild(commandForm('Record provider operational status', [{ label: 'Provider status', name: 'providerStatus', values: ['DELAYED_SETTLEMENT', 'DISPUTE', 'CHARGEBACK', 'ACCOUNT_RESTRICTED', 'UNKNOWN', 'CLEARED'].map((value) => [value, value.replaceAll('_', ' ')]) }, ...baseFields], (form) => command('/admin/training/payments/' + encodeURIComponent(obligation.paymentObligationId) + '/reconcile', 'provider-status:' + obligation.paymentObligationId, { command: 'RECORD_PROVIDER_STATUS', providerStatus: form.get('providerStatus'), expectedObligationVersion: Number(obligation.version), ...common(form) })));
      const allocatable = captures.filter((item) => item.allocationCommandAvailable === true);
      if (allocatable.length) detail.appendChild(commandForm('Attempt backend-controlled verified capture allocation', [{ label: 'Verified capture reference', name: 'providerPaymentReference', values: allocatable.map((item) => [item.providerPaymentReference, item.providerPaymentReference + ' · ' + money(item.amountMinorUnits, item.currency)]) }, ...baseFields], (form) => command('/admin/training/payments/' + encodeURIComponent(obligation.paymentObligationId) + '/reconcile', 'allocate:' + obligation.paymentObligationId, { command: 'ALLOCATE_VERIFIED_CAPTURE', providerPaymentReference: form.get('providerPaymentReference'), expectedObligationVersion: Number(obligation.version), ...common(form) })));
      (communications.items || []).filter((item) => item.canResend === true).forEach((item) => detail.appendChild(commandForm('Resend original approved communication', baseFields, (form) => command('/admin/training/enrolments/' + encodeURIComponent(obligation.enrolmentId) + '/communications/resend', 'communication:' + item.logicalKey, { logicalKey: item.logicalKey, mode: 'ORIGINAL_RENDER', ...common(form) }))));
    }
    async function loadDetail(id) {
      if (!safeId(id) || !config.sessionActive()) return; selected = id; detail.replaceChildren(text('p', 'Loading authoritative Gate 2 evidence...', 'admin-empty'));
      try { const data = await config.request('/admin/training/payments/' + encodeURIComponent(id), { method: 'GET' }); const enrolmentId = data.obligation && safeId(data.obligation.enrolmentId); const courseId = data.obligation && safeId(data.obligation.courseId); const results = await Promise.all([config.request('/admin/training/payments/' + encodeURIComponent(id) + '/reconciliation', { method: 'GET' }), enrolmentId ? config.request('/admin/training/enrolments/' + encodeURIComponent(enrolmentId) + '/communications?limit=50', { method: 'GET' }) : Promise.resolve({ items: [] }), courseId ? config.request('/admin/training/cohorts?courseId=' + encodeURIComponent(courseId) + '&limit=100', { method: 'GET' }) : Promise.resolve({ items: [] })]); renderDetail(data, results[0], results[1], Array.isArray(results[2].items) ? results[2].items : []); config.setStatus('', ''); }
      catch (error) { detail.replaceChildren(text('p', 'Payment evidence is temporarily unavailable.', 'admin-empty')); fail(error); }
    }
    list.addEventListener('click', (event) => { const button = event.target.closest('[data-payment-obligation-id]'); if (button) loadDetail(button.dataset.paymentObligationId); });
    refresh.addEventListener('click', () => { loaded = false; load(true); if (selected) loadDetail(selected); });
    return { clear() { loaded = false; selected = ''; list.replaceChildren(); detail.replaceChildren(text('p', 'Select a payment obligation to review.', 'admin-empty')); }, load };
  }
  window.sjAdminPayments = { create, money, safeId };
}());
