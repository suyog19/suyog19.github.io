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
    'BALANCE_ACTION_NEEDED', 'CLOSED_NON_PAYMENT', 'COHORT_CANCELLED',
    'COHORT_POSTPONED', 'BALANCE_OVERDUE_IN_GRACE', 'BALANCE_EXTENDED',
    'BALANCE_DUE', 'BALANCE_CONFIRMING', 'ACTIVATION_PENDING', 'ACTIVE',
  ]);
  const GATE2_ACTION_CODES = new Set([
    'DEPOSIT_DUE', 'PAYMENT_CONFIRMING', 'RESERVED', 'PAYMENT_ACTION_NEEDED',
    'CANCELLATION_REQUESTED', 'REFUND_PROCESSING', 'REFUNDED',
  ]);
  const GATE3_ACTION_CODES = new Set([
    'BALANCE_ACTION_NEEDED', 'CLOSED_NON_PAYMENT', 'COHORT_CANCELLED',
    'COHORT_POSTPONED', 'BALANCE_OVERDUE_IN_GRACE', 'BALANCE_EXTENDED',
    'BALANCE_DUE', 'BALANCE_CONFIRMING', 'ACTIVATION_PENDING', 'ACTIVE',
  ]);
  const STATUS_PRESENTATIONS = Object.freeze({
    APPLY: ['Choose a course to begin', 'You do not have a current application. Compare the available courses and apply when you are ready.', 'View courses'],
    COMPLETE_PROFILE: ['Complete your learner details', 'Add the learner details required before your application can be completed.', 'Complete your application'],
    APPLICATION_RECEIVED: ['Application received', 'Your application is ready for review. We will email you when a decision or meaningful update is recorded.', null],
    UNDER_REVIEW: ['Application under review', 'We are reviewing your application. We will email you when a decision is recorded.', null],
    WAITLISTED: ['You are on the waitlist', 'A seat is not confirmed. We will contact you if availability changes.', null],
    RECOMMENDED: ['Another course may be a better fit', 'Review the recommended course before deciding what to do next.', 'View recommended course'],
    DECLINED: ['Application not accepted for this cohort', 'This application will not progress for the current cohort. You can review other courses when you are ready.', null],
    WITHDRAWN: ['Application withdrawn', 'This application is no longer active. You can compare courses when you are ready to apply again.', 'View courses'],
    OFFERED: ['Your application has been accepted', 'Your place is not reserved yet. Payment instructions will appear when the offer is ready.', null],
    ACCEPTED: ['Your application has been accepted', 'Your place is not reserved yet. Review the current offer and its next step.', null],
    DEPOSIT_DUE: ['Deposit due', 'Review the authoritative deposit amount, deadline and terms before opening secure payment.', 'Pay the deposit'],
    PAYMENT_CONFIRMING: ['We are confirming your deposit', 'Please do not pay again. We will update this page when confirmation is complete.', 'Check payment confirmation'],
    RESERVED: ['Your seat is reserved', 'Your deposit is confirmed. We will update you when the cohort decision is recorded.', null],
    PAYMENT_ACTION_NEEDED: ['A payment needs organiser review', 'A payment may have been received, but it has not been applied automatically. Please do not pay again.', 'Contact support'],
    CANCELLATION_REQUESTED: ['Your request is under review', 'We will email you when the organiser records a decision or meaningful update.', 'Check your request'],
    REFUND_PROCESSING: ['Refund being processed', 'The request outcome is recorded and the refund is now being processed. No further action is required right now.', 'Check refund status'],
    REFUNDED: ['Refund complete', 'The refund is recorded as complete. Confirmation details remain available in your request.', null],
    BALANCE_DUE: ['Your cohort is confirmed', 'The remaining fee is now due. Review the amount and current payment deadline.', 'Review the remaining fee'],
    BALANCE_OVERDUE_IN_GRACE: ['Remaining fee overdue', 'Your seat is still reserved during the current grace period. Review the current payment deadline.', 'Review the remaining fee'],
    BALANCE_EXTENDED: ['Payment deadline extended', 'An approved extension is active. Review the new deadline and remaining fee.', 'Review the remaining fee'],
    BALANCE_CONFIRMING: ['We are confirming your remaining-fee payment', 'Please do not pay again. We will update this page when confirmation is complete.', 'Check payment confirmation'],
    ACTIVATION_PENDING: ['Payment complete — activating your enrolment', 'No further payment is required. We are updating your enrolment status.', null],
    ACTIVE: ['Your enrolment is active', 'Your payment and enrolment are complete. We will email you when joining details and the course area are available.', null],
    CLOSED_NON_PAYMENT: ['Your reserved place has been released', 'The payment period ended. A normal payment can no longer reactivate this enrolment automatically.', null],
    COHORT_POSTPONED: ['Your cohort has been postponed', 'We will show the revised schedule or next decision update when it is available.', null],
    COHORT_CANCELLED: ['This cohort has been cancelled', 'The cohort will not proceed. Any request or refund status is shown separately.', null],
    BALANCE_ACTION_NEEDED: ['A payment needs organiser review', 'Money may have been received, but your enrolment is not automatically active. Please do not pay again.', 'Contact support'],
  });

  function statusPresentation(code) {
    const value = STATUS_PRESENTATIONS[code];
    return value ? { heading: value[0], explanation: value[1], actionLabel: value[2] } : {
      heading: 'View your current learning status',
      explanation: 'The latest authorised status is shown below. Refresh or contact support if you cannot identify the next step.',
      actionLabel: null,
    };
  }

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

  function gate3Href(application) {
    const gate = application && application.gate3;
    const id = application && application.offer && application.offer.enrolmentId;
    const code = gate && gate.action && gate.action.code;
    if (!gate || !/^[A-Za-z0-9_-]{1,128}$/.test(id || '')) return null;
    if (code === 'PAY_BALANCE') {
      return '/my-learning/balance/?enrolmentId=' + encodeURIComponent(id);
    }
    if (code === 'CONTACT_SUPPORT') return '/contact/';
    return null;
  }

  function gate3StatusLabel(kind, value) {
    const labels = {
      decision: { PENDING: 'Decision pending', CONFIRMED: 'Confirmed', POSTPONED: 'Postponed', CANCELLED: 'Cancelled' },
      balance: { NOT_OPEN: 'Not open', DUE: 'Remaining fee due', CONFIRMING: 'Payment confirmation in progress', OVERDUE_IN_GRACE: 'Overdue within grace', EXTENDED: 'Deadline extended', SATISFIED: 'Remaining fee completed', CLOSED_NON_PAYMENT: 'Closed for non-payment', ACTION_NEEDED: 'Action needed' },
      activation: { NOT_ELIGIBLE: 'Not yet eligible', ELIGIBLE: 'Activation pending', ACTIVE: 'Active', ACTION_NEEDED: 'Action needed' },
      joining: { NOT_ELIGIBLE: 'Not yet available', ELIGIBLE: 'Available without course-resource links' },
      communication: { PENDING: 'Sending', SENT: 'Sent', FAILED: 'Action needed', NOT_APPLICABLE: 'Not applicable' },
      disposition: { ACTION_NEEDED: 'Organiser review required' },
    };
    return labels[kind] && labels[kind][value] || 'Not available';
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
  function isGate2ActionCode(value) { return typeof value === 'string' && GATE2_ACTION_CODES.has(value); }
  function isGate3ActionCode(value) { return typeof value === 'string' && GATE3_ACTION_CODES.has(value); }

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
    gate3Href,
    gate3StatusLabel,
    hasActionableOffer,
    isV1ActionCode,
    isGate2ActionCode,
    isGate3ActionCode,
    safeCourseHref,
    safeActionHref,
    safeSupportHref,
    statusPresentation,
  };
}());
