(function () {
  'use strict';

  const allowedEvents = new Set([
    'card_save_contact',
    'card_linkedin_select',
    'card_email_select',
    'card_website_select',
    'card_software_signal_select',
    'card_share_select'
  ]);
  const canonicalUrl = 'https://suyogjoshi.com/card/';
  const shareButton = document.querySelector('[data-share-card]');
  const shareStatus = document.querySelector('[data-share-status]');

  function track(name) {
    if (!allowedEvents.has(name) || typeof window.gtag !== 'function') return;
    window.gtag('event', name, { source_page: 'digital_card' });
  }

  document.addEventListener('click', function (event) {
    const tracked = event.target.closest('[data-card-event]');
    if (tracked) track(tracked.dataset.cardEvent);
  });

  if (!shareButton) return;

  shareButton.addEventListener('click', async function () {
    shareStatus.textContent = '';

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Suyog Joshi — Digital Card',
          text: 'Save Suyog Joshi’s professional contact details and explore his work.',
          url: canonicalUrl
        });
        shareStatus.textContent = 'Card shared.';
      } catch (error) {
        if (error && error.name !== 'AbortError') {
          shareStatus.textContent = 'Sharing was unavailable. Use the visible card address instead.';
        }
      }
      return;
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(canonicalUrl);
        shareStatus.textContent = 'Card address copied.';
        return;
      } catch (error) {
        // The visible canonical URL is the no-permission fallback.
      }
    }

    shareStatus.textContent = 'Copy the visible card address to share it.';
  });
})();
