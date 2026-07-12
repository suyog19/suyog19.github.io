(function () {
  'use strict';

  const ACTION_PATHS = new Set(['/my-learning/', '/training/', '/contact/']);
  const ACKNOWLEDGEMENT_LABELS = {
    'software-signal-terms-privacy': 'Terms and privacy',
    'software-signal-recorded-delivery': 'Recorded class delivery',
  };

  function safeActionHref(value) {
    return typeof value === 'string' && ACTION_PATHS.has(value)
      ? value
      : '/my-learning/';
  }

  function booleanLabel(value, whenTrue, whenFalse) {
    if (value === true) return whenTrue;
    if (value === false) return whenFalse;
    return 'Not available';
  }

  function acknowledgementLabel(records) {
    if (!Array.isArray(records)) return 'Not available';
    if (!records.length) return 'Not recorded';
    const complete = records.every((item) => (
      item
      && typeof item.documentId === 'string'
      && Object.hasOwn(ACKNOWLEDGEMENT_LABELS, item.documentId)
      && typeof item.version === 'string'
      && /^[0-9]+\.[0-9]+\.[0-9]+$/.test(item.version)
    ));
    if (!complete) return 'Not available';
    return records.map((item) => (
      ACKNOWLEDGEMENT_LABELS[item.documentId] + ' version ' + item.version
    )).join(', ');
  }

  window.sjLearnerSummary = {
    acknowledgementLabel,
    booleanLabel,
    safeActionHref,
  };
}());
