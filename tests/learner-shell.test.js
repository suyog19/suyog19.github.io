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
    this.attributes = {};
    this.listeners = {};
  }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
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

function flattenedText(node) {
  return [node.textContent, ...node.children.flatMap((child) => flattenedText(child))].filter(Boolean).join(' | ');
}

function findByHref(node, href) {
  if (node.href === href) return node;
  for (const child of node.children) {
    const found = findByHref(child, href);
    if (found) return found;
  }
  return undefined;
}

test('renderer preserves empty-profile semantics and support fallbacks', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({ support: { privacyUrl: 'https://evil.example/' } }));
  assert.equal(elements['learner-profile-empty'].hidden, false);
  assert.equal(elements['learner-profile-details'].children.length, 0);
  assert.equal(elements['learner-privacy-link'].href, '/training/policies/');
  assert.equal(
    elements['learner-applications'].children[0].textContent,
    ''
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
  const text = flattenedText(card);
  assert.doesNotMatch(text, /cohort offer is available/);
  assert.match(text, /View recommended course/);
  assert.match(text, /application status shown above is unchanged/);
  assert.ok(findByHref(card, '/training/applied-python-ai-ml/'));
});

test('renderer shows an offer only for the backend OFFERED state', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    applications: [{
      reference: 'APP-2', course: { title: 'Python' },
      action: { label: 'View your offer' }, offer: { status: 'OFFERED' },
    }],
  }));
  const text = flattenedText(elements['learner-applications'].children[0]);
  assert.match(text, /Your application has been accepted/);
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
  assert.ok(findByHref(elements['learner-current-action'], '/my-learning/change/?enrolmentId=enr_one'));
  const card = elements['learner-applications'].children[0];
  const joined = flattenedText(card);
  assert.match(joined, /Place status.*Seat reserved/);
  assert.match(joined, /Request outcome.*Decision recorded · Approved/);
  assert.match(joined, /Refund status.*Refund processing/);
  assert.match(joined, /latest email was delivered[\s\S]*status shown above is unchanged/);
  assert.ok(findByHref(card, '/my-learning/change/?enrolmentId=enr_one'));
  assert.equal(card.children.some((child) => /Request cancellation/.test(child.textContent)), false);
});

test('unsupported Gate 3 and Gate 4 actions render neutral and inert', () => {
  for (const code of ['BALANCE_DUE', 'VIEW_COURSE_RESOURCES']) {
    const { elements, shell } = harness();
    shell.renderSummary(summary({
      currentAction: { code, label: code === 'BALANCE_DUE' ? 'Pay balance' : 'Open course resources', href: '/my-learning/' },
      applications: [{
        reference: 'APP-FUTURE', course: { title: 'Python' }, offer: { enrolmentId: 'enr_one', status: 'RESERVED' },
        action: { code, label: code === 'BALANCE_DUE' ? 'Pay balance' : 'Open course resources' },
        gate2: { action: { code, label: 'Future action' }, enrolment: { status: 'RESERVED', seatReserved: true } },
      }],
    }));
    const current = elements['learner-current-action'];
    assert.equal(current.children[1].textContent, 'View your current learning status');
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
    assert.equal(elements['learner-current-action'].children[1].textContent, 'View your current learning status');
    assert.equal(elements['learner-current-action'].children[2].tag, 'p');
    const card = elements['learner-applications'].children[0];
    assert.equal(card.children[1].textContent, 'View your current learning status');
    assert.doesNotMatch(card.children.map((child) => child.textContent).join(' | '), /Pay balance|Open course resources/);
  });
});

test('Gate 2-only actions stay inert when their authoritative projection is missing', () => {
  ['DEPOSIT_DUE', 'REFUND_PROCESSING'].forEach((code) => {
    const { elements, shell } = harness();
    const label = code === 'DEPOSIT_DUE' ? 'Pay deposit' : 'View refund status';
    shell.renderSummary(summary({
      currentAction: { code, label, href: '/my-learning/' },
      applications: [{ reference: 'APP-MISSING-G2', course: { title: 'Python' }, offer: { enrolmentId: 'enr_one', status: 'RESERVED' }, action: { code, label } }],
    }));
    assert.equal(elements['learner-current-action'].children[1].textContent, 'View your current learning status');
    assert.equal(elements['learner-current-action'].children[2].tag, 'p');
    const card = elements['learner-applications'].children[0];
    assert.equal(card.children[1].textContent, 'View your current learning status');
    assert.doesNotMatch(card.children.map((child) => child.textContent).join(' | '), /Pay deposit|View refund status/);
  });
});

