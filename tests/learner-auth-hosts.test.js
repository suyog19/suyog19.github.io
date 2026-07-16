const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function auth(hostname, fetchImpl = async () => { throw new Error('unexpected fetch'); }) {
  const storage = new Map();
  const context = {
    Error, Set, URL, URLSearchParams, fetch: fetchImpl,
    sessionStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    window: { location: { hostname, origin: 'https://' + hostname } },
  };
  vm.runInNewContext(fs.readFileSync('js/learner-auth.js', 'utf8'), context);
  return context.window.sjLearnerAuth;
}

test('learner auth routes only exact development and production hosts', () => {
  assert.equal(auth('dev.suyogjoshi.com').apiBaseUrl(), 'https://api-dev.suyogjoshi.com');
  assert.equal(auth('preview.suyogjoshi-dev.pages.dev').apiBaseUrl(), 'https://api-dev.suyogjoshi.com');
  assert.equal(auth('suyogjoshi.com').apiBaseUrl(), 'https://api.suyogjoshi.com');
  assert.equal(auth('www.suyogjoshi.com').apiBaseUrl(), 'https://api.suyogjoshi.com');
  assert.equal(auth('untrusted.example').apiBaseUrl(), '');
});

test('unknown learner host fails before fetch', async () => {
  let calls = 0;
  const client = auth('untrusted.example', async () => { calls += 1; });
  await assert.rejects(client.request('/me', { method: 'GET' }), /UNTRUSTED_HOST/);
  assert.equal(calls, 0);
});
