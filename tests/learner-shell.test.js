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
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
}

function harness(authOverrides = {}) {
  const ids = [
    'learner-shell', 'learner-shell-status', 'learner-user-label', 'learner-logout',
    'learner-current-action', 'learner-applications', 'learner-profile-details',
    'learner-profile-empty', 'learner-error-actions', 'learner-retry',
    'learner-support-link', 'learner-privacy-link', 'learner-grievance-link',
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
  elements['learner-shell'].hidden = true;
  elements['learner-error-actions'].hidden = true;
  const context = {
    document: {
      createElement: (tag) => new Element(tag),
      getElementById: (id) => elements[id],
    },
    window: {
      __SJ_DISABLE_AUTO_INIT__: true,
      location: { pathname: '/my-learning/', search: '', replace() {} },
      sjLearnerAuth: {
        restore: async () => ({ emailId: 'learner@example.com' }),
        request: async () => ({}),
        logout: async () => true,
        ...authOverrides,
      },
    },
  };
  vm.runInNewContext(fs.readFileSync('js/learner-summary.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync('js/learner-shell.js', 'utf8'), context);
  return { context, elements, shell: context.window.sjLearnerShell };
}

function summary(overrides = {}) {
  return {
    currentAction: {
      code: 'APPLICATION_RECEIVED', label: 'Application received', href: '/my-learning/',
    },
    applications: [],
    learner: null,
    support: {
      supportUrl: '/contact/',
      privacyUrl: '/training/policies/',
      grievanceUrl: '/training/policies/#support-and-grievance-process',
    },
    ...overrides,
  };
}

test('renderer preserves empty-profile semantics and support fallbacks', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({ support: { privacyUrl: 'https://evil.example/' } }));
  assert.equal(elements['learner-profile-empty'].hidden, false);
  assert.equal(elements['learner-profile-details'].children.length, 0);
  assert.equal(elements['learner-privacy-link'].href, '/training/policies/');
  assert.equal(
    elements['learner-applications'].children[0].textContent,
    'No current application yet.'
  );
});

test('renderer shows only explicit offers, safe recommendations, and failed delivery guidance', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    learner: {
      verifiedEmail: 'learner@example.com', fullName: 'Learner', timezone: 'Asia/Kolkata',
      adultEligibilityConfirmed: true, acknowledgements: [], promotionalConsent: null,
    },
    applications: [{
      reference: 'APP-1', course: { title: 'Python' },
      action: { label: 'Contact support' }, offer: { status: 'WITHDRAWN' },
      communication: { status: 'FAILED' },
      decision: {
        recommendedCourse: {
          title: 'Applied Python', href: '/training/applied-python-ai-ml/',
        },
      },
    }],
  }));
  const card = elements['learner-applications'].children[0];
  const text = card.children.map((child) => child.textContent).join(' | ');
  assert.doesNotMatch(text, /cohort offer is available/);
  assert.match(text, /View recommended course: Applied Python/);
  assert.match(text, /application status above is unchanged/);
  assert.equal(
    card.children.find((child) => /View recommended/.test(child.textContent)).href,
    '/training/applied-python-ai-ml/'
  );
});

test('renderer shows an offer only for the backend OFFERED state', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    applications: [{
      reference: 'APP-2', course: { title: 'Python' },
      action: { label: 'View your offer' }, offer: { status: 'OFFERED' },
    }],
  }));
  const text = elements['learner-applications'].children[0].children
    .map((child) => child.textContent).join(' | ');
  assert.match(text, /A cohort offer is available/);
});

test('renderer keeps Gate 2 domain stages separate and links only to focused journeys', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    currentAction: { code: 'REFUND_PROCESSING', label: 'View refund status', href: '/my-learning/payments/enr_one/' },
    applications: [{
      reference: 'APP-G2', course: { title: 'Python' }, offer: { enrolmentId: 'enr_one', status: 'RESERVED' },
      action: { label: 'View refund status' },
      gate2: {
        journeyStatus: 'REFUND_PROCESSING', action: { code: 'REFUND_PROCESSING', label: 'View refund status' },
        enrolment: { status: 'RESERVED', seatReserved: true },
        learnerChange: { type: 'CANCELLATION', status: 'DECIDED', decision: 'APPROVED' },
        refund: { status: 'PROCESSING', amount: 1000 }, communication: { status: 'FAILED' },
      },
    }],
  }));
  assert.equal(elements['learner-current-action'].children[2].href, '/my-learning/change/?enrolmentId=enr_one');
  const card = elements['learner-applications'].children[0];
  const joined = card.children.map((child) => child.textContent).join(' | ');
  assert.match(joined, /Place status: Seat reserved/);
  assert.match(joined, /Seat reservation is confirmed by the service/);
  assert.match(joined, /Organiser request: Decision recorded · Approved/);
  assert.match(joined, /Provider refund: Refund processing/);
  assert.match(joined, /message could not be confirmed[\s\S]*status above are unchanged/);
  assert.ok(card.children.find((child) => child.href === '/my-learning/change/?enrolmentId=enr_one'));
  assert.equal(card.children.some((child) => /Request cancellation/.test(child.textContent)), false);
});

