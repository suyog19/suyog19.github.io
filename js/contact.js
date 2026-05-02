(function () {
  const form     = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');

  if (!form || !statusEl) return;

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setError(id, message) {
    const errorEl = document.getElementById(id + '-error');
    const fieldEl = document.getElementById(id);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
    if (fieldEl) {
      fieldEl.setAttribute('aria-invalid', 'true');
      if (!fieldEl.getAttribute('aria-describedby') || !fieldEl.getAttribute('aria-describedby').includes(id + '-error')) {
        const existing = fieldEl.getAttribute('aria-describedby') || '';
        fieldEl.setAttribute('aria-describedby', (existing + ' ' + id + '-error').trim());
      }
    }
  }

  function clearError(id) {
    const errorEl = document.getElementById(id + '-error');
    const fieldEl = document.getElementById(id);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
    if (fieldEl) {
      fieldEl.removeAttribute('aria-invalid');
    }
  }

  function validate() {
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    let valid = true;

    clearError('name');
    clearError('email');
    clearError('message');

    if (!name) {
      setError('name', 'Your name is required.');
      valid = false;
    }

    if (!email) {
      setError('email', 'Your email address is required.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setError('email', 'Please enter a valid email address.');
      valid = false;
    }

    if (!message) {
      setError('message', 'A message is required.');
      valid = false;
    } else if (message.length < 20) {
      setError('message', 'Please share a bit more context — at least 20 characters.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    statusEl.className = 'form-status';
    statusEl.textContent = '';

    if (validate()) {
      statusEl.textContent = 'Thanks — the form is ready. Email sending will be connected in the next implementation phase.';
      statusEl.classList.add('is-success');
      form.reset();
      // Return focus to the top of the form for accessibility
      form.querySelector('input, textarea, button').focus();
    }
  });

  // Clear individual field errors as the user corrects their input
  form.querySelectorAll('input, textarea').forEach(function (field) {
    field.addEventListener('input', function () {
      clearError(field.id);
    });
  });
}());
