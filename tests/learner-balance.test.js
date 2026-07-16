const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

class Element {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.hidden = false;
    this.disabled = false;
    this.textContent = '';
    this.href = '';
    this.listeners = {};
    this.attributes = {};
    this.dataset = {};
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; if (name === 'href') this.href = ''; }
}

function harness(overrides = {}) {
  const ids = ['balance-status', 'balance-panel', 'balance-state', 'balance-details', 'balance-action',
    'balance-error-panel', 'balance-error-heading', 'balance-error-message', 'balance-error-actions', 'balance-retry'];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
  elements['balance-panel'].hidden = true;
  elements['balance-error-panel'].hidden = true;
  elements['balance-error-actions'].hidden = true;
  const storage = new Map();
  const timers = [];
  const context = {
    Date, Error, Intl, Number, URL, URLSearchParams,
    sessionStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
    },
    document: {
      createElement: (tag) => new Element(tag),
      createTextNode: (value) => ({ textContent: value }),
      getElementById: (id) => elements[id],
    },
    window: {
      __SJ_DISABLE_AUTO_INIT__: true,
      crypto: { randomUUID: () => 'fixed-idempotency-key' },
      setTimeout: (callback) => { timers.push(callback); return timers.length; },
      clearTimeout: () => {},
      location: { hostname: 'localhost', pathname: '/my-learning/balance/', search: '?enrolmentId=enr_one', replace() {} },
      sjLearnerAuth: {
        restore: async () => ({ userId: 'usr_one' }),
        request: async () => ({}),
        ...overrides,
      },
    },
  };
  vm.runInNewContext(fs.readFileSync('js/training-release.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync('js/learner-balance.js', 'utf8'), context);
  return { balance: context.window.sjLearnerBalance, context, elements, storage, timers };
}

function projection(overrides = {}) {
  return {
    enrolmentId: 'enr_one', enrolmentStatus: 'RESERVED', paymentObligationId: 'obl_one',
    paymentRequestId: 'req_one', status: 'OPEN', purpose: 'BALANCE', amountDue: 250000,
    currency: 'INR', totalCourseFee: 400000, appliedDepositNetPaid: 100000,
    capturedAmount: 25000, refundedAmount: 0, creditAmount: 25000,
    netPaid: 25000, confirmationStatus: 'NONE', confirmation: null,
    joining: { status: 'NOT_ELIGIBLE', guidance: null },
    balanceDeadline: '2099-01-01T18:29:59Z', graceUntil: '2099-01-05T18:29:59Z',
    extensionUntil: null, depositDispositionOutcome: null, receiptAvailable: false,
    courseTitle: 'Synthetic course', paymentAction: {
      available: true, safeUrl: 'https://pay.test.invalid/requests/req_one',
      requestDeadline: '2099-01-01T18:29:59Z', linkExpiry: '2099-01-05T18:29:59Z',
    }, version: 4, ...overrides,
  };
}

test('only exact mock and Razorpay test payment URLs are actionable', () => {
  const { balance } = harness();
  assert.equal(balance.safePaymentUrl('https://pay.test.invalid/requests/one'), 'https://pay.test.invalid/requests/one');
  assert.equal(balance.safePaymentUrl('https://rzp.io/i/test-one'), 'https://rzp.io/i/test-one');
  assert.equal(balance.safePaymentUrl('https://pay.test.invalid/#token'), null);
  assert.equal(balance.safePaymentUrl('https://rzp.io.evil.example/i/test'), null);
  assert.equal(balance.safePaymentUrl('https://user@rzp.io/i/test'), null);
  assert.equal(balance.safePaymentUrl('https://rzp.io/i/test?token=value'), null);
  assert.equal(balance.safePaymentUrl('https://rzp.io:444/i/test'), null);
  assert.equal(balance.safePaymentUrl('javascript:alert(1)'), null);
});

test('production and unknown hosts make no remaining-fee requests', async () => {
  for (const hostname of ['suyogjoshi.com', 'unknown.example']) {
    const calls = [];
    const { balance, context, elements } = harness({ request: async (...args) => { calls.push(args); return {}; } });
    context.window.location.hostname = hostname;
    await balance.initialise();
    assert.equal(calls.length, 0);
    assert.equal(elements['balance-panel'].hidden, true);
    assert.match(elements['balance-status'].textContent, /not currently available/);
  }
});

test('production and unknown hosts reject all development payment URLs', () => {
  const { balance, context } = harness();
  for (const hostname of ['suyogjoshi.com', 'www.suyogjoshi.com', 'preview.example']) {
    context.window.location.hostname = hostname;
    assert.equal(balance.safePaymentUrl('https://rzp.io/i/test-one'), null);
    assert.equal(balance.safePaymentUrl('https://pay.test.invalid/requests/one'), null);
  }
});

test('renderer displays backend aggregates and keeps test action acknowledged', () => {
  const { balance, elements } = harness();
  balance.render(projection());
  const values = elements['balance-details'].children.map((child) => child.textContent).join(' | ');
  assert.match(values, /Synthetic course/);
  assert.match(values, /2,500/);
  assert.match(values, /250/);
  assert.match(values, /Active|Reserved/);
  const [acknowledgement, link] = elements['balance-action'].children;
  assert.equal(link.attributes['aria-disabled'], 'true');
  acknowledgement.children[0].checked = true;
  acknowledgement.children[0].listeners.change();
  assert.equal(link.href, 'https://pay.test.invalid/requests/req_one');
  let prevented = false;
  link.listeners.click({ preventDefault() { prevented = true; } });
  assert.equal(link.textContent, 'Opening secure payment…');
  assert.equal(link.attributes['aria-disabled'], 'true');
  link.listeners.click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
});

test('closed non-payment is support-only and shows backend deposit outcome', () => {
  const { balance, elements } = harness();
  balance.render(projection({
    enrolmentStatus: 'CLOSED_NON_PAYMENT', status: 'CLOSED_NON_PAYMENT',
    paymentAction: { available: false, safeUrl: null },
    depositDispositionOutcome: 'ACTION_NEEDED', receiptAvailable: false,
  }));
  const state = elements['balance-state'].children.map((child) => child.textContent).join(' ');
  const values = elements['balance-details'].children.map((child) => child.textContent).join(' | ');
  assert.match(state, /reserved place has been released/);
  assert.match(values, /Released/);
  assert.match(values, /Action needed under the recorded policy/);
  assert.equal(elements['balance-action'].children.length, 1);
  assert.equal(elements['balance-action'].children[0].href, '/contact/?topic=learning-payment-review');
});

test('overdue, satisfied, and action-needed states remain distinct', () => {
  const overdue = harness();
  overdue.balance.render(projection({
    status: 'OVERDUE', extensionUntil: '2099-01-07T18:29:59Z',
  }));
  assert.match(
    overdue.elements['balance-state'].children.map((child) => child.textContent).join(' '),
    /seat is still reserved/,
  );

  const satisfied = harness();
  satisfied.balance.render(projection({
    enrolmentStatus: 'ACTIVE', status: 'SATISFIED', amountDue: 0,
    capturedAmount: 250000, netPaid: 250000, receiptAvailable: true,
    confirmationStatus: 'SATISFIED',
    confirmation: {
      label: 'Development test payment confirmation — not a tax invoice',
      treatmentVersion: 'DEV-TEST-CONFIRMATION-NOT-TAX-INVOICE-v1',
      verifiedAt: '2099-01-02T00:00:00Z',
    },
    joining: {
      status: 'ELIGIBLE_NO_ACCESS_LINKS',
      guidance: 'Joining instructions will be available when the course area is ready.',
    },
    paymentAction: { available: false, safeUrl: null },
  }));
  const satisfiedText = satisfied.elements['balance-details'].children.map((child) => child.textContent).join(' | ');
  assert.match(satisfiedText, /Active/);
  assert.match(satisfiedText, /Payment confirmation \| Payment confirmation/);
  assert.doesNotMatch(satisfiedText, /development|test payment/i);
  assert.match(satisfiedText, /not a tax invoice/);
  assert.match(satisfiedText, /course area is ready/);
  assert.equal(satisfied.elements['balance-action'].children.length, 0);

  const actionNeeded = harness();
  actionNeeded.balance.render(projection({
    status: 'ACTION_NEEDED', paymentAction: { available: false, safeUrl: null },
  }));
  const actionText = actionNeeded.elements['balance-state'].children.map((child) => child.textContent).join(' ');
  assert.match(actionText, /not automatically active/);
  assert.equal(actionNeeded.elements['balance-action'].children[0].href, '/contact/?topic=learning-payment-review');
});

test('confirming suppresses payment and schedules bounded authoritative polling', () => {
  const { balance, elements, timers } = harness();
  balance.render(projection({ confirmationStatus: 'CONFIRMING' }));
  const state = elements['balance-state'].children.map((child) => child.textContent).join(' ');
  const actionText = elements['balance-action'].children.map((child) => child.textContent).join(' ');
  assert.match(actionText, /confirming your remaining-fee payment/);
  assert.match(actionText, /do not pay again/i);
  assert.doesNotMatch(actionText, /Continue to test payment|Prepare test payment/);
  assert.equal(timers.length, 1);
});

test('expired or rejected payment actions cannot be reused or recreated in browser', () => {
  const { balance, elements } = harness();
  balance.render(projection({
    paymentAction: { available: false, safeUrl: 'https://pay.test.invalid/requests/old' },
  }));
  const actionText = elements['balance-action'].children.map((child) => child.textContent).join(' | ');
  assert.match(actionText, /unavailable or expired/);
  assert.doesNotMatch(actionText, /Prepare test payment details|Continue to test payment/);
  assert.equal(elements['balance-action'].children.some((child) => child.href.includes('pay.test.invalid')), false);
});

test('request preparation reuses one idempotency key and sends no amount', async () => {
  const calls = [];
  const { balance, elements } = harness({
    request: async (path, options) => {
      calls.push([path, options]);
      return { balance: projection() };
    },
  });
  balance.render(projection({ paymentRequestId: null, paymentAction: { available: false, safeUrl: null } }));
  const prepare = elements['balance-action'].children[0];
  await prepare.listeners.click();
  await prepare.listeners.click();
  assert.equal(calls[0][0], '/me/enrolments/enr_one/balance-requests');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].headers['Idempotency-Key'], 'web_fixed-idempotency-key');
  assert.equal(calls[1][1].headers['Idempotency-Key'], 'web_fixed-idempotency-key');
  assert.equal(Object.hasOwn(calls[0][1], 'body'), false);
});

