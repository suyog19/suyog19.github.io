(function () {
  const form     = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');

  if (!form || !statusEl) return;

  const LEARNING_CONTEXTS = Object.freeze({
    'learning-course-selection': {
      note: 'Course selection question: explain your current Python experience and what you want to learn. Do not include passwords or private account information.',
      prompt: 'I would like help choosing the right Software Signal course. My current Python experience and learning goal are: ',
    },
    'learning-application': {
      note: 'Application help: describe the step that is blocked. Do not include a one-time code, access token or private application reference.',
      prompt: 'I need help with my Software Signal application. The step that is blocked is: ',
    },
    'learning-payment-review': {
      note: 'Payment review: do not pay again while review is pending. Describe what the page currently says; do not include card, bank, UPI PIN or full payment-reference details.',
      prompt: 'My Software Signal payment status needs review. The current learner-facing status says: ',
    },
    'learning-course-access': {
      note: 'Course access: your enrolment status is not changed by this message. Tell us which course and what access detail you expected; do not paste private meeting, file or payment links.',
      prompt: 'My Software Signal enrolment is active and I need help with course access. I expected to see: ',
    },
  });

  function applyLearningContext(search) {
    const topic = new URLSearchParams(search || '').get('topic');
    const context = LEARNING_CONTEXTS[topic];
    if (!context) return false;
    const box = document.getElementById('learning-contact-context');
    const message = document.getElementById('message');
    box.textContent = context.note;
    box.hidden = false;
    if (!message.value) message.value = context.prompt;
    document.getElementById('message-hint').textContent = 'Add only the context needed to help. Remove anything sensitive before sending.';
    return true;
  }

  const API_BASE_URL =
    (window.location.hostname === 'dev.suyogjoshi.com' ||
     window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1')
      ? 'https://api-dev.suyogjoshi.com'
      : 'https://api.suyogjoshi.com';

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
    } else if (message.length > 5000) {
      setError('message', 'Message must be 5000 characters or fewer.');
      valid = false;
    }

    return valid;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    statusEl.className = 'form-status';
    statusEl.textContent = '';

    if (!validate()) return;

    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(API_BASE_URL + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    document.getElementById('name').value.trim(),
          email:   document.getElementById('email').value.trim(),
          message: document.getElementById('message').value.trim(),
          type:    'contact',
          source:  'contact_page',
          website: '',
        }),
      });

      const data = await res.json();

      if (res.status === 202) {
        statusEl.textContent = "Thanks — I’ll be in touch!";
        statusEl.classList.add('is-success');
        form.reset();
        form.querySelector('input, textarea, button').focus();
      } else if (res.status === 400 && data.error === 'VALIDATION_FAILED' && data.fields) {
        Object.entries(data.fields).forEach(function ([field, msg]) {
          setError(field, msg);
        });
      } else {
        statusEl.textContent = 'Something went wrong — please try again or email me directly at contact@suyogjoshi.com.';
        statusEl.classList.add('is-error');
      }
    } catch (_) {
      statusEl.textContent = 'Something went wrong — please try again or email me directly at contact@suyogjoshi.com.';
      statusEl.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  form.querySelectorAll('input, textarea').forEach(function (field) {
    field.addEventListener('input', function () {
      clearError(field.id);
    });
  });
  applyLearningContext(window.location.search);
  window.sjContact = { applyLearningContext, isValidEmail };
}());
