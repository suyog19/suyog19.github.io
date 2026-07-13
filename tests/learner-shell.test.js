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
  assert.match(text, /No payment workflow is enabled in Gate 1/);
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
  await elements['learner-logout'].listeners.click();
  assert.equal(elements['learner-shell'].hidden, true);
  assert.match(elements['learner-shell-status'].textContent, /could not confirm server sign-out/);
  assert.equal(elements['learner-shell-status'].hidden, false);
  assert.equal(elements['learner-error-actions'].hidden, false);
});
