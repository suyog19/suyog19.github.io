(function () {
  'use strict';

  var embeds = document.querySelectorAll('.newsletter-embed');

  function labelFrame(container) {
    var frame = container.querySelector('iframe');
    if (!frame) return false;
    frame.setAttribute('title', 'Subscribe to Software Signal Weekly');
    return true;
  }

  embeds.forEach(function (container) {
    if (labelFrame(container)) return;

    var observer = new MutationObserver(function () {
      if (labelFrame(container)) observer.disconnect();
    });

    observer.observe(container, { childList: true, subtree: true });
  });
})();
