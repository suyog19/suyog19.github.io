(function () {
  'use strict';

  const definitions = {
    'training.applications.enabled': {
      group: 'Applications and interest',
      name: 'Applications',
      description: 'Allows eligible learners to submit an application while a published cohort window is open.',
      impact: 'Disabling fails closed for new applications; existing applications are retained.',
      dependency: 'Publication status and cohort application windows remain authoritative.',
    },
    'training.course_interest.capture_enabled': {
      group: 'Applications and interest',
      name: 'Course-interest capture',
      description: 'Shows Get notified or Register interest for eligible courses and accepts new interest records.',
      impact: 'Disabling removes public interest actions and rejects new submissions.',
      dependency: 'Independent of email delivery; capture can remain enabled while delivery is disabled.',
    },
    'training.gate1.email_delivery_enabled': {
      group: 'Applications and interest',
      name: 'Gate 1 email delivery',
      description: 'Allows approved Gate 1 and course-interest notifications to leave the platform.',
      impact: 'Disabling preserves records but suppresses outbound Gate 1 delivery.',
      dependency: 'Requires applications or course-interest capture to be enabled.',
    },
    'training.payments.enabled': {
      group: 'Payments',
      name: 'Payments',
      description: 'Allows eligible deposit and payment operations through the configured provider mode.',
      impact: 'A production change can affect learner payment availability.',
      dependency: 'The deployment-managed payment provider must also be ready.',
    },
    'training.gate2.email_delivery_enabled': {
      group: 'Payments',
      name: 'Gate 2 email delivery',
      description: 'Allows approved payment communications to leave the platform.',
      impact: 'Disabling preserves payment state while suppressing outbound Gate 2 delivery.',
      dependency: 'Requires Payments to be enabled.',
    },
    'training.gate3.cohort_enabled': {
      group: 'Cohorts',
      name: 'Cohort operations',
      description: 'Allows Gate 3 cohort confirmation and related operational capabilities.',
      impact: 'A production change can affect cohort progression.',
      dependency: 'Requires Applications and Payments to be enabled.',
    },
    'training.gate3.email_delivery_enabled': {
      group: 'Cohorts',
      name: 'Gate 3 email delivery',
      description: 'Allows approved cohort and balance notifications to leave the platform.',
      impact: 'Disabling preserves cohort state while suppressing outbound Gate 3 delivery.',
      dependency: 'Requires Cohort operations to be enabled.',
    },
  };

  const reasons = [
    ['', 'Select a reason'],
    ['PLANNED_CHANGE', 'Planned configuration change'],
    ['PLANNED_DISABLEMENT', 'Planned capability disablement'],
    ['EMERGENCY_DISABLEMENT', 'Emergency capability disablement'],
    ['DEPENDENCY_ALIGNMENT', 'Align configuration dependencies'],
    ['CONFIGURATION_CORRECTION', 'Correct invalid configuration'],
    ['INCIDENT_RECOVERY', 'Recover configuration after incident'],
    ['ROLLBACK', 'Roll back configuration change'],
  ];

  function text(tag, value, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value || '';
    return node;
  }

  function definitionFor(key) {
    return definitions[key] || null;
  }

  function validConfiguration(item) {
    return Boolean(
      item
      && definitionFor(item.key)
      && typeof item.value === 'boolean'
      && item.valueType === 'BOOLEAN'
      && Number.isSafeInteger(item.version)
      && item.version > 0
      && ['dev', 'prod'].includes(item.environment)
    );
  }

  function changeLabel(before, after) {
    return (before ? 'Enabled' : 'Disabled') + ' → ' + (after ? 'Enabled' : 'Disabled');
  }

  function create(config) {
    const catalogue = document.getElementById('admin-configuration-catalogue');
    const alert = document.getElementById('admin-configuration-alert');
    const refresh = document.getElementById('admin-refresh-configuration');
    let items = [];
    let histories = new Map();
    let loaded = false;
    let loading = false;

    function setAlert(message) {
      alert.textContent = message || '';
      alert.hidden = !message;
    }

    function fail(error, context) {
      if (error.status === 401 || error.status === 403) {
        config.clearSession('Your admin session is no longer authorized. Sign in again.');
        return;
      }
      const stale = error.status === 409 || error.status === 412;
      const message = stale
        ? 'Configuration changed in another session. Current values were reloaded; review them before trying again.'
        : (context || 'Runtime configuration could not be loaded.') + ' '
          + ((error.status === 400 || error.status === 422) && error.message
            ? error.message
            : config.friendlyError(error));
      setAlert(message);
      config.setStatus(message, 'error');
    }

    function addPair(list, label, value) {
      list.appendChild(text('dt', label));
      list.appendChild(text('dd', value));
    }

    function renderHistory(item, container) {
      const events = histories.get(item.key) || [];
      const details = document.createElement('details');
      details.className = 'admin-configuration-history';
      const summary = text('summary', 'Change history (' + events.length + ')');
      details.appendChild(summary);
      if (!events.length) {
        details.appendChild(text('p', 'No audit history is available.', 'admin-empty'));
      } else {
        const list = document.createElement('ol');
        events.forEach((event) => {
          const entry = document.createElement('li');
          entry.appendChild(text('strong', changeLabel(Boolean(event.previousValue), Boolean(event.newValue))));
          entry.appendChild(text('span', config.date(event.occurredAt) + ' · ' + (event.actorId || 'Unknown administrator')));
          entry.appendChild(text('span', event.reason || event.reasonCode || 'No reason available'));
          if (Number.isSafeInteger(event.newVersion) && event.newValue !== item.value) {
            const restore = text('button', 'Restore this value', 'btn btn-secondary');
            restore.type = 'button';
            restore.dataset.configRestoreKey = item.key;
            restore.dataset.configHistoryVersion = String(event.newVersion);
            restore.dataset.configRestoreValue = String(event.newValue);
            entry.appendChild(restore);
          }
          list.appendChild(entry);
        });
        details.appendChild(list);
      }
      container.appendChild(details);
    }

    function renderCard(item) {
      const definition = definitionFor(item.key);
      const history = histories.get(item.key) || [];
      const latest = history[0] || {};
      const card = document.createElement('article');
      card.className = 'admin-configuration-card';
      const header = document.createElement('header');
      const heading = text('h4', definition.name);
      const status = text('span', item.value ? 'Enabled' : 'Disabled', 'admin-configuration-state ' + (item.value ? 'is-enabled' : 'is-disabled'));
      header.append(heading, status);
      card.appendChild(header);
      card.appendChild(text('p', definition.description));
      card.appendChild(text('p', definition.impact, 'admin-configuration-impact'));
      card.appendChild(text('p', 'Dependency: ' + definition.dependency, 'admin-list-meta'));
      const metadata = document.createElement('dl');
      metadata.className = 'admin-detail-list admin-configuration-metadata';
      addPair(metadata, 'Environment', item.environment === 'prod' ? 'Production' : 'Development');
      addPair(metadata, 'Version', String(item.version));
      addPair(metadata, 'Safe initial value', item.safeValue ? 'Enabled' : 'Disabled');
      addPair(metadata, 'Last changed', latest.occurredAt ? config.date(latest.occurredAt) : 'Not available');
      addPair(metadata, 'Changed by', latest.actorId || 'Not available');
      addPair(metadata, 'Reason', latest.reason || latest.reasonCode || 'Not available');
      card.appendChild(metadata);
      const actions = document.createElement('div');
      actions.className = 'admin-form-actions';
      const toggle = text('button', item.value ? 'Disable' : 'Enable', item.value ? 'btn btn-secondary' : 'btn btn-primary');
      toggle.type = 'button';
      toggle.dataset.configKey = item.key;
      toggle.dataset.configValue = String(!item.value);
      actions.appendChild(toggle);
      card.appendChild(actions);
      renderHistory(item, card);
      return card;
    }

    function render() {
      catalogue.replaceChildren();
      if (!items.length) {
        catalogue.appendChild(text('p', 'No supported runtime configuration was returned. Retry or contact the platform operator.', 'admin-empty'));
        return;
      }
      ['Applications and interest', 'Payments', 'Cohorts'].forEach((groupName) => {
        const section = document.createElement('section');
        section.className = 'admin-configuration-group';
        section.appendChild(text('h3', groupName));
        const grid = document.createElement('div');
        grid.className = 'admin-configuration-grid';
        items.filter((item) => definitionFor(item.key).group === groupName).forEach((item) => grid.appendChild(renderCard(item)));
        section.appendChild(grid);
        catalogue.appendChild(section);
      });
    }

    async function load(force) {
      if (!config.sessionActive() || loading || (loaded && !force)) return;
      loading = true;
      setAlert('');
      catalogue.replaceChildren(text('p', 'Loading effective runtime configuration…', 'admin-empty'));
      try {
        const response = await config.request('/admin/training/runtime-configurations', { method: 'GET' });
        const incoming = Array.isArray(response.items) ? response.items : [];
        if (incoming.length !== Object.keys(definitions).length || !incoming.every(validConfiguration)) {
          const error = new Error('The service returned an incomplete or invalid closed catalogue.');
          error.status = 422;
          throw error;
        }
        const historyResponses = await Promise.all(incoming.map((item) => config.request(
          '/admin/training/runtime-configurations/' + encodeURIComponent(item.key) + '/history?limit=100',
          { method: 'GET' }
        )));
        items = incoming;
        histories = new Map(incoming.map((item, index) => [
          item.key,
          Array.isArray(historyResponses[index].items) ? historyResponses[index].items : [],
        ]));
        loaded = true;
        render();
        config.setStatus('', '');
      } catch (error) {
        items = [];
        histories = new Map();
        loaded = false;
        render();
        fail(error, 'Runtime configuration could not be loaded.');
      } finally {
        loading = false;
      }
    }

    async function validateChange(item, proposedValue) {
      const response = await config.request(
        '/admin/training/runtime-configurations/' + encodeURIComponent(item.key) + '/validate',
        { method: 'POST', body: JSON.stringify({ value: proposedValue }) }
      );
      const validation = response.validation || {};
      if (validation.valid !== true) {
        const violations = Array.isArray(validation.violations) ? validation.violations : [];
        const guidance = violations.map((entry) => [entry.explanation, entry.correctiveAction].filter(Boolean).join(' ')).join(' ');
        const error = new Error(guidance || 'The proposed combination is not allowed.');
        error.status = 400;
        throw error;
      }
    }

    async function change(key, proposedValue) {
      const item = items.find((candidate) => candidate.key === key);
      if (!item || typeof proposedValue !== 'boolean') return;
      setAlert('');
      try {
        await validateChange(item, proposedValue);
        const confirmed = await config.dialog({
          title: (proposedValue ? 'Enable ' : 'Disable ') + definitionFor(key).name + '?',
          description: (item.environment === 'prod' ? 'Production change. ' : '')
            + 'Before: ' + (item.value ? 'Enabled' : 'Disabled')
            + '. After: ' + (proposedValue ? 'Enabled' : 'Disabled')
            + '. ' + definitionFor(key).impact,
          confirmLabel: proposedValue ? 'Confirm enable' : 'Confirm disable',
          fields: [{ type: 'select', name: 'reason', label: 'Change reason', options: reasons }],
          onConfirm: async (values) => {
            await config.request('/admin/training/runtime-configurations/' + encodeURIComponent(key), {
              method: 'PATCH',
              body: JSON.stringify({ value: proposedValue, expectedVersion: item.version, reason: values.reason }),
            });
          },
        });
        if (!confirmed) return;
        loaded = false;
        await load(true);
        config.setStatus(definitionFor(key).name + ' was updated and audited.', 'success');
      } catch (error) {
        await load(true);
        fail(error, 'Configuration was not changed.');
      }
    }

    async function restore(key, historyVersion, restoredValue) {
      const item = items.find((candidate) => candidate.key === key);
      if (!item || !Number.isSafeInteger(historyVersion) || typeof restoredValue !== 'boolean') return;
      setAlert('');
      try {
        await validateChange(item, restoredValue);
        const confirmed = await config.dialog({
          title: 'Restore ' + definitionFor(key).name + '?',
          description: (item.environment === 'prod' ? 'Production restore. ' : '')
            + 'Before: ' + (item.value ? 'Enabled' : 'Disabled')
            + '. After: ' + (restoredValue ? 'Enabled' : 'Disabled')
            + '. A new audited version will be created; history will not be rewritten.',
          confirmLabel: 'Confirm restore',
          onConfirm: async () => {
            await config.request('/admin/training/runtime-configurations/' + encodeURIComponent(key) + '/restore', {
              method: 'POST',
              body: JSON.stringify({
                historyVersion,
                expectedVersion: item.version,
                reason: 'RESTORE_PRIOR_VALUE',
              }),
            });
          },
        });
        if (!confirmed) return;
        loaded = false;
        await load(true);
        config.setStatus(definitionFor(key).name + ' was restored through a new audited change.', 'success');
      } catch (error) {
        await load(true);
        fail(error, 'Configuration was not restored.');
      }
    }

    catalogue.addEventListener('click', (event) => {
      const changeButton = event.target.closest('[data-config-key]');
      if (changeButton) {
        change(changeButton.dataset.configKey, changeButton.dataset.configValue === 'true');
        return;
      }
      const restoreButton = event.target.closest('[data-config-restore-key]');
      if (restoreButton) {
        restore(
          restoreButton.dataset.configRestoreKey,
          Number(restoreButton.dataset.configHistoryVersion),
          restoreButton.dataset.configRestoreValue === 'true'
        );
      }
    });
    refresh.addEventListener('click', () => { loaded = false; load(true); });

    return {
      clear() {
        items = [];
        histories = new Map();
        loaded = false;
        loading = false;
        setAlert('');
        catalogue.replaceChildren(text('p', 'Open Configuration to load the effective runtime controls.', 'admin-empty'));
      },
      load,
    };
  }

  window.sjAdminRuntimeConfig = {
    create,
    definitionFor,
    validConfiguration,
    changeLabel,
  };
}());
