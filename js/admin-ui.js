(function () {
  'use strict';

  const labels = {
    NEW: 'New', UNDER_REVIEW: 'In review', ACCEPTED: 'Accepted', WAITLISTED: 'Waitlisted',
    RECOMMENDED: 'Recommended another course', DECLINED: 'Declined', WITHDRAWN: 'Withdrawn',
    DRAFT: 'Draft', OPEN: 'Applications open', CLOSED: 'Applications closed', CONFIRMED: 'Confirmed',
    POSTPONED: 'Postponed', CANCELLED: 'Cancelled', PUBLISHED: 'Published', UNPUBLISHED: 'Not published',
    APPLICATIONS_OPEN_NOTIFICATION: 'Notify when applications open', PIPELINE_INTEREST: 'Interested in a future course',
    ACTIVE: 'Active', FULFILLED: 'Notified', FAILED_RETRYABLE: 'Delivery failed — can retry',
    FAILED_FINAL: 'Delivery failed', SUPPRESSED: 'Delivery suppressed', SENDING: 'Sending',
    CONFIRM: 'Confirm cohort', POSTPONE: 'Postpone decision', CANCEL: 'Cancel cohort decision'
  };

  function label(value) {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (value === null || value === undefined || value === '') return 'Not available';
    return labels[value] || String(value).replace(/_/g, ' ').toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
  }

  function date(value) {
    const parsed = new Date(value);
    return value && !Number.isNaN(parsed.getTime())
      ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
      : 'Not available';
  }

  function money(minorUnits, currency) {
    return Number.isSafeInteger(minorUnits) && /^[A-Z]{3}$/.test(currency || '')
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(minorUnits / 100)
      : 'Not available';
  }

  function humanField(key) {
    const curated = { emailId: 'Email', courseId: 'Course reference', cohortId: 'Cohort reference', createdAt: 'Created', updatedAt: 'Updated', deliveryState: 'Delivery status', derivedIntent: 'Request type' };
    return curated[key] || String(key).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
  }

  function technicalDetails(entries, title) {
    const details = document.createElement('details');
    details.className = 'admin-technical-details';
    const summary = document.createElement('summary'); summary.textContent = title || 'Technical details';
    const pre = document.createElement('pre'); pre.textContent = JSON.stringify(entries, null, 2);
    details.append(summary, pre);
    return details;
  }

  function dialog(options) {
    const root = document.getElementById('admin-action-dialog');
    const form = root.querySelector('form');
    const title = root.querySelector('[data-dialog-title]');
    const description = root.querySelector('[data-dialog-description]');
    const fields = root.querySelector('[data-dialog-fields]');
    const error = root.querySelector('[data-dialog-error]');
    const submit = root.querySelector('[data-dialog-submit]');
    const previous = document.activeElement;
    title.textContent = options.title;
    description.textContent = options.description || '';
    fields.replaceChildren(); error.hidden = true; error.textContent = '';
    (options.fields || []).forEach((item) => {
      const wrap = document.createElement('label'); wrap.className = 'form-field';
      const caption = document.createElement('span'); caption.textContent = item.label;
      const control = item.type === 'select' ? document.createElement('select') : document.createElement(item.type === 'textarea' ? 'textarea' : 'input');
      control.name = item.name; control.required = item.required !== false;
      if (item.type && !['select', 'textarea'].includes(item.type)) control.type = item.type;
      if (item.maxLength) control.maxLength = item.maxLength;
      (item.options || []).forEach(([value, text]) => control.appendChild(new Option(text, value)));
      wrap.append(caption, control); fields.appendChild(wrap);
    });
    submit.textContent = options.confirmLabel;
    root.showModal();
    (fields.querySelector('input, textarea, select') || submit).focus();
    return new Promise((resolve) => {
      let settled = false;
      function finish(value) { if (settled) return; settled = true; cleanup(); resolve(value); }
      function cleanup() { form.removeEventListener('submit', onSubmit); root.removeEventListener('close', onClose); if (previous && previous.focus) previous.focus(); }
      function onClose() { finish(null); }
      async function onSubmit(event) {
        event.preventDefault();
        if (!form.reportValidity()) return;
        submit.disabled = true; submit.setAttribute('aria-busy', 'true'); error.hidden = true;
        try {
          const values = Object.fromEntries(new FormData(form));
          if (options.onConfirm) await options.onConfirm(values);
          root.close(); finish(values);
        } catch (reason) {
          error.textContent = reason.message || 'The action could not be completed. Try again.'; error.hidden = false;
        } finally { submit.disabled = false; submit.removeAttribute('aria-busy'); }
      }
      form.addEventListener('submit', onSubmit); root.addEventListener('close', onClose);
    });
  }

  window.sjAdminUi = { label, date, money, humanField, technicalDetails, dialog };
}());
