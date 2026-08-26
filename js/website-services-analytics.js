(function () {
  'use strict';

  const SERVICES = Object.freeze({
    landing_campaign: 'landing_campaign_page',
    starter_presence: 'starter_presence',
    business_website: 'business_website',
    website_redesign: 'website_redesign',
    website_care: 'website_care',
    help_choose: 'help_choose',
  });

  function emit(analytics, eventName, properties) {
    if (typeof analytics !== 'function') return false;
    analytics('event', eventName, Object.assign({}, properties));
    return true;
  }

  function initialise(documentRoot, pageLocation, analyticsProvider) {
    if (!documentRoot || !pageLocation || pageLocation.pathname !== '/website-services/') return false;
    const provider = typeof analyticsProvider === 'function' ? analyticsProvider : function () { return null; };
    emit(provider(), 'website_services_page_view', { page_type: 'website_services' });
    documentRoot.querySelectorAll('[data-website-service]').forEach(function (action) {
      const service = SERVICES[action.getAttribute('data-website-service')];
      if (!service) return;
      action.addEventListener('click', function () {
        emit(provider(), 'website_services_cta_selected', {
          service: service,
          source_page: 'website_services',
        });
      });
    });
    return true;
  }

  window.sjWebsiteServicesAnalytics = Object.freeze({ emit, initialise });
  initialise(document, window.location, function () { return window.gtag; });
}());