test('Gate 3 renders backend-owned fee, grace, extension, credit, and safe balance action', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    currentAction: { code: 'BALANCE_EXTENDED', label: 'Pay remaining fee' },
    applications: [{
      reference: 'APP-G3', journeyStatus: 'BALANCE_EXTENDED', course: { title: 'Python' },
      offer: { enrolmentId: 'enr_one', status: 'RESERVED' }, action: { code: 'BALANCE_EXTENDED', label: 'Pay remaining fee' },
      gate3: {
        cohortDecision: 'CONFIRMED', schedule: { startsAt: '2026-08-01T04:30:00Z', endsAt: '2026-08-01T06:30:00Z', timezone: 'Asia/Kolkata' },
        balanceStatus: 'EXTENDED', amountDue: 120000, creditAmount: 5000, currency: 'INR',
        balanceDeadline: '2026-07-20T18:29:59Z', extensionUntil: '2026-07-25T18:29:59Z',
        seatReserved: true, seatReleased: false, activationStatus: 'ELIGIBLE', joiningEligibility: 'NOT_ELIGIBLE',
        action: { code: 'PAY_BALANCE' }, communication: { status: 'SENT' },
      },
    }],
  }));
  assert.ok(findByHref(elements['learner-current-action'], '/my-learning/balance/?enrolmentId=enr_one'));
  const card = elements['learner-applications'].children[0];
  const text = flattenedText(card);
  assert.match(text, /Cohort status.*Confirmed/);
  assert.match(text, /Remaining fee.*Deadline extended/);
  assert.match(text, /Amount due.*1,200/);
  assert.match(text, /Approved credit or waiver.*50/);
  assert.match(text, /Approved extension ends/);
  assert.match(text, /Seat status.*Reserved/);
  assert.ok(findByHref(card, '/my-learning/balance/?enrolmentId=enr_one'));
});

test('Gate 3 confirming, non-payment closure, and communication failure remain separate', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    currentAction: { code: 'CLOSED_NON_PAYMENT', label: 'Contact support' },
    applications: [{
      reference: 'APP-CLOSED', journeyStatus: 'CLOSED_NON_PAYMENT', course: { title: 'Python' },
      offer: { enrolmentId: 'enr_closed' }, action: { code: 'CLOSED_NON_PAYMENT', label: 'Contact support' },
      gate3: {
        cohortDecision: 'CONFIRMED', balanceStatus: 'CLOSED_NON_PAYMENT', amountDue: 10000, creditAmount: 0, currency: 'INR',
        seatReserved: false, seatReleased: true, activationStatus: 'NOT_ELIGIBLE', joiningEligibility: 'NOT_ELIGIBLE',
        depositDispositionOutcome: 'ACTION_NEEDED', action: { code: 'CONTACT_SUPPORT' }, communication: { status: 'FAILED' },
      },
    }],
  }));
  const card = elements['learner-applications'].children[0];
  const text = flattenedText(card);
  assert.match(text, /Seat status.*Released/);
  assert.match(text, /Deposit treatment.*Organiser review required/);
  assert.match(text, /cannot reactivate this enrolment automatically/);
  assert.match(text, /latest email was delivered.*status shown above is unchanged/);
  assert.ok(findByHref(card, '/contact/?topic=learning-payment-review'));
});

test('Gate 3 activation and joining never expose Gate 4 resources', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    currentAction: { code: 'ACTIVE', label: 'Enrolment active', href: '/course/private' },
    applications: [{
      reference: 'APP-ACTIVE', journeyStatus: 'ACTIVE', course: { title: 'Python' },
      offer: { enrolmentId: 'enr_active' }, action: { code: 'ACTIVE', label: 'Enrolment active' },
      gate3: { cohortDecision: 'CONFIRMED', balanceStatus: 'SATISFIED', amountDue: 0, creditAmount: 0, currency: 'INR', seatReserved: true, seatReleased: false, activationStatus: 'ACTIVE', joiningEligibility: 'ELIGIBLE', action: { code: 'NONE' }, communication: { status: 'NOT_APPLICABLE' } },
    }],
  }));
  const all = [elements['learner-current-action'], elements['learner-applications'].children[0]];
  const text = all.map(flattenedText).join(' | ');
  assert.match(text, /Joining details.*Available without course-resource links/);
  assert.equal(all.some((element) => findByHref(element, '/course/private')), false);
});

test('active course-area action uses only current authorised local eligibility', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    currentAction: { code: 'ACTIVE', label: 'Raw action ignored' },
    applications: [{
      reference: 'APP-HUB', journeyStatus: 'ACTIVE', course: { title: 'Python' }, action: { code: 'ACTIVE', label: 'Raw action ignored' },
      gate3: { activationStatus: 'ACTIVE', courseHub: { eligible: true, href: '/my-learning/enr_hub/' }, action: { code: 'NONE' } },
    }],
  }));
  const current = findByHref(elements['learner-current-action'], '/my-learning/enr_hub/');
  const journey = findByHref(elements['learner-applications'], '/my-learning/enr_hub/');
  assert.equal(current.textContent, 'Open your course area');
  assert.equal(journey.textContent, 'Open your course area');
});

test('Gate 3 malformed ownership and unknown enums fail closed', () => {
  const { elements, shell } = harness();
  shell.renderSummary(summary({
    currentAction: { code: 'BALANCE_DUE', label: 'Pay balance' },
    applications: [{ reference: 'APP-BAD', journeyStatus: 'BALANCE_DUE', course: { title: 'Python' }, offer: { enrolmentId: '../admin' }, action: { code: 'BALANCE_DUE', label: 'Pay balance' }, gate3: { cohortDecision: 'UNKNOWN', balanceStatus: 'UNKNOWN', action: { code: 'PAY_BALANCE' } } }],
  }));
  assert.equal(elements['learner-current-action'].children[2].tag, 'p');
  const card = elements['learner-applications'].children[0];
  assert.equal(card.children.some((child) => child.href), false);
  assert.doesNotMatch(flattenedText(card), /UNKNOWN/);
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
  const correction = findByHref(card, '/apply/?courseId=crs_python_foundations&applicationId=app_abc');
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
    'My Learning is temporarily unavailable. Your application, payment and enrolment records are not changed by this display problem.'
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
