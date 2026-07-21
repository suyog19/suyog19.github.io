(function () {
  'use strict';

  function dateToIso(value, endOfDay) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = endOfDay
      ? new Date(year, month, day, 23, 59, 59, 999)
      : new Date(year, month, day, 0, 0, 0, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
    return date.toISOString();
  }

  function isoToDateInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function validateCohort(values) {
    const errors = {};
    const capacity = Number(values.capacity);
    const minimumSize = Number(values.minimumSize);
    const registrationOpenIso = dateToIso(values.registrationOpensAt, false);
    const registrationCloseIso = dateToIso(values.registrationClosesAt, true);
    const tentativeStartIso = values.tentativeStartAt ? dateToIso(values.tentativeStartAt, false) : null;
    const tentativeEndIso = values.tentativeEndAt ? dateToIso(values.tentativeEndAt, true) : null;
    const registrationOpen = registrationOpenIso ? new Date(registrationOpenIso) : null;
    const registrationClose = registrationCloseIso ? new Date(registrationCloseIso) : null;
    const tentativeStart = tentativeStartIso ? new Date(tentativeStartIso) : null;
    const tentativeEnd = tentativeEndIso ? new Date(tentativeEndIso) : null;
    if (!values.courseId) errors.courseId = 'Choose a course.';
    if (!values.label || !values.label.trim() || values.label.trim().length > 120) errors.label = 'Enter a cohort label of 1 to 120 characters.';
    if (!values.timezone || !values.timezone.trim()) errors.timezone = 'Enter a timezone.';
    if (!Number.isInteger(capacity) || capacity < 1) errors.capacity = 'Capacity must be a whole number of at least 1.';
    if (!Number.isInteger(minimumSize) || minimumSize < 1) errors.minimumSize = 'Minimum size must be a whole number of at least 1.';
    if (!errors.capacity && !errors.minimumSize && minimumSize > capacity) errors.minimumSize = 'Minimum size cannot exceed capacity.';
    if (!registrationOpen) errors.registrationOpensAt = 'Enter a valid registration opening date.';
    if (!registrationClose) errors.registrationClosesAt = 'Enter a valid registration closing date.';
    if (!errors.registrationOpensAt && !errors.registrationClosesAt && registrationOpen >= registrationClose) errors.registrationClosesAt = 'Registration must close after it opens.';
    if (values.tentativeStartAt && !tentativeStart) errors.tentativeStartAt = 'Enter a valid tentative start date.';
    if (values.tentativeEndAt && !tentativeEnd) errors.tentativeEndAt = 'Enter a valid tentative end date.';
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

  function opaqueIdempotencyKey(cryptoApi, timestamp, randomValue) {
    const value = cryptoApi && typeof cryptoApi.randomUUID === 'function'
      ? cryptoApi.randomUUID()
      : String(timestamp === undefined ? Date.now() : timestamp) + '-' + String(randomValue === undefined ? Math.random() : randomValue).replace(/^0\./, '');
    return 'web-' + value;
  }

  function idempotencyHeaders(tracker, scope, payload) {
    return { 'Idempotency-Key': tracker.key(scope, payload) };
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

  async function requestWithTransportRetry(request) {
    try {
      return await request();
    } catch (error) {
      if (error.status !== undefined) throw error;
    }

    try {
      return await request();
    } catch (error) {
      if (error.status === undefined) {
        error.body = {
          message: 'Unable to reach the development API after retrying. Check your connection and try again.',
        };
      }
      throw error;
    }
  }

  window.sjAdminTraining = {
    createIdempotencyTracker,
    dateToIso,
    detailValue,
    isoToDateInput,
    idempotencyHeaders,
    nextTabIndex,
    opaqueIdempotencyKey,
    offerableCohort,
    requestStillCurrent,
    requestWithTransportRetry,
    resendAllowed,
    validateCohort,
  };
}());
