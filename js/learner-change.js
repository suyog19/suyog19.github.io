(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const recovery = window.sjLearnerChangeRecovery;
  const status = document.getElementById('change-status');
  const panel = document.getElementById('change-panel');
  const state = document.getElementById('change-state');
  const details = document.getElementById('change-details');
  const form = document.getElementById('change-form');
  const errors = document.getElementById('change-error-actions');
  const submit = document.getElementById('change-submit');
  const ID = /^[A-Za-z0-9_-]{1,128}$/;
  let context = null;
  let requiresReconciliation = false;

  function enrolmentId() { const value = new URLSearchParams(location.search).get('enrolmentId'); return ID.test(value || '') ? value : null; }
  function loginUrl() { return '/learn/?continue=' + encodeURIComponent(location.pathname + location.search); }
  function text(tag, value) { const node = document.createElement(tag); node.textContent = value || ''; return node; }
  function addDetail(label, value) { details.appendChild(text('dt', label)); details.appendChild(text('dd', value || 'Not available')); }
  function money(value, currency) { return Number.isSafeInteger(value) && value >= 0 && /^[A-Z]{3}$/.test(currency || '') ? new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value / 100) : 'Not available'; }
  function placeLabel(value) { return ({ OFFERED: 'Offer available', RESERVED: 'Seat reserved', CANCELLED: 'Place cancelled', TRANSFERRED: 'Place transferred' })[value] || 'Current status available in My Learning'; }
  function refundLabel(value) { return ({ PENDING_SUBMISSION: 'Refund under review', SUBMITTING: 'Refund being prepared', PROCESSING: 'Refund being processed', COMPLETED: 'Refund complete', FAILED_FINAL: 'Refund needs attention', ACTION_NEEDED: 'Refund needs attention' })[value] || 'No refund action recorded yet'; }
  function findApplication(summary, id) { return (Array.isArray(summary.applications) ? summary.applications : []).find((item) => item.offer && item.offer.enrolmentId === id) || null; }
  function describe(change, refund, enrolment) {
    if (refund) {
      if (['PENDING_SUBMISSION', 'SUBMITTING', 'PROCESSING'].includes(refund.status)) return ['Refund being processed', 'The organiser decision is complete. Refund processing is a separate stage and is not yet complete.'];
      if (refund.status === 'COMPLETED') return ['Refund complete', 'The refund is recorded as complete.'];
      return ['Refund needs attention', 'The refund needs organiser review. Do not make another payment or assume completion.'];
    }
    if (enrolment && ['CANCELLED', 'TRANSFERRED'].includes(enrolment.status)) {
      return ['Action needed', 'This place is already closed or transferred. A new request is unavailable; contact support if the status is unexpected.'];
    }
    if (!change) return ['Request a change', 'Choose the outcome you prefer. We will review it against the current policy and payment record.'];
    if (change.status === 'REQUESTED') return ['Request received', 'We will review the request and email you when a decision or meaningful update is recorded. No refund, credit or transfer has been promised.'];
    if (change.decision === 'APPROVED') return ['Request approved', 'The organiser approved the request. Any refund processing appears as a separate stage.'];
    if (change.decision === 'TRANSFER_OFFERED') return ['A transfer option is available', 'The organiser has offered a transfer. The next organiser-led step will be shown here.'];
    if (change.decision === 'REJECTED') return ['Your request was not approved', 'Contact support if you need clarification about the recorded decision.'];
    return ['Action needed', 'The organiser needs more information or manual review.'];
  }
  function render(application, payment) {
    const gate = application.gate2 || {};
    const change = gate.learnerChange;
    const refund = gate.refund;
    const copy = describe(change, refund, gate.enrolment);
    state.replaceChildren(text('h2', copy[0]), text('p', copy[1]));
    if (gate.communication && gate.communication.status === 'FAILED') {
      state.appendChild(text('p', 'A notification could not be confirmed. The request, decision and refund status shown here are unchanged.'));
    }
    details.replaceChildren();
    addDetail('Course', application.course && application.course.title);
    addDetail('Current place', placeLabel(gate.enrolment && gate.enrolment.status));
    addDetail('Amount received', money(gate.payment && gate.payment.capturedAmount, gate.payment && gate.payment.currency));
    addDetail('Refund status', refundLabel(refund && refund.status));
    addDetail('Refund amount', refund ? money(refund.amount, gate.payment && gate.payment.currency) : 'Not started');
    if (gate.communication && gate.communication.status === 'FAILED') addDetail('Email delivery', 'Delivery could not be confirmed; status unchanged');
    addDetail('Cancellation policy', payment.review && payment.review.policyVersions && payment.review.policyVersions.cancellation);
    addDetail('Refund policy', payment.review && payment.review.policyVersions && payment.review.policyVersions.refund);
    addDetail('Transfer policy', payment.review && payment.review.policyVersions && payment.review.policyVersions.transfer);
    form.hidden = Boolean(change) || Boolean(refund) || !['OFFERED', 'RESERVED'].includes(gate.enrolment && gate.enrolment.status);
    panel.hidden = false;
  }
  async function initialise() {
    const id = enrolmentId(); context = null; panel.hidden = true; errors.hidden = true; status.hidden = false; status.textContent = 'Restoring your secure session...';
    if (!id) { status.textContent = 'This request link is incomplete. Return to My Learning.'; errors.hidden = false; return; }
    try {
      const user = await auth.restore(); if (!user) { location.replace(loginUrl()); return; }
      status.textContent = 'Checking the current request status...';
      const results = await Promise.all([auth.request('/me/learning-summary', { method: 'GET' }), auth.request('/me/enrolments/' + encodeURIComponent(id) + '/payment', { method: 'GET' })]);
      const application = findApplication(results[0], id); const payment = results[1].payment || results[1];
      if (!application || !application.gate2 || !payment) throw Object.assign(new Error('NOT_AVAILABLE'), { status: 404 });
      context = { id, application, payment }; render(application, payment); status.hidden = true;
      const pending = recovery.reconcile(sessionStorage, id, Boolean(application.gate2.learnerChange || application.gate2.refund));
      if (application.gate2.learnerChange || application.gate2.refund) requiresReconciliation = false;
      if (!application.gate2.learnerChange && !application.gate2.refund && pending) {
        requiresReconciliation = true;
        status.hidden = false;
        status.textContent = 'We could not confirm whether the previous request was received. Check the current status before retrying.';
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) { location.replace(loginUrl()); return; }
      status.textContent = error.status === 404 ? 'This request is not available for the selected enrolment.' : 'Request status is temporarily unavailable. No request was changed.'; errors.hidden = false;
    }
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); if (!context) return;
    let envelope = recovery.read(sessionStorage, context.id);
    if (requiresReconciliation || envelope) {
      await initialise();
      const gate = context && context.application && context.application.gate2;
      if (!context) return;
      if (gate && (gate.learnerChange || gate.refund)) { recovery.clear(sessionStorage, context.id); requiresReconciliation = false; return; }
      envelope = recovery.read(sessionStorage, context.id);
      requiresReconciliation = false;
    }
    if (!envelope) {
      const selected = new FormData(form).get('requestType');
      const kind = selected === 'TRANSFER' ? 'TRANSFER' : 'CANCELLATION';
      const outcome = selected === 'DISCUSS_OPTIONS' ? 'DISCUSS_OPTIONS' : selected;
      const policy = context.payment.review && context.payment.review.policyVersions && context.payment.review.policyVersions[kind.toLowerCase()];
      if (!policy || document.getElementById('change-ack').checked !== true) { status.hidden = false; status.textContent = 'Review and acknowledge the current policy before submitting.'; return; }
      envelope = recovery.create(sessionStorage, window.crypto, context.id, kind, { category: document.getElementById('change-category').value, requestedOutcome: outcome, explanation: document.getElementById('change-explanation').value, policyAcknowledgement: { documentId: 'software-signal-' + kind.toLowerCase() + '-development-policy', version: policy } });
    }
    submit.disabled = true; status.hidden = false; status.textContent = 'Submitting your request...';
    try {
      await auth.request('/me/enrolments/' + encodeURIComponent(context.id) + '/' + envelope.kind.toLowerCase() + '-requests', { method: 'POST', headers: { 'Idempotency-Key': envelope.key }, body: JSON.stringify(envelope.payload) });
      recovery.clear(sessionStorage, context.id);
      await initialise();
    } catch (error) {
      if (recovery.isAmbiguous(error.status)) {
        requiresReconciliation = true;
        await initialise();
        const gate = context && context.application && context.application.gate2;
        if (!gate || (!gate.learnerChange && !gate.refund)) {
          status.hidden = false;
          status.textContent = 'The service did not confirm whether the request was received. Check status before retrying; the same request key will be reused.';
          errors.hidden = false;
        }
      } else {
        recovery.clear(sessionStorage, context.id);
        status.textContent = error.status === 409 ? 'A request already exists or eligibility changed. Check the current status.' : 'The request could not be submitted. No refund, credit or transfer was created.'; errors.hidden = false;
      }
    } finally { submit.disabled = false; }
  });
  document.getElementById('change-retry').addEventListener('click', initialise);
  window.sjLearnerChange = { describe, enrolmentId, findApplication, initialise, money, render };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
