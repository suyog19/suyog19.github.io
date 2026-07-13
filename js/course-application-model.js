(function () {
  'use strict';
  const COURSES = {
    crs_python_foundations: { slug: 'python-foundations-ai-data', title: 'Python Foundations for AI and Data' },
    crs_applied_python: { slug: 'applied-python-ai-ml', title: 'Applied Python for AI and Machine Learning' },
  };
  const ACKNOWLEDGEMENTS = [
    { documentId: 'software-signal-terms-privacy', version: '1.0.0' },
    { documentId: 'software-signal-recorded-delivery', version: '1.0.0' },
  ];

  function course(value) { return Object.hasOwn(COURSES, value) ? { courseId: value, ...COURSES[value] } : null; }
  function bounded(value, maximum) {
    return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= maximum;
  }
  function validate(model, needsProfile) {
    const fields = {};
    if (!course(model.courseId)) fields.courseId = 'Choose an available course.';
    for (const key of ['programmingExperience', 'learningGoal', 'weeklyAvailability']) {
      if (!bounded(model.answers[key], 1000)) fields[key] = 'Enter between 1 and 1000 characters.';
    }
    if (needsProfile) {
      if (!bounded(model.fullName, 120)) fields.fullName = 'Enter your full name.';
      if (typeof model.timezone !== 'string' || !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(model.timezone)) fields.timezone = 'Enter an IANA timezone.';
    }
    if (model.adultEligibilityConfirmed !== true) fields.adultEligibilityConfirmed = 'Adult confirmation is required.';
    if (!model.termsAccepted) fields.termsAccepted = 'Terms and privacy acknowledgement is required.';
    if (!model.recordingAccepted) fields.recordingAccepted = 'Recorded-delivery acknowledgement is required.';
    return fields;
  }
  function payload(model) {
    return { courseId: model.courseId, answers: {
      programmingExperience: model.answers.programmingExperience.trim(),
      learningGoal: model.answers.learningGoal.trim(),
      weeklyAvailability: model.answers.weeklyAvailability.trim(),
    }, acknowledgements: ACKNOWLEDGEMENTS.map((item) => ({ ...item })) };
  }
  function replacementPayload(model, expectedVersion) { return { ...payload(model), expectedVersion }; }
  function fingerprint(model, replacement) { return JSON.stringify(replacement ? replacementPayload(model, replacement.expectedVersion) : payload(model)); }
  function idempotencyKey() {
    const random = new Uint32Array(4);
    crypto.getRandomValues(random);
    return 'web-' + Array.from(random, (value) => value.toString(16).padStart(8, '0')).join('');
  }
  function applicationsEnabled(hostname) {
    return hostname === 'dev.suyogjoshi.com'
      || hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname === '[::1]'
      || /^[a-z0-9-]+\.suyogjoshi-dev\.pages\.dev$/.test(hostname || '');
  }
  function errorMessage(error) {
    const code = error && error.body && error.body.error;
    if (error && (error.status === 401 || error.status === 403)) return { code: 'SESSION_EXPIRED', message: 'Your secure session expired. Verify your email again to continue.' };
    if (code === 'DUPLICATE_ACTIVE_APPLICATION') return { code: 'DUPLICATE', message: 'You already have a current application for this course. View it in My Learning.' };
    if (code === 'ACKNOWLEDGEMENT_VERSION_NOT_CURRENT') return { code: 'ACKNOWLEDGEMENT_REQUIRED', message: 'Confirm the current terms and recorded-delivery notices, then retry.' };
    if (code === 'APPLICATION_REPLACEMENT_CONFLICT') return { code: 'REPLACEMENT_CONFLICT', message: 'This application can no longer be corrected because its status changed. View My Learning or contact support.' };
    if (code === 'PROFILE_REQUIRED') return { code, message: 'Complete your learner profile before applying.' };
    if (code === 'REGISTRATION_CLOSED') return { code, message: 'Applications are currently closed for this course.' };
    if (code === 'COHORT_FULL') return { code, message: 'The currently available cohort is full.' };
    if (code === 'WAITLIST_ONLY') return { code, message: 'This course is currently accepting waitlist applications only.' };
    if (code === 'COURSE_UNAVAILABLE' || (error && error.status === 404)) return { code: 'COURSE_UNAVAILABLE', message: 'This course is not currently available for applications.' };
    if (code === 'VALIDATION_FAILED') return { code, message: 'Review the highlighted information and try again.' };
    if (!error || !error.status || error.status >= 500) return { code: 'UNCERTAIN', message: 'The result could not be confirmed. Retry safely with the same information; this will not create a duplicate application.' };
    return { code: code || 'REQUEST_FAILED', message: 'The application could not be submitted. Review the information or contact support.' };
  }
  window.sjCourseApplication = { ACKNOWLEDGEMENTS, applicationsEnabled, course, errorMessage, fingerprint, idempotencyKey, payload, replacementPayload, validate };
}());
