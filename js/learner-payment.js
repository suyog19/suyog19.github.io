(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const status = document.getElementById('payment-status');
  const panel = document.getElementById('payment-panel');
  const stateBox = document.getElementById('payment-state');
  const details = document.getElementById('payment-details');
  const action = document.getElementById('payment-action');
  const errorActions = document.getElementById('payment-error-actions');
  const retry = document.getElementById('payment-retry');
  const ID = /^[A-Za-z0-9_-]{1,128}$/;
  const STATES = {
    DEPOSIT_DUE: ['Payment due', 'Review the deposit details below. Only the current service-provided payment action can be opened.'],
    PAYMENT_CONFIRMING: ['We are confirming your payment', 'Please do not pay again while confirmation is in progress.'],
    RESERVED: ['Deposit completed', 'Your deposit is verified and the service reports that your seat is reserved.'],
    PAYMENT_ACTION_NEEDED: ['Payment needs review', 'Money may have been received, but the service cannot safely confirm allocation. Do not pay again; contact support.'],
    REFUND_PROCESSING: ['Refund processing', 'A refund is being processed. This does not change until the service confirms it.'],
    REFUNDED: ['Refund completed', 'The service reports that the refund is complete.'],
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
  function addDetail(label, value) {
    details.appendChild(text('dt', label));
    details.appendChild(text('dd', value || 'Not available'));
  }
  function safePaymentUrl(value) {
    try {
      const url = new URL(value);
      const allowedHost = url.hostname === 'pay.test.invalid' || url.hostname === 'rzp.io';
      return url.protocol === 'https:' && allowedHost && !url.username && !url.password && !url.hash ? url.href : null;
    } catch (_) { return null; }
  }
  function idempotencyKey(id) {
    const key = 'sj_gate2_deposit_request_' + id;
    let value = sessionStorage.getItem(key);
    if (!value) {
      value = 'web_' + (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36));
      sessionStorage.setItem(key, value);
    }
    return value;
  }
  function renderPreparation(id) {
    panel.hidden = false;
    stateBox.replaceChildren(
      text('h2', 'Prepare deposit details'),
      text('p', 'The service will verify your current offer and return the authoritative amount, deadline, and payment action. Nothing is paid by this step.')
    );
    details.replaceChildren();
    action.replaceChildren();
    const prepare = text('button', 'Prepare deposit details', 'btn btn-primary');
    prepare.type = 'button';
    prepare.addEventListener('click', async () => {
      prepare.disabled = true;
      status.hidden = false;
      status.textContent = 'Preparing authoritative deposit details…';
      try {
        const data = await auth.request('/me/enrolments/' + encodeURIComponent(id) + '/deposit-requests', {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey(id) },
        });
        render(data);
        status.hidden = true;
      } catch (error) {
        status.textContent = error.status === 409
          ? 'Your payment status changed. Check the current status before continuing.'
          : 'Deposit details could not be prepared. No payment was started.';
        errorActions.hidden = false;
      } finally { prepare.disabled = false; }
    });
    action.appendChild(prepare);
  }
  function render(data) {
    const descriptor = STATES[data.journeyStatus] || STATES.PAYMENT_ACTION_NEEDED;
    const payment = data.payment || {};
    const paymentAction = payment.paymentAction || {};
    stateBox.replaceChildren(text('h2', descriptor[0]), text('p', descriptor[1]));
    details.replaceChildren();
    addDetail('Purpose', payment.purpose === 'DEPOSIT' ? 'Course deposit' : 'Not available');
    addDetail('Amount due', money(payment.amountDue, payment.currency));
    addDetail('Payment received', money(payment.capturedAmount, payment.currency));
    addDetail('Refunded', money(payment.refundedAmount, payment.currency));
    addDetail('Confirmation', payment.receiptAvailable === true ? 'Authoritative confirmation available' : 'Not yet available');
    addDetail('Deadline', paymentAction.deadline ? new Date(paymentAction.deadline).toLocaleString() : 'Not available');
    action.replaceChildren();
    const url = paymentAction.available === true ? safePaymentUrl(paymentAction.safeUrl) : null;
    if (data.journeyStatus === 'DEPOSIT_DUE' && url) {
      const link = text('a', 'Continue to secure payment', 'btn btn-primary');
      link.href = url;
      link.rel = 'noopener noreferrer';
      action.appendChild(link);
      action.appendChild(text('p', 'This opens the current payment page supplied by the service. Return here to check authoritative status.', 'field-hint'));
    } else if (data.journeyStatus === 'PAYMENT_ACTION_NEEDED') {
      const support = text('a', 'Contact support', 'btn btn-primary');
      support.href = '/contact/';
      action.appendChild(support);
    } else if (data.journeyStatus === 'PAYMENT_CONFIRMING') {
      const check = text('button', 'Check payment status', 'btn btn-primary');
      check.type = 'button';
      check.addEventListener('click', initialise);
      action.appendChild(check);
    }
  }
  async function initialise() {
    const id = enrolmentId();
    panel.hidden = true;
    errorActions.hidden = true;
    status.hidden = false;
    status.textContent = 'Restoring your secure session…';
    if (!id) { status.textContent = 'This payment link is incomplete. Return to My Learning.'; errorActions.hidden = false; return; }
    try {
      const user = await auth.restore();
      if (!user) { window.location.replace(loginUrl()); return; }
      status.textContent = 'Checking authoritative payment status…';
      const data = await auth.request('/me/enrolments/' + encodeURIComponent(id) + '/payment', { method: 'GET' });
      render(data);
      panel.hidden = false;
      status.hidden = true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) { window.location.replace(loginUrl()); return; }
      if (error.status === 404) {
        status.hidden = true;
        renderPreparation(id);
      } else {
        status.textContent = 'Payment status is temporarily unavailable. Do not pay again until the service confirms the current action.';
        errorActions.hidden = false;
      }
    }
  }
  retry.addEventListener('click', initialise);
  window.sjLearnerPayment = { enrolmentId, initialise, money, render, renderPreparation, safePaymentUrl };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
