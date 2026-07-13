(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const summaryView = window.sjLearnerSummary;
  const shell = document.getElementById('learner-shell');
  const status = document.getElementById('learner-shell-status');
  const userLabel = document.getElementById('learner-user-label');
  const logoutButton = document.getElementById('learner-logout');
  const currentAction = document.getElementById('learner-current-action');
  const applicationList = document.getElementById('learner-applications');
  const profileDetails = document.getElementById('learner-profile-details');
  const profileEmpty = document.getElementById('learner-profile-empty');
  const errorActions = document.getElementById('learner-error-actions');
  const retryButton = document.getElementById('learner-retry');
  const supportLink = document.getElementById('learner-support-link');
  const privacyLink = document.getElementById('learner-privacy-link');
  const grievanceLink = document.getElementById('learner-grievance-link');

  function loginUrl() {
    return '/learn/?continue=' + encodeURIComponent(window.location.pathname + window.location.search);
  }

  async function initialise() {
    shell.hidden = true;
    userLabel.textContent = '';
    currentAction.replaceChildren();
    applicationList.replaceChildren();
    profileDetails.replaceChildren();
    profileEmpty.hidden = true;
    retryButton.disabled = true;
    errorActions.hidden = true;
    status.textContent = 'Restoring your secure session…';
    status.hidden = false;
    try {
      const user = await auth.restore();
      if (!user) { window.location.replace(loginUrl()); return; }
      const summary = await auth.request('/me/learning-summary', { method: 'GET' });
      userLabel.textContent = user.emailId || 'Learner session';
      renderSummary(summary);
      shell.hidden = false;
      status.hidden = true;
      errorActions.hidden = true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) { window.location.replace(loginUrl()); return; }
      status.textContent = 'My Learning is temporarily unavailable.';
      status.hidden = false;
      errorActions.hidden = false;
    } finally {
      retryButton.disabled = false;
    }
  }

  function textElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text || '';
    return element;
  }

  function renderSummary(summary) {
    currentAction.replaceChildren();
    const action = summary.currentAction || {};
    const applications = Array.isArray(summary.applications) ? summary.applications : [];
    const currentGate2 = applications.find((application) => (
      application.gate2 && application.gate2.action
      && application.gate2.action.code === action.code
    ));
    const currentGate2Href = summaryView.gate2Href(currentGate2);
    const currentSupported = summaryView.isV1ActionCode(action.code)
      && (!summaryView.isGate2ActionCode(action.code) || Boolean(currentGate2 && currentGate2Href));
    currentAction.appendChild(textElement('p', 'eyebrow', 'Next action'));
    const currentLabel = !currentSupported || (currentGate2 && !currentGate2Href) ? 'No action is currently available' : action.label || 'My Learning';
    currentAction.appendChild(textElement('h2', '', currentLabel));
    if (currentSupported && (!currentGate2 || currentGate2Href)) {
      const actionLink = textElement('a', 'btn btn-primary', action.label || 'Continue');
      actionLink.href = currentGate2Href || summaryView.safeActionHref(action.href);
      currentAction.appendChild(actionLink);
    } else {
      currentAction.appendChild(textElement('p', '', 'This status is not enabled in the current learner experience.'));
    }

    applicationList.replaceChildren();
    if (!applications.length) {
      applicationList.appendChild(textElement('p', 'learner-empty', 'No current application yet.'));
    }
    applications.forEach((application) => {
      const card = textElement('article', 'learner-application-card', '');
      const gate2 = application.gate2;
      const gate2ActionHref = summaryView.gate2Href(application);
      const applicationAction = application.action || {};
      const applicationSupported = !applicationAction.code || (
        summaryView.isV1ActionCode(applicationAction.code)
        && (!summaryView.isGate2ActionCode(applicationAction.code) || Boolean(gate2 && gate2ActionHref))
      );
      card.appendChild(textElement('p', 'eyebrow', application.course && application.course.title));
      card.appendChild(textElement('h2', '', !applicationSupported || (gate2 && !gate2ActionHref) ? 'Status available' : applicationAction.label));
      card.appendChild(textElement('p', '', 'Reference: ' + (application.reference || 'Available in support records')));
      if (gate2) {
        const enrolment = gate2.enrolment || {};
        card.appendChild(textElement('p', 'learner-offer-note', 'Place status: ' + summaryView.gate2StatusLabel('enrolment', enrolment.status)));
        if (enrolment.seatReserved === true) card.appendChild(textElement('p', '', 'Seat reservation is confirmed by the service.'));
        if (applicationSupported && gate2ActionHref) {
          const gate2Action = textElement('a', 'btn btn-primary learner-gate2-link', gate2.action && gate2.action.label || 'View status');
          gate2Action.href = gate2ActionHref;
          card.appendChild(gate2Action);
        }
        const changeHref = summaryView.gate2ChangeHref(application);
        if (changeHref) {
          const change = textElement('a', 'btn btn-secondary learner-gate2-change-link', 'Request cancellation or transfer review');
          change.href = changeHref;
          card.appendChild(change);
        }
        if (gate2.learnerChange) {
          const requestLabel = summaryView.gate2StatusLabel('request', gate2.learnerChange.status);
          const decisionLabel = gate2.learnerChange.decision ? ' · ' + summaryView.gate2StatusLabel('decision', gate2.learnerChange.decision) : '';
          card.appendChild(textElement('p', '', 'Organiser request: ' + requestLabel + decisionLabel));
        }
        if (gate2.refund) card.appendChild(textElement('p', '', 'Provider refund: ' + summaryView.gate2StatusLabel('refund', gate2.refund.status)));
        if (gate2.communication && gate2.communication.status === 'FAILED') {
          card.appendChild(textElement('p', 'learner-communication-warning', 'A Gate 2 message could not be confirmed. Payment, place, request and refund status above are unchanged.'));
        }
      }
      const correctionHref = summaryView.correctionHref(application);
      if (correctionHref) {
        const correction = textElement('a', 'btn btn-secondary learner-correction-link', 'Correct or update application');
        correction.href = correctionHref;
        card.appendChild(correction);
        card.appendChild(textElement('p', 'field-hint', 'Opening correction does not withdraw or change your current application.'));
      }
      if (!gate2 && summaryView.hasActionableOffer(application.offer)) {
        card.appendChild(textElement('p', 'learner-offer-note', 'A cohort offer is available.'));
      }
      const recommendedCourse = application.decision && application.decision.recommendedCourse;
      const recommendationHref = recommendedCourse && summaryView.safeCourseHref(recommendedCourse.href);
      if (recommendationHref) {
        const recommendation = textElement('a', 'learner-course-link', 'View recommended course: ' + (recommendedCourse.title || 'Course'));
        recommendation.href = recommendationHref;
        card.appendChild(recommendation);
      }
      if (application.communication && application.communication.status === 'FAILED') {
        card.appendChild(textElement('p', 'learner-communication-warning', 'A status message could not be confirmed. Your application status above is unchanged; contact support if you need help.'));
      }
      applicationList.appendChild(card);
    });

    const support = summary.support || {};
    supportLink.href = summaryView.safeSupportHref(support.supportUrl, '/contact/');
    privacyLink.href = summaryView.safeSupportHref(
      support.privacyUrl, '/training/policies/'
    );
    grievanceLink.href = summaryView.safeSupportHref(
      support.grievanceUrl, '/training/policies/#support-and-grievance-process'
    );

    profileDetails.replaceChildren();
    profileEmpty.hidden = true;
    const learner = summary.learner;
    if (!learner) {
      profileEmpty.hidden = false;
      return;
    }
    addDetail('Verified email', learner.verifiedEmail);
    addDetail('Full name', learner.fullName);
    addDetail('Timezone', learner.timezone);
    addDetail(
      'Adult eligibility',
      summaryView.booleanLabel(
        learner.adultEligibilityConfirmed, 'Confirmed', 'Not confirmed'
      )
    );
    addDetail(
      'Required acknowledgements',
      summaryView.acknowledgementLabel(learner.acknowledgements)
    );
    addDetail(
      'Promotional consent',
      summaryView.booleanLabel(learner.promotionalConsent, 'Recorded', 'Not recorded')
    );
  }

  function addDetail(label, value) {
    profileDetails.appendChild(textElement('dt', '', label));
    profileDetails.appendChild(textElement('dd', '', value || 'Not available'));
  }

  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    userLabel.textContent = '';
    currentAction.replaceChildren();
    applicationList.replaceChildren();
    profileDetails.replaceChildren();
    profileEmpty.hidden = true;
    const revoked = await auth.logout();
    if (revoked) {
      window.location.replace('/learn/');
      return;
    }
    shell.hidden = true;
    status.textContent = 'Signed out on this device, but the service could not confirm server sign-out. Close this browser window on a shared device and contact support if this continues.';
    status.hidden = false;
    errorActions.hidden = false;
  });
  retryButton.addEventListener('click', initialise);
  window.sjLearnerShell = { initialise, renderSummary };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
