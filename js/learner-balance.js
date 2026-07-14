(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const status = document.getElementById('balance-status');
  const panel = document.getElementById('balance-panel');
  const stateBox = document.getElementById('balance-state');
  const details = document.getElementById('balance-details');
  const action = document.getElementById('balance-action');
  const errorActions = document.getElementById('balance-error-actions');
  const retry = document.getElementById('balance-retry');
  const ID = /^[A-Za-z0-9_-]{1,128}$/;
  const CONFIRMATION_LABEL = 'Development test payment confirmation — not a tax invoice';
  const CONFIRMATION_TREATMENT = 'DEV-TEST-CONFIRMATION-NOT-TAX-INVOICE-v1';
  const JOINING_GUIDANCE = 'Joining instructions are available without session or resource links. Access remains unavailable until the separate Gate 4 status.';
  let loadGeneration = 0;
  let confirmingPolls = 0;
  let pollTimer = null;
  const STATES = {
    OPEN: ['Remaining fee due', 'Review the authoritative balance and current test payment action below.'],
    OVERDUE: ['Overdue within the allowed period', 'Your seat remains reserved while the service keeps this obligation open through the displayed grace or extension time.'],
    SATISFIED: ['Remaining fee completed', 'The service reports that this obligation is satisfied.'],
    CLOSED_NON_PAYMENT: ['Closed for non-payment', 'The service reports that the seat has been released. A late payment cannot reactivate the enrolment automatically.'],
    ACTION_NEEDED: ['Payment needs review', 'Verified money may have arrived, but it cannot safely activate this enrolment. Do not pay again; contact support.'],
  };
  const DISPOSITIONS = {
    RETAIN: 'Retained under the recorded policy',
    REFUND: 'Refund action required under the recorded policy',
    TRANSFER: 'Transfer action required under the recorded policy',
    ACTION_NEEDED: 'Action needed under the recorded policy',
  };

  function loginUrl() { return '/learn/?continue=' + encodeURIComponent(window.location.pathname + window.location.search); }
  function enrolmentId() {
    const value = new URLSearchParams(window.location.search).get('enrolmentId');
    return ID.test(value || '') ? value : null;
  }
  function text(tag, value, className) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value || '';
    return element;
  }
  function money(value, currency) {
    if (!Number.isSafeInteger(value) || value < 0 || !/^[A-Z]{3}$/.test(currency || '')) return 'Not available';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value / 100);
  }
  function dateTime(value) {
    if (typeof value !== 'string') return 'Not available';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? 'Not available' : parsed.toLocaleString();
  }
  function addDetail(label, value) {
    details.appendChild(text('dt', label));
    details.appendChild(text('dd', value || 'Not available'));
  }
  function clearPrivate() {
    panel.hidden = true;
    stateBox.replaceChildren();
    details.replaceChildren();
    action.replaceChildren();
  }
  function confirmationLabel(balance) {
    const confirmation = balance.confirmation;
    return balance.receiptAvailable === true && confirmation
      && confirmation.label === CONFIRMATION_LABEL
      && confirmation.treatmentVersion === CONFIRMATION_TREATMENT
      && dateTime(confirmation.verifiedAt) !== 'Not available'
      ? confirmation.label + ' · ' + dateTime(confirmation.verifiedAt)
      : 'Not yet available';
  }
  function joiningLabel(balance) {
    const joining = balance.joining;
    return joining && joining.status === 'ELIGIBLE_NO_ACCESS_LINKS'
      && joining.guidance === JOINING_GUIDANCE ? joining.guidance : 'Not yet available';
  }
  function safePaymentUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'pay.test.invalid'
        && !url.username && !url.password && !url.hash ? url.href : null;
    } catch (_) { return null; }
  }
  function idempotencyKey(id) {
    const key = 'sj_gate3_balance_request_' + id;
    let value = sessionStorage.getItem(key);
    if (!value) {
      value = 'web_' + (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36));
      sessionStorage.setItem(key, value);
    }
    return value;
  }
  async function prepare(id, button) {
    button.disabled = true;
    status.hidden = false;
    status.textContent = 'Preparing current remaining-fee details...';
    try {
      const response = await auth.request('/me/enrolments/' + encodeURIComponent(id) + '/balance-requests', {
        method: 'POST', headers: { 'Idempotency-Key': idempotencyKey(id) },
      });
      if (!response.balance || response.balance.enrolmentId !== id) throw new Error('STALE_BALANCE');
      render(response.balance, id);
      status.hidden = true;
    } catch (error) {
      clearPrivate();
      status.textContent = error.status === 409
        ? 'The balance changed. Check the current authoritative status before continuing.'
        : 'Remaining-fee details could not be prepared. No payment was started.';
      errorActions.hidden = false;
    } finally { button.disabled = false; }
  }
  function renderPaymentAction(balance, id) {
    action.replaceChildren();
    const paymentAction = balance.paymentAction || {};
    const url = paymentAction.available === true ? safePaymentUrl(paymentAction.safeUrl) : null;
    if (balance.confirmationStatus === 'CONFIRMING') {
      action.appendChild(text('p', 'Verified test payment evidence is being reconciled. Do not pay again while confirmation is in progress.', 'field-hint'));
      const check = text('button', 'Check confirmation status', 'btn btn-primary');
      check.type = 'button';
      check.addEventListener('click', initialise);
      action.appendChild(check);
    } else if (['OPEN', 'OVERDUE'].includes(balance.status) && url) {
      const link = text('a', 'Continue to test payment', 'btn btn-primary');
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-disabled', 'true');
      const acknowledgement = document.createElement('label');
      acknowledgement.className = 'learner-payment-acknowledgement';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) { link.href = url; link.removeAttribute('aria-disabled'); }
        else { link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); }
      });
      acknowledgement.appendChild(checkbox);
      acknowledgement.appendChild(document.createTextNode(' I reviewed the current remaining-fee details and policies before continuing.'));
      action.appendChild(acknowledgement);
      action.appendChild(link);
      action.appendChild(text('p', 'Only a development test-payment page is allowed in this gate. Return here for authoritative confirmation.', 'field-hint'));
    } else if (['OPEN', 'OVERDUE'].includes(balance.status) && !balance.paymentRequestId) {
      const button = text('button', 'Prepare test payment details', 'btn btn-primary');
      button.type = 'button';
      button.addEventListener('click', () => prepare(id, button));
      action.appendChild(button);
    } else if (['OPEN', 'OVERDUE'].includes(balance.status)) {
      action.appendChild(text('p', 'The previous payment action is unavailable or expired. Do not reuse it or pay again until the service returns a current action.', 'field-hint'));
      const check = text('button', 'Check authoritative status', 'btn btn-primary');
      check.type = 'button';
      check.addEventListener('click', initialise);
      action.appendChild(check);
      const support = text('a', 'Contact support', 'btn btn-secondary');
      support.href = '/contact/';
      action.appendChild(support);
    } else if (balance.status === 'ACTION_NEEDED' || balance.status === 'CLOSED_NON_PAYMENT') {
      const support = text('a', 'Contact support', 'btn btn-primary');
      support.href = '/contact/';
      action.appendChild(support);
    }
  }
  function scheduleConfirmingPoll() {
    if (confirmingPolls >= 20 || typeof window.setTimeout !== 'function') return;
    confirmingPolls += 1;
    if (pollTimer && typeof window.clearTimeout === 'function') window.clearTimeout(pollTimer);
    pollTimer = window.setTimeout(initialise, 3000);
  }
  function render(balance, expectedId) {
    const requestedId = expectedId || enrolmentId();
    if (!balance || balance.enrolmentId !== requestedId || balance.purpose !== 'BALANCE' || !STATES[balance.status]) throw new Error('INVALID_BALANCE');
    const descriptor = balance.confirmationStatus === 'CONFIRMING'
      ? ['We are confirming your payment', 'Verified test payment evidence is being reconciled. Do not pay again.']
      : STATES[balance.status];
    stateBox.replaceChildren(text('h2', descriptor[0]), text('p', descriptor[1]));
    details.replaceChildren();
    addDetail('Course', balance.courseTitle);
    addDetail('Total course fee', money(balance.totalCourseFee, balance.currency));
    addDetail('Deposit applied', money(balance.appliedDepositNetPaid, balance.currency));
    addDetail('Remaining-fee payment received', money(balance.capturedAmount, balance.currency));
    addDetail('Completed refunds', money(balance.refundedAmount, balance.currency));
    addDetail('Net payment applied', money(balance.netPaid, balance.currency));
    addDetail('Approved credit or waiver', money(balance.creditAmount, balance.currency));
    addDetail('Authoritative amount due', money(balance.amountDue, balance.currency));
    addDetail('Balance deadline', dateTime(balance.balanceDeadline));
    addDetail('Grace deadline', dateTime(balance.graceUntil));
    addDetail('Approved extension until', dateTime(balance.extensionUntil));
    const seatLabels = { RESERVED: 'Reserved', ACTIVE: 'Active', CLOSED_NON_PAYMENT: 'Released' };
    addDetail('Enrolment status', seatLabels[balance.enrolmentStatus] || 'Not available');
    addDetail('Deposit treatment', DISPOSITIONS[balance.depositDispositionOutcome] || 'Not applicable');
    addDetail('Payment confirmation', confirmationLabel(balance));
    addDetail('Joining instructions', joiningLabel(balance));
    renderPaymentAction(balance, requestedId);
    panel.hidden = false;
    if (balance.confirmationStatus === 'CONFIRMING') scheduleConfirmingPoll();
    else {
      confirmingPolls = 0;
      if (pollTimer && typeof window.clearTimeout === 'function') window.clearTimeout(pollTimer);
      pollTimer = null;
    }
  }
  async function initialise() {
    const generation = ++loadGeneration;
    const id = enrolmentId();
    clearPrivate();
    errorActions.hidden = true;
    status.hidden = false;
    status.textContent = 'Restoring your secure session...';
    if (!id) { status.textContent = 'This remaining-fee link is incomplete. Return to My Learning.'; errorActions.hidden = false; return; }
    try {
      const user = await auth.restore();
      if (generation !== loadGeneration) return;
      if (!user) { window.location.replace(loginUrl()); return; }
      status.textContent = 'Checking authoritative remaining-fee status...';
      const response = await auth.request('/me/enrolments/' + encodeURIComponent(id) + '/balance', { method: 'GET' });
      if (generation !== loadGeneration) return;
      if (!response.balance || response.balance.enrolmentId !== id) throw new Error('BALANCE_NOT_AVAILABLE');
      render(response.balance, id);
      status.hidden = true;
    } catch (error) {
      if (generation !== loadGeneration) return;
      if (error.status === 401 || error.status === 403) { window.location.replace(loginUrl()); return; }
      status.textContent = error.status === 404
        ? 'A remaining-fee obligation is not available for this enrolment.'
        : 'Remaining-fee status is temporarily unavailable. Do not pay again until the service confirms the current action.';
      errorActions.hidden = false;
    }
  }
  retry.addEventListener('click', initialise);
  window.sjLearnerBalance = { dateTime, enrolmentId, initialise, money, render, safePaymentUrl };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
