const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync('js/contact.js', 'utf8');

function loadContact(search) {
  const events = new Map();
  const analytics = [];
  const fetchCalls = [];
  const submitButton = { disabled: false, textContent: 'Send message' };
  const elements = {
    'learning-contact-context': { hidden: true, textContent: '' },
    name: { value: 'Synthetic Visitor', addEventListener(name, listener) { events.set('name:' + name, listener); }, removeAttribute() {}, setAttribute() {}, getAttribute() { return ''; } },
    email: { value: 'synthetic@example.com', addEventListener(name, listener) { events.set('email:' + name, listener); }, removeAttribute() {}, setAttribute() {}, getAttribute() { return ''; } },
    message: { value: '', addEventListener(name, listener) { events.set('message:' + name, listener); }, removeAttribute() {}, setAttribute() {}, getAttribute() { return 'message-hint message-error'; } },
    'message-hint': { textContent: '' },
    'form-status': { className: '', classList: { add() {} }, textContent: '' },
  };
  for (const id of ['name-error', 'email-error', 'message-error']) elements[id] = { hidden: true, textContent: '' };
  const form = { addEventListener(name, listener) { events.set('form:' + name, listener); }, querySelector(selector) { return selector === '[type="submit"]' ? submitButton : { focus() {} }; }, querySelectorAll() { return [elements.name, elements.email, elements.message]; }, reset() {} };
  elements['contact-form'] = form;
  const window = { location: { hostname: 'localhost', search }, gtag(...args) { analytics.push(args); } };
  vm.runInNewContext(script, { document: { getElementById(id) { return elements[id] || null; } }, fetch: async (...args) => { fetchCalls.push(args); return { status: 202, json: async () => ({}) }; }, URLSearchParams, window });
  return { analytics, elements, events, fetchCalls, tools: window.sjContact };
}

test('six fixed Website Services contexts render safe guidance', () => {
  for (const topic of ['landing', 'starter', 'business', 'redesign', 'care', 'help-choose']) assert.match(script, new RegExp("'website-services-" + topic + "'"));
  const state = loadContact('?topic=website-services-redesign');
  assert.equal(state.elements['learning-contact-context'].hidden, false);
  assert.match(state.elements['learning-contact-context'].textContent, /public URL.*do not include credentials/i);
  assert.match(state.elements.message.value, /^I would like to discuss a Website Redesign/);
  assert.match(state.elements['message-hint'].textContent, /Remove anything sensitive/);
  const unknown = loadContact('?topic=website-services-not-allow-listed');
  assert.equal(unknown.elements['learning-contact-context'].hidden, true);
});

test('Website Services enquiry requires added detail and preserves the API contract', async () => {
  const state = loadContact('?topic=website-services-business');
  state.events.get('name:input')();
  assert.deepEqual(JSON.parse(JSON.stringify(state.analytics)), [['event', 'website_services_enquiry_started', { service: 'business_website', source_page: 'contact' }]]);
  await state.events.get('form:submit')({ preventDefault() {} });
  assert.equal(state.fetchCalls.length, 0);
  assert.match(state.elements['message-error'].textContent, /current situation and website goal/i);
  state.elements.message.value += 'We need clearer service journeys and a reliable enquiry path.';
  state.events.get('message:input')();
  await state.events.get('form:submit')({ preventDefault() {} });
  const payload = JSON.parse(state.fetchCalls[0][1].body);
  assert.deepEqual(payload, { name: 'Synthetic Visitor', email: 'synthetic@example.com', message: state.elements.message.value.trim(), type: 'contact', source: 'contact_page', website: '' });
  assert.deepEqual(JSON.parse(JSON.stringify(state.analytics[1])), ['event', 'website_services_enquiry_submitted', { service: 'business_website', source_page: 'contact' }]);
  assert.doesNotMatch(JSON.stringify(state.analytics), /Synthetic Visitor|synthetic@example|clearer service journeys/i);
});

test('Consulting and Learning context entry points remain exported', () => {
  const state = loadContact('');
  assert.equal(typeof state.tools.applyConsultingContext, 'function');
  assert.equal(typeof state.tools.applyLearningContext, 'function');
  assert.equal(typeof state.tools.applyWebsiteServiceContext, 'function');
});
