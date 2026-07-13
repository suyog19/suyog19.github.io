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
  const profileFields = document.getElementById('profile-fields');
  const userLabel = document.getElementById('application-user-label');
  const logout = document.getElementById('application-logout');
  const cancel = document.getElementById('application-cancel');
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
      adultEligibilityConfirmed: document.getElementById('application-adult').checked,
      termsAccepted: document.getElementById('application-terms').checked,
      recordingAccepted: document.getElementById('application-recording').checked,
      answers: {
        programmingExperience: document.getElementById('application-experience').value,
        learningGoal: document.getElementById('application-goal').value,
        weeklyAvailability: document.getElementById('application-availability').value,
      },
    };
  }
  function saveDraft(value) {
    sessionStorage.setItem(draftKey, JSON.stringify(value || formModel()));
  }
  function restoreDraft() {
    const draft = readDraft();
    if (!draft || draft.courseId !== courseId) return;
    const values = {
      'application-full-name': draft.fullName,
      'application-timezone': draft.timezone,
      'application-experience': draft.answers && draft.answers.programmingExperience,
      'application-goal': draft.answers && draft.answers.learningGoal,
      'application-availability': draft.answers && draft.answers.weeklyAvailability,
    };
    Object.entries(values).forEach(([id, value]) => {
      if (typeof value === 'string') document.getElementById(id).value = value;
    });
    document.getElementById('application-adult').checked = draft.adultEligibilityConfirmed === true;
    document.getElementById('application-terms').checked = draft.termsAccepted === true;
    document.getElementById('application-recording').checked = draft.recordingAccepted === true;
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
  }
  function showFieldErrors(fields) {
    const ids = {
      fullName: 'application-full-name', timezone: 'application-timezone',
      programmingExperience: 'application-experience', learningGoal: 'application-goal',
      weeklyAvailability: 'application-availability', adultEligibilityConfirmed: 'application-adult',
      termsAccepted: 'application-terms', recordingAccepted: 'application-recording',
    };
    clearFieldErrors();
    const first = Object.keys(fields)[0];
    Object.keys(fields).forEach((key) => {
      const field = document.getElementById(ids[key]);
      if (field) field.setAttribute('aria-invalid', 'true');
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
    form.hidden = true;
    recovery.hidden = true;
    result.hidden = false;
    reference.textContent = application.reference || 'Available in My Learning';
    resultTitle.textContent = correctionMode ? 'Updated application received' : 'Application received';
    resultDetail.textContent = correctionMode
      ? 'This new application replaces your earlier submission. Only the updated application will be reviewed.'
      : 'Your application will be reviewed. Check My Learning for the current status and next action.';
    sessionStorage.removeItem(draftKey);
    sessionStorage.removeItem(idempotencyStateKey);
    if (trackCompletion) analytics('course_application_complete');
    result.querySelector('a').focus();
  }
  async function reconcile() {
    try {
      const application = await currentApplication();
      if (application) { showSuccess(application); return true; }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        saveDraft(); window.location.replace(loginUrl()); return true;
      }
    }
    return false;
  }
  async function submitApplication() {
    if (pending) return;
    const value = formModel();
    saveDraft(value);
    const fields = model.validate(value, needsProfile);
    if (Object.keys(fields).length) {
      showFieldErrors(fields);
      message('Review the required information and try again.', 'error');
      return;
    }
    clearFieldErrors();
    setPending(true);
    recovery.hidden = true;
    message('Submitting your application…', '');
    try {
      if (needsProfile) {
        await auth.request('/learners/me/bootstrap', {
          method: 'POST',
          body: JSON.stringify({
            fullName: value.fullName.trim(), timezone: value.timezone,
            adultEligibilityConfirmed: true,
            acknowledgements: model.ACKNOWLEDGEMENTS,
          }),
        });
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
    restoreDraft();
    try {
      const user = await auth.restore();
      if (!user) { window.location.replace(loginUrl()); return; }
      userLabel.textContent = user.emailId || 'Learner session';
      const publicCourse = await auth.request('/training/courses/' + selectedCourse.slug, { method: 'GET' });
      if (!publicCourse.course || publicCourse.course.courseId !== courseId) throw Object.assign(new Error('COURSE_UNAVAILABLE'), { status: 404, body: { error: 'COURSE_UNAVAILABLE' } });
      courseSummary.textContent = 'Applying for ' + publicCourse.course.title + '. Applications are reviewed.';
      try {
        const profile = await auth.request('/learners/me', { method: 'GET' });
        needsProfile = false;
        profileFields.hidden = true;
        document.getElementById('application-adult').checked = profile.learner.adultEligibilityConfirmed === true;
        const current = new Set((profile.learner.acknowledgements || []).map((item) => item.documentId + ':' + (item.version || item.documentVersion)));
        missingAcknowledgements = model.ACKNOWLEDGEMENTS.filter((item) => !current.has(item.documentId + ':' + item.version));
      } catch (error) {
        if (error.status !== 404) throw error;
        needsProfile = true;
        profileFields.hidden = false;
      }
      const existing = await currentApplication();
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
          document.getElementById('application-experience').value = sourceApplication.answers.programmingExperience;
          document.getElementById('application-goal').value = sourceApplication.answers.learningGoal;
          document.getElementById('application-availability').value = sourceApplication.answers.weeklyAvailability;
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
  form.addEventListener('input', () => saveDraft());
  form.addEventListener('submit', (event) => { event.preventDefault(); submitApplication(); });
  retry.addEventListener('click', () => { recovery.hidden = true; retryAction(); });
  logout.addEventListener('click', async () => { saveDraft(); await auth.logout(); window.location.replace(loginUrl()); });
  window.sjCourseApplicationPage = { formModel, initialise, reconcile, submitApplication };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
