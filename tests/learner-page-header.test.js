const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

test('private learning subpages show the saved identity and clear content before logout', async () => {
  const user = { hidden: true, textContent: '' };
  const panel = { hidden: false };
  const button = { disabled: false, listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; } };
  let loggedOut = false;
  let destination = '';
  const context = {
    document: {
      getElementById(id) { return id === 'learner-page-user' ? user : id === 'learner-page-logout' ? button : null; },
      querySelectorAll() { return [panel]; },
    },
    window: {
      location: { replace(value) { destination = value; } },
      sjLearnerAuth: {
        readUser() { return { email: 'learner@example.com' }; },
        async logout() { loggedOut = true; return true; },
      },
    },
  };
  vm.runInNewContext(fs.readFileSync('js/learner-page-header.js', 'utf8'), context);
  assert.equal(user.textContent, 'learner@example.com');
  assert.equal(user.hidden, false);
  await button.listeners.click();
  assert.equal(button.disabled, true);
  assert.equal(panel.hidden, true);
  assert.equal(loggedOut, true);
  assert.equal(destination, '/learn/');
});

test('every private learning subpage loads the shared identity and logout controller', () => {
  for (const page of ['payment', 'balance', 'change']) {
    const html = fs.readFileSync(`my-learning/${page}/index.html`, 'utf8');
    assert.match(html, /id="learner-page-user"/);
    assert.match(html, /id="learner-page-logout"/);
    assert.match(html, /learner-page-header\.js/);
  }
});
