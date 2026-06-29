(function () {
  const COMMENT_LIMIT = 1800;
  const ANONYMOUS_ID_KEY = 'sj_feedback_anonymous_id';
  const SUBMITTED_KEY_PREFIX = 'sj_feedback_widget:v1';
  const VALID_TARGET_TYPES = ['ARTICLE', 'ARTICLE_SERIES', 'SYSTEM', 'PAGE', 'MODULE'];
  const VALID_RATINGS = ['THUMBS_UP', 'THUMBS_DOWN', 'NONE'];
  const widgets = document.querySelectorAll('[data-feedback-widget]');

  if (!widgets.length) return;

  const API_BASE_URL =
    (window.location.hostname === 'dev.suyogjoshi.com' ||
     window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1')
      ? 'https://api-dev.suyogjoshi.com'
      : 'https://api.suyogjoshi.com';

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
      // Storage may be unavailable in private or restricted browsing modes.
    }
  }

  function createAnonymousId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    const randomPart = Math.random().toString(36).slice(2);
    const timePart = Date.now().toString(36);
    return 'anon-' + timePart + '-' + randomPart;
  }

  function getAnonymousId() {
    const existing = safeStorageGet(ANONYMOUS_ID_KEY);
    if (existing) {
      return existing;
    }

    const next = createAnonymousId();
    safeStorageSet(ANONYMOUS_ID_KEY, next);
    return next;
  }

  function getSubmittedKey(config) {
    return SUBMITTED_KEY_PREFIX + ':' + config.targetType + ':' + config.targetId;
  }

  function getFeedbackAuthToken() {
    if (window.sjFeedbackAuth && typeof window.sjFeedbackAuth.getToken === 'function') {
      return window.sjFeedbackAuth.getToken();
    }
    return null;
  }

  function normalizeSourcePageUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'https://suyogjoshi.com' + window.location.pathname;
    }

    return window.location.origin + window.location.pathname;
  }

  function readConfig(widget) {
    const targetType = widget.getAttribute('data-feedback-target-type');
    const targetId = widget.getAttribute('data-feedback-target-id');
    const sourceLabel = widget.getAttribute('data-feedback-source-label') || 'piece';

    return {
      targetType,
      targetId,
      sourceLabel
    };
  }

  function isValidConfig(config) {
    return VALID_TARGET_TYPES.includes(config.targetType) && Boolean(config.targetId);
  }

  function setStatus(widget, message, type) {
    const status = widget.querySelector('[data-feedback-status]');
    if (!status) return;

    status.textContent = message;
    status.classList.toggle('is-success', type === 'success');
    status.classList.toggle('is-error', type === 'error');
  }

  function setSubmitting(widget, isSubmitting) {
    const submitButton = widget.querySelector('[data-feedback-submit]');
    const buttons = widget.querySelectorAll('button');

    buttons.forEach(function (button) {
      button.disabled = isSubmitting;
    });

    if (submitButton) {
      submitButton.textContent = isSubmitting ? 'Sending...' : 'Send feedback';
    }
  }

  function updateCharacterCount(widget) {
    const textarea = widget.querySelector('[data-feedback-comment]');
    const counter = widget.querySelector('[data-feedback-count]');
    const error = widget.querySelector('[data-feedback-error]');

    if (!textarea || !counter) return true;

    const length = textarea.value.trim().length;
    const isOverLimit = length > COMMENT_LIMIT;
    counter.textContent = length + ' / ' + COMMENT_LIMIT;
    textarea.classList.toggle('is-over-limit', isOverLimit);
    textarea.setAttribute('aria-invalid', isOverLimit ? 'true' : 'false');

    if (error) {
      error.textContent = isOverLimit ? 'Please shorten your note before sending.' : '';
    }

    return !isOverLimit;
  }

  function selectRating(widget, rating) {
    if (!VALID_RATINGS.includes(rating)) return;

    const form = widget.querySelector('[data-feedback-form]');
    const choices = widget.querySelectorAll('[data-feedback-rating]');

    widget.setAttribute('data-feedback-selected-rating', rating);

    choices.forEach(function (choice) {
      const isSelected = choice.getAttribute('data-feedback-rating') === rating;
      choice.classList.toggle('is-selected', isSelected);
      choice.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    if (form) {
      form.hidden = false;
    }

    setStatus(widget, '', '');
  }

  function markSubmitted(widget, config, message) {
    safeStorageSet(getSubmittedKey(config), 'true');
    widget.classList.add('is-submitted');
    widget.innerHTML = '';

    const messageWrap = document.createElement('div');
    messageWrap.className = 'feedback-widget-thanks';

    const title = document.createElement('h2');
    title.textContent = 'Thanks for the feedback.';

    const body = document.createElement('p');
    body.textContent = message || 'I appreciate you taking a moment to share a signal on this piece.';

    messageWrap.append(title, body);
    widget.append(messageWrap);
  }

  function buildPayload(widget, config) {
    const textarea = widget.querySelector('[data-feedback-comment]');
    const comment = textarea ? textarea.value.trim() : '';
    const payload = {
      targetType: config.targetType,
      targetId: config.targetId,
      rating: widget.getAttribute('data-feedback-selected-rating') || 'NONE',
      sourcePageUrl: normalizeSourcePageUrl(),
      anonymousId: getAnonymousId(),
      website: ''
    };

    if (comment) {
      payload.comment = comment;
    }

    return payload;
  }

  async function submitFeedback(widget, config) {
    if (!updateCharacterCount(widget)) {
      setStatus(widget, 'Please shorten your note before sending.', 'error');
      return;
    }

    setSubmitting(widget, true);
    setStatus(widget, '', '');

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      const token = await getFeedbackAuthToken();

      if (token) {
        headers.Authorization = 'Bearer ' + token;
      }

      const response = await fetch(API_BASE_URL + '/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify(buildPayload(widget, config))
      });

      if (response.status === 201 || response.status === 202 || response.status === 200 || response.status === 204) {
        markSubmitted(widget, config);
        return;
      }

      if (response.status === 429) {
        markSubmitted(widget, config, 'Your feedback has already been received. Thank you.');
        return;
      }

      setStatus(widget, 'Something went wrong. Please try sending your feedback again.', 'error');
    } catch (_) {
      setStatus(widget, 'Something went wrong. Please try sending your feedback again.', 'error');
    } finally {
      if (!widget.classList.contains('is-submitted')) {
        setSubmitting(widget, false);
      }
    }
  }

  function renderWidget(widget, config) {
    const title = document.createElement('h2');
    title.className = 'feedback-widget-title';
    title.textContent = 'Was this useful?';

    const copy = document.createElement('p');
    copy.className = 'feedback-widget-copy';
    copy.textContent = 'Your feedback helps shape future writing.';

    const intro = document.createElement('div');
    intro.className = 'feedback-widget-intro';
    intro.append(title, copy);

    const choices = document.createElement('div');
    choices.className = 'feedback-widget-choices';
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Choose feedback for this ' + config.sourceLabel.toLowerCase());

    [
      ['THUMBS_UP', 'Useful'],
      ['THUMBS_DOWN', 'Not useful'],
      ['NONE', 'Leave a note']
    ].forEach(function (item) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'feedback-widget-choice';
      button.setAttribute('data-feedback-rating', item[0]);
      button.setAttribute('aria-pressed', 'false');
      button.textContent = item[1];
      choices.append(button);
    });

    const form = document.createElement('form');
    form.className = 'feedback-widget-form';
    form.setAttribute('data-feedback-form', '');
    form.hidden = true;

    const label = document.createElement('label');
    label.className = 'feedback-widget-label';
    label.setAttribute('for', 'feedback-comment-' + config.targetType.toLowerCase() + '-' + config.targetId);
    label.textContent = 'Optional context';

    const textarea = document.createElement('textarea');
    textarea.id = 'feedback-comment-' + config.targetType.toLowerCase() + '-' + config.targetId;
    textarea.className = 'feedback-widget-comment';
    textarea.setAttribute('data-feedback-comment', '');
    textarea.setAttribute('aria-describedby', textarea.id + '-hint ' + textarea.id + '-error');
    textarea.maxLength = COMMENT_LIMIT + 100;
    textarea.placeholder = 'Add a sentence about what worked, what was missing, or what you hoped to find.';

    const meta = document.createElement('div');
    meta.className = 'feedback-widget-meta';

    const hint = document.createElement('span');
    hint.id = textarea.id + '-hint';
    hint.setAttribute('data-feedback-count', '');
    hint.textContent = '0 / ' + COMMENT_LIMIT;

    const error = document.createElement('span');
    error.id = textarea.id + '-error';
    error.className = 'feedback-widget-error';
    error.setAttribute('data-feedback-error', '');
    error.setAttribute('role', 'alert');

    meta.append(hint, error);

    const actions = document.createElement('div');
    actions.className = 'feedback-widget-actions';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn btn-primary feedback-widget-submit';
    submit.setAttribute('data-feedback-submit', '');
    submit.textContent = 'Send feedback';

    actions.append(submit);
    form.append(label, textarea, meta, actions);

    const status = document.createElement('p');
    status.className = 'feedback-widget-status';
    status.setAttribute('data-feedback-status', '');
    status.setAttribute('aria-live', 'polite');

    widget.append(intro, choices, form, status);
  }

  widgets.forEach(function (widget) {
    const config = readConfig(widget);

    if (!isValidConfig(config)) {
      widget.hidden = true;
      return;
    }

    if (safeStorageGet(getSubmittedKey(config))) {
      markSubmitted(widget, config, 'Your feedback has already been received. Thank you.');
      return;
    }

    renderWidget(widget, config);

    widget.querySelectorAll('[data-feedback-rating]').forEach(function (button) {
      button.addEventListener('click', function () {
        selectRating(widget, button.getAttribute('data-feedback-rating'));
      });
    });

    const textarea = widget.querySelector('[data-feedback-comment]');
    if (textarea) {
      textarea.addEventListener('input', function () {
        updateCharacterCount(widget);
      });
    }

    const form = widget.querySelector('[data-feedback-form]');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        submitFeedback(widget, config);
      });
    }
  });
}());
