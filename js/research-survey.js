(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else api.init(root.document);
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function createFrame(documentRef, source, onLoad) {
    var frame = documentRef.createElement('iframe');
    frame.src = source;
    frame.title = 'AI Teaching Workflows Research Survey';
    frame.loading = 'eager';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.setAttribute('frameborder', '0');
    frame.setAttribute('marginheight', '0');
    frame.setAttribute('marginwidth', '0');
    frame.addEventListener('load', onLoad);
    return frame;
  }

  function init(documentRef) {
    if (!documentRef) return null;
    var container = documentRef.getElementById('survey-embed');
    var gate = documentRef.getElementById('survey-form-gate');
    var loadButton = documentRef.getElementById('survey-load-button');
    var status = documentRef.getElementById('survey-load-status');
    if (!container || !gate || !loadButton || !status) return null;

    loadButton.addEventListener('click', function () {
      var source = loadButton.getAttribute('data-survey-src');
      if (!source || loadButton.disabled) return;
      loadButton.disabled = true;
      status.textContent = 'Loading survey form…';
      var frame = createFrame(documentRef, source, function () {
        status.textContent = 'Survey form loaded.';
      });
      gate.hidden = true;
      container.appendChild(frame);
    });
    return { container: container, gate: gate, loadButton: loadButton, status: status };
  }

  return { createFrame: createFrame, init: init };
});