test('unsupported Gate 3 and Gate 4 actions render neutral and inert', () => {
  for (const code of ['BALANCE_DUE', 'VIEW_COURSE_RESOURCES']) {
    const { elements, shell } = harness();
    shell.renderSummary(summary({
      currentAction: { code, label: code === 'BALANCE_DUE' ? 'Pay balance' : 'Open course resources', href: '/my-learning/' },
      applications: [{
        reference: 'APP-FUTURE', course: { title: 'Python' }, offer: { enrolmentId: 'enr_one', status: 'RESERVED' },
        action: { label: code === 'BALANCE_DUE' ? 'Pay balance' : 'Open course resources' },
        gate2: { action: { code, label: 'Future action' }, enrolment: { status: 'RESERVED', seatReserved: true } },
      }],
    }));
    const current = elements['learner-current-action'];
    assert.equal(current.children[1].textContent, 'No action is currently available');
    assert.equal(current.children[2].tag, 'p');
    assert.equal(current.children[2].href, '');
    const cardText = elements['learner-applications'].children[0].children.map((child) => child.textContent).join(' | ');
    assert.doesNotMatch(cardText, /Pay balance|Open course resources|Future action/);
  }
});

test('future actions stay inert when gate2 is absent or retains a supported code', () => {
  const shapes = [
    { gate2: null, code: 'BALANCE_DUE', label: 'Pay balance' },
    { gate2: { action: { code: 'RESERVED', label: 'View reserved seat' }, enrolment: { status: 'RESERVED', seatReserved: true } }, code: 'VIEW_COURSE_RESOURCES', label: 'Open course resources' },
  ];
  shapes.forEach((shape) => {
    const { elements, shell } = harness();
    const application = { reference: 'APP-FUTURE', course: { title: 'Python' }, offer: { enrolmentId: 'enr_one', status: 'RESERVED' }, action: { code: shape.code, label: shape.label } };
    if (shape.gate2) application.gate2 = shape.gate2;
    shell.renderSummary(summary({ currentAction: { code: shape.code, label: shape.label, href: '/my-learning/' }, applications: [application] }));
    assert.equal(elements['learner-current-action'].children[1].textContent, 'No action is currently available');
    assert.equal(elements['learner-current-action'].children[2].tag, 'p');
    const card = elements['learner-applications'].children[0];
    assert.equal(card.children[1].textContent, 'Status available');
    assert.doesNotMatch(card.children.map((child) => child.textContent).join(' | '), /Pay balance|Open course resources/);
  });
});

test('renderer offers correction only when backend marks the current application eligible', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    applications: [{
      applicationId: 'app_abc', reference: 'APP-3', canReplace: true,
      course: { courseId: 'crs_python_foundations', title: 'Python' },
      action: { label: 'Application received' }, offer: null,
    }],
  }));
  const card = elements['learner-applications'].children[0];
  const correction = card.children.find((child) => child.textContent === 'Correct or update application');
  assert.equal(correction.href, '/apply/?courseId=crs_python_foundations&applicationId=app_abc');
  assert.match(card.children.map((child) => child.textContent).join(' | '), /does not withdraw or change/);
});

test('initialise exposes retry and support recovery after a network error', async () => {
  const { elements, shell } = harness({
    request: async () => { const error = new Error('network'); error.status = 0; throw error; },
  });
  await shell.initialise();
  assert.equal(
    elements['learner-shell-status'].textContent,
    'My Learning is temporarily unavailable.'
  );
  assert.equal(elements['learner-error-actions'].hidden, false);
  assert.equal(elements['learner-retry'].disabled, false);
  assert.equal(typeof elements['learner-retry'].listeners.click, 'function');
});

test('a failed refresh clears and hides previously rendered private state', async () => {
  let fail = false;
  const { elements, shell } = harness({
    request: async () => {
      if (fail) { const error = new Error('network'); error.status = 0; throw error; }
      return summary({
        learner: { verifiedEmail: 'private@example.com', fullName: 'Private Learner', timezone: 'Asia/Kolkata', adultEligibilityConfirmed: true, acknowledgements: [] },
        applications: [{ reference: 'APP-PRIVATE', course: { title: 'Private course' }, action: { label: 'Application received' } }],
      });
    },
  });
  await shell.initialise();
  assert.equal(elements['learner-shell'].hidden, false);
  fail = true;
  await shell.initialise();
  assert.equal(elements['learner-shell'].hidden, true);
  assert.equal(elements['learner-user-label'].textContent, '');
  assert.equal(elements['learner-applications'].children.length, 0);
  assert.equal(elements['learner-profile-details'].children.length, 0);
  assert.equal(elements['learner-current-action'].children.length, 0);
});

test('initialise redirects expired sessions without exposing the shell', async () => {
  let redirected = '';
  const { context, elements, shell } = harness({
    request: async () => { const error = new Error('expired'); error.status = 401; throw error; },
  });
  context.window.location.replace = (value) => { redirected = value; };
  await shell.initialise();
  assert.match(redirected, /^\/learn\/\?continue=/);
  assert.equal(elements['learner-shell'].hidden, true);
});

test('logout uncertainty hides private content and gives safe recovery guidance', async () => {
  const { elements } = harness({ logout: async () => false });
  elements['learner-shell'].hidden = false;
  elements['learner-user-label'].textContent = 'private@example.com';
  elements['learner-current-action'].appendChild(new Element());
  elements['learner-applications'].appendChild(new Element());
  elements['learner-profile-details'].appendChild(new Element());
  await elements['learner-logout'].listeners.click();
  assert.equal(elements['learner-shell'].hidden, true);
  assert.equal(elements['learner-user-label'].textContent, '');
  assert.equal(elements['learner-current-action'].children.length, 0);
  assert.equal(elements['learner-applications'].children.length, 0);
  assert.equal(elements['learner-profile-details'].children.length, 0);
  assert.match(elements['learner-shell-status'].textContent, /could not confirm server sign-out/);
  assert.equal(elements['learner-shell-status'].hidden, false);
  assert.equal(elements['learner-error-actions'].hidden, false);
});
