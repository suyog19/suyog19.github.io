(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const view = window.sjLearnerSummary;
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

  function loginUrl() { return '/learn/?continue=' + encodeURIComponent(window.location.pathname + window.location.search); }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text || '';
    return node;
  }
  function money(value, currency) {
    return Number.isSafeInteger(value) && value >= 0 && currency === 'INR'
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value / 100) : null;
  }
  function dateTime(value) {
    if (typeof value !== 'string') return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
    }).format(parsed);
  }
  function addDetail(list, label, value) {
    if (value === undefined || value === null || value === '' || value === 'Not available') return;
    list.appendChild(element('dt', '', label));
    list.appendChild(element('dd', '', value));
  }
  function disclosure(label) {
    const details = document.createElement('details');
    details.className = 'learning-details';
    details.appendChild(element('summary', '', label));
    const list = document.createElement('dl');
    details.appendChild(list);
    return { details, list };
  }
  function importantDate(application) {
    const gate3 = application && application.gate3;
    if (!gate3) return null;
    if (gate3.extensionUntil) return 'Extended payment deadline: ' + dateTime(gate3.extensionUntil);
    if (gate3.graceUntil) return 'Current grace period ends: ' + dateTime(gate3.graceUntil);
    if (gate3.balanceDeadline) return 'Payment deadline: ' + dateTime(gate3.balanceDeadline);
    if (gate3.cohortDecisionDate) return 'Cohort decision expected: ' + dateTime(gate3.cohortDecisionDate);
    if (gate3.schedule && gate3.schedule.startsAt) return 'Course starts: ' + dateTime(gate3.schedule.startsAt);
    return null;
  }
  function supported(application) {
    const action = application.action || {};
    if (!action.code) return true;
    if (!view.isV1ActionCode(action.code)) return false;
    if (view.isGate2ActionCode(action.code)) return Boolean(application.gate2 && view.gate2Href(application));
    if (view.isGate3ActionCode(action.code)) return Boolean(application.gate3);
    return true;
  }
  function journeyHref(application) {
    if (!supported(application)) return null;
    const hubHref = view.courseHubHref(application);
    if (hubHref) return { href: hubHref, label: 'Open your course area' };
    const actionHref = view.gate3Href(application) || view.gate2Href(application);
    if (actionHref) {
      const label = view.statusPresentation((application.action || {}).code || application.journeyStatus).actionLabel;
      return { href: actionHref, label: label || (actionHref === '/contact/' ? 'Contact support' : 'View current status') };
    }
    const correction = view.correctionHref(application);
    if (correction) return { href: correction, label: 'Review your application', correction: true };
    const recommended = application.decision && application.decision.recommendedCourse;
    const recommendation = recommended && view.safeCourseHref(recommended.href);
    if (recommendation) return { href: recommendation, label: 'View recommended course' };
    const change = view.gate2ChangeHref(application);
    return change ? { href: change, label: 'Request a change' } : null;
  }
  function renderJourney(application) {
    const card = element('article', 'learner-application-card', '');
    const title = application.course && application.course.title || 'Course';
    const action = application.action || {};
    const presentation = view.statusPresentation(action.code || application.journeyStatus || (application.offer && application.offer.status));
    card.setAttribute('aria-label', title + ' learning journey');
    card.appendChild(element('p', 'learning-status-marker', title));
    card.appendChild(element('h2', '', supported(application) ? presentation.heading : 'View your current learning status'));
    card.appendChild(element('p', '', supported(application) ? presentation.explanation : 'The latest authorised status is available. Return to My Learning or contact support if the next step is unclear.'));
    const date = importantDate(application);
    if (date) card.appendChild(element('p', 'learning-deadline', date));

    const details = disclosure('View details');
    addDetail(details.list, 'Application reference', application.reference);
    const gate2 = application.gate2;
    if (gate2) {
      const enrolment = gate2.enrolment || {};
      addDetail(details.list, 'Place status', view.gate2StatusLabel('enrolment', enrolment.status));
      if (gate2.learnerChange) {
        const decision = gate2.learnerChange.decision ? ' · ' + view.gate2StatusLabel('decision', gate2.learnerChange.decision) : '';
        addDetail(details.list, 'Request outcome', view.gate2StatusLabel('request', gate2.learnerChange.status) + decision);
      }
      if (gate2.refund) addDetail(details.list, 'Refund status', view.gate2StatusLabel('refund', gate2.refund.status));
      if (gate2.communication && gate2.communication.status === 'FAILED') card.appendChild(element('p', 'learner-communication-warning', 'We could not confirm that the latest email was delivered. Your payment, place, request and refund status shown above is unchanged.'));
    }
    const gate3 = application.gate3;
    if (gate3) {
      addDetail(details.list, 'Cohort status', view.gate3StatusLabel('decision', gate3.cohortDecision));
      if (gate3.schedule) addDetail(details.list, 'Final schedule', dateTime(gate3.schedule.startsAt) + ' to ' + dateTime(gate3.schedule.endsAt) + ' · ' + (gate3.schedule.timezone || 'Timezone not available'));
      addDetail(details.list, 'Remaining fee', view.gate3StatusLabel('balance', gate3.balanceStatus));
      addDetail(details.list, 'Amount due', money(gate3.amountDue, gate3.currency));
      addDetail(details.list, 'Approved credit or waiver', money(gate3.creditAmount, gate3.currency));
      addDetail(details.list, 'Original payment deadline', dateTime(gate3.balanceDeadline));
      addDetail(details.list, 'Grace ends', dateTime(gate3.graceUntil));
      addDetail(details.list, 'Approved extension ends', dateTime(gate3.extensionUntil));
      addDetail(details.list, 'Seat status', gate3.seatReleased === true ? 'Released' : gate3.seatReserved === true ? 'Reserved' : null);
      addDetail(details.list, 'Enrolment activation', view.gate3StatusLabel('activation', gate3.activationStatus));
      addDetail(details.list, 'Joining details', view.gate3StatusLabel('joining', gate3.joiningEligibility));
      if (gate3.depositDispositionOutcome) addDetail(details.list, 'Deposit treatment', view.gate3StatusLabel('disposition', gate3.depositDispositionOutcome));
      if (gate3.balanceStatus === 'OVERDUE_IN_GRACE') card.appendChild(element('p', 'field-hint', 'The remaining fee is overdue, but your seat is still reserved during the current grace period.'));
      if (gate3.balanceStatus === 'CONFIRMING') card.appendChild(element('p', 'field-hint', 'Payment confirmation is in progress. Do not pay again.'));
      if (gate3.balanceStatus === 'CLOSED_NON_PAYMENT') card.appendChild(element('p', 'field-hint', 'The seat has been released. A normal payment cannot reactivate this enrolment automatically.'));
      if (gate3.balanceStatus === 'ACTION_NEEDED') card.appendChild(element('p', 'field-hint', 'A payment needs organiser review and does not activate the enrolment automatically. Do not pay again.'));
      if (gate3.communication && gate3.communication.status === 'FAILED') card.appendChild(element('p', 'learner-communication-warning', 'We could not confirm that the latest email was delivered. Your payment, cohort, seat and enrolment status shown above is unchanged.'));
    }
    if (details.list.children.length) card.appendChild(details.details);
    const next = journeyHref(application);
    if (next) {
      const link = element('a', 'btn btn-secondary learner-journey-link', next.label);
      link.href = next.href;
      card.appendChild(link);
      if (next.correction) card.appendChild(element('p', 'field-hint', 'Opening correction does not withdraw or change your current application.'));
    }
    if (application.communication && application.communication.status === 'FAILED') card.appendChild(element('p', 'learner-communication-warning', 'We could not confirm that the latest email was delivered. Your application status shown above is unchanged.'));
    return card;
  }
  function renderCurrent(summary, applications) {
    currentAction.replaceChildren();
    const action = summary.currentAction || {};
    const gate2 = applications.find((item) => item.gate2 && item.gate2.action && item.gate2.action.code === action.code);
    const gate3 = applications.find((item) => item.gate3 && item.journeyStatus === action.code);
    const href2 = view.gate2Href(gate2);
    const href3 = view.courseHubHref(gate3) || view.gate3Href(gate3);
    const isSupported = view.isV1ActionCode(action.code) && (view.isGate2ActionCode(action.code) ? Boolean(gate2 && href2) : view.isGate3ActionCode(action.code) ? Boolean(gate3) : true);
    const presentation = view.statusPresentation(action.code);
    currentAction.appendChild(element('p', 'learning-status-marker', 'Current status'));
    const heading = element('h2', '', isSupported ? presentation.heading : 'View your current learning status');
    heading.tabIndex = -1;
    currentAction.appendChild(heading);
    currentAction.appendChild(element('p', '', isSupported ? presentation.explanation : 'The latest authorised status is shown below. Refresh or contact support if you cannot identify the next step.'));
    const date = importantDate(gate3 || gate2);
    if (date) currentAction.appendChild(element('p', 'learning-deadline', date));
    const href = gate3 ? href3 : gate2 ? href2 : view.safeActionHref(action.href);
    const primaryLabel = view.courseHubHref(gate3) ? 'Open your course area' : presentation.actionLabel;
    if (isSupported && href && primaryLabel) {
      const link = element('a', 'btn btn-primary btn-learning', primaryLabel);
      link.href = href;
      currentAction.appendChild(link);
    }
  }
  function renderProfile(learner) {
    profileDetails.replaceChildren();
    profileEmpty.hidden = Boolean(learner);
    if (!learner) return;
    addDetail(profileDetails, 'Verified email', learner.verifiedEmail);
    addDetail(profileDetails, 'Full name', learner.fullName);
    addDetail(profileDetails, 'Timezone', learner.timezone);
    addDetail(profileDetails, 'Adult eligibility', view.booleanLabel(learner.adultEligibilityConfirmed, 'Confirmed', 'Not confirmed'));
    addDetail(profileDetails, 'Required acknowledgements', view.acknowledgementLabel(learner.acknowledgements));
    if (learner.promotionalConsent !== undefined && learner.promotionalConsent !== null) addDetail(profileDetails, 'Promotional consent', view.booleanLabel(learner.promotionalConsent, 'Recorded', 'Not recorded'));
  }
  function renderSummary(summary) {
    const applications = Array.isArray(summary.applications) ? summary.applications : [];
    renderCurrent(summary, applications);
    applicationList.replaceChildren();
    if (!applications.length) {
      const empty = element('article', 'learner-application-card learner-empty', '');
      empty.appendChild(element('h2', '', 'Choose a course to begin'));
      empty.appendChild(element('p', '', 'You do not have a current application. Compare the available courses and apply when you are ready.'));
      const courses = element('a', 'btn btn-primary btn-learning', 'View courses'); courses.href = '/training/'; empty.appendChild(courses);
      applicationList.appendChild(empty);
    } else applications.forEach((application) => applicationList.appendChild(renderJourney(application)));
    const support = summary.support || {};
    supportLink.href = view.safeSupportHref(support.supportUrl, '/contact/');
    privacyLink.href = view.safeSupportHref(support.privacyUrl, '/training/policies/');
    grievanceLink.href = view.safeSupportHref(support.grievanceUrl, '/training/policies/#support-and-grievance-process');
    renderProfile(summary.learner);
  }
  async function initialise() {
    shell.hidden = true; userLabel.textContent = ''; currentAction.replaceChildren(); applicationList.replaceChildren(); profileDetails.replaceChildren(); profileEmpty.hidden = true;
    retryButton.disabled = true; errorActions.hidden = true; status.textContent = 'Checking your secure session…'; status.hidden = false;
    try {
      const user = await auth.restore(); if (!user) { window.location.replace(loginUrl()); return; }
      const summary = await auth.request('/me/learning-summary', { method: 'GET' });
      userLabel.textContent = user.emailId || 'Learner session'; renderSummary(summary); shell.hidden = false; status.hidden = true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) { window.location.replace(loginUrl()); return; }
      status.textContent = 'My Learning is temporarily unavailable. Your application, payment and enrolment records are not changed by this display problem.'; errorActions.hidden = false;
    } finally { retryButton.disabled = false; }
  }
  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true; userLabel.textContent = ''; currentAction.replaceChildren(); applicationList.replaceChildren(); profileDetails.replaceChildren(); profileEmpty.hidden = true;
    if (await auth.logout()) { window.location.replace('/learn/'); return; }
    shell.hidden = true; status.textContent = 'Signed out on this device, but the service could not confirm server sign-out. Close this window on a shared device and contact support if this continues.'; status.hidden = false; errorActions.hidden = false;
  });
  retryButton.addEventListener('click', initialise);
  window.sjLearnerShell = { initialise, renderJourney, renderSummary };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
