(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const model = window.sjCourseApplication;
  const courseId = new URLSearchParams(window.location.search).get('courseId') || '';
  const sourceApplicationId = new URLSearchParams(window.location.search).get('applicationId') || '';
  const correctionMode = sourceApplicationId !== '';
  const selectedCourse = model.course(courseId);
  const draftKey = 'sj_gate1_application_draft_' + courseId;
  const idempotencyStateKey = 'sj_gate1_application_idempotency_' + courseId;
  const profileIdempotencyStateKey = 'sj_gate1_profile_idempotency';
  const form = document.getElementById('application-form');
  const status = document.getElementById('application-status');
  const recovery = document.getElementById('application-recovery');
  const retry = document.getElementById('application-retry');
  const submit = document.getElementById('application-submit');
  const result = document.getElementById('application-result');
  const reference = document.getElementById('application-reference');
  const resultTitle = document.getElementById('application-result-title');
  const resultDetail = document.getElementById('application-result-detail');
  const courseSummary = document.getElementById('application-course-summary');
  const practicalSummary = document.getElementById('application-practical-summary');
  const profileFields = document.getElementById('profile-fields');
  const userLabel = document.getElementById('application-user-label');
  const logout = document.getElementById('application-logout');
  const cancel = document.getElementById('application-cancel');
  if (practicalSummary) practicalSummary.hidden = courseId !== 'crs_python_foundations';
  let needsProfile = false;
  let pending = false;
  let retryAction = initialise;
  let missingAcknowledgements = [];
  let sourceApplication = null;

  function destination() {
    const source = correctionMode ? '&applicationId=' + encodeURIComponent(sourceApplicationId) : '';
    return '/apply/?courseId=' + encodeURIComponent(courseId) + source;
  }
  function loginUrl() { return '/learn/?continue=' + encodeURIComponent(destination()); }
  function message(value, tone) {
    status.textContent = value || '';
    status.className = 'learner-status' + (tone ? ' is-' + tone : '');
    status.hidden = !value;
  }
  function setPending(value) {
    pending = value;
    submit.disabled = value;
    retry.disabled = value;
  }
  function readDraft() {
    try { return JSON.parse(sessionStorage.getItem(draftKey) || 'null'); } catch (_) { return null; }
  }
  function formModel() {
    return {
      courseId,
      fullName: document.getElementById('application-full-name').value,
      timezone: document.getElementById('application-timezone').value,
      learnerNote: document.getElementById('application-note').value,
      requiredConfirmation: document.getElementById('application-confirmation').checked,
    };
  }
  function saveDraft(value) {
    sessionStorage.setItem(draftKey, JSON.stringify(value || formModel()));
  }
  function timezoneSupported(value) {
    return typeof value === 'string' && Array.from(document.getElementById('application-timezone').options).some((option) => option.value === value);
  }
  function ensureTimezoneOption(value) {
    const timezone = document.getElementById('application-timezone');
    if (!value || timezoneSupported(value)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value.replaceAll('_', ' ');
    timezone.appendChild(option);
  }
  function detectedTimezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { return ''; }
  }
  function restoreDraft() {
    const draft = readDraft();
    if (!draft || draft.courseId !== courseId) return false;
    if (typeof draft.fullName === 'string') document.getElementById('application-full-name').value = draft.fullName;
    if (typeof draft.timezone === 'string' && draft.timezone) {
      ensureTimezoneOption(draft.timezone);
      document.getElementById('application-timezone').value = draft.timezone;
    }
    const legacyNote = draft.answers && draft.answers.learningGoal;
    if (typeof draft.learnerNote === 'string') document.getElementById('application-note').value = draft.learnerNote;
    else if (legacyNote && legacyNote !== 'N/A') document.getElementById('application-note').value = legacyNote;
    document.getElementById('application-confirmation').checked = draft.requiredConfirmation === true
      || (draft.adultEligibilityConfirmed === true && draft.termsAccepted === true && draft.recordingAccepted === true);
    return true;
  }
  function initialiseTimezone(hasDraft) {
    if (hasDraft) return;
    const detected = detectedTimezone();
    document.getElementById('application-timezone').value = timezoneSupported(detected) ? detected : 'Asia/Kolkata';
  }
  function idempotencyKey(value) {
    const fingerprint = model.fingerprint(value, sourceApplication);
    let state = null;
    try { state = JSON.parse(sessionStorage.getItem(idempotencyStateKey) || 'null'); } catch (_) { state = null; }
    if (!state || state.fingerprint !== fingerprint || typeof state.key !== 'string') {
      state = { fingerprint, key: model.idempotencyKey() };
      sessionStorage.setItem(idempotencyStateKey, JSON.stringify(state));
    }
    return state.key;
  }
  function clearFieldErrors() {
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach((error) => { error.textContent = ''; error.hidden = true; });
  }
  function showFieldErrors(fields) {
    const ids = {
      fullName: 'application-full-name', timezone: 'application-timezone',
      learnerNote: 'application-note', requiredConfirmation: 'application-confirmation',
    };
    const errors = {
      fullName: 'application-full-name-error', timezone: 'application-timezone-error',
      learnerNote: 'application-note-error', requiredConfirmation: 'application-confirmation-error',
    };
    clearFieldErrors();
    const first = Object.keys(fields)[0];
    Object.keys(fields).forEach((key) => {
      const field = document.getElementById(ids[key]);
      if (field) field.setAttribute('aria-invalid', 'true');
      const error = document.getElementById(errors[key]);
      if (error) { error.textContent = fields[key]; error.hidden = false; }
    });
    const target = document.getElementById(ids[first]);
    if (target) target.focus();
  }
  function analytics(name) {
    if (typeof window.gtag === 'function' && selectedCourse) {
      window.gtag('event', name, { course_slug: selectedCourse.slug });
    }
  }
  async function currentApplication() {
    const data = await auth.request('/me/applications/current?courseId=' + encodeURIComponent(courseId), { method: 'GET' });
    return data.application || null;
  }
  function showSuccess(application, trackCompletion = true) {
    message('', '');
    form.hidden = true;
    recovery.hidden = true;
    result.hidden = false;
    reference.textContent = application.reference || 'Available in My Learning';
    resultTitle.textContent = correctionMode ? 'Updated application received' : 'Application received';
    resultDetail.textContent = correctionMode
      ? 'This new application replaces your earlier submission. Only the updated application will be reviewed.'
      : 'We normally review your application within five business days. A cohort offer may arrive later because it depends on the final schedule and cohort formation. You can track your status and next steps in My Learning.';
    sessionStorage.removeItem(draftKey);
    sessionStorage.removeItem(idempotencyStateKey);
    if (trackCompletion) analytics('course_application_complete');
    result.querySelector('a').focus();
  }
  async function reconcile() {
    try {
      const application = await currentApplication();
      const isExpected = correctionMode
        ? application && application.applicationId !== sourceApplicationId && application.replacesApplicationId === sourceApplicationId
        : Boolean(application);
      if (isExpected) { showSuccess(application); return true; }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        saveDraft(); window.location.replace(loginUrl()); return true;
      }
    }
    return false;
  }
  function profileIdempotencyKey(value) {
    const fingerprint = JSON.stringify({ fullName: value.fullName.trim(), timezone: value.timezone, acknowledgements: model.ACKNOWLEDGEMENTS });
    let state = null;
    try { state = JSON.parse(sessionStorage.getItem(profileIdempotencyStateKey) || 'null'); } catch (_) { state = null; }
    if (!state || state.fingerprint !== fingerprint || typeof state.key !== 'string') {
      state = { fingerprint, key: model.idempotencyKey() };
      sessionStorage.setItem(profileIdempotencyStateKey, JSON.stringify(state));
    }
    return state.key;
  }
  function profileMatches(learner, value) {
    const current = new Set((learner.acknowledgements || []).map((item) => item.documentId + ':' + (item.version || item.documentVersion)));
    return learner.fullName === value.fullName.trim()
      && learner.timezone === value.timezone
      && learner.adultEligibilityConfirmed === true
      && model.ACKNOWLEDGEMENTS.every((item) => current.has(item.documentId + ':' + item.version));
  }
  async function bootstrapProfile(value) {
    const body = {
      fullName: value.fullName.trim(), timezone: value.timezone,
      adultEligibilityConfirmed: true, acknowledgements: model.ACKNOWLEDGEMENTS,
    };
    try {
      await auth.request('/learners/me/bootstrap', {
        method: 'POST', headers: { 'Idempotency-Key': profileIdempotencyKey(value) }, body: JSON.stringify(body),
      });
    } catch (error) {
      if (error.status === 401 || error.status === 403) throw error;
      try {
        const profile = await auth.request('/learners/me', { method: 'GET' });
        if (!profile.learner || !profileMatches(profile.learner, value)) throw error;
      } catch (reconcileError) {
        if (reconcileError === error) throw error;
        throw error;
      }
    }
    sessionStorage.removeItem(profileIdempotencyStateKey);
  }
  async function submitApplication() {
    if (pending) return;
    const value = formModel();
    saveDraft(value);
    const fields = model.validate(value, needsProfile);
    if (Object.keys(fields).length) {
      showFieldErrors(fields);
      message(Object.keys(fields).length === 1 && fields.requiredConfirmation
        ? 'Confirm your eligibility and accept the required policies to continue.'
        : 'Please correct the highlighted information and try again.', 'error');
      return;
    }
    clearFieldErrors();
    setPending(true);
    recovery.hidden = true;
    message('Submitting your application…', '');
    try {
      if (needsProfile) {
        await bootstrapProfile(value);
        needsProfile = false;
        profileFields.hidden = true;
      } else {
        for (const acknowledgement of missingAcknowledgements) {
          await auth.request('/learners/me/acknowledgements', {
            method: 'POST',
            headers: { 'Idempotency-Key': 'web-ack-' + acknowledgement.documentId + '-' + acknowledgement.version },
            body: JSON.stringify(acknowledgement),
          });
        }
        missingAcknowledgements = [];
      }
      const endpoint = correctionMode
        ? '/me/applications/' + encodeURIComponent(sourceApplicationId) + '/replacements'
        : '/me/applications';
      const requestPayload = correctionMode
        ? model.replacementPayload(value, sourceApplication.version)
        : model.payload(value);
      const data = await auth.request(endpoint, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey(value) },
        body: JSON.stringify(requestPayload),
      });
      showSuccess(data.application);
    } catch (error) {
      const friendly = model.errorMessage(error);
      if (friendly.code === 'SESSION_EXPIRED') {
        saveDraft(value); window.location.replace(loginUrl()); return;
      }
      if (friendly.code === 'DUPLICATE' || friendly.code === 'UNCERTAIN') {
        if (await reconcile()) return;
      }
      if (friendly.code === 'REPLACEMENT_CONFLICT') {
        form.hidden = true;
        retry.hidden = true;
      }
      message(friendly.message, 'error');
      retryAction = submitApplication;
      recovery.hidden = friendly.code === 'VALIDATION_FAILED';
      if (friendly.code === 'VALIDATION_FAILED' && error.body && error.body.fields) {
        showFieldErrors(error.body.fields);
      }
    } finally { setPending(false); }
  }
  async function initialise() {
    retryAction = initialise;
    retry.hidden = false;
    if (!model.applicationsEnabled(window.location.hostname)) {
      courseSummary.textContent = 'Applications are not currently open.';
      message('This application journey is disabled until launch approval.', '');
      form.hidden = true;
      recovery.hidden = true;
      return;
    }
    if (correctionMode && !/^app_[A-Za-z0-9]{1,120}$/.test(sourceApplicationId)) {
      message('This correction link is invalid. Return to My Learning and try again.', 'error');
      recovery.hidden = false;
      retry.hidden = true;
      return;
    }
    if (!selectedCourse) {
      courseSummary.textContent = 'Choose one of the available courses before applying.';
      message('This course selection is invalid or unavailable.', 'error');
      recovery.hidden = false;
      retry.hidden = true;
      return;
    }
    const hasDraft = restoreDraft();
    initialiseTimezone(hasDraft);
    try {
      const user = await auth.restore();
      if (!user) { window.location.replace(loginUrl()); return; }
      userLabel.textContent = user.emailId || 'Learner session';
      const publicCourse = await auth.request('/training/courses/' + selectedCourse.slug, { method: 'GET' });
      if (!publicCourse.course || publicCourse.course.courseId !== courseId) throw Object.assign(new Error('COURSE_UNAVAILABLE'), { status: 404, body: { error: 'COURSE_UNAVAILABLE' } });
      courseSummary.textContent = 'Applying for ' + publicCourse.course.title + '. Applications are reviewed.';
      if (practicalSummary) practicalSummary.hidden = courseId !== 'crs_python_foundations';
      try {
        const profile = await auth.request('/learners/me', { method: 'GET' });
        needsProfile = false;
        profileFields.hidden = true;
        const current = new Set((profile.learner.acknowledgements || []).map((item) => item.documentId + ':' + (item.version || item.documentVersion)));
        missingAcknowledgements = model.ACKNOWLEDGEMENTS.filter((item) => !current.has(item.documentId + ':' + item.version));
        document.getElementById('application-confirmation').checked = profile.learner.adultEligibilityConfirmed === true && missingAcknowledgements.length === 0;
      } catch (error) {
        if (error.status !== 404) throw error;
        needsProfile = true;
        profileFields.hidden = false;
      }
      // A first-time learner cannot have a current application yet because the
      // application API requires the learner profile we are about to create.
      // Avoid turning that expected prerequisite into a fatal initialization
      // error before the inline profile form can be shown.
      const existing = needsProfile ? null : await currentApplication();
      if (correctionMode) {
        if (!existing || existing.applicationId !== sourceApplicationId || !['NEW', 'UNDER_REVIEW'].includes(existing.status)) {
          throw Object.assign(new Error('APPLICATION_REPLACEMENT_CONFLICT'), { status: 409, body: { error: 'APPLICATION_REPLACEMENT_CONFLICT' } });
        }
        const detail = await auth.request('/me/applications/' + encodeURIComponent(sourceApplicationId), { method: 'GET' });
        sourceApplication = detail.application;
        if (!sourceApplication || sourceApplication.courseId !== courseId || sourceApplication.version !== existing.version) {
          throw Object.assign(new Error('APPLICATION_REPLACEMENT_CONFLICT'), { status: 409, body: { error: 'APPLICATION_REPLACEMENT_CONFLICT' } });
        }
        if (!readDraft()) {
          const existingNote = sourceApplication.answers && sourceApplication.answers.learningGoal;
          document.getElementById('application-note').value = existingNote && existingNote !== 'N/A' ? existingNote : '';
        }
        courseSummary.textContent = 'Correcting ' + sourceApplication.reference + ' for ' + publicCourse.course.title + '. Your original remains active until you resubmit.';
        submit.textContent = 'Submit corrected application';
        cancel.hidden = false;
      } else if (existing) { showSuccess(existing, false); return; }
      form.hidden = false;
      retryAction = submitApplication;
      message('', '');
      analytics('course_application_start');
    } catch (error) {
      const friendly = model.errorMessage(error);
      if (friendly.code === 'SESSION_EXPIRED') { window.location.replace(loginUrl()); return; }
      message(friendly.message, 'error');
      if (friendly.code === 'REPLACEMENT_CONFLICT') retry.hidden = true;
      recovery.hidden = false;
    }
  }
  form.addEventListener('input', (event) => {
    saveDraft();
    if (event.target && event.target.getAttribute('aria-invalid') === 'true') {
      event.target.removeAttribute('aria-invalid');
      const describedBy = (event.target.getAttribute('aria-describedby') || '').split(/\s+/);
      describedBy.forEach((id) => {
        const error = document.getElementById(id);
        if (error && error.classList.contains('field-error')) { error.textContent = ''; error.hidden = true; }
      });
      message('', '');
    }
  });
  form.addEventListener('submit', (event) => { event.preventDefault(); submitApplication(); });
  retry.addEventListener('click', () => { recovery.hidden = true; retryAction(); });
  logout.addEventListener('click', async () => { saveDraft(); await auth.logout(); window.location.replace(loginUrl()); });
  window.sjCourseApplicationPage = { formModel, initialise, reconcile, submitApplication };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
