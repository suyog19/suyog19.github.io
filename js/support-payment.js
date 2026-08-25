(function () {
  'use strict';

  const DESTINATIONS = Object.freeze({
    development: 'https://pages.razorpay.com/pl_TTdbTEtwC4vyYF/view',
    production: 'https://pages.razorpay.com/pl_TTcwSP5BE6K7WC/view',
  });
  const DEVELOPMENT_HOSTS = new Set(['dev.suyogjoshi.com', 'localhost', '127.0.0.1']);
  const PRODUCTION_HOSTS = new Set(['suyogjoshi.com', 'www.suyogjoshi.com']);
  const PAYMENT_PAGE_PATH = /^\/pl_[A-Za-z0-9]+\/view\/?$/;
  const PRESET_AMOUNTS = Object.freeze({ '250': '₹250', '500': '₹500', '1000': '₹1,000' });

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

  function destinationForAmount(destination, amount) {
    if (!isExactPaymentPage(destination)) return null;
    if (typeof amount !== 'string') return null;
    if (amount === 'custom') return destination;
    if (!Object.prototype.hasOwnProperty.call(PRESET_AMOUNTS, amount)) return null;
    const url = new URL(destination);
    url.searchParams.set('support_amount', amount);
    return url.toString();
  }

  function activate(documentRoot, hostname, destinations) {
    const action = documentRoot.querySelector('[data-support-razorpay]');
    const status = documentRoot.querySelector('#support-once-status');
    const amountGroup = documentRoot.querySelector('[data-support-amounts]');
    if (!action || !status || !amountGroup) return false;

    const destination = resolveDestination(hostname, destinations);
    if (!destination) return false;

    action.setAttribute('rel', 'external');
    amountGroup.removeAttribute('disabled');
    amountGroup.addEventListener('change', function (event) {
      const amount = event && event.target ? event.target.value : '';
      const amountDestination = destinationForAmount(destination, amount);
      if (!amountDestination) return;
      action.setAttribute('href', amountDestination);
      action.removeAttribute('aria-disabled');
      action.textContent = amount === 'custom' ? 'Choose a custom amount on Razorpay' : 'Support with ' + PRESET_AMOUNTS[amount];
      status.textContent = amount === 'custom' ? 'You’ll enter the amount on Razorpay.' : PRESET_AMOUNTS[amount] + ' will be prefilled on Razorpay.';
    });
    status.textContent = 'Choose an amount. Razorpay confirms payment; use Back to cancel or recover.';
    return true;
  }

  function trackSponsorIntent(documentRoot, analytics) {
    const action = documentRoot.querySelector('[data-support-github-sponsors]');
    if (!action || typeof action.addEventListener !== 'function') return false;

    action.addEventListener('click', function () {
      if (typeof analytics !== 'function') return;
      analytics('event', 'support_sponsorship_intent', {
        provider: 'github_sponsors',
        cadence: 'recurring',
        source_page: 'support',
      });
    });
    return true;
  }

  const api = Object.freeze({ activate, destinationForAmount, isExactPaymentPage, resolveDestination, stageForHost, trackSponsorIntent });
  window.sjSupportPayment = api;
  activate(document, window.location.hostname, DESTINATIONS);
  trackSponsorIntent(document, window.gtag);
})();
