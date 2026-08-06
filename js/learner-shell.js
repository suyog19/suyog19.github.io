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
  function dateTime(value, timeZone) {
    if (typeof value !== 'string') return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
      timeZone: view.safeTimeZone(timeZone), timeZoneName: 'short',
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
  function importantDate(application, timeZone) {
    const gate3 = application && application.gate3;
    if (!gate3) return null;
    if (gate3.extensionUntil) return 'Extended payment deadline: ' + dateTime(gate3.extensionUntil, timeZone);
    if (gate3.graceUntil) return 'Current grace period ends: ' + dateTime(gate3.graceUntil, timeZone);
    if (gate3.balanceDeadline) return 'Payment deadline: ' + dateTime(gate3.balanceDeadline, timeZone);
    if (gate3.cohortDecisionDate) return 'Cohort decision expected: ' + dateTime(gate3.cohortDecisionDate, timeZone);
    if (gate3.schedule && gate3.schedule.startsAt) return 'Course starts: ' + dateTime(gate3.schedule.startsAt, timeZone);
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
    const offerHref = view.offerPaymentHref(application);
    if (offerHref) return { href: offerHref, label: 'Review deposit details' };
    const correction = view.correctionHref(application);
    if (correction) return { href: correction, label: 'View or correct your application', correction: true };
    const recommended = application.decision && application.decision.recommendedCourse;
    const recommendation = recommended && view.safeCourseHref(recommended.href);
    if (recommendation) return { href: recommendation, label: 'View recommended course' };
    const change = view.gate2ChangeHref(application);
    return change ? { href: change, label: 'Request a change' } : null;
  }
  function stageItem(label, state) {
    const item = element('li', 'learner-application-progress__step learner-application-progress__step--' + state, '');
    const icon = element('span', 'learner-application-progress__icon', state === 'complete' ? '✓' : state === 'current' ? '●' : '○');
    icon.setAttribute('aria-hidden', 'true');
    item.appendChild(icon);
    item.appendChild(element('span', '', label));
    item.setAttribute('aria-label', label + ': ' + (state === 'complete' ? 'completed' : state === 'current' ? 'current' : 'future, not yet confirmed'));
    if (state === 'current') item.setAttribute('aria-current', 'step');
    return item;
  }
  function renderStages(application, code) {
    const positions = { OFFERED: 1, ACCEPTED: 1, DEPOSIT_DUE: 2, PAYMENT_CONFIRMING: 2, RESERVED: 3, COHORT_POSTPONED: 3, BALANCE_DUE: 4, BALANCE_OVERDUE_IN_GRACE: 4, BALANCE_EXTENDED: 4, BALANCE_CONFIRMING: 4, ACTIVATION_PENDING: 5, ACTIVE: view.courseHubHref(application) ? 6 : 5 };
    const current = positions[code];
    if (current === undefined) return null;
    const progress = element('ol', 'learner-application-progress', '');
    progress.setAttribute('aria-label', 'Learning journey stages');
    ['Application', 'Decision', 'Deposit', 'Cohort', 'Remaining fee', 'Enrolled', 'Course access'].forEach((label, index) => {
      const state = index < current ? 'complete' : index === current ? 'current' : 'pending';
      progress.appendChild(stageItem(label, state));
    });
    return progress;
  }
  function renderJourney(application, timeZone, suppressCommunicationWarning, headingTag) {
    const card = element('article', 'learner-application-card', '');
    const title = application.course && application.course.title || 'Course';
    const action = application.action || {};
    const presentation = view.resolvePresentation(application);
    card.setAttribute('aria-label', title + ' learning journey');
    if (action.code === 'APPLICATION_RECEIVED' || action.code === 'UNDER_REVIEW') card.className += ' learner-application-card--waiting';
    card.setAttribute('data-journey-group', presentation.primaryAction ? 'attention' : ['DECLINED', 'WITHDRAWN', 'REFUNDED', 'CLOSED_NON_PAYMENT', 'COHORT_CANCELLED'].includes(presentation.journeyStage) ? 'past' : 'progress');
    card.appendChild(element('p', 'learning-status-marker', presentation.marker));
    const courseHeading = element(headingTag || 'h2', 'learner-course-title', title); courseHeading.tabIndex = -1; card.appendChild(courseHeading);
    card.appendChild(element('p', 'learner-status-badge', 'Status: ' + presentation.heading));
    card.appendChild(element('p', '', presentation.explanation));
    if (action.code === 'APPLICATION_RECEIVED' || action.code === 'UNDER_REVIEW') {
      const progress = element('ol', 'learner-application-progress', '');
      progress.setAttribute('aria-label', 'Application progress');
      const stages = action.code === 'UNDER_REVIEW'
        ? [['Submitted', 'complete'], ['Under review', 'current'], ['Decision', 'pending']]
        : [['Submitted', 'complete'], ['Awaiting review', 'current'], ['Decision', 'pending']];
      stages.forEach(([label, state]) => {
        progress.appendChild(stageItem(label, state));
      });
      card.appendChild(progress);
    } else { const stages = renderStages(application, presentation.journeyStage); if (stages) card.appendChild(stages); }
    const date = importantDate(application, timeZone);
    if (date) card.appendChild(element('p', 'learning-deadline', date));

    const applicationDetails = disclosure('Application');
    const paymentDetails = disclosure('Payments');
    const cohortDetails = disclosure('Cohort and enrolment');
    const requestDetails = disclosure('Requests and refunds');
    addDetail(applicationDetails.list, 'Application reference', application.reference);
    addDetail(applicationDetails.list, 'Submitted', dateTime(application.submittedAt, timeZone));
    addDetail(applicationDetails.list, 'Last updated', dateTime(application.updatedAt, timeZone));
    const gate2 = application.gate2;
    if (gate2) {
      const enrolment = gate2.enrolment || {};
      addDetail(cohortDetails.list, 'Place status', view.gate2StatusLabel('enrolment', enrolment.status));
      if (gate2.learnerChange) {
        const decision = gate2.learnerChange.decision ? ' · ' + view.gate2StatusLabel('decision', gate2.learnerChange.decision) : '';
        addDetail(requestDetails.list, 'Organiser decision', view.gate2StatusLabel('request', gate2.learnerChange.status) + decision);
      }
      if (gate2.refund) addDetail(requestDetails.list, 'Refund execution', view.gate2StatusLabel('refund', gate2.refund.status));
    }
    const gate3 = application.gate3;
    if (gate3) {
      addDetail(cohortDetails.list, 'Cohort status', view.gate3StatusLabel('decision', gate3.cohortDecision));
      if (gate3.schedule) addDetail(cohortDetails.list, 'Final schedule', dateTime(gate3.schedule.startsAt, timeZone) + ' to ' + dateTime(gate3.schedule.endsAt, timeZone));
      addDetail(paymentDetails.list, 'Remaining fee', view.gate3StatusLabel('balance', gate3.balanceStatus));
      addDetail(paymentDetails.list, 'Amount due', money(gate3.amountDue, gate3.currency));
      addDetail(paymentDetails.list, 'Approved credit or waiver', money(gate3.creditAmount, gate3.currency));
      addDetail(paymentDetails.list, 'Original payment deadline', dateTime(gate3.balanceDeadline, timeZone));
      addDetail(paymentDetails.list, 'Grace ends', dateTime(gate3.graceUntil, timeZone));
      addDetail(paymentDetails.list, 'Approved extension ends', dateTime(gate3.extensionUntil, timeZone));
      addDetail(cohortDetails.list, 'Seat status', gate3.seatReleased === true ? 'Released' : gate3.seatReserved === true ? 'Reserved' : null);
      addDetail(cohortDetails.list, 'Enrolment activation', view.gate3StatusLabel('activation', gate3.activationStatus));
      addDetail(cohortDetails.list, 'Course area', gate3.activationStatus === 'ACTIVE' ? (view.courseHubHref(application) ? 'Ready' : 'We will email you when it is available') : null);
      if (gate3.depositDispositionOutcome) addDetail(paymentDetails.list, 'Deposit treatment', view.gate3StatusLabel('disposition', gate3.depositDispositionOutcome));
      if (gate3.balanceStatus === 'OVERDUE_IN_GRACE') card.appendChild(element('p', 'field-hint', 'The remaining fee is overdue, but your seat is still reserved during the current grace period.'));
      if (gate3.balanceStatus === 'CONFIRMING') card.appendChild(element('p', 'field-hint', 'Payment confirmation is in progress. Do not pay again.'));
      if (gate3.balanceStatus === 'CLOSED_NON_PAYMENT') card.appendChild(element('p', 'field-hint', 'The seat has been released. A normal payment cannot reactivate this enrolment automatically.'));
      if (gate3.balanceStatus === 'ACTION_NEEDED') card.appendChild(element('p', 'field-hint', 'A payment needs organiser review and does not activate the enrolment automatically. Do not pay again.'));
    }
    const correction = view.correctionHref(application);
    if (correction) {
      const edit = element('a', 'learner-edit-application', 'Edit application');
      edit.href = correction;
      edit.setAttribute('aria-label', 'Edit application for ' + title);
      applicationDetails.details.appendChild(edit);
      applicationDetails.details.appendChild(element('p', 'field-hint', 'Changes apply only after you submit an update.'));
    }
    [applicationDetails, paymentDetails, cohortDetails, requestDetails].forEach((group) => { if (group.list.children.length) card.appendChild(group.details); });
    const next = presentation.primaryAction || journeyHref(application);
    if (next) {
      const linkLabel = next.correction ? 'View application' : next.label;
      const link = element('a', 'btn btn-secondary learner-journey-link', linkLabel);
      link.href = next.href;
      link.setAttribute('aria-label', linkLabel + ' for ' + title);
      card.appendChild(link);
      if (next.correction) card.appendChild(element('p', 'field-hint', 'Viewing is optional and does not change your application.'));
    }
    if (!suppressCommunicationWarning && communicationFailed(application)) card.appendChild(element('p', 'learner-communication-warning', 'We could not confirm that the latest email was delivered. Your learning status shown above is unchanged.'));
    return card;
  }
  function communicationFailed(application) {
    return Boolean(application && (application.communication && application.communication.status === 'FAILED'
      || application.gate2 && application.gate2.communication && application.gate2.communication.status === 'FAILED'
      || application.gate3 && application.gate3.communication && application.gate3.communication.status === 'FAILED'));
  }
  function applicationForCurrentAction(summary, applications) {
    const code = summary.currentAction && summary.currentAction.code;
    const backendPrioritised = applications[0];
    return backendPrioritised && view.presentationCode(backendPrioritised) === code ? backendPrioritised : null;
  }
  function renderCurrent(summary, applications, timeZone) {
    currentAction.replaceChildren();
    currentAction.hidden = true;
    if (applications.length === 1) return null;

    const failed = applications.filter(communicationFailed);
    if (failed.length) {
      const names = failed.map((application) => application.course && application.course.title || 'a course').join(', ');
      currentAction.appendChild(element('p', 'learning-status-marker', 'Email delivery warning'));
      const heading = element('h2', '', 'Check your status here'); heading.tabIndex = -1; currentAction.appendChild(heading);
      currentAction.appendChild(element('p', '', 'We could not confirm delivery of the latest email for ' + names + '. Your learning status shown below is unchanged.'));
      currentAction.hidden = false;
      return heading;
    }

    const reportedAction = summary.currentAction || {};
    const action = !summary.learner && applications.length === 0 && reportedAction.code === 'COMPLETE_PROFILE'
      ? { code: 'APPLY', href: '/training/' }
      : reportedAction;
    const authoritative = applicationForCurrentAction(summary, applications);
    const resolved = authoritative && view.resolvePresentation(authoritative);
    if (applications.length > 1 && (!resolved || (!resolved.primaryAction && resolved.marker !== 'Needs your attention'))) return null;
    const gate2 = authoritative && authoritative.gate2 ? authoritative : null;
    const gate3 = authoritative && authoritative.gate3 ? authoritative : null;
    const offered = authoritative && action.code === 'OFFERED' ? authoritative : null;
    const href2 = view.gate2Href(gate2);
    const href3 = view.courseHubHref(gate3) || view.gate3Href(gate3);
    const offerHref = view.offerPaymentHref(offered);
    const isSupported = view.isV1ActionCode(action.code) && (action.code === 'OFFERED' ? Boolean(offerHref) : view.isGate2ActionCode(action.code) ? Boolean(gate2 && href2) : view.isGate3ActionCode(action.code) ? Boolean(gate3) : true);
    const presentation = view.statusPresentation(action.code);
    currentAction.hidden = false;
    currentAction.appendChild(element('p', 'learning-status-marker', applications.length ? 'Needs your attention' : 'Get started'));
    const heading = element('h2', '', isSupported ? presentation.heading : 'View your current learning status');
    heading.tabIndex = -1;
    currentAction.appendChild(heading);
    if (authoritative && authoritative.course && authoritative.course.title) currentAction.appendChild(element('p', 'learner-notification-course', 'For ' + authoritative.course.title));
    currentAction.appendChild(element('p', '', isSupported ? presentation.explanation : 'The latest authorised status is shown below. Refresh or contact support if you cannot identify the next step.'));
    const date = importantDate(gate3 || gate2, timeZone);
    if (date) currentAction.appendChild(element('p', 'learning-deadline', date));
    const href = gate3 ? href3 : gate2 ? href2 : offerHref || view.safeActionHref(action.href);
    const primaryLabel = view.courseHubHref(gate3) ? 'Open your course area' : presentation.actionLabel;
    if (isSupported && href && primaryLabel) {
      const link = element('a', 'btn btn-primary btn-learning', primaryLabel);
      link.href = href;
      currentAction.appendChild(link);
    }
    return heading;
  }
  function renderProfile(learner) {
    profileDetails.replaceChildren();
    profileEmpty.hidden = Boolean(learner);
    if (!learner) return;
    const identity = document.createElement('dl'); identity.className = 'learner-profile-identity';
    addDetail(identity, 'Verified email', learner.verifiedEmail);
    addDetail(identity, 'Full name', learner.fullName);
    addDetail(identity, 'Timezone', view.timeZoneLabel(learner.timezone));
    profileDetails.appendChild(identity);
    const records = disclosure('Consent and policy records');
    addDetail(records.list, 'Adult eligibility', view.booleanLabel(learner.adultEligibilityConfirmed, 'Confirmed', 'Not confirmed'));
    addDetail(records.list, 'Agreements on record', view.acknowledgementLabel(learner.acknowledgements));
    if (learner.promotionalConsent !== undefined && learner.promotionalConsent !== null) addDetail(records.list, 'Promotional consent', view.booleanLabel(learner.promotionalConsent, 'Recorded', 'Not recorded'));
    profileDetails.appendChild(records.details);
  }
  function renderSummary(summary) {
    const applications = Array.isArray(summary.applications) ? summary.applications : [];
    const timeZone = view.safeTimeZone(summary.learner && summary.learner.timezone);
    const notificationHeading = renderCurrent(summary, applications, timeZone);
    applicationList.replaceChildren();
    let firstCourseHeading = null;
    if (applications.length > 1) {
      const suppressWarnings = applications.some(communicationFailed);
      const cards = applications.map((application) => renderJourney(application, timeZone, suppressWarnings, 'h3'));
      firstCourseHeading = cards[0] && Array.from(cards[0].children).find((child) => child.className === 'learner-course-title');
      [['attention', 'Needs your attention'], ['progress', 'In progress'], ['past', 'Past applications and courses']].forEach(([group, label]) => {
        const matching = cards.filter((card) => card.getAttribute('data-journey-group') === group);
        if (!matching.length) return;
        const section = element('section', 'learner-journey-group', ''); section.appendChild(element('h2', '', label)); matching.forEach((card) => section.appendChild(card)); applicationList.appendChild(section);
      });
    } else if (applications.length) {
      const card = renderJourney(applications[0], timeZone, false);
      firstCourseHeading = Array.from(card.children).find((child) => child.className === 'learner-course-title');
      applicationList.appendChild(card);
    }
    const support = summary.support || {};
    supportLink.href = view.safeSupportHref(support.supportUrl, '/contact/');
    privacyLink.href = view.safeSupportHref(support.privacyUrl, '/privacy/');
    grievanceLink.href = view.safeSupportHref(support.grievanceUrl, '/training/policies/#support-and-grievance-process');
    renderProfile(summary.learner);
    return notificationHeading || firstCourseHeading;
  }
  async function initialise(focusAfterLoad) {
    shell.hidden = true; userLabel.textContent = ''; currentAction.replaceChildren(); applicationList.replaceChildren(); profileDetails.replaceChildren(); profileEmpty.hidden = true;
    retryButton.disabled = true; errorActions.hidden = true; status.textContent = 'Checking your secure session…'; status.hidden = false;
    try {
      const user = await auth.restore(); if (!user) { window.location.replace(loginUrl()); return; }
      const summary = await auth.request('/me/learning-summary', { method: 'GET' });
      userLabel.textContent = user.emailId || 'Learner session'; const focusTarget = renderSummary(summary); shell.hidden = false; status.hidden = true;
      if (focusAfterLoad && focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
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
  retryButton.addEventListener('click', () => initialise(true));
  window.sjLearnerShell = { initialise, renderJourney, renderSummary };
  if (!window.__SJ_DISABLE_AUTO_INIT__) initialise();
}());
