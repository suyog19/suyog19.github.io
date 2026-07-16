(function () {
  'use strict';
  const PRODUCTION = new Set(['suyogjoshi.com', 'www.suyogjoshi.com']);
  const LOCAL = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  const PRODUCTION_CONTROLS = Object.freeze({ applications: true, depositPayments: true, balancePayments: true });

  function environment(hostname) {
    if (LOCAL.has(hostname) || hostname === 'dev.suyogjoshi.com'
      || /^[a-z0-9-]+\.suyogjoshi-dev\.pages\.dev$/.test(hostname || '')) return 'development';
    if (PRODUCTION.has(hostname)) return 'production';
    return 'unknown';
  }
  function capabilityEnabled(capability, hostname) {
    const stage = environment(hostname);
    if (stage === 'development') return Object.hasOwn(PRODUCTION_CONTROLS, capability);
    return stage === 'production' && PRODUCTION_CONTROLS[capability] === true;
  }
  function apiBaseUrl(capability, hostname) {
    if (!capabilityEnabled(capability, hostname)) return '';
    return environment(hostname) === 'production' ? 'https://api.suyogjoshi.com' : 'https://api-dev.suyogjoshi.com';
  }
  function safePaymentUrl(value, capability, hostname) {
    if (!capabilityEnabled(capability, hostname)) return null;
    try {
      const url = new URL(value);
      const stage = environment(hostname);
      const allowedHost = url.hostname === 'rzp.io'
        || (stage === 'development' && url.hostname === 'pay.test.invalid');
      return url.protocol === 'https:' && allowedHost && !url.username && !url.password
        && !url.hash && !url.search && (!url.port || url.port === '443') ? url.href : null;
    } catch (_) { return null; }
  }
  window.sjTrainingRelease = { apiBaseUrl, capabilityEnabled, environment, safePaymentUrl };
}());
