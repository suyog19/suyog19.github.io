(function () {
  'use strict';

  const DESTINATIONS = Object.freeze({
    development: '',
    production: '',
  });
  const DEVELOPMENT_HOSTS = new Set(['dev.suyogjoshi.com', 'localhost', '127.0.0.1']);
  const PRODUCTION_HOSTS = new Set(['suyogjoshi.com', 'www.suyogjoshi.com']);
  const PAYMENT_PAGE_PATH = /^\/pl_[A-Za-z0-9]+\/view\/?$/;

  function stageForHost(hostname) {
    if (DEVELOPMENT_HOSTS.has(hostname)) return 'development';
    if (PRODUCTION_HOSTS.has(hostname)) return 'production';
    return null;
  }

  function isExactPaymentPage(value) {
    if (typeof value !== 'string' || !value) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' &&
        url.hostname === 'pages.razorpay.com' &&
        !url.username &&
        !url.password &&
        !url.port &&
        !url.search &&
        !url.hash &&
        PAYMENT_PAGE_PATH.test(url.pathname);
    } catch (_error) {
      return false;
    }
  }

  function resolveDestination(hostname, destinations) {
    const stage = stageForHost(hostname);
    const destination = stage && destinations ? destinations[stage] : '';
    return isExactPaymentPage(destination) ? destination : null;
  }

  function activate(documentRoot, hostname, destinations) {
    const action = documentRoot.querySelector('[data-support-razorpay]');
    const status = documentRoot.querySelector('#support-once-status');
    if (!action || !status) return false;

    const destination = resolveDestination(hostname, destinations);
    if (!destination) return false;

    action.setAttribute('href', destination);
    action.setAttribute('rel', 'external');
    action.removeAttribute('aria-disabled');
    status.textContent = 'Opens Razorpay in this tab. Choose your amount there. If Razorpay does not confirm completion, return with your browser Back button to retry.';
    return true;
  }

  const api = Object.freeze({ activate, isExactPaymentPage, resolveDestination, stageForHost });
  window.sjSupportPayment = api;
  activate(document, window.location.hostname, DESTINATIONS);
})();
