(function () {
  'use strict';
  const ID = /^[A-Za-z0-9_-]{1,128}$/;
  function storageKey(id) { return 'sj_gate2_change_command_' + id; }
  function valid(envelope, id) {
    if (!envelope || !ID.test(id || '') || !['CANCELLATION', 'TRANSFER'].includes(envelope.kind) || !ID.test(envelope.key || '')) return false;
    const payload = envelope.payload;
    if (!payload || typeof payload.category !== 'string' || !/^.{3,80}$/s.test(payload.category) || typeof payload.explanation !== 'string' || !/^.{3,1000}$/s.test(payload.explanation)) return false;
    const outcomes = envelope.kind === 'CANCELLATION' ? ['CANCEL', 'DISCUSS_OPTIONS'] : ['TRANSFER', 'DISCUSS_OPTIONS'];
    if (!outcomes.includes(payload.requestedOutcome)) return false;
    const acknowledgement = payload.policyAcknowledgement || {};
    const lower = envelope.kind.toLowerCase();
    return acknowledgement.documentId === 'software-signal-' + lower + '-development-policy'
      && typeof acknowledgement.version === 'string' && acknowledgement.version.length <= 160;
  }
  function read(storage, id) {
    try { const value = JSON.parse(storage.getItem(storageKey(id)) || 'null'); return valid(value, id) ? value : null; } catch (_) { return null; }
  }
  function create(storage, cryptoApi, id, kind, payload) {
    const existing = read(storage, id);
    if (existing) return existing;
    const envelope = { kind, key: 'web_' + (cryptoApi && cryptoApi.randomUUID ? cryptoApi.randomUUID() : Date.now().toString(36)), payload };
    if (!valid(envelope, id)) throw new Error('INVALID_CHANGE_COMMAND');
    storage.setItem(storageKey(id), JSON.stringify(envelope));
    return envelope;
  }
  function clear(storage, id) { storage.removeItem(storageKey(id)); }
  function isAmbiguous(status) { return status === 0 || (Number.isInteger(status) && status >= 500); }
  window.sjLearnerChangeRecovery = { clear, create, isAmbiguous, read, storageKey };
}());
