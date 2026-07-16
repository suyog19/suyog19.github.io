(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const status = document.getElementById('balance-status');
  const panel = document.getElementById('balance-panel');
  const stateBox = document.getElementById('balance-state');
  const details = document.getElementById('balance-details');
  const action = document.getElementById('balance-action');
  const errorPanel = document.getElementById('balance-error-panel');
  const errorHeading = document.getElementById('balance-error-heading');
  const errorMessage = document.getElementById('balance-error-message');
  const errorActions = document.getElementById('balance-error-actions');
  const retry = document.getElementById('balance-retry');
  const ID = /^[A-Za-z0-9_-]{1,128}$/;
  const CONFIRMATION_LABEL = 'Development test payment confirmation — not a tax invoice';
  const CONFIRMATION_TREATMENT = 'DEV-TEST-CONFIRMATION-NOT-TAX-INVOICE-v1';
  const JOINING_GUIDANCE = 'Joining instructions will be available when the course area is ready.';
  let loadGeneration = 0;
  let confirmingPolls = 0;
  let pollTimer = null;
  const STATES = {
    OPEN: ['Remaining fee due', 'Review the amount to pay and current deadline before continuing to secure payment.'],
    OVERDUE: ['Remaining fee overdue', 'Your seat is still reserved during the current grace period. Complete payment by the displayed date.'],
    SATISFIED: ['No remaining payment is required', 'Your remaining-fee requirement is complete. Check My Learning for activation status.'],
    CLOSED_NON_PAYMENT: ['Your reserved place has been released', 'The payment period ended. A normal payment cannot reactivate the enrolment automatically.'],
    ACTION_NEEDED: ['A payment needs organiser review', 'A payment may have been received, but your enrolment is not automatically active. Please do not pay again.'],
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
    errorPanel.hidden = true;
    stateBox.replaceChildren();
    details.replaceChildren();
    action.replaceChildren();
  }
  function errorCode(error) {
    return error && error.body && typeof error.body.error === 'string' ? error.body.error : '';
  }
  function errorState(error) {
    const code = errorCode(error);
    if (error && error.status === 404) {
      return [
        'No remaining fee is available for this enrolment',
        'Return to My Learning to check your current course status. You do not need to make a payment from this page.',
      ];
    }
    if (code === 'INVALID_LINK') {
      return [
        'This remaining-fee link is incomplete',
        'Return to My Learning and open the payment action from your current course status.',
      ];
    }
    if (code === 'BALANCE_EVIDENCE_NOT_AVAILABLE') {
      return [
        'Your payment details are being verified',
        'We have not safely confirmed the current amount and payment action. Do not use an older payment link or pay again. Check here again later.',
      ];
    }
    if (code === 'GATE3_DISABLED' || (error && [502, 503, 504].includes(error.status))) {
      return [
        'The remaining-fee service is temporarily unavailable',
        'Your seat and payment records have not changed. Do not pay using an older link. Please check the current status again shortly.',
      ];
    }
    if (error && error.status === 0) {
      return [
        'We could not connect to the remaining-fee service',
        'Check your connection and try again. Do not pay using an older link while the current status is unavailable.',
      ];
    }
    return [
      'We could not safely verify your payment details',
      'The current amount or payment action could not be confirmed. Do not use an older payment link or pay again. Check here again or contact support.',
    ];
  }
  function showError(error) {
    const descriptor = errorState(error);
    status.hidden = true;
    errorHeading.textContent = descriptor[0];
    errorMessage.textContent = descriptor[1];
    errorPanel.hidden = false;
    errorActions.hidden = false;
  }
  function confirmationLabel(balance) {
    const confirmation = balance.confirmation;
    return balance.receiptAvailable === true && confirmation
      && confirmation.label === CONFIRMATION_LABEL
      && confirmation.treatmentVersion === CONFIRMATION_TREATMENT
      && dateTime(confirmation.verifiedAt) !== 'Not available'
      ? 'Payment confirmation — not a tax invoice · ' + dateTime(confirmation.verifiedAt)
      : 'Not yet available';
  }
  function joiningLabel(balance) {
    const joining = balance.joining;
    return joining && joining.status === 'ELIGIBLE_NO_ACCESS_LINKS'
      && joining.guidance === JOINING_GUIDANCE ? joining.guidance : 'Not yet available';
  }
  function safePaymentUrl(value) {
    return window.sjTrainingRelease
      ? window.sjTrainingRelease.safePaymentUrl(value, 'balancePayments', window.location.hostname)
      : null;
  }
  function paymentCapabilityEnabled() {
    return Boolean(window.sjTrainingRelease
      && window.sjTrainingRelease.capabilityEnabled('balancePayments', window.location.hostname));
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
    if (!paymentCapabilityEnabled()) {
      clearPrivate();
      status.hidden = false;
      status.textContent = 'Remaining-fee payments are not currently available.';
      return;
    }
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
      showError(error);
    } finally { button.disabled = false; }
  }
  function renderPaymentAction(balance, id) {
    action.replaceChildren();
    const paymentAction = balance.paymentAction || {};
    const url = paymentAction.available === true ? safePaymentUrl(paymentAction.safeUrl) : null;
    if (balance.confirmationStatus === 'CONFIRMING') {
      action.appendChild(text('p', 'We are confirming your remaining-fee payment. Please do not pay again.', 'field-hint'));
      const check = text('button', 'Check payment confirmation', 'btn btn-primary btn-learning');
      check.type = 'button';
      check.addEventListener('click', initialise);
      action.appendChild(check);
    } else if (['OPEN', 'OVERDUE'].includes(balance.status) && url) {
      const link = text('a', 'Continue to secure payment', 'btn btn-primary btn-learning');
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
      link.addEventListener('click', (event) => {
        if (!link.href || link.dataset.opening === 'true') { event.preventDefault(); return; }
        link.dataset.opening = 'true';
        link.textContent = 'Opening secure payment…';
        link.setAttribute('aria-disabled', 'true');
      });
      acknowledgement.appendChild(checkbox);
      acknowledgement.appendChild(document.createTextNode(' I reviewed the current remaining-fee details and policies before continuing.'));
      action.appendChild(acknowledgement);
      action.appendChild(link);
      action.appendChild(text('p', 'This opens the current secure payment page. Return here to check confirmation.', 'field-hint'));
    } else if (['OPEN', 'OVERDUE'].includes(balance.status) && !balance.paymentRequestId) {
      const button = text('button', 'Prepare payment details', 'btn btn-primary btn-learning');
      button.type = 'button';
      button.addEventListener('click', () => prepare(id, button));
      action.appendChild(button);
    } else if (['OPEN', 'OVERDUE'].includes(balance.status)) {
      action.appendChild(text('p', 'The previous payment action is unavailable or expired. Do not reuse it or pay again until the service returns a current action.', 'field-hint'));
      const check = text('button', 'Check current status', 'btn btn-primary btn-learning');
      check.type = 'button';
      check.addEventListener('click', initialise);
      action.appendChild(check);
      const support = text('a', 'Contact support', 'btn btn-secondary');
      support.href = '/contact/?topic=learning-payment-review';
      action.appendChild(support);
    } else if (balance.status === 'ACTION_NEEDED' || balance.status === 'CLOSED_NON_PAYMENT') {
      const support = text('a', 'Contact support', 'btn btn-primary btn-learning');
      support.href = '/contact/?topic=learning-payment-review';
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
      ? ['We are confirming your remaining-fee payment', 'Please do not pay again. We will update this page when confirmation is complete.']
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
    addDetail('Amount to pay', money(balance.amountDue, balance.currency));
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
    if (!paymentCapabilityEnabled()) {
      status.textContent = 'Remaining-fee payments are not currently available.';
      return;
    }
    status.textContent = 'Restoring your secure session...';
    if (!id) { showError({ body: { error: 'INVALID_LINK' } }); return; }
    try {
      const user = await auth.restore();
      if (generation !== loadGeneration) return;
      if (!user) { window.location.replace(loginUrl()); return; }
      status.textContent = 'Checking the current remaining-fee status...';
      const response = await auth.request('/me/enrolments/' + encodeURIComponent(id) + '/balance', { method: 'GET' });
      if (generation !== loadGeneration) return;
      if (!response.balance || response.balance.enrolmentId !== id) throw new Error('BALANCE_NOT_AVAILABLE');
      render(response.balance, id);
      status.hidden = true;
    } catch (error) {
      if (generation !== loadGeneration) return;
      if (error.status === 401 || error.status === 403) { window.location.replace(loginUrl()); return; }
      showError(error);
    }
  }
  retry.addEventListener('click', initialise);
  window.sjLearnerBalance = { dateTime, enrolmentId, initialise, money, render, safePaymentUrl, errorState };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
