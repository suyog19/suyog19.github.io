(function () {
  'use strict';
  const ID = /^[A-Za-z0-9_-]{1,160}$/;
  const COMMANDS = new Set(['CONFIRM', 'POSTPONE', 'CANCEL']);
  const PRODUCTION_COMMERCIAL_DOCUMENT_VERSIONS = Object.freeze([
    'software-signal-terms@1.1.0',
    'software-signal-privacy@1.1.0',
    'software-signal-cancellation-refund@1.1.0',
    'software-signal-course-delivery@1.1.0',
    'software-signal-recording-consent@1.1.0',
    'software-signal-conduct-confidentiality@1.1.0',
    'software-signal-support-grievance@1.1.0',
    'software-signal-transfer@1.1.0',
  ]);
  function validProductionCommercialDocumentVersions(value) { return Array.isArray(value) && value.length === PRODUCTION_COMMERCIAL_DOCUMENT_VERSIONS.length && value.every((item, index) => item === PRODUCTION_COMMERCIAL_DOCUMENT_VERSIONS[index]); }
  function safeId(value) { return ID.test(value || '') ? value : null; }
  function text(tag, value, className) { const node = document.createElement(tag); if (className) node.className = className; node.textContent = value == null ? '' : String(value); return node; }
  function pair(dl, label, value) { dl.appendChild(text('dt', label)); dl.appendChild(text('dd', value == null || value === '' ? 'Not available' : value)); }
  function field(label, name, options = {}) {
    const wrap = text('label', '', 'form-field'); wrap.appendChild(text('span', label));
    const input = options.values ? document.createElement('select') : document.createElement(options.multiline ? 'textarea' : 'input');
    if (options.values) options.values.forEach(([value, title]) => { const option = document.createElement('option'); option.value = value; option.textContent = title; input.appendChild(option); });
    if (options.type) input.type = options.type; input.name = name; input.required = options.optional !== true; if (options.value != null) input.value = options.value; wrap.appendChild(input); return wrap;
  }
  function allowed(summary, command) { return COMMANDS.has(command) && Array.isArray(summary && summary.allowedCommands) && summary.allowedCommands.includes(command); }
  function shouldReloadAfterCommand(error) { return Boolean(error && (error.status === 409 || error.status === 412)); }
  function iso(value) { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? date.toISOString() : null; }
  function contract(environment) {
    return environment === 'production' ? {
      approvalStatus: 'APPROVED_FOR_PRODUCTION', scheduleVersion: 'PROD-G3-SCHEDULE-v1',
      policyId: 'PROD-G3-POLICY-v1', policyVersion: 'PROD-G3-BALANCE-v1',
      extensionRulesVersion: 'PROD-G3-EXTENSION-v1', creditWaiverRulesVersion: 'PROD-G3-CREDIT-WAIVER-v1',
      depositDispositionPolicyVersion: 'PROD-G3-DEPOSIT-DISPOSITION-v1', nonPaymentClosurePolicyVersion: 'PROD-G3-NON-PAYMENT-v1',
      commercialDocumentVersions: PRODUCTION_COMMERCIAL_DOCUMENT_VERSIONS,
    } : {
      approvalStatus: 'APPROVED_FOR_DEVELOPMENT', scheduleVersion: 'development-v1',
      policyId: 'development-policy', policyVersion: 'development-v1',
      extensionRulesVersion: 'development-v1', creditWaiverRulesVersion: 'development-v1',
      depositDispositionPolicyVersion: 'development-v1', nonPaymentClosurePolicyVersion: 'development-v1',
      commercialDocumentVersions: Object.freeze([]),
    };
  }
  function common(form, summary) {
    const body = {
      expectedCohortVersion: Number(summary.cohortVersion), expectedDecisionSequence: Number(summary.decisionSequence),
      confirmation: form.get('confirmation') === 'on', reason: String(form.get('reason') || '').trim(), evidenceReference: String(form.get('evidenceReference') || '').trim(),
    };
    const revision = String(form.get('revisionReason') || '').trim(); if (revision) body.revisionReason = revision;
    const revisedAt = iso(form.get('revisedDecisionAt')); if (revisedAt) body.revisedDecisionAt = revisedAt;
    return body;
  }
  function confirmationPayload(form, summary, environment = 'development') {
    const defaults = contract(environment); const production = environment === 'production';
    const policy = {
      policyId: production ? defaults.policyId : String(form.get('policyId') || '').trim(), policyVersion: production ? defaults.policyVersion : String(form.get('policyVersion') || '').trim(), approvalStatus: defaults.approvalStatus,
      extensionRulesVersion: production ? defaults.extensionRulesVersion : String(form.get('extensionRulesVersion') || '').trim(), creditWaiverRulesVersion: production ? defaults.creditWaiverRulesVersion : String(form.get('creditWaiverRulesVersion') || '').trim(),
      depositApplicationRule: form.get('depositApplicationRule'), depositDispositionRule: form.get('depositDispositionRule'), depositDispositionPolicyVersion: production ? defaults.depositDispositionPolicyVersion : String(form.get('depositDispositionPolicyVersion') || '').trim(), nonPaymentClosurePolicyVersion: production ? defaults.nonPaymentClosurePolicyVersion : String(form.get('nonPaymentClosurePolicyVersion') || '').trim(), commercialDocumentVersions: Array.from(defaults.commercialDocumentVersions),
    };
    if (!production) { policy.balanceDeadline = iso(form.get('balanceDeadline')); policy.graceUntil = iso(form.get('graceUntil')); }
    return {
      ...common(form, summary),
      finalSchedule: { timezone: String(form.get('timezone') || '').trim(), startsAt: iso(form.get('startsAt')), endsAt: iso(form.get('endsAt')), scheduleVersion: production ? defaults.scheduleVersion : String(form.get('scheduleVersion') || '').trim() },
      policy,
    };
  }
  function create(config) {
    const environment = config.environment === 'production' ? 'production' : 'development'; const defaults = contract(environment);
    const list = document.getElementById('admin-gate3-cohorts'); const detail = document.getElementById('admin-gate3-detail'); const refresh = document.getElementById('admin-refresh-gate3');
    let loaded = false; let loading = false; let selected = ''; let records = []; let generation = 0;
    function fail(error) { if (error.status === 401 || error.status === 403) return config.clearSession('Your admin session is no longer authorized. Sign in again.'); config.setStatus(config.friendlyError(error), 'error'); }
    function commandForm(title, command, summary, fields, payload, help) {
      const section = text('section', '', 'admin-payment-command'); section.appendChild(text('h4', title)); if (help) section.appendChild(text('p', help, 'form-help')); const form = document.createElement('form'); form.className = 'admin-payment-command-form';
      fields.forEach((item) => form.appendChild(field(item.label, item.name, item))); form.appendChild(field('I understand the consequence and want to continue', 'confirmation', { type: 'checkbox' })); const button = text('button', window.sjAdminUi.label(command), 'btn btn-secondary'); button.type = 'submit'; form.appendChild(button);
      form.addEventListener('submit', async (event) => { event.preventDefault(); if (!allowed(summary, command)) return; button.disabled = true; const body = payload(new FormData(form), summary); const action = { CONFIRM: 'confirm', POSTPONE: 'postpone', CANCEL: 'cancel' }[command]; try { await config.request('/admin/training/cohorts/' + encodeURIComponent(summary.cohortId) + '/' + action, { method: 'POST', body: JSON.stringify(body), headers: { 'Idempotency-Key': config.idempotencyKey('decision:' + summary.cohortId + ':' + command, body) } }); config.setStatus(window.sjAdminUi.label(command) + ' completed.', 'success'); await load(true); } catch (error) { if (shouldReloadAfterCommand(error)) await load(true); fail(error); } finally { button.disabled = false; } });
      section.appendChild(form); return section;
    }
    function renderList() { list.replaceChildren(); if (!records.length) return list.appendChild(text('p', 'No cohorts are available.', 'admin-empty')); records.forEach((record) => { const button = text('button', record.cohort.label + ' · ' + (record.summary.decisionState || 'PENDING'), 'admin-list-item'); button.type = 'button'; button.dataset.gate3CohortId = record.cohort.cohortId; button.appendChild(text('span', record.course.title || record.course.courseId, 'admin-list-meta')); list.appendChild(button); }); }
    function renderDetail(record) {
      detail.replaceChildren(); if (!record) return detail.appendChild(text('p', 'Select a cohort to review.', 'admin-empty')); const summary = record.summary; const decision = summary.currentDecision || {};
      detail.appendChild(text('h3', record.cohort.label)); detail.appendChild(text('p', summary.minimumThresholdReached ? `Ready for decision. ${summary.reservedCount} learners have reserved seats; the minimum required is ${summary.minimumSize}.` : `${summary.reservedCount} learners have reserved seats; ${summary.minimumSize} are required before confirmation.`, 'admin-decision-summary'));
      const dl = document.createElement('dl'); dl.className = 'admin-detail-list'; [['Reserved seats', summary.reservedCount], ['Eligible learners', summary.eligibleCount], ['Learners needing attention', summary.ineligibleCount], ['Minimum required', summary.minimumSize], ['Minimum cohort size reached', window.sjAdminUi.label(summary.minimumThresholdReached)], ['Seats remaining', summary.capacityRemaining], ['Eligibility counts need review', window.sjAdminUi.label(summary.eligibilityReconciliationRequired)], ['Decision status', window.sjAdminUi.label(summary.decisionState)]].forEach(([label, value]) => pair(dl, label, value)); detail.appendChild(dl);
      detail.appendChild(window.sjAdminUi.technicalDetails({ decisionSequence: summary.decisionSequence, cohortVersion: summary.cohortVersion, allowedCommands: summary.allowedCommands, finalSchedule: decision.finalSchedule || null, commercialContext: decision.commercialContext || null, policy: decision.policy || null }));
      const base = [{ label: 'Operational reason', name: 'reason', multiline: true }, { label: 'Evidence reference', name: 'evidenceReference' }]; const revision = Number(summary.decisionSequence) > 0 ? [{ label: 'Revision reason', name: 'revisionReason', multiline: true }] : [];
      if (allowed(summary, 'CONFIRM')) detail.appendChild(commandForm('Confirm cohort and open balance obligations', 'CONFIRM', summary, [
        { label: 'Final schedule timezone', name: 'timezone', value: record.cohort.timezone || 'Asia/Kolkata' }, { label: 'Final start', name: 'startsAt', type: 'datetime-local' }, { label: 'Final end', name: 'endsAt', type: 'datetime-local' }, { label: 'Schedule version', name: 'scheduleVersion', value: defaults.scheduleVersion },
        ...(environment === 'production' ? [] : [{ label: 'Balance deadline', name: 'balanceDeadline', type: 'datetime-local' }, { label: 'Grace ends', name: 'graceUntil', type: 'datetime-local' }, { label: 'Policy id', name: 'policyId', value: defaults.policyId }, { label: 'Policy version', name: 'policyVersion', value: defaults.policyVersion }, { label: 'Extension rules version', name: 'extensionRulesVersion', value: defaults.extensionRulesVersion }, { label: 'Credit/waiver rules version', name: 'creditWaiverRulesVersion', value: defaults.creditWaiverRulesVersion }]),
        { label: 'Deposit application', name: 'depositApplicationRule', values: [['APPLY_NET_PAID_TO_COURSE_FEE', 'Apply verified net deposit to fee'], ['EXCLUDE_FROM_COURSE_FEE', 'Exclude deposit from fee']] }, { label: 'Non-payment deposit treatment', name: 'depositDispositionRule', values: [['ACTION_NEEDED', 'Organiser review required'], ['RETAIN', 'Retain'], ['REFUND', 'Refund intent'], ['TRANSFER', 'Transfer intent']] }, ...(environment === 'production' ? [] : [{ label: 'Deposit treatment policy version', name: 'depositDispositionPolicyVersion', value: defaults.depositDispositionPolicyVersion }, { label: 'Non-payment closure policy version', name: 'nonPaymentClosurePolicyVersion', value: defaults.nonPaymentClosurePolicyVersion }]), ...revision, ...base,
      ], (form, current) => confirmationPayload(form, current, environment), environment === 'production' ? 'The server records the authoritative confirmation time, sets the balance deadline seven days later, and applies zero grace. Production policy versions are fixed to the approved set.' : 'Development confirmation uses the entered balance deadline, grace end, and development policy versions.'));
      const decisionFields = [{ label: 'Revised decision date (optional)', name: 'revisedDecisionAt', type: 'datetime-local', optional: true }, ...revision, ...base];
      if (allowed(summary, 'POSTPONE')) detail.appendChild(commandForm('Postpone or revise decision date', 'POSTPONE', summary, decisionFields, common));
      if (allowed(summary, 'CANCEL')) detail.appendChild(commandForm('Cancel cohort decision', 'CANCEL', summary, decisionFields, common));
    }
    async function load(force) { if (!config.sessionActive() || loading || (loaded && !force)) return; const requestGeneration = ++generation; loading = true; try { const courses = await config.request('/admin/training/courses', { method: 'GET' }); if (requestGeneration !== generation || !config.sessionActive()) return; const courseItems = Array.isArray(courses.items) ? courses.items : []; const groups = await Promise.all(courseItems.map(async (course) => { const page = await config.request('/admin/training/cohorts?courseId=' + encodeURIComponent(course.courseId) + '&limit=100', { method: 'GET' }); return Promise.all((page.items || []).map(async (cohort) => { const data = await config.request('/admin/training/cohorts/' + encodeURIComponent(cohort.cohortId) + '/gate3-summary', { method: 'GET' }); return { course, cohort, summary: data.summary || {} }; })); })); if (requestGeneration !== generation || !config.sessionActive()) return; records = groups.flat(); loaded = true; renderList(); if (selected) renderDetail(records.find((item) => item.cohort.cohortId === selected)); config.setStatus('', ''); } catch (error) { if (requestGeneration === generation && config.sessionActive()) fail(error); } finally { loading = false; } }
    async function openForCohort(cohortId) { if (!safeId(cohortId)) return; selected = cohortId; await load(true); const record = records.find((item) => item.cohort.cohortId === selected); if (record) renderDetail(record); }
    list.addEventListener('click', (event) => { const button = event.target.closest('[data-gate3-cohort-id]'); if (!button || !safeId(button.dataset.gate3CohortId)) return; selected = button.dataset.gate3CohortId; renderDetail(records.find((item) => item.cohort.cohortId === selected)); }); refresh.addEventListener('click', () => { loaded = false; load(true); });
    return { load, openForCohort, clear() { generation += 1; loaded = false; selected = ''; records = []; list.replaceChildren(); detail.replaceChildren(text('p', 'Select a cohort to review.', 'admin-empty')); } };
  }
  window.sjAdminGate3 = { allowed, confirmationPayload, contract, create, safeId, shouldReloadAfterCommand, validProductionCommercialDocumentVersions };
}());
