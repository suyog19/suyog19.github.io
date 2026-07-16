(function () {
  'use strict';

  const auth = window.sjLearnerAuth;
  const userLabel = document.getElementById('learner-page-user');
  const logoutButton = document.getElementById('learner-page-logout');
  if (!auth || !userLabel || !logoutButton) return;

  const user = auth.readUser();
  const email = user && typeof user.email === 'string' ? user.email.trim() : '';
  userLabel.textContent = email;
  userLabel.hidden = !email;

  logoutButton.addEventListener('click', async function () {
    logoutButton.disabled = true;
    userLabel.textContent = '';
    document.querySelectorAll('.learner-payment-panel').forEach(function (panel) { panel.hidden = true; });
    await auth.logout();
    window.location.replace('/learn/');
  });
}());
