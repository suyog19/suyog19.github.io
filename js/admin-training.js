(function () {
  'use strict';

  function validateCohort(values) {
    const errors = {};
    const capacity = Number(values.capacity);
    const minimumSize = Number(values.minimumSize);
    const registrationOpen = new Date(values.registrationOpensAt);
    const registrationClose = new Date(values.registrationClosesAt);
    const tentativeStart = values.tentativeStartAt ? new Date(values.tentativeStartAt) : null;
    const tentativeEnd = values.tentativeEndAt ? new Date(values.tentativeEndAt) : null;
    if (!values.courseId) errors.courseId = 'Choose a course.';
    if (!values.label || !values.label.trim() || values.label.trim().length > 120) errors.label = 'Enter a cohort label of 1 to 120 characters.';
    if (!values.timezone || !values.timezone.trim()) errors.timezone = 'Enter a timezone.';
    if (!Number.isInteger(capacity) || capacity < 1) errors.capacity = 'Capacity must be a whole number of at least 1.';
    if (!Number.isInteger(minimumSize) || minimumSize < 1) errors.minimumSize = 'Minimum size must be a whole number of at least 1.';
    if (!errors.capacity && !errors.minimumSize && minimumSize > capacity) errors.minimumSize = 'Minimum size cannot exceed capacity.';
    if (Number.isNaN(registrationOpen.getTime())) errors.registrationOpensAt = 'Enter a valid registration opening time.';
    if (Number.isNaN(registrationClose.getTime())) errors.registrationClosesAt = 'Enter a valid registration closing time.';
    if (!errors.registrationOpensAt && !errors.registrationClosesAt && registrationOpen >= registrationClose) errors.registrationClosesAt = 'Registration must close after it opens.';
    if (tentativeStart && Number.isNaN(tentativeStart.getTime())) errors.tentativeStartAt = 'Enter a valid tentative start.';
    if (tentativeEnd && Number.isNaN(tentativeEnd.getTime())) errors.tentativeEndAt = 'Enter a valid tentative end.';
    if (tentativeStart && tentativeEnd && !errors.tentativeStartAt && !errors.tentativeEndAt && tentativeStart >= tentativeEnd) errors.tentativeEndAt = 'Tentative end must be after tentative start.';
    return errors;
  }

  function createIdempotencyTracker(generate) {
    const entries = new Map();
    return {
      key(scope, payload) {
        const fingerprint = JSON.stringify(payload);
        const existing = entries.get(scope);
        if (existing && existing.fingerprint === fingerprint) return existing.key;
        const key = generate(scope);
        entries.set(scope, { fingerprint, key });
        return key;
      },
      clear(scope) { entries.delete(scope); },
      clearAll() { entries.clear(); },
    };
  }

  function nextTabIndex(current, key, count) {
    if (key === 'Home') return 0;
    if (key === 'End') return count - 1;
    if (key === 'ArrowRight') return (current + 1) % count;
    if (key === 'ArrowLeft') return (current - 1 + count) % count;
    return current;
  }

  function offerableCohort(cohort, courseId) {
    return Boolean(
      cohort
      && cohort.courseId === courseId
      && cohort.lifecycle === 'OPEN'
      && cohort.isFull === false
      && Number(cohort.capacityRemaining) > 0
    );
  }

  function resendAllowed(communication) {
    return Boolean(
      communication
      && communication.canResend === true
      && typeof (communication.sk || communication.logicalKey) === 'string'
      && !String(communication.sk || communication.logicalKey).includes(':RESEND:')
    );
  }

  function detailValue(value) {
    if (value === null || value === undefined || value === '') return 'Not available';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  function requestStillCurrent(current, expected) {
    return current.applicationId === expected.applicationId
      && current.sessionToken === expected.sessionToken
      && current.sequence === expected.sequence;
  }

  window.sjAdminTraining = {
    createIdempotencyTracker,
    detailValue,
    nextTabIndex,
    offerableCohort,
    requestStillCurrent,
    resendAllowed,
    validateCohort,
  };
}());
