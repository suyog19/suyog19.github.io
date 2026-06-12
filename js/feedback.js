(function () {
  const widgets = document.querySelectorAll('.article-feedback');

  if (!widgets.length) return;

  const API_BASE_URL =
    (window.location.hostname === 'dev.suyogjoshi.com' ||
     window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1')
      ? 'https://api-dev.suyogjoshi.com'
      : 'https://api.suyogjoshi.com';

  const ANON_ID_KEY = 'sj_anon_id';
  const THANKS_MESSAGE = 'Thanks for your feedback!';
  const ERROR_MESSAGE = 'Something went wrong - please try again later.';

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
      // Feedback should remain usable even when localStorage is unavailable.
    }
  }

  function generateAnonId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return 'anon_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
  }

  function getAnonId() {
    let anonId = storageGet(ANON_ID_KEY);

    if (!anonId) {
      anonId = generateAnonId();
      storageSet(ANON_ID_KEY, anonId);
    }

    return anonId;
  }

  function getSourcePageUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');

    if (canonical && canonical.href) {
      return canonical.href;
    }

    return window.location.href;
  }

  function setButtonsDisabled(buttons, disabled) {
    buttons.forEach(function (button) {
      button.disabled = disabled;
    });
  }

  function showStatus(statusEl, message) {
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.hidden = false;
  }

  function showThanks(buttonGroup, statusEl) {
    if (buttonGroup) {
      buttonGroup.hidden = true;
    }

    showStatus(statusEl, THANKS_MESSAGE);
  }

  widgets.forEach(function (widget) {
    const article = widget.closest('article');
    const targetId = article ? article.getAttribute('data-feedback-target') : '';
    const buttonGroup = widget.querySelector('.article-feedback-buttons');
    const buttons = widget.querySelectorAll('.feedback-btn');
    const statusEl = widget.querySelector('.article-feedback-status');

    if (!targetId || !buttonGroup || !buttons.length || !statusEl) return;

    const feedbackKey = 'sj_feedback_' + targetId;
    const existingRating = storageGet(feedbackKey);

    if (existingRating) {
      buttons.forEach(function (button) {
        if (button.getAttribute('data-rating') === existingRating) {
          button.setAttribute('aria-pressed', 'true');
        }
      });
      showThanks(buttonGroup, statusEl);
      return;
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', async function () {
        const rating = button.getAttribute('data-rating');

        if (rating !== 'THUMBS_UP' && rating !== 'THUMBS_DOWN') return;

        statusEl.textContent = '';
        statusEl.hidden = true;
        setButtonsDisabled(buttons, true);
        button.setAttribute('aria-pressed', 'true');

        try {
          const res = await fetch(API_BASE_URL + '/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetType: 'ARTICLE',
              targetId: targetId,
              rating: rating,
              sourcePageUrl: getSourcePageUrl(),
              anonymousId: getAnonId(),
            }),
          });

          if (res.status === 201 || res.status === 429) {
            storageSet(feedbackKey, rating);
            showThanks(buttonGroup, statusEl);
          } else {
            if (res.status === 400) {
              console.warn('Article feedback validation failed.', await res.json().catch(function () { return null; }));
            }
            button.removeAttribute('aria-pressed');
            setButtonsDisabled(buttons, false);
            showStatus(statusEl, ERROR_MESSAGE);
          }
        } catch (err) {
          console.warn('Article feedback request failed.', err);
          button.removeAttribute('aria-pressed');
          setButtonsDisabled(buttons, false);
          showStatus(statusEl, ERROR_MESSAGE);
        }
      });
    });
  });
}());
