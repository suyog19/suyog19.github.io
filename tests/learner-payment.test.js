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

function harness(request) {
  const ids = ['payment-status', 'payment-panel', 'payment-state', 'payment-details', 'payment-action', 'payment-error-actions', 'payment-retry'];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
  elements['payment-panel'].hidden = true;
  elements['payment-error-actions'].hidden = true;
  const storage = new Map();
  const context = {
    Date, Error, Intl, Number, Object, URL, URLSearchParams,
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
      location: {
        hostname: 'localhost', pathname: '/my-learning/payment/',
        search: '?enrolmentId=enr_one', replace() {},
      },
      sjLearnerAuth: { restore: async () => ({ userId: 'usr_one' }), request },
    },
  };
  vm.runInNewContext(fs.readFileSync('js/training-release.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync('js/learner-summary.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync('js/learner-payment.js', 'utf8'), context);
  return { context, elements, payment: context.window.sjLearnerPayment };
}

function offeredSummary(overrides = {}) {
  return {
    applications: [{
      offer: { status: 'OFFERED', enrolmentId: 'enr_one' },
      gate2: null,
      ...overrides,
    }],
  };
}

test('only an exact offered enrolment without Gate 2 is recoverable', () => {
  const { payment } = harness(async () => ({}));
  assert.equal(payment.isRecoverableOffer(offeredSummary(), 'enr_one'), true);
  assert.equal(payment.isRecoverableOffer(offeredSummary({ gate2: { action: { code: 'DEPOSIT_DUE' } } }), 'enr_one'), false);
  assert.equal(payment.isRecoverableOffer(offeredSummary({ offer: { status: 'RESERVED', enrolmentId: 'enr_one' } }), 'enr_one'), false);
  assert.equal(payment.isRecoverableOffer(offeredSummary(), 'enr_other'), false);
  assert.equal(payment.isRecoverableOffer({}, 'enr_one'), false);
});

test('production requests authoritative payment state while unknown hosts remain closed', async () => {
  const productionCalls = [];
  const production = harness(async (...args) => { productionCalls.push(args); return {}; });
  production.context.window.location.hostname = 'suyogjoshi.com';
  await production.payment.initialise();
  assert.equal(productionCalls.length, 1);
  assert.equal(productionCalls[0][0], '/me/enrolments/enr_one/payment');

  const unknownCalls = [];
  const unknown = harness(async (...args) => { unknownCalls.push(args); return {}; });
  unknown.context.window.location.hostname = 'unknown.example';
  await unknown.payment.initialise();
  assert.equal(unknownCalls.length, 0);
  assert.equal(unknown.elements['payment-panel'].hidden, true);
  assert.match(unknown.elements['payment-status'].textContent, /not currently available/);
});

test('failed initial payment read recovers preparation from authoritative offered summary', async () => {
  const calls = [];
  const { elements, payment } = harness(async (path, options) => {
    calls.push([path, options]);
    if (path.endsWith('/payment')) { const error = new Error('unavailable'); error.status = 500; throw error; }
    return offeredSummary();
  });
  await payment.initialise();
  assert.deepEqual(calls.map(([path]) => path), [
    '/me/enrolments/enr_one/payment',
    '/me/learning-summary',
  ]);
  assert.equal(elements['payment-panel'].hidden, false);
  assert.equal(elements['payment-error-actions'].hidden, true);
  assert.match(elements['payment-state'].children.map((child) => child.textContent).join(' '), /Prepare deposit details/);
});

test('uncertain or existing payment state remains fail closed', async () => {
  for (const summary of [
    offeredSummary({ gate2: { action: { code: 'DEPOSIT_DUE' } } }),
    offeredSummary({ offer: { status: 'RESERVED', enrolmentId: 'enr_one' } }),
    offeredSummary({ offer: { status: 'OFFERED', enrolmentId: 'enr_other' } }),
  ]) {
    const { elements, payment } = harness(async (path) => {
      if (path.endsWith('/payment')) { const error = new Error('unavailable'); error.status = 500; throw error; }
      return summary;
    });
    await payment.initialise();
    assert.equal(elements['payment-panel'].hidden, true);
    assert.equal(elements['payment-error-actions'].hidden, false);
    assert.match(elements['payment-status'].textContent, /Do not pay again/);
  }
});

test('reserved payment state exposes an authoritative secondary change-request link', async () => {
  const calls = [];
  const reserved = {
    applications: [{
      course: { title: 'Python Foundations' },
      offer: { status: 'RESERVED', enrolmentId: 'enr_one' },
      gate2: { enrolment: { status: 'RESERVED' }, action: { code: 'RESERVED' } },
    }],
  };
  const { elements, payment } = harness(async (path) => {
    calls.push(path);
    return path.endsWith('/payment') ? { payment: { journeyStatus: 'RESERVED', payment: {} } } : reserved;
  });
  await payment.initialise();
  assert.deepEqual(calls, ['/me/enrolments/enr_one/payment', '/me/learning-summary']);
  const link = elements['payment-action'].children.find((child) => child.href);
  assert.equal(link.textContent, 'Request cancellation or another change');
  assert.equal(link.href, '/my-learning/change/?enrolmentId=enr_one');
  assert.match(elements['payment-state'].children.map((child) => child.textContent).join(' '), /Deposit complete/);
});

test('reserved payment status still renders when the secondary summary lookup fails', async () => {
  const { elements, payment } = harness(async (path) => {
    if (path.endsWith('/payment')) return { payment: { journeyStatus: 'RESERVED', payment: {} } };
    const error = new Error('summary unavailable'); error.status = 500; throw error;
  });
  await payment.initialise();
  assert.equal(elements['payment-panel'].hidden, false);
  assert.match(elements['payment-state'].children.map((child) => child.textContent).join(' '), /Deposit complete/);
  assert.equal(elements['payment-action'].children.length, 0);
});

test('deposit change navigation fails closed for missing, ambiguous, stale, or ineligible summary state', async () => {
  const eligible = {
    offer: { status: 'RESERVED', enrolmentId: 'enr_one' },
    gate2: { enrolment: { status: 'RESERVED' }, action: { code: 'RESERVED' } },
  };
  for (const summary of [
    {},
    { applications: [eligible, eligible] },
    { applications: [{ ...eligible, gate2: { enrolment: { status: 'CANCELLED' } } }] },
  ]) {
    const { payment } = harness(async () => ({}));
    assert.equal(payment.changeNavigation(summary, 'enr_one', 'RESERVED'), null);
  }
});

test('existing request or refund receives status navigation instead of a duplicate request', () => {
  for (const gateState of [
    { learnerChange: { status: 'REQUESTED' } },
    { refund: { status: 'PROCESSING' } },
  ]) {
    const { payment } = harness(async () => ({}));
    const summary = { applications: [{
      offer: { status: 'RESERVED', enrolmentId: 'enr_one' },
      gate2: { enrolment: { status: 'RESERVED' }, action: { code: 'REFUND_PROCESSING' }, ...gateState },
    }] };
    const navigation = payment.changeNavigation(summary, 'enr_one', 'REFUND_PROCESSING');
    assert.equal(navigation.href, '/my-learning/change/?enrolmentId=enr_one');
    assert.equal(navigation.label, 'View request or refund status');
  }
});

test('payment page loads the shared summary helper before its renderer', () => {
  const html = fs.readFileSync('my-learning/payment/index.html', 'utf8');
  assert.ok(html.indexOf('js/learner-summary.js') < html.indexOf('js/learner-payment.js'));
});
