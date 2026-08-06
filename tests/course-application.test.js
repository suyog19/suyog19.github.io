const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function loadModel() {
  const context = {
    window: {},
    crypto: { getRandomValues(values) { values.set([1, 2, 3, 4]); return values; } },
    Uint32Array,
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/training-release.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/course-application-model.js'), 'utf8'), context);
  return context.window.sjCourseApplication;
}

function validValue() {
  return {
    courseId: 'crs_python_foundations', fullName: 'Learner', timezone: 'Asia/Kolkata',
    learnerNote: 'I want to build safely', requiredConfirmation: true,
  };
}

class Element {
  constructor() {
    this.value = ''; this.checked = false; this.hidden = false; this.disabled = false;
    this.textContent = ''; this.className = ''; this.listeners = {}; this.attributes = {}; this.options = [];
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  focus() { this.focused = true; }
  querySelector() { return new Element(); }
  querySelectorAll() { return []; }
  appendChild(child) { this.options.push(child); }
  getAttribute(name) { return this.attributes[name] || null; }
  get classList() { return { contains: (name) => this.className.split(/\s+/).includes(name) }; }
}

function pageHarness(search, request, detectedTimezone = 'Asia/Kolkata') {
  const ids = [
    'application-form', 'application-status', 'application-recovery', 'application-retry',
    'application-submit', 'application-result', 'application-reference',
    'application-result-title', 'application-result-detail', 'application-course-summary',
    'profile-fields', 'application-user-label', 'application-logout', 'application-cancel',
    'application-full-name', 'application-full-name-error', 'application-timezone',
    'application-timezone-error', 'application-note', 'application-note-error',
    'application-confirmation', 'application-confirmation-error',
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
  elements['application-form'].hidden = true;
  elements['application-recovery'].hidden = true;
  elements['application-result'].hidden = true;
  elements['application-timezone'].value = 'Asia/Kolkata';
  elements['application-timezone'].options = [
    { value: 'Asia/Kolkata' }, { value: 'Europe/London' }, { value: 'America/New_York' },
  ];
  for (const id of ['application-full-name-error', 'application-timezone-error', 'application-note-error', 'application-confirmation-error']) {
    elements[id].className = 'field-error'; elements[id].hidden = true;
  }
  elements['application-confirmation'].attributes['aria-describedby'] = 'application-confirmation-error';
  elements['application-note'].attributes['aria-describedby'] = 'application-note-hint application-note-error';
  elements['application-form'].querySelectorAll = (selector) => {
    if (selector === '.field-error') return Object.values(elements).filter((element) => element.className.includes('field-error'));
    if (selector === '[aria-invalid="true"]') return Object.values(elements).filter((element) => element.attributes['aria-invalid'] === 'true');
    return [];
  };
  const storage = new Map();
  const context = {
    URLSearchParams, Uint32Array,
    crypto: { getRandomValues(values) { values.set([1, 2, 3, 4]); return values; } },
    sessionStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); },
    },
    Intl: { DateTimeFormat() { return { resolvedOptions() { return { timeZone: detectedTimezone }; } }; } },
    document: { getElementById(id) { return elements[id]; }, createElement() { return new Element(); } },
    window: {
      __SJ_DISABLE_AUTO_INIT__: true,
      location: { hostname: 'dev.suyogjoshi.com', search, replace(value) { this.redirected = value; } },
      sjLearnerAuth: {
        restore: async () => ({ emailId: 'learner@example.com' }), request,
        logout: async () => true,
      },
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/training-release.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/course-application-model.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/course-application.js'), 'utf8'), context);
  return { context, elements, page: context.window.sjCourseApplicationPage, storage };
}

test('only approved Gate 1 course identifiers are accepted', () => {
  const model = loadModel();
  assert.equal(model.course('crs_python_foundations').slug, 'python-foundations-for-data-science');
  assert.equal(model.course('crs_applied_python').slug, 'applied-data-analysis-with-python');
  assert.equal(model.course('../admin'), null);
});

test('production is enabled after launch approval while unknown hosts remain disabled', () => {
  const model = loadModel();
  assert.equal(model.applicationsEnabled('suyogjoshi.com'), true);
  assert.equal(model.applicationsEnabled('www.suyogjoshi.com'), true);
  assert.equal(model.applicationsEnabled('untrusted.example'), false);
  assert.equal(model.applicationsEnabled('dev.suyogjoshi.com'), true);
  assert.equal(model.applicationsEnabled('preview.suyogjoshi-dev.pages.dev'), true);
});

test('submission payload is the exact approved contract', () => {
  const model = loadModel();
  const payload = model.payload(validValue());
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    courseId: 'crs_python_foundations',
    answers: { programmingExperience: 'N/A', learningGoal: 'I want to build safely', weeklyAvailability: 'N/A' },
    acknowledgements: [
      { documentId: 'software-signal-terms-privacy', version: '1.1.0' },
      { documentId: 'software-signal-recorded-delivery', version: '1.1.0' },
    ],
  });
  assert.equal(Object.hasOwn(payload, 'phone'), false);
  assert.equal(Object.hasOwn(payload, 'optionalConsent'), false);
  assert.equal(Object.hasOwn(payload, 'payment'), false);
});

