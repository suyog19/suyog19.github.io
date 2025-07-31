/**
 * Registration page JavaScript
 * Handles OTP-based user registration
 */

document.addEventListener('DOMContentLoaded', function() {
  // Redirect if already authenticated
  if (api.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const registrationForm = document.getElementById('registrationForm');
  const otpForm = document.getElementById('otpForm');
  const successMessage = document.getElementById('successMessage');
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const editPhoneBtn = document.getElementById('editPhoneBtn');
  
  let currentPhoneNumber = '';
  let resendTimer = 60;
  let resendInterval = null;

  // Registration form submission
  registrationForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const email = document.getElementById('email').value.trim();

    // Validation
    if (!fullName) {
      showAlert('Please enter your full name', 'danger');
      return;
    }

    if (!api.isValidPhoneNumber(phoneNumber)) {
      showAlert('Please enter a valid 10-digit phone number', 'danger');
      return;
    }

    if (email && !api.isValidEmail(email)) {
      showAlert('Please enter a valid email address', 'danger');
      return;
    }

    showLoading(sendOtpBtn, true);

    try {
      const formattedPhone = api.formatPhoneNumber(phoneNumber);
      const result = await api.sendRegistrationOTP(formattedPhone, fullName, email);

      if (result.success) {
        currentPhoneNumber = formattedPhone;
        document.getElementById('phoneDisplay').textContent = formattedPhone;
        
        // Switch to OTP form
        registrationForm.style.display = 'none';
        otpForm.style.display = 'block';
        
        showAlert('OTP sent successfully! Please check your WhatsApp.', 'success');
        startResendTimer();
        
        // Focus on OTP input
        document.getElementById('otpCode').focus();
      } else {
        showAlert(result.error || 'Failed to send OTP. Please try again.', 'danger');
      }
    } catch (error) {
      showAlert('Network error. Please check your connection and try again.', 'danger');
    } finally {
      showLoading(sendOtpBtn, false);
    }
  });

  // OTP verification form submission
  otpForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const otpCode = document.getElementById('otpCode').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!otpCode || otpCode.length !== 6) {
      showAlert('Please enter a valid 6-digit OTP', 'danger');
      return;
    }

    showLoading(verifyOtpBtn, true);

    try {
      const result = await api.verifyRegistrationOTP(currentPhoneNumber, otpCode, fullName, email);

      if (result.success) {
        // Store user data
        api.saveUserData(result.data.user);
        
        // Show success message
        otpForm.style.display = 'none';
        successMessage.style.display = 'block';
        
        showAlert('Registration successful! Welcome to SuvicharSathi! 🎉', 'success');
        
        // Auto redirect to pricing after 3 seconds
        setTimeout(() => {
          window.location.href = 'pricing.html';
        }, 3000);
      } else {
        showAlert(result.error || 'Invalid OTP. Please try again.', 'danger');
        document.getElementById('otpCode').value = '';
        document.getElementById('otpCode').focus();
      }
    } catch (error) {
      showAlert('Network error. Please check your connection and try again.', 'danger');
    } finally {
      showLoading(verifyOtpBtn, false);
    }
  });

  // Resend OTP button
  resendOtpBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (resendTimer > 0) return;

    showLoading(resendOtpBtn, true);

    try {
      const result = await api.resendOTP(currentPhoneNumber, 'register');

      if (result.success) {
        showAlert('OTP resent successfully!', 'success');
        startResendTimer();
      } else {
        showAlert(result.error || 'Failed to resend OTP. Please try again.', 'danger');
      }
    } catch (error) {
      showAlert('Network error. Please try again.', 'danger');
    } finally {
      showLoading(resendOtpBtn, false);
    }
  });

  // Edit phone number button
  editPhoneBtn.addEventListener('click', function() {
    otpForm.style.display = 'none';
    registrationForm.style.display = 'block';
    clearResendTimer();
    document.getElementById('otpCode').value = '';
    document.getElementById('phoneNumber').focus();
  });

  // OTP input formatting
  const otpInput = document.getElementById('otpCode');
  otpInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 6) value = value.slice(0, 6);
    e.target.value = value;
    
    // Auto-submit when 6 digits entered
    if (value.length === 6) {
      setTimeout(() => {
        otpForm.dispatchEvent(new Event('submit'));
      }, 500);
    }
  });

  // Phone number input formatting
  const phoneInput = document.getElementById('phoneNumber');
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
    resendOtpBtn.disabled = true;
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
    resendOtpBtn.disabled = false;
    updateResendButtonText();
  }

  function updateResendButtonText() {
    const timerSpan = document.getElementById('resendTimer');
    if (resendTimer > 0) {
      timerSpan.textContent = resendTimer;
      resendOtpBtn.classList.add('disabled');
    } else {
      resendOtpBtn.innerHTML = 'Resend OTP';
      resendOtpBtn.classList.remove('disabled');
    }
  }

  // Handle browser back button
  window.addEventListener('popstate', function() {
    if (otpForm.style.display === 'block') {
      // If on OTP form, go back to registration form
      editPhoneBtn.click();
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
        otpForm.dispatchEvent(new Event('submit'));
      }, 500);
    }
  });

  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Escape key to go back to registration form
    if (e.key === 'Escape' && otpForm.style.display === 'block') {
      editPhoneBtn.click();
    }
    
    // Enter key on name field moves to phone
    if (e.key === 'Enter' && document.activeElement === document.getElementById('fullName')) {
      e.preventDefault();
      phoneInput.focus();
    }
    
    // Enter key on phone field moves to email
    if (e.key === 'Enter' && document.activeElement === phoneInput) {
      e.preventDefault();
      document.getElementById('email').focus();
    }
  });
});
