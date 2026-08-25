(function () {
  'use strict';

  const EVENT_PROPERTIES = Object.freeze({
    support_page_view: Object.freeze({ page_type: 'support' }),
    support_one_time_intent: Object.freeze({
      provider: 'razorpay',
      cadence: 'one_time',
      source_page: 'support',
    }),
    support_sponsorship_intent: Object.freeze({
      provider: 'github_sponsors',
      cadence: 'recurring',
      source_page: 'support',
    }),
  });

  function emit(analytics, eventName) {
    if (typeof analytics !== 'function' || !Object.prototype.hasOwnProperty.call(EVENT_PROPERTIES, eventName)) return false;
    analytics('event', eventName, EVENT_PROPERTIES[eventName]);
    return true;
  }

  function bindIntent(documentRoot, selector, eventName, analyticsProvider, isEnabled) {
    const action = documentRoot.querySelector(selector);
    if (!action || typeof action.addEventListener !== 'function') return false;
    action.addEventListener('click', function () {
      if (typeof isEnabled === 'function' && !isEnabled(action)) return;
      const analytics = typeof analyticsProvider === 'function' ? analyticsProvider() : null;
      emit(analytics, eventName);
    });
    return true;
  }

  function initialise(documentRoot, pageLocation, analyticsProvider) {
    if (!documentRoot || !pageLocation || pageLocation.pathname !== '/support/') return false;
    const analytics = typeof analyticsProvider === 'function' ? analyticsProvider() : null;
    emit(analytics, 'support_page_view');
    bindIntent(documentRoot, '[data-support-razorpay]', 'support_one_time_intent', analyticsProvider, function (action) {
      return action.hasAttribute('href') && action.getAttribute('aria-disabled') !== 'true';
    });
    bindIntent(documentRoot, '[data-support-github-sponsors]', 'support_sponsorship_intent', analyticsProvider);
    return true;
  }

  window.sjSupportAnalytics = Object.freeze({ bindIntent, emit, initialise });
  initialise(document, window.location, function () { return window.gtag; });
}());
