(function () {
  'use strict';

  const OFFERS = Object.freeze({
    advisory: 'engineering_advisory_session',
    repository_review: 'repository_ai_readiness_review',
    help_choose: 'help_choose',
  });

  function emit(analytics, eventName, properties) {
    if (typeof analytics !== 'function') return false;
    analytics('event', eventName, Object.assign({}, properties));
    return true;
  }

  function initialise(documentRoot, pageLocation, analyticsProvider) {
    if (!documentRoot || !pageLocation || pageLocation.pathname !== '/consulting/') return false;
    const provider = typeof analyticsProvider === 'function' ? analyticsProvider : function () { return null; };
    emit(provider(), 'consulting_page_view', { page_type: 'consulting' });
    documentRoot.querySelectorAll('[data-consulting-offer]').forEach(function (action) {
      const offer = OFFERS[action.getAttribute('data-consulting-offer')];
      if (!offer) return;
      action.addEventListener('click', function () {
        emit(provider(), 'consulting_offer_cta_selected', {
          offer: offer,
          source_page: 'consulting',
        });
      });
    });
    return true;
  }

  window.sjConsultingAnalytics = Object.freeze({ emit, initialise });
  initialise(document, window.location, function () { return window.gtag; });
}());
