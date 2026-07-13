(function () {
  'use strict';

  const ACTION_PATHS = new Set(['/my-learning/', '/training/', '/contact/']);
  const SUPPORT_PATHS = new Set([
    '/contact/',
    '/training/policies/',
    '/training/policies/#support-and-grievance-process',
  ]);
  const ACKNOWLEDGEMENT_LABELS = {
    'software-signal-terms-privacy': 'Terms and privacy',
    'software-signal-recorded-delivery': 'Recorded class delivery',
  };
  const V1_ACTION_CODES = new Set([
    'APPLY', 'COMPLETE_PROFILE', 'APPLICATION_RECEIVED', 'UNDER_REVIEW', 'OFFERED',
    'ACCEPTED', 'WAITLISTED', 'RECOMMENDED', 'DECLINED', 'WITHDRAWN',
    'DEPOSIT_DUE', 'PAYMENT_CONFIRMING', 'RESERVED', 'PAYMENT_ACTION_NEEDED',
    'CANCELLATION_REQUESTED', 'REFUND_PROCESSING', 'REFUNDED',
  ]);

  function safeActionHref(value) {
    return typeof value === 'string' && ACTION_PATHS.has(value)
      ? value
      : '/my-learning/';
  }

  function safeSupportHref(value, fallback) {
    return typeof value === 'string' && SUPPORT_PATHS.has(value) ? value : fallback;
  }

  function safeCourseHref(value) {
    return typeof value === 'string' && /^\/training\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(value)
      ? value
      : null;
  }

  function correctionHref(application) {
    if (!application || application.canReplace !== true) return null;
    const applicationId = application.applicationId;
    const courseId = application.course && application.course.courseId;
    if (!/^app_[A-Za-z0-9]{1,120}$/.test(applicationId || '') || !/^crs_[A-Za-z0-9_]{1,120}$/.test(courseId || '')) return null;
    return '/apply/?courseId=' + encodeURIComponent(courseId) + '&applicationId=' + encodeURIComponent(applicationId);
  }

  function hasActionableOffer(offer) {
    return Boolean(offer && offer.status === 'OFFERED');
  }

  function gate2Href(application) {
    const gate = application && application.gate2;
    const id = application && application.offer && application.offer.enrolmentId;
    const code = gate && gate.action && gate.action.code;
    if (!gate || !/^[A-Za-z0-9_-]{1,128}$/.test(id || '')) return null;
    if (code === 'PAYMENT_ACTION_NEEDED') return '/contact/';
    if (gate.refund || gate.learnerChange || (gate.enrolment && ['CANCELLED', 'TRANSFERRED'].includes(gate.enrolment.status))) {
      return '/my-learning/change/?enrolmentId=' + encodeURIComponent(id);
    }
    if (['DEPOSIT_DUE', 'PAYMENT_CONFIRMING', 'RESERVED'].includes(code)) {
      return '/my-learning/payment/?enrolmentId=' + encodeURIComponent(id);
    }
    if (['CANCELLATION_REQUESTED', 'REFUND_PROCESSING', 'REFUNDED'].includes(code)) {
      return '/my-learning/change/?enrolmentId=' + encodeURIComponent(id);
    }
    return null;
  }

  function gate2ChangeHref(application) {
    const gate = application && application.gate2;
    const id = application && application.offer && application.offer.enrolmentId;
    const status = gate && gate.enrolment && gate.enrolment.status;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id || '') || !['OFFERED', 'RESERVED'].includes(status)) return null;
    if (gate.learnerChange || gate.refund) return null;
    return '/my-learning/change/?enrolmentId=' + encodeURIComponent(id);
  }

  function gate2StatusLabel(kind, value) {
    const labels = {
      enrolment: { OFFERED: 'Offer available', RESERVED: 'Seat reserved', CANCELLED: 'Place cancelled', TRANSFERRED: 'Place transferred' },
      request: { REQUESTED: 'Submitted', DECIDED: 'Decision recorded' },
      decision: { APPROVED: 'Approved', REJECTED: 'Rejected', TRANSFER_OFFERED: 'Transfer offered', ACTION_NEEDED: 'Action needed' },
      refund: { PENDING_SUBMISSION: 'Refund processing', SUBMITTING: 'Refund processing', PROCESSING: 'Refund processing', COMPLETED: 'Completed', FAILED_FINAL: 'Action needed', ACTION_NEEDED: 'Action needed' },
    };
    return labels[kind] && labels[kind][value] || 'Action needed';
  }

  function isV1ActionCode(value) { return typeof value === 'string' && V1_ACTION_CODES.has(value); }

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
    correctionHref,
    gate2ChangeHref,
    gate2Href,
    gate2StatusLabel,
    hasActionableOffer,
    isV1ActionCode,
    safeCourseHref,
    safeActionHref,
    safeSupportHref,
  };
}());