test('initialise uses the owned balance endpoint and hides private panel on failure', async () => {
  const calls = [];
  const { balance, elements } = harness({
    request: async (path, options) => { calls.push([path, options]); return { balance: projection() }; },
  });
  await balance.initialise();
  assert.equal(calls[0][0], '/me/enrolments/enr_one/balance');
  assert.equal(calls[0][1].method, 'GET');
  assert.equal(elements['balance-panel'].hidden, false);

  const failed = harness({ request: async () => { const error = new Error('down'); error.status = 503; throw error; } });
  await failed.balance.initialise();
  assert.equal(failed.elements['balance-panel'].hidden, true);
  assert.equal(failed.elements['balance-error-panel'].hidden, false);
  assert.equal(failed.elements['balance-status'].hidden, true);
  assert.match(failed.elements['balance-error-heading'].textContent, /temporarily unavailable/);
  assert.match(failed.elements['balance-error-message'].textContent, /records have not changed/);
});

test('known evidence, network, and missing-obligation failures give distinct safe guidance', async () => {
  const cases = [
    [{ status: 409, body: { error: 'BALANCE_EVIDENCE_NOT_AVAILABLE' } }, /being verified/, /older payment link/],
    [{ status: 0 }, /could not connect/, /Check your connection/],
    [{ status: 404 }, /No remaining fee/, /Return to My Learning/],
  ];
  for (const [failure, heading, message] of cases) {
    const page = harness({ request: async () => { throw Object.assign(new Error('failure'), failure); } });
    await page.balance.initialise();
    assert.equal(page.elements['balance-panel'].hidden, true);
    assert.equal(page.elements['balance-error-panel'].hidden, false);
    assert.match(page.elements['balance-error-heading'].textContent, heading);
    assert.match(page.elements['balance-error-message'].textContent, message);
  }
});

