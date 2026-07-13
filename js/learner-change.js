(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const status = document.getElementById('change-status');
  const panel = document.getElementById('change-panel');
  const state = document.getElementById('change-state');
  const details = document.getElementById('change-details');
  const form = document.getElementById('change-form');
  const errors = document.getElementById('change-error-actions');
  const submit = document.getElementById('change-submit');
  const ID = /^[A-Za-z0-9_-]{1,128}$/;
  let context = null;

  function enrolmentId() { const value = new URLSearchParams(location.search).get('enrolmentId'); return ID.test(value || '') ? value : null; }
  function loginUrl() { return '/learn/?continue=' + encodeURIComponent(location.pathname + location.search); }
  function text(tag, value) { const node = document.createElement(tag); node.textContent = value || ''; return node; }
  function addDetail(label, value) { details.appendChild(text('dt', label)); details.appendChild(text('dd', value || 'Not available')); }
  function money(value, currency) { return Number.isSafeInteger(value) && value >= 0 && /^[A-Z]{3}$/.test(currency || '') ? new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value / 100) : 'Not available'; }
  function key(id, kind) { const name = 'sj_gate2_change_' + id + '_' + kind; let value = sessionStorage.getItem(name); if (!value) { value = 'web_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)); sessionStorage.setItem(name, value); } return value; }
  function findApplication(summary, id) { return (Array.isArray(summary.applications) ? summary.applications : []).find((item) => item.offer && item.offer.enrolmentId === id) || null; }
  function describe(change, refund) {
    if (refund) {
      if (['PENDING_SUBMISSION', 'SUBMITTING', 'PROCESSING'].includes(refund.status)) return ['Refund processing', 'The organiser decision is complete. Razorpay test-mode processing is still separate and not yet complete.'];
      if (refund.status === 'COMPLETED') return ['Completed', 'The service reports that the refund has completed.'];
      return ['Action needed', 'The refund needs organiser review. Do not make another payment or assume completion.'];
    }
    if (!change) return ['Request a review', 'Choose one outcome. We will review it against the current policy and payment record.'];
    if (change.status === 'REQUESTED') return ['Submitted', 'Your request is under review. No refund, credit or transfer has been promised.'];
    if (change.decision === 'APPROVED' || change.decision === 'TRANSFER_OFFERED') return ['Approved', 'The organiser approved the request. Any refund processing or separate transfer offer will appear as its own stage.'];
    if (change.decision === 'REJECTED') return ['Rejected', 'The organiser did not approve this request. Contact support if you need clarification.'];
    return ['Action needed', 'The organiser needs more information or manual review.'];
  }
  function render(application, payment) {
    const gate = application.gate2 || {};
    const change = gate.learnerChange;
    const refund = gate.refund;
    const copy = describe(change, refund);
    state.replaceChildren(text('h2', copy[0]), text('p', copy[1]));
    details.replaceChildren();
    addDetail('Course', application.course && application.course.title);
    addDetail('Current place', gate.enrolment && gate.enrolment.status);
    addDetail('Amount received', money(gate.payment && gate.payment.capturedAmount, gate.payment && gate.payment.currency));
    addDetail('Refund status', refund && refund.status);
    addDetail('Refund amount', refund ? money(refund.amount, gate.payment && gate.payment.currency) : 'Not started');
    addDetail('Cancellation policy', payment.review && payment.review.policyVersions && payment.review.policyVersions.cancellation);
    addDetail('Refund policy', payment.review && payment.review.policyVersions && payment.review.policyVersions.refund);
    addDetail('Transfer policy', payment.review && payment.review.policyVersions && payment.review.policyVersions.transfer);
    form.hidden = Boolean(change) || Boolean(refund) || !['OFFERED', 'RESERVED'].includes(gate.enrolment && gate.enrolment.status);
    panel.hidden = false;
  }
  async function initialise() {
    const id = enrolmentId(); panel.hidden = true; errors.hidden = true; status.hidden = false; status.textContent = 'Restoring your secure session...';
    if (!id) { status.textContent = 'This request link is incomplete. Return to My Learning.'; errors.hidden = false; return; }
    try {
      const user = await auth.restore(); if (!user) { location.replace(loginUrl()); return; }
      status.textContent = 'Checking authoritative request status...';
      const results = await Promise.all([auth.request('/me/learning-summary', { method: 'GET' }), auth.request('/me/enrolments/' + encodeURIComponent(id) + '/payment', { method: 'GET' })]);
      const application = findApplication(results[0], id); const payment = results[1].payment || results[1];
      if (!application || !application.gate2 || !payment) throw Object.assign(new Error('NOT_AVAILABLE'), { status: 404 });
      context = { id, application, payment }; render(application, payment); status.hidden = true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) { location.replace(loginUrl()); return; }
      status.textContent = error.status === 404 ? 'This request is not available for the selected enrolment.' : 'Request status is temporarily unavailable. No request was changed.'; errors.hidden = false;
    }
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); if (!context) return;
    const selected = new FormData(form).get('requestType');
    const kind = selected === 'TRANSFER' ? 'TRANSFER' : 'CANCELLATION';
    const outcome = selected === 'DISCUSS_OPTIONS' ? 'DISCUSS_OPTIONS' : selected;
    const policy = context.payment.review && context.payment.review.policyVersions && context.payment.review.policyVersions[kind.toLowerCase()];
    if (!policy || document.getElementById('change-ack').checked !== true) { status.hidden = false; status.textContent = 'Review and acknowledge the current policy before submitting.'; return; }
    submit.disabled = true; status.hidden = false; status.textContent = 'Submitting your request...';
    try {
      await auth.request('/me/enrolments/' + encodeURIComponent(context.id) + '/' + kind.toLowerCase() + '-requests', { method: 'POST', headers: { 'Idempotency-Key': key(context.id, kind) }, body: JSON.stringify({ category: document.getElementById('change-category').value, requestedOutcome: outcome, explanation: document.getElementById('change-explanation').value, policyAcknowledgement: { documentId: 'software-signal-' + kind.toLowerCase() + '-development-policy', version: policy } }) });
      await initialise();
    } catch (error) {
      status.textContent = error.status === 409 ? 'A request already exists or eligibility changed. Check the current status.' : 'The request could not be submitted. No refund, credit or transfer was created.'; errors.hidden = false;
    } finally { submit.disabled = false; }
  });
  document.getElementById('change-retry').addEventListener('click', initialise);
  window.sjLearnerChange = { describe, enrolmentId, findApplication, initialise, money, render };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