test('blank optional note maps all legacy answer fields to N/A', () => {
  const model = loadModel();
  const payload = model.payload({ ...validValue(), learnerNote: '   ' });
  assert.deepEqual(JSON.parse(JSON.stringify(payload.answers)), {
    programmingExperience: 'N/A', learningGoal: 'N/A', weeklyAvailability: 'N/A',
  });
});

test('replacement adds only the optimistic concurrency precondition', () => {
  const model = loadModel();
  const replacement = model.replacementPayload(validValue(), 3);
  assert.equal(replacement.expectedVersion, 3);
  assert.deepEqual(Object.keys(replacement).sort(), ['acknowledgements', 'answers', 'courseId', 'expectedVersion']);
  assert.notEqual(model.fingerprint(validValue()), model.fingerprint(validValue(), { expectedVersion: 3 }));
});

test('validation covers profile, optional note, and combined confirmation', () => {
  const model = loadModel();
  assert.deepEqual(Object.keys(model.validate(validValue(), true)), []);
  const invalid = validValue();
  invalid.learnerNote = 'x'.repeat(501);
  invalid.requiredConfirmation = false;
  assert.deepEqual(Object.keys(model.validate(invalid, true)).sort(), ['learnerNote', 'requiredConfirmation']);
  invalid.learnerNote = '';
  invalid.requiredConfirmation = true;
  assert.deepEqual(Object.keys(model.validate(invalid, true)), []);
});

test('backend contract errors map to specific recovery states', () => {
  const model = loadModel();
  assert.equal(model.errorMessage({ status: 409, body: { error: 'DUPLICATE_ACTIVE_APPLICATION' } }).code, 'DUPLICATE');
  assert.equal(model.errorMessage({ status: 409, body: { error: 'REGISTRATION_CLOSED' } }).code, 'REGISTRATION_CLOSED');
  assert.equal(model.errorMessage({ status: 409, body: { error: 'ACKNOWLEDGEMENT_VERSION_NOT_CURRENT' } }).code, 'ACKNOWLEDGEMENT_REQUIRED');
  assert.equal(model.errorMessage({ status: 409, body: { error: 'APPLICATION_REPLACEMENT_CONFLICT' } }).code, 'REPLACEMENT_CONFLICT');
  assert.equal(model.errorMessage({ status: 503, body: {} }).code, 'UNCERTAIN');
  assert.equal(model.errorMessage({ status: 401, body: {} }).code, 'SESSION_EXPIRED');
});

test('page remains private-by-default and contains no payment integration', () => {
  const html = fs.readFileSync(path.join(root, 'apply/index.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'js/course-application.js'), 'utf8');
  assert.match(html, /noindex, nofollow/);
  assert.match(html, /No payment is collected with an application/);
  assert.doesNotMatch(html + script, /Razorpay|checkout\.js|payment-button/i);
  assert.doesNotMatch(script, /emailId.*gtag|application\.reference.*gtag/);
  assert.match(script, /sessionStorage/);
  assert.match(script, /Idempotency-Key/);
  assert.match(script, /\/replacements/);
  assert.match(script, /Your original remains active until you resubmit/);
  assert.equal((html.match(/id="application-confirmation"/g) || []).length, 1);
  assert.doesNotMatch(html, /id="application-(?:experience|goal|availability)"/);
  assert.match(html, /id="application-note"[^>]+maxlength="500"/);
  assert.match(html, /<details class="application-course-details">/);
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g) || []).length, 4);
});

