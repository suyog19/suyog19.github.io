const test = require('node:test');
const assert = require('node:assert/strict');

const survey = require('../js/research-survey.js');

function element(attributes = {}) {
  return {
    attributes,
    disabled: false,
    hidden: false,
    textContent: '',
    children: [],
    listeners: {},
    addEventListener(type, listener) { this.listeners[type] = listener; },
    appendChild(child) { this.children.push(child); },
    getAttribute(name) { return this.attributes[name] || null; },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
}

function fixture(source = 'https://docs.google.com/forms/example') {
  const elements = {
    'survey-embed': element(),
    'survey-form-gate': element(),
    'survey-load-button': element({ 'data-survey-src': source }),
    'survey-load-status': element(),
  };
  return {
    elements,
    document: {
      getElementById(id) { return elements[id] || null; },
      createElement(tag) { const created = element(); created.tagName = tag.toUpperCase(); return created; },
    },
  };
}

test('survey iframe does not exist before the explicit load action', () => {
  const { document, elements } = fixture();
  survey.init(document);
  assert.equal(elements['survey-embed'].children.length, 0);
  assert.equal(elements['survey-load-button'].disabled, false);
});

test('load action creates one privacy-bounded titled iframe and announces state', () => {
  const { document, elements } = fixture();
  survey.init(document);
  elements['survey-load-button'].listeners.click();
  const frames = elements['survey-embed'].children;
  assert.equal(frames.length, 1);
  assert.equal(frames[0].tagName, 'IFRAME');
  assert.equal(frames[0].src, 'https://docs.google.com/forms/example');
  assert.equal(frames[0].title, 'AI Teaching Workflows Research Survey');
  assert.equal(frames[0].referrerPolicy, 'strict-origin-when-cross-origin');
  assert.equal(elements['survey-form-gate'].hidden, true);
  assert.equal(elements['survey-load-button'].disabled, true);
  assert.equal(elements['survey-load-status'].textContent, 'Loading survey form…');
  frames[0].listeners.load();
  assert.equal(elements['survey-load-status'].textContent, 'Survey form loaded.');
});

test('missing source fails closed without hiding the direct survey route', () => {
  const { document, elements } = fixture('');
  survey.init(document);
  elements['survey-load-button'].listeners.click();
  assert.equal(elements['survey-embed'].children.length, 0);
  assert.equal(elements['survey-form-gate'].hidden, false);
});