test('invalid identifiers and live URLs fail closed', async () => {
  const { balance, context, elements } = harness();
  context.window.location.search = '?enrolmentId=../admin';
  await balance.initialise();
  assert.equal(elements['balance-panel'].hidden, true);
  assert.equal(elements['balance-error-panel'].hidden, false);
  assert.match(elements['balance-error-heading'].textContent, /incomplete/);
});

test('mismatched GET and POST enrolment responses clear private state', async () => {
  const getMismatch = harness({
    request: async () => ({ balance: projection({ enrolmentId: 'enr_other' }) }),
  });
  await getMismatch.balance.initialise();
  assert.equal(getMismatch.elements['balance-panel'].hidden, true);
  assert.equal(getMismatch.elements['balance-details'].children.length, 0);

  const postMismatch = harness({
    request: async () => ({ balance: projection({ enrolmentId: 'enr_other' }) }),
  });
  postMismatch.balance.render(projection({ paymentRequestId: null, paymentAction: { available: false, safeUrl: null } }));
  await postMismatch.elements['balance-action'].children[0].listeners.click();
  assert.equal(postMismatch.elements['balance-panel'].hidden, true);
  assert.equal(postMismatch.elements['balance-error-panel'].hidden, false);
  assert.equal(postMismatch.elements['balance-details'].children.length, 0);
});