test('first-time learner sees inline profile form before application lookup', async () => {
  const calls = [];
  const { elements, page } = pageHarness('?courseId=crs_python_foundations', async (path) => {
    calls.push(path);
    if (path === '/training/courses/python-foundations-for-data-science') {
      return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    }
    if (path === '/learners/me') {
      const error = new Error('missing profile');
      error.status = 404;
      throw error;
    }
    if (path.startsWith('/me/applications/current')) {
      throw new Error('Application lookup must wait until the profile exists');
    }
    throw new Error('Unexpected ' + path);
  });

  await page.initialise();

  assert.equal(elements['profile-fields'].hidden, false);
  assert.equal(elements['application-form'].hidden, false);
  assert.equal(elements['application-recovery'].hidden, true);
  assert.equal(calls.some((path) => path.startsWith('/me/applications/current')), false);
});

test('first-time timezone uses supported browser detection and falls back safely', async () => {
  async function request(path) {
    if (path === '/training/courses/python-foundations-for-data-science') return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    if (path === '/learners/me') { const error = new Error('missing'); error.status = 404; throw error; }
    throw new Error('Unexpected ' + path);
  }
  const detected = pageHarness('?courseId=crs_python_foundations', request, 'Europe/London');
  await detected.page.initialise();
  assert.equal(detected.elements['application-timezone'].value, 'Europe/London');

  const fallback = pageHarness('?courseId=crs_python_foundations', request, 'Antarctica/Troll');
  await fallback.page.initialise();
  assert.equal(fallback.elements['application-timezone'].value, 'Asia/Kolkata');
});

test('saved draft timezone and optional note take precedence over browser detection', async () => {
  const harness = pageHarness('?courseId=crs_python_foundations', async (path) => {
    if (path === '/training/courses/python-foundations-for-data-science') return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    if (path === '/learners/me') { const error = new Error('missing'); error.status = 404; throw error; }
    throw new Error('Unexpected ' + path);
  }, 'Europe/London');
  harness.storage.set('sj_gate1_application_draft_crs_python_foundations', JSON.stringify({
    courseId: 'crs_python_foundations', fullName: 'Learner', timezone: 'America/New_York',
    learnerNote: 'Saved context', requiredConfirmation: true,
  }));
  await harness.page.initialise();
  assert.equal(harness.elements['application-timezone'].value, 'America/New_York');
  assert.equal(harness.elements['application-note'].value, 'Saved context');
  assert.equal(harness.elements['application-confirmation'].checked, true);
});

test('missing combined confirmation shows its specific accessible error', async () => {
  const { elements, page } = pageHarness('?courseId=crs_python_foundations', async (path) => {
    if (path === '/training/courses/python-foundations-for-data-science') return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    if (path === '/learners/me') { const error = new Error('missing'); error.status = 404; throw error; }
    throw new Error('Unexpected ' + path);
  });
  await page.initialise();
  elements['application-full-name'].value = 'Learner';
  await page.submitApplication();
  assert.equal(elements['application-confirmation'].attributes['aria-invalid'], 'true');
  assert.equal(elements['application-confirmation'].focused, true);
  assert.match(elements['application-confirmation-error'].textContent, /18 or older/);
  assert.equal(elements['application-confirmation-error'].hidden, false);
  assert.match(elements['application-status'].textContent, /Confirm your eligibility/);
});

