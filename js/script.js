const toggle = document.getElementById('nav-toggle');
const nav    = document.getElementById('nav');

if (toggle && nav) {
  const closeNavigation = ({ restoreFocus = false } = {}) => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-open', isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      closeNavigation();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      closeNavigation({ restoreFocus: true });
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1040 && nav.classList.contains('is-open')) closeNavigation();
  });
}

(function () {
  'use strict';

  const SUPPORT_PATH = '/support/';
  const SECTION_PREFIXES = Object.freeze([
    ['writing', '/writing/'],
    ['systems', '/systems/'],
    ['training', '/training/'],
    ['newsletter', '/newsletter/'],
    ['about', '/about/'],
    ['contact', '/contact/'],
    ['research', '/research/'],
    ['search', '/search/'],
  ]);

  function sourceSection(pathname) {
    if (pathname === '/') return 'home';
    const match = SECTION_PREFIXES.find(function (entry) {
      return pathname === entry[1].slice(0, -1) || pathname.startsWith(entry[1]);
    });
    return match ? match[0] : 'other_public';
  }

  function trackSupportEntry(documentRoot, pageLocation, analyticsProvider) {
    if (!documentRoot || typeof documentRoot.addEventListener !== 'function') return false;

    documentRoot.addEventListener('click', function (event) {
      const link = event.target && typeof event.target.closest === 'function'
        ? event.target.closest('.site-footer a')
        : null;
      if (!link || pageLocation.pathname.startsWith(SUPPORT_PATH)) return;

      let destination;
      try {
        destination = new URL(link.getAttribute('href'), pageLocation.href);
      } catch (_error) {
        return;
      }
      if (destination.origin !== pageLocation.origin || destination.pathname !== SUPPORT_PATH) return;

      const analytics = typeof analyticsProvider === 'function' ? analyticsProvider() : null;
      if (typeof analytics !== 'function') return;
      analytics('event', 'support_entry_click', {
        entry_location: 'footer',
        source_section: sourceSection(pageLocation.pathname),
      });
    });
    return true;
  }

  window.sjSupportEntryAnalytics = Object.freeze({ sourceSection, trackSupportEntry });
  trackSupportEntry(document, window.location, function () { return window.gtag; });
}());
