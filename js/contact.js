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

  const CONSULTING_CONTEXTS = Object.freeze({
    'consulting-advisory': {
      offer: 'engineering_advisory_session',
      note: 'Engineering Advisory Session enquiry: share the decision you are facing and what a useful outcome would look like. Do not include passwords, secrets, or confidential material at this stage.',
      prompt: 'I would like help with an Engineering Advisory Session. The decision or problem I am facing is: ',
    },
    'consulting-repository-review': {
      offer: 'repository_ai_readiness_review',
      note: 'Repository AI-Readiness Review enquiry: describe the concern or decision that prompted the review. Detailed access is requested only after fit and scope are established; do not paste private repository links, credentials, or confidential material.',
      prompt: 'I would like to discuss a Repository AI-Readiness Review. The concern or decision that prompted it is: ',
    },
    'consulting-help-choose': {
      offer: 'help_choose',
      note: 'Not sure which offer fits? Describe the engineering decision or concern and the outcome you need. Do not include passwords, secrets, private repository links, or confidential material at this stage.',
      prompt: 'I am not sure which Consulting offer fits. The decision or engineering problem I want to move forward is: ',
    },
  });

  const WEBSITE_SERVICE_CONTEXTS = Object.freeze({
    'website-services-landing': { service: 'landing_campaign_page', note: 'Landing / Campaign Page enquiry: share what you are promoting, who it is for, and the action the page should support. Do not include passwords, account access, or confidential customer data.', prompt: 'I would like to discuss a Landing / Campaign Page. My work or business, current situation, and the outcome I want are: ' },
    'website-services-starter': { service: 'starter_presence', note: 'Starter Presence enquiry: describe your work or business, who should find the website useful, and what visitors should do next. Do not include passwords or account access.', prompt: 'I would like to discuss a Starter Presence website. My work or business, current situation, and the outcome I want are: ' },
    'website-services-business': { service: 'business_website', note: 'Business Website enquiry: share the services, audiences, trust or enquiry needs that the website should support. Do not include passwords, account access, or confidential customer data.', prompt: 'I would like to discuss a Business Website. My business, current situation, audiences, and the outcome I want are: ' },
    'website-services-redesign': { service: 'website_redesign', note: 'Website Redesign enquiry: explain what the current site no longer does well. You may include its public URL in your message, but do not include credentials or private access links.', prompt: 'I would like to discuss a Website Redesign. My current situation, what should improve, and my existing public website URL if relevant are: ' },
    'website-services-care': { service: 'website_care', note: 'Website Care enquiry: describe the website platform if known and the maintenance help you need. Do not include credentials, private dashboards, or access links.', prompt: 'I would like to discuss Website Care. My website, current maintenance situation, and the help I need are: ' },
    'website-services-help-choose': { service: 'help_choose', note: 'Not sure which website option fits? Describe your work or business, current situation, and what the website should help achieve. Do not include passwords, account access, or confidential customer data.', prompt: 'I am not sure which Website Services option fits. My work or business, current situation, and the outcome I want are: ' },
  });

  let activeConsultingContext = null;
  let activeWebsiteServiceContext = null;
  let consultingStartTracked = false;
  let websiteServiceStartTracked = false;

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

  function emitConsultingEvent(name) {
    if (!activeConsultingContext || typeof window.gtag !== 'function') return false;
    window.gtag('event', name, {
      offer: activeConsultingContext.offer,
      source_page: 'contact',
    });
    return true;
  }

  function applyConsultingContext(search) {
    const topic = new URLSearchParams(search || '').get('topic');
    const context = CONSULTING_CONTEXTS[topic];
    if (!context) return false;
    const box = document.getElementById('learning-contact-context');
    const message = document.getElementById('message');
    activeConsultingContext = context;
    box.textContent = context.note;
    box.hidden = false;
    if (!message.value) message.value = context.prompt;
    document.getElementById('message-hint').textContent = 'Add only the context needed to understand the problem. Remove anything sensitive before sending.';
    return true;
  }

  function emitWebsiteServiceEvent(name) {
    if (!activeWebsiteServiceContext || typeof window.gtag !== 'function') return false;
    window.gtag('event', name, { service: activeWebsiteServiceContext.service, source_page: 'contact' });
    return true;
  }

  function applyWebsiteServiceContext(search) {
    const topic = new URLSearchParams(search || '').get('topic');
    const context = WEBSITE_SERVICE_CONTEXTS[topic];
    if (!context) return false;
    const box = document.getElementById('learning-contact-context');
    const message = document.getElementById('message');
    activeWebsiteServiceContext = context;
    box.textContent = context.note;
    box.hidden = false;
    if (!message.value) message.value = context.prompt;
    document.getElementById('message-hint').textContent = 'Add only the context needed to understand your website goal. Remove anything sensitive before sending.';
    return true;
  }

  function apiBaseUrl(hostname) {
    if (hostname === 'dev.suyogjoshi.com' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') {
      return 'https://api-dev.suyogjoshi.com';
    }
    if (hostname === 'suyogjoshi.com' || hostname === 'www.suyogjoshi.com') return 'https://api.suyogjoshi.com';
    return '';
  }
  const API_BASE_URL = apiBaseUrl(window.location.hostname);

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
    } else if (activeConsultingContext && message.startsWith(activeConsultingContext.prompt.trimEnd()) && message.slice(activeConsultingContext.prompt.trimEnd().length).trim().length < 20) {
      setError('message', 'Please add at least 20 characters describing the decision or problem.');
      valid = false;
    } else if (activeWebsiteServiceContext && message.startsWith(activeWebsiteServiceContext.prompt.trimEnd()) && message.slice(activeWebsiteServiceContext.prompt.trimEnd().length).trim().length < 20) {
      setError('message', 'Please add at least 20 characters describing your current situation and website goal.');
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

    if (!API_BASE_URL) {
      statusEl.textContent = 'This form is unavailable on this host. Please use suyogjoshi.com or email contact@suyogjoshi.com.';
      statusEl.classList.add('is-error');
      return;
    }

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
        emitConsultingEvent('consulting_enquiry_submitted');
        emitWebsiteServiceEvent('website_services_enquiry_submitted');
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
      if (activeConsultingContext && !consultingStartTracked) {
        consultingStartTracked = emitConsultingEvent('consulting_enquiry_started');
      }
      if (activeWebsiteServiceContext && !websiteServiceStartTracked) {
        websiteServiceStartTracked = emitWebsiteServiceEvent('website_services_enquiry_started');
      }
    });
  });
  applyLearningContext(window.location.search);
  applyConsultingContext(window.location.search);
  applyWebsiteServiceContext(window.location.search);
  window.sjContact = { apiBaseUrl, applyConsultingContext, applyLearningContext, applyWebsiteServiceContext, isValidEmail };
}());