test('eligible correction is prefilled and submits the exact immutable replacement', async () => {
  const calls = [];
  const source = {
    applicationId: 'app_source', reference: 'APP-SOURCE', courseId: 'crs_python_foundations',
    status: 'NEW', version: 4,
    answers: { programmingExperience: 'N/A', learningGoal: 'Old goal', weeklyAvailability: 'N/A' },
  };
  const { elements, page } = pageHarness('?courseId=crs_python_foundations&applicationId=app_source', async (path, options) => {
    calls.push({ path, options });
    if (path === '/training/courses/python-foundations-for-data-science') return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    if (path === '/learners/me') return { learner: { adultEligibilityConfirmed: true, acknowledgements: [
      { documentId: 'software-signal-terms-privacy', version: '1.1.0' },
      { documentId: 'software-signal-recorded-delivery', version: '1.1.0' },
    ] } };
    if (path.startsWith('/me/applications/current')) return { application: source };
    if (path === '/me/applications/app_source') return { application: source };
    if (path === '/me/applications/app_source/replacements') return { application: { applicationId: 'app_new', reference: 'APP-NEW' } };
    throw new Error('Unexpected ' + path);
  });
  await page.initialise();
  assert.equal(elements['application-note'].value, 'Old goal');
  assert.equal(elements['application-submit'].textContent, 'Submit corrected application');
  assert.equal(elements['application-cancel'].hidden, false);
  elements['application-confirmation'].checked = true;
  await page.submitApplication();
  const replacement = calls.find((call) => call.path.endsWith('/replacements'));
  assert.equal(replacement.options.headers['Idempotency-Key'], 'web-00000001000000020000000300000004');
  assert.deepEqual(JSON.parse(replacement.options.body), {
    courseId: 'crs_python_foundations', expectedVersion: 4,
    answers: { programmingExperience: 'N/A', learningGoal: 'Old goal', weeklyAvailability: 'N/A' },
    acknowledgements: [
      { documentId: 'software-signal-terms-privacy', version: '1.1.0' },
      { documentId: 'software-signal-recorded-delivery', version: '1.1.0' },
    ],
  });
  assert.equal(elements['application-result-title'].textContent, 'Updated application received');
  assert.match(elements['application-result-detail'].textContent, /replaces your earlier submission/);
  assert.equal(elements['application-status'].textContent, '');
  assert.equal(elements['application-status'].hidden, true);
});

test('correction does not expose N/A as learner-entered text', async () => {
  const source = {
    applicationId: 'app_source', reference: 'APP-SOURCE', courseId: 'crs_python_foundations', status: 'NEW', version: 1,
    answers: { programmingExperience: 'N/A', learningGoal: 'N/A', weeklyAvailability: 'N/A' },
  };
  const { elements, page } = pageHarness('?courseId=crs_python_foundations&applicationId=app_source', async (path) => {
    if (path === '/training/courses/python-foundations-for-data-science') return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    if (path === '/learners/me') return { learner: { adultEligibilityConfirmed: true, acknowledgements: [
      { documentId: 'software-signal-terms-privacy', version: '1.1.0' },
      { documentId: 'software-signal-recorded-delivery', version: '1.1.0' },
    ] } };
    if (path.startsWith('/me/applications/current')) return { application: source };
    if (path === '/me/applications/app_source') return { application: source };
    throw new Error('Unexpected ' + path);
  });
  await page.initialise();
  assert.equal(elements['application-note'].value, '');
});

test('replacement conflict hides resubmission and leaves support available', async () => {
  const source = { applicationId: 'app_source', courseId: 'crs_python_foundations', status: 'ACCEPTED', version: 5 };
  const { elements, page } = pageHarness('?courseId=crs_python_foundations&applicationId=app_source', async (path) => {
    if (path === '/training/courses/python-foundations-for-data-science') return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    if (path === '/learners/me') return { learner: { adultEligibilityConfirmed: true, acknowledgements: [] } };
    if (path.startsWith('/me/applications/current')) return { application: source };
    throw new Error('Unexpected ' + path);
  });
  await page.initialise();
  assert.equal(elements['application-form'].hidden, true);
  assert.equal(elements['application-recovery'].hidden, false);
  assert.equal(elements['application-retry'].hidden, true);
  assert.match(elements['application-status'].textContent, /can no longer be corrected/);
});

test('uncertain replacement retry reuses its key and resolves without duplication', async () => {
  const source = {
    applicationId: 'app_source', reference: 'APP-SOURCE', courseId: 'crs_python_foundations', status: 'NEW', version: 2,
    answers: { programmingExperience: 'N/A', learningGoal: 'Goal', weeklyAvailability: 'N/A' },
  };
  const keys = [];
  let currentReads = 0;
  let attempts = 0;
  const { elements, page } = pageHarness('?courseId=crs_python_foundations&applicationId=app_source', async (path, options) => {
    if (path === '/training/courses/python-foundations-for-data-science') return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    if (path === '/learners/me') return { learner: { adultEligibilityConfirmed: true, acknowledgements: [
      { documentId: 'software-signal-terms-privacy', version: '1.1.0' },
      { documentId: 'software-signal-recorded-delivery', version: '1.1.0' },
    ] } };
    if (path.startsWith('/me/applications/current')) {
      currentReads += 1;
      return { application: currentReads === 1 ? source : null };
    }
    if (path === '/me/applications/app_source') return { application: source };
    if (path.endsWith('/replacements')) {
      keys.push(options.headers['Idempotency-Key']);
      attempts += 1;
      if (attempts === 1) { const error = new Error('network'); error.status = 0; throw error; }
      return { application: { applicationId: 'app_new', reference: 'APP-NEW' } };
    }
    throw new Error('Unexpected ' + path);
  });
  await page.initialise();
  elements['application-confirmation'].checked = true;
  await page.submitApplication();
  await page.submitApplication();
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
  assert.equal(elements['application-reference'].textContent, 'APP-NEW');
});

