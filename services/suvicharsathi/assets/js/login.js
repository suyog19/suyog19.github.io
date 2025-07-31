/**
 * Login page JavaScript
 * Handles OTP-based user login
 */

document.addEventListener('DOMContentLoaded', function() {
  // Redirect if already authenticated
  if (api.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const loginOtpForm = document.getElementById('loginOtpForm');
  const sendLoginOtpBtn = document.getElementById('sendLoginOtpBtn');
  const verifyLoginOtpBtn = document.getElementById('verifyLoginOtpBtn');
  const resendLoginOtpBtn = document.getElementById('resendLoginOtpBtn');
  const editLoginPhoneBtn = document.getElementById('editLoginPhoneBtn');
  
  let currentPhoneNumber = '';
  let resendTimer = 60;
  let resendInterval = null;

  // Login form submission
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const phoneNumber = document.getElementById('loginPhone').value.trim();

    // Validation
    if (!api.isValidPhoneNumber(phoneNumber)) {
      showAlert('Please enter a valid 10-digit phone number', 'danger');
      return;
    }

    showLoading(sendLoginOtpBtn, true);

    try {
      const formattedPhone = api.formatPhoneNumber(phoneNumber);
      const result = await api.sendLoginOTP(formattedPhone);

      if (result.success) {
        currentPhoneNumber = formattedPhone;
        document.getElementById('loginPhoneDisplay').textContent = formattedPhone;
        
        // Switch to OTP form
        loginForm.style.display = 'none';
        loginOtpForm.style.display = 'block';
        
        showAlert('Login OTP sent successfully! Please check your WhatsApp.', 'success');
        startResendTimer();
        
        // Focus on OTP input
        document.getElementById('loginOtpCode').focus();
      } else {
        if (result.error.includes('not found') || result.error.includes('not registered')) {
          showAlert('Phone number not registered. Please register first.', 'warning');
          setTimeout(() => {
            window.location.href = 'register.html';
          }, 2000);
        } else {
          showAlert(result.error || 'Failed to send OTP. Please try again.', 'danger');
        }
      }
    } catch (error) {
      showAlert('Network error. Please check your connection and try again.', 'danger');
    } finally {
      showLoading(sendLoginOtpBtn, false);
    }
  });

  // Login OTP verification form submission
  loginOtpForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const otpCode = document.getElementById('loginOtpCode').value.trim();

    if (!otpCode || otpCode.length !== 6) {
      showAlert('Please enter a valid 6-digit OTP', 'danger');
      return;
    }

    showLoading(verifyLoginOtpBtn, true);

    try {
      const result = await api.verifyLoginOTP(currentPhoneNumber, otpCode);

      if (result.success) {
        // Store user data
        api.saveUserData(result.data.user);
        
        showAlert('Login successful! Welcome back! 🎉', 'success');
        
        // Check if user has a subscription
        const subscriptionResult = await api.getCurrentSubscription();
        if (subscriptionResult.success && subscriptionResult.data) {
          api.saveSubscriptionData(subscriptionResult.data);
        }
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        showAlert(result.error || 'Invalid OTP. Please try again.', 'danger');
        document.getElementById('loginOtpCode').value = '';
        document.getElementById('loginOtpCode').focus();
      }
    } catch (error) {
      showAlert('Network error. Please check your connection and try again.', 'danger');
    } finally {
      showLoading(verifyLoginOtpBtn, false);
    }
  });

  // Resend login OTP button
  resendLoginOtpBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (resendTimer > 0) return;

    showLoading(resendLoginOtpBtn, true);

    try {
      const result = await api.resendOTP(currentPhoneNumber, 'login');

      if (result.success) {
        showAlert('OTP resent successfully!', 'success');
        startResendTimer();
      } else {
        showAlert(result.error || 'Failed to resend OTP. Please try again.', 'danger');
      }
    } catch (error) {
      showAlert('Network error. Please try again.', 'danger');
    } finally {
      showLoading(resendLoginOtpBtn, false);
    }
  });

  // Edit phone number button
  editLoginPhoneBtn.addEventListener('click', function() {
    loginOtpForm.style.display = 'none';
    loginForm.style.display = 'block';
    clearResendTimer();
    document.getElementById('loginOtpCode').value = '';
    document.getElementById('loginPhone').focus();
  });

  // OTP input formatting
  const otpInput = document.getElementById('loginOtpCode');
  otpInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) value = value.slice(0, 6);
    e.target.value = value;
    
    // Auto-submit when 6 digits entered
    if (value.length === 6) {
      setTimeout(() => {
        loginOtpForm.dispatchEvent(new Event('submit'));
      }, 500);
    }
  });

  // Phone number input formatting
  const phoneInput = document.getElementById('loginPhone');
  phoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    e.target.value = value;
  });

  // Auto-focus on phone input
  phoneInput.focus();

  // Resend timer functions
  function startResendTimer() {
    resendTimer = 60;
    resendLoginOtpBtn.disabled = true;
    updateResendButtonText();
    
    resendInterval = setInterval(() => {
      resendTimer--;
      updateResendButtonText();
      
      if (resendTimer <= 0) {
        clearResendTimer();
      }
    }, 1000);
  }

  function clearResendTimer() {
    if (resendInterval) {
      clearInterval(resendInterval);
      resendInterval = null;
    }
    resendTimer = 0;
    resendLoginOtpBtn.disabled = false;
    updateResendButtonText();
  }

  function updateResendButtonText() {
    const timerSpan = document.getElementById('resendLoginTimer');
    if (resendTimer > 0) {
      timerSpan.textContent = resendTimer;
      resendLoginOtpBtn.classList.add('disabled');
    } else {
      resendLoginOtpBtn.innerHTML = 'Resend OTP';
      resendLoginOtpBtn.classList.remove('disabled');
    }
  }

  // Handle browser back button
  window.addEventListener('popstate', function() {
    if (loginOtpForm.style.display === 'block') {
      // If on OTP form, go back to login form
      editLoginPhoneBtn.click();
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', function() {
    clearResendTimer();
  });

  // Handle paste in OTP field
  otpInput.addEventListener('paste', function(e) {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const otpValue = paste.replace(/\D/g, '').slice(0, 6);
    otpInput.value = otpValue;
    
    if (otpValue.length === 6) {
      setTimeout(() => {
        loginOtpForm.dispatchEvent(new Event('submit'));
      }, 500);
    }
  });

  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Escape key to go back to login form
    if (e.key === 'Escape' && loginOtpForm.style.display === 'block') {
      editLoginPhoneBtn.click();
    }
  });

  // Check for registration success redirect
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('registered') === 'true') {
    showAlert('Registration successful! Please login with your phone number.', 'success');
  }
});
