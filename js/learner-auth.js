(function () {
  'use strict';

  const TOKEN_KEY = 'sj_learner_access_token';
  const USER_KEY = 'sj_learner_user';
  const SAFE_DESTINATIONS = ['/my-learning/', '/learn/', '/courses/', '/apply/'];

  function apiBaseUrl() {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === 'dev.suyogjoshi.com'
      ? 'https://api-dev.suyogjoshi.com'
      : 'https://api.suyogjoshi.com';
  }

  function safeDestination(value) {
    if (!value) return '/my-learning/';
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin || url.username || url.password) return '/my-learning/';
      const allowed = SAFE_DESTINATIONS.some((prefix) => url.pathname === prefix || url.pathname.startsWith(prefix));
      return allowed ? url.pathname + url.search + url.hash : '/my-learning/';
    } catch (_) {
      return '/my-learning/';
    }
  }

  function readUser() {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch (_) { return null; }
  }

  function token() { return sessionStorage.getItem(TOKEN_KEY) || ''; }

  function saveSession(accessToken, user) {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user || {}));
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  async function request(path, options) {
    const headers = { ...(options && options.headers ? options.headers : {}) };
    if (options && options.body) headers['Content-Type'] = 'application/json';
    if (token()) headers.Authorization = 'Bearer ' + token();
    let response;
    try {
      response = await fetch(apiBaseUrl() + path, { ...options, headers, cache: 'no-store' });
    } catch (_) {
      const error = new Error('NETWORK_ERROR');
      error.status = 0;
      throw error;
    }
    let body = {};
    try { body = await response.json(); } catch (_) { body = {}; }
    if (!response.ok) {
      const error = new Error(body.message || 'REQUEST_FAILED');
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }

  async function restore() {
    if (!token()) return null;
    try {
      const data = await request('/me', { method: 'GET' });
      saveSession(token(), data.user);
      return data.user;
    } catch (error) {
      if (error.status === 401 || error.status === 403) clearSession();
      throw error;
    }
  }

  async function logout() {
    const accessToken = token();
    clearSession();
    if (!accessToken) return;
    try {
      await fetch(apiBaseUrl() + '/auth/logout', {
        method: 'POST', cache: 'no-store', headers: { Authorization: 'Bearer ' + accessToken },
      });
    } catch (_) { /* The local session is already removed. */ }
  }

  window.sjLearnerAuth = { clearSession, logout, readUser, request, restore, safeDestination, saveSession, token };
}());