test('out-of-order refresh cannot overwrite the newest authoritative response', async () => {
  let resolveFirst;
  let markFirstRequested;
  let calls = 0;
  const first = new Promise((resolve) => { resolveFirst = resolve; });
  const firstRequested = new Promise((resolve) => { markFirstRequested = resolve; });
  const current = projection({ status: 'SATISFIED', amountDue: 0, confirmationStatus: 'SATISFIED' });
  const stale = projection({ status: 'OPEN', amountDue: 250000 });
  const { balance, elements } = harness({
    request: async () => {
      calls += 1;
      if (calls === 1) { markFirstRequested(); return first; }
      return { balance: current };
    },
  });
  const older = balance.initialise();
  await firstRequested;
  await balance.initialise();
  resolveFirst({ balance: stale });
  await older;
  const state = elements['balance-state'].children.map((child) => child.textContent).join(' ');
  assert.match(state, /No remaining payment is required/);
  assert.doesNotMatch(state, /Remaining fee due/);
});

test('confirming poll redirects safely when the session expires', async () => {
  let active = true;
  let redirected = '';
  const confirming = projection({ confirmationStatus: 'CONFIRMING' });
  const { balance, context, elements, timers } = harness({
    restore: async () => active ? { userId: 'usr_one' } : null,
    request: async () => ({ balance: confirming }),
  });
  context.window.location.replace = (value) => { redirected = value; };
  await balance.initialise();
  assert.equal(elements['balance-panel'].hidden, false);
  active = false;
  await timers[0]();
  assert.match(redirected, /^\/learn\/\?continue=/);
  assert.equal(elements['balance-panel'].hidden, true);
});

test('private page is noindex, no-store, labelled, and exposes no Gate 4 link', () => {
  const html = fs.readFileSync('my-learning/balance/index.html', 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<meta http-equiv="Cache-Control" content="no-store">/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-label="Remaining-fee support"/);
  assert.match(html, /Your seat, deposit and payment records are not changed by this display problem/);
  assert.match(html, /Back to My Learning/);
  assert.doesNotMatch(html, /Teams|OneDrive|GitHub learner|course resources|recording/i);
});
