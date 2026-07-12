(function () {
  'use strict';
  const auth = window.sjLearnerAuth;
  const destination = auth.safeDestination(new URLSearchParams(window.location.search).get('continue'));
  const emailForm = document.getElementById('learner-email-form');
  const otpForm = document.getElementById('learner-otp-form');
  const email = document.getElementById('learner-email');
  const otp = document.getElementById('learner-otp');
  const status = document.getElementById('learner-auth-status');
  const resend = document.getElementById('learner-resend');
  const changeEmail = document.getElementById('learner-change-email');
  let emailId = '';
  let pending = false;
  let registrationAttempted = false;

  function message(text, tone) {
    status.textContent = text || '';
    status.className = 'learner-status' + (tone ? ' is-' + tone : '');
    status.hidden = !text;
  }

  function busy(value) {
    pending = value;
    Array.from(document.querySelectorAll('.learner-auth-card button')).forEach((button) => { button.disabled = value; });
  }

  function friendly(error) {
    if (error.status === 401) return 'That code is invalid, expired, or already used. Request a new code and try again.';
    if (error.status === 403) return 'This account cannot continue. Contact support if you believe this is an error.';
    if (!error.status) return 'We could not reach the service. Check your connection and try again.';
    if (error.status === 429) return 'Too many attempts. Please wait before trying again.';
    return 'We could not complete that request. Please try again.';
  }

  async function sendCode() {
    if (pending) return;
    busy(true);
    message('', '');
    try {
      if (!registrationAttempted) {
        try {
          await auth.request('/auth/register', {
            method: 'POST', body: JSON.stringify({ emailId }),
          });
        } catch (_) {
          // Registration and OTP request are deliberately indistinguishable.
          // Always continue to the generic OTP endpoint so account state cannot
          // be inferred from client request count, timing, or status handling.
        }
        registrationAttempted = true;
      }
      await auth.request('/auth/otp/request', { method: 'POST', body: JSON.stringify({ emailId }) });
      emailForm.hidden = true;
      otpForm.hidden = false;
      otp.value = '';
      otp.focus();
      message('If this email can continue, a 6 digit code has been sent.', 'success');
    } catch (error) { message(friendly(error), 'error'); }
    finally { busy(false); }
  }

  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    emailId = email.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId)) {
      message('Enter a valid email address.', 'error');
      email.focus();
      return;
    }
    await sendCode();
  });

  otpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = otp.value.trim();
    if (!/^\d{6}$/.test(code)) {
      message('Enter the 6 digit code from your email.', 'error');
      otp.focus();
      return;
    }
    busy(true);
    try {
      const data = await auth.request('/auth/otp/verify', {
        method: 'POST', body: JSON.stringify({ emailId, otp: code }),
      });
      auth.saveSession(data.accessToken, data.user);
      window.location.assign(destination);
    } catch (error) {
      otp.value = '';
      message(friendly(error), 'error');
      otp.focus();
    } finally { busy(false); }
  });

  resend.addEventListener('click', sendCode);
  changeEmail.addEventListener('click', () => {
    otpForm.hidden = true;
    emailForm.hidden = false;
    otp.value = '';
    registrationAttempted = false;
    message('', '');
    email.focus();
  });

  (async function initialise() {
    try {
      if (await auth.restore()) window.location.replace(destination);
    } catch (error) {
      if (error.status && error.status !== 401 && error.status !== 403) message(friendly(error), 'error');
    }
    email.focus();
  }());
}());
