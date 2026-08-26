const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync('js/contact.js', 'utf8');
const page = fs.readFileSync('contact/index.html', 'utf8');

function loadContact(search, fetchImpl) {
  const events = new Map();
  const analytics = [];
  const submitButton = { disabled: false, textContent: 'Send message' };
  const classList = { add() {} };
  const elements = {
    'learning-contact-context': { hidden: true, textContent: '' },
    name: { value: 'Synthetic Visitor', addEventListener(name, listener) { events.set('name:' + name, listener); }, removeAttribute() {}, setAttribute() {}, getAttribute() { return ''; } },
    email: { value: 'synthetic@example.com', addEventListener(name, listener) { events.set('email:' + name, listener); }, removeAttribute() {}, setAttribute() {}, getAttribute() { return ''; } },
    message: { value: '', addEventListener(name, listener) { events.set('message:' + name, listener); }, removeAttribute() {}, setAttribute() {}, getAttribute() { return 'message-hint message-error'; } },
    'message-hint': { textContent: '' },
    'form-status': { className: '', classList, textContent: '' },
  };
  for (const id of ['name-error', 'email-error', 'message-error']) elements[id] = { hidden: true, textContent: '' };
  const form = {
    addEventListener(name, listener) { events.set('form:' + name, listener); },
    querySelector(selector) { return selector === '[type="submit"]' ? submitButton : { focus() {} }; },
    querySelectorAll() { return [elements.name, elements.email, elements.message]; },
    reset() {},
  };
  elements['contact-form'] = form;
  const fetchCalls = [];
  const window = {
    location: { hostname: 'localhost', search },
    gtag(...args) { analytics.push(args); },
  };
  const context = {
    document: { getElementById(id) { return elements[id] || null; } },
    fetch: async (...args) => { fetchCalls.push(args); return fetchImpl ? fetchImpl(...args) : { status: 202, json: async () => ({}) }; },
    URLSearchParams,
    window,
  };
  vm.runInNewContext(script, context);
  return { analytics, elements, events, fetchCalls, tools: window.sjContact };
}

test('Contact accepts only three fixed Consulting contexts with safe guidance', () => {
  for (const topic of ['consulting-advisory', 'consulting-repository-review', 'consulting-help-choose']) {
    assert.match(script, new RegExp("'" + topic + "'"));
  }
  for (const offer of ['engineering_advisory_session', 'repository_ai_readiness_review', 'help_choose']) {
    assert.match(script, new RegExp("offer: '" + offer + "'"));
  }
  assert.match(script, /do not include passwords, secrets/i);
  assert.match(script, /do not paste private repository links, credentials, or confidential material/i);
  assert.match(page, /contact\.js\?v=3/);
});

test('Consulting context renders safe guidance and ignores unknown topics', () => {
  const state = loadContact('?topic=consulting-advisory');
  assert.equal(state.elements['learning-contact-context'].hidden, false);
  assert.match(state.elements['learning-contact-context'].textContent, /Engineering Advisory Session enquiry/);
  assert.match(state.elements.message.value, /^I would like help with an Engineering Advisory Session/);
  assert.match(state.elements['message-hint'].textContent, /Remove anything sensitive/);
  const unknown = loadContact('?topic=consulting-not-allow-listed');
  assert.equal(unknown.elements['learning-contact-context'].hidden, true);
  assert.equal(unknown.elements.message.value, '');
});

test('Consulting start and accepted submission emit only fixed metadata without changing the API payload', async () => {
  const state = loadContact('?topic=consulting-repository-review');
  state.events.get('name:input')();
  state.events.get('email:input')();
  assert.deepEqual(JSON.parse(JSON.stringify(state.analytics)), [
    ['event', 'consulting_enquiry_started', { offer: 'repository_ai_readiness_review', source_page: 'contact' }],
  ]);
  await state.events.get('form:submit')({ preventDefault() {} });
  assert.equal(state.fetchCalls.length, 1);
  assert.equal(state.fetchCalls[0][0], 'https://api-dev.suyogjoshi.com/messages');
  const payload = JSON.parse(state.fetchCalls[0][1].body);
  assert.deepEqual(payload, {
    name: 'Synthetic Visitor',
    email: 'synthetic@example.com',
    message: state.elements.message.value.trim(),
    type: 'contact',
    source: 'contact_page',
    website: '',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(state.analytics[1])), ['event', 'consulting_enquiry_submitted', { offer: 'repository_ai_readiness_review', source_page: 'contact' }]);
  assert.doesNotMatch(JSON.stringify(state.analytics), /Synthetic Visitor|synthetic@example|decision or engineering problem/i);
});

test('Consulting enquiry analytics is fixed metadata and never form content', () => {
  assert.match(script, /consulting_enquiry_started/);
  assert.match(script, /consulting_enquiry_submitted/);
  assert.match(script, /offer: activeConsultingContext\.offer/);
  const analyticsBlock = script.slice(script.indexOf('function emitConsultingEvent'), script.indexOf('function applyConsultingContext'));
  assert.doesNotMatch(analyticsBlock, /getElementById|\.value|location\.search|document\.referrer|email|company|message/i);
  assert.match(script, /body: JSON\.stringify\(\{[\s\S]*type:\s+'contact',[\s\S]*source:\s+'contact_page',[\s\S]*website:\s+'',/);
});
