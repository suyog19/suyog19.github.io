(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const shell = document.getElementById('learner-shell');
  const status = document.getElementById('learner-shell-status');
  const userLabel = document.getElementById('learner-user-label');
  const logoutButton = document.getElementById('learner-logout');

  function loginUrl() {
    return '/learn/?continue=' + encodeURIComponent(window.location.pathname + window.location.search);
  }

  async function initialise() {
    try {
      const user = await auth.restore();
      if (!user) { window.location.replace(loginUrl()); return; }
      userLabel.textContent = user.emailId || 'Learner session';
      shell.hidden = false;
      status.hidden = true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) { window.location.replace(loginUrl()); return; }
      status.textContent = 'My Learning is temporarily unavailable. Check your connection and retry.';
      status.hidden = false;
    }
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
