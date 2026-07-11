(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const shell = document.getElementById('learner-shell');
  const status = document.getElementById('learner-shell-status');
  const userLabel = document.getElementById('learner-user-label');
  const logoutButton = document.getElementById('learner-logout');
  const currentAction = document.getElementById('learner-current-action');
  const applicationList = document.getElementById('learner-applications');
  const profileDetails = document.getElementById('learner-profile-details');

  function loginUrl() {
    return '/learn/?continue=' + encodeURIComponent(window.location.pathname + window.location.search);
  }

  async function initialise() {
    try {
      const user = await auth.restore();
      if (!user) { window.location.replace(loginUrl()); return; }
      userLabel.textContent = user.emailId || 'Learner session';
      const summary = await auth.request('/me/learning-summary', { method: 'GET' });
      renderSummary(summary);
      shell.hidden = false;
      status.hidden = true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) { window.location.replace(loginUrl()); return; }
      status.textContent = 'My Learning is temporarily unavailable. Check your connection and retry.';
      status.hidden = false;
    }
  }

  function textElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text || '';
    return element;
  }

  function safeActionHref(value) {
    if (typeof value !== 'string') return '/my-learning/';
    return ['/my-learning/', '/training/', '/contact/'].includes(value) ? value : '/my-learning/';
  }

  function renderSummary(summary) {
    currentAction.replaceChildren();
    const action = summary.currentAction || {};
    currentAction.appendChild(textElement('p', 'eyebrow', 'Next action'));
    currentAction.appendChild(textElement('h2', '', action.label || 'My Learning'));
    const actionLink = textElement('a', 'btn btn-primary', action.label || 'Continue');
    actionLink.href = safeActionHref(action.href);
    currentAction.appendChild(actionLink);

    applicationList.replaceChildren();
    const applications = Array.isArray(summary.applications) ? summary.applications : [];
    if (!applications.length) {
      applicationList.appendChild(textElement('p', 'learner-empty', 'No current application yet.'));
    }
    applications.forEach((application) => {
      const card = textElement('article', 'learner-application-card', '');
      card.appendChild(textElement('p', 'eyebrow', application.course && application.course.title));
      card.appendChild(textElement('h2', '', application.action && application.action.label));
      card.appendChild(textElement('p', '', 'Reference: ' + (application.reference || 'Available in support records')));
      if (application.offer) {
        card.appendChild(textElement('p', 'learner-offer-note', 'A cohort offer is available. No payment workflow is enabled in Gate 1.'));
      }
      if (application.communication && application.communication.status === 'FAILED') {
        card.appendChild(textElement('p', 'learner-communication-warning', 'A status message could not be confirmed. Your application status above is unchanged; contact support if you need help.'));
      }
      applicationList.appendChild(card);
    });

    profileDetails.replaceChildren();
    const learner = summary.learner;
    if (!learner) {
      profileDetails.appendChild(textElement('p', '', 'Complete your learner profile to apply.'));
      return;
    }
    addDetail('Verified email', learner.verifiedEmail);
    addDetail('Full name', learner.fullName);
    addDetail('Timezone', learner.timezone);
    addDetail('Adult eligibility', learner.adultEligibilityConfirmed ? 'Confirmed' : 'Not confirmed');
    const acknowledgements = Array.isArray(learner.acknowledgements) ? learner.acknowledgements : [];
    const acknowledgementLabels = {
      'software-signal-terms-privacy': 'Terms and privacy',
      'software-signal-recorded-delivery': 'Recorded class delivery',
    };
    addDetail('Required acknowledgements', acknowledgements.length ? acknowledgements.map((item) => (acknowledgementLabels[item.documentId] || 'Required policy') + ' version ' + item.version).join(', ') : 'Not recorded');
    addDetail('Promotional consent', learner.promotionalConsent ? 'Recorded' : 'Not used');
  }

  function addDetail(label, value) {
    profileDetails.appendChild(textElement('dt', '', label));
    profileDetails.appendChild(textElement('dd', '', value || 'Not available'));
  }

  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    const revoked = await auth.logout();
    if (revoked) {
      window.location.replace('/learn/');
      return;
    }
    shell.hidden = true;
    status.textContent = 'Signed out on this device, but the service could not confirm server sign-out. Close this browser window on a shared device and contact support if this continues.';
    status.hidden = false;
  });
  initialise();
}());