test('uncertain replacement does not mistake the unchanged source for success', async () => {
  const source = {
    applicationId: 'app_source', reference: 'APP-SOURCE', courseId: 'crs_python_foundations', status: 'NEW', version: 2,
    answers: { programmingExperience: 'N/A', learningGoal: 'Goal', weeklyAvailability: 'N/A' },
  };
  let attempts = 0;
  const { elements, page } = pageHarness('?courseId=crs_python_foundations&applicationId=app_source', async (path) => {
    if (path === '/training/courses/python-foundations-for-data-science') return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    if (path === '/learners/me') return { learner: { adultEligibilityConfirmed: true, acknowledgements: [
      { documentId: 'software-signal-terms-privacy', version: '1.1.0' },
      { documentId: 'software-signal-recorded-delivery', version: '1.1.0' },
    ] } };
    if (path.startsWith('/me/applications/current')) return { application: source };
    if (path === '/me/applications/app_source') return { application: source };
    if (path.endsWith('/replacements')) { attempts += 1; const error = new Error('network'); error.status = 0; throw error; }
    throw new Error('Unexpected ' + path);
  });
  await page.initialise();
  elements['application-confirmation'].checked = true;
  await page.submitApplication();
  assert.equal(attempts, 1);
  assert.equal(elements['application-result'].hidden, true);
  assert.equal(elements['application-form'].hidden, false);
  assert.match(elements['application-status'].textContent, /could not be confirmed/);
});

test('lost profile-bootstrap response reconciles before application submission', async () => {
  let profileExists = false;
  let submitted = false;
  const { elements, page } = pageHarness('?courseId=crs_python_foundations', async (path, options) => {
    if (path === '/training/courses/python-foundations-for-data-science') return { course: { courseId: 'crs_python_foundations', title: 'Python Foundations' } };
    if (path === '/learners/me' && !profileExists) { const error = new Error('missing'); error.status = 404; throw error; }
    if (path === '/learners/me') return { learner: { fullName: 'Learner', timezone: 'Asia/Kolkata', adultEligibilityConfirmed: true, acknowledgements: [
      { documentId: 'software-signal-terms-privacy', version: '1.1.0' },
      { documentId: 'software-signal-recorded-delivery', version: '1.1.0' },
    ] } };
    if (path.startsWith('/me/applications/current')) return { application: null };
    if (path === '/learners/me/bootstrap') {
      assert.match(options.headers['Idempotency-Key'], /^web-/);
      assert.deepEqual(JSON.parse(options.body), {
        fullName: 'Learner', timezone: 'Asia/Kolkata', adultEligibilityConfirmed: true,
        acknowledgements: [
          { documentId: 'software-signal-terms-privacy', version: '1.1.0' },
          { documentId: 'software-signal-recorded-delivery', version: '1.1.0' },
        ],
      });
      profileExists = true;
      const error = new Error('lost response'); error.status = 0; throw error;
    }
    if (path === '/me/applications') { submitted = true; return { application: { applicationId: 'app_new', reference: 'APP-NEW' } }; }
    throw new Error('Unexpected ' + path);
  });
  await page.initialise();
  elements['application-full-name'].value = 'Learner';
  elements['application-note'].value = '';
  elements['application-confirmation'].checked = true;
  await page.submitApplication();
  assert.equal(submitted, true);
  assert.equal(elements['application-reference'].textContent, 'APP-NEW');
});

test('unknown-host guard prevents authentication or API requests', async () => {
  let requests = 0;
  const { context, elements, page } = pageHarness('?courseId=crs_python_foundations', async () => { requests += 1; return {}; });
  context.window.location.hostname = 'untrusted.example';
  context.window.sjLearnerAuth.restore = async () => { requests += 1; return {}; };
  await page.initialise();
  assert.equal(requests, 0);
  assert.equal(elements['application-form'].hidden, true);
  assert.match(elements['application-status'].textContent, /disabled until launch approval/);
});
