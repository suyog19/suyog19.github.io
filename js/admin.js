(function () {
  const TOKEN_KEY = 'sj_admin_access_token';
  const USER_KEY = 'sj_admin_user';
  const LIMIT = 50;
  const trainingTools = window.sjAdminTraining;
  const operationKeys = trainingTools.createIdempotencyTracker(() => trainingTools.opaqueIdempotencyKey(window.crypto));

  const state = {
    apiBase: apiBaseUrl(),
    token: sessionStorage.getItem(TOKEN_KEY) || '',
    user: readSessionUser(),
    emailId: '',
    activeView: 'overview',
    messages: [],
    feedback: [],
    trainingCourses: [],
    trainingCohorts: [],
    trainingApplications: [],
    selectedApplicationId: '',
    selectedApplication: null,
    selectedEnrolment: null,
    applicationCommunications: [],
    trainingMutationPending: false,
    applicationRequestSequence: 0,
    feedbackSummary: null,
    selectedMessageId: '',
    selectedFeedbackId: '',
  };

  const els = {
    apiNote: document.getElementById('admin-api-note'),
    status: document.getElementById('admin-status'),
    sessionActions: document.getElementById('admin-session-actions'),
    userPill: document.getElementById('admin-user-pill'),
    logout: document.getElementById('admin-logout'),
    loginPanel: document.getElementById('admin-login-panel'),
    loginForm: document.getElementById('admin-login-form'),
    email: document.getElementById('admin-email'),
    emailError: document.getElementById('admin-email-error'),
    requestOtp: document.getElementById('admin-request-otp'),
    otpForm: document.getElementById('admin-otp-form'),
    otp: document.getElementById('admin-otp'),
    otpError: document.getElementById('admin-otp-error'),
    verifyOtp: document.getElementById('admin-verify-otp'),
    changeEmail: document.getElementById('admin-change-email'),
    shell: document.getElementById('admin-shell'),
    tabs: Array.from(document.querySelectorAll('[data-admin-view]')),
    messagesPanel: document.getElementById('admin-messages-panel'),
    feedbackPanel: document.getElementById('admin-feedback-panel'),
    overviewPanel: document.getElementById('admin-overview-panel'),
    coursesPanel: document.getElementById('admin-courses-panel'),
    applicationsPanel: document.getElementById('admin-applications-panel'),
    interestsPanel: document.getElementById('admin-interests-panel'),
    paymentsPanel: document.getElementById('admin-payments-panel'),
    gate3Panel: document.getElementById('admin-gate3-panel'),
    refreshTraining: document.getElementById('admin-refresh-current'),
    trainingCourses: document.getElementById('admin-training-courses'),
    trainingCohorts: document.getElementById('admin-training-cohorts'),
    cohortForm: document.getElementById('admin-cohort-form'),
    cohortId: document.getElementById('admin-cohort-id'),
    cohortVersion: document.getElementById('admin-cohort-version'),
    cohortCourse: document.getElementById('admin-cohort-course'),
    cohortLabel: document.getElementById('admin-cohort-label'),
    cohortTimezone: document.getElementById('admin-cohort-timezone'),
    cohortCapacity: document.getElementById('admin-cohort-capacity'),
    cohortMinimum: document.getElementById('admin-cohort-minimum'),
    cohortStart: document.getElementById('admin-cohort-start'),
    cohortEnd: document.getElementById('admin-cohort-end'),
    registrationOpen: document.getElementById('admin-registration-open'),
    registrationClose: document.getElementById('admin-registration-close'),
    cohortCancel: document.getElementById('admin-cohort-cancel'),
    cohortTitle: document.getElementById('admin-cohort-editor-title'),
    cohortSubmit: document.getElementById('admin-cohort-submit'),
    refreshApplications: document.getElementById('admin-refresh-applications'),
    applicationList: document.getElementById('admin-application-list'),
    applicationDetail: document.getElementById('admin-application-detail'),
    applicationFilters: document.getElementById('admin-application-filters'),
    applicationCourseFilter: document.getElementById('admin-application-course-filter'),
    applicationCohortFilter: document.getElementById('admin-application-cohort-filter'),
    refreshMessages: document.getElementById('admin-refresh-messages'),
    refreshFeedback: document.getElementById('admin-refresh-feedback'),
    messagesList: document.getElementById('admin-messages-list'),
    messageDetail: document.getElementById('admin-message-detail'),
    feedbackFilters: document.getElementById('admin-feedback-filters'),
    feedbackSummary: document.getElementById('admin-feedback-summary'),
    feedbackList: document.getElementById('admin-feedback-list'),
    feedbackDetail: document.getElementById('admin-feedback-detail'),
  };

  function apiBaseUrl() {
    const override = new URLSearchParams(window.location.search).get('apiBase');
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (override && isLocal) return override.replace(/\/$/, '');
    if (isLocal || host === 'dev.suyogjoshi.com' || /^[a-z0-9-]+\.suyogjoshi-dev\.pages\.dev$/.test(host || '')) {
      return 'https://api-dev.suyogjoshi.com';
    }
    if (host === 'suyogjoshi.com' || host === 'www.suyogjoshi.com') return 'https://api.suyogjoshi.com';
    return '';
  }

  function readSessionUser() {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function writeSession(token, user) {
    state.token = token || '';
    state.user = user || null;
    if (state.token) {
      sessionStorage.setItem(TOKEN_KEY, state.token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
    if (state.user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(state.user));
    } else {
      sessionStorage.removeItem(USER_KEY);
    }
  }

  function textEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text || '';
    return node;
  }

  function buttonEl(className, text, data) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = className;
    node.textContent = text;
    Object.entries(data || {}).forEach(([key, value]) => {
      node.dataset[key] = value;
    });
    return node;
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setStatus(message, tone) {
    els.status.textContent = message || '';
    els.status.className = 'admin-status';
    if (tone) els.status.classList.add('is-' + tone);
    els.status.hidden = !message;
  }

  function setFieldError(fieldEl, errorEl, message) {
    errorEl.textContent = message || '';
    errorEl.hidden = !message;
    if (message) {
      fieldEl.setAttribute('aria-invalid', 'true');
    } else {
      fieldEl.removeAttribute('aria-invalid');
    }
  }

  function setBusy(button, busy, label) {
    button.disabled = busy;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = label;
    } else if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  async function parseJson(response) {
    const text = await response.text();
    let body = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (_) {
        body = { message: text };
      }
    }
    if (!response.ok) {
      const error = new Error(body.message || body.error || 'Request failed');
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  }

  async function apiRequest(path, options) {
    if (!state.apiBase) { const error = new Error('Untrusted host'); error.status = 0; throw error; }
    const headers = {};
    if (options && options.body) headers['Content-Type'] = 'application/json';
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    const response = await fetch(state.apiBase + path, {
      ...options,
      headers: {
        ...headers,
        ...(options && options.headers ? options.headers : {}),
      },
    });
    return parseJson(response);
  }

  async function adminGet(path) {
    return apiRequest(path, { method: 'GET' });
  }

  function showLogin() {
    els.loginPanel.hidden = false;
    els.shell.hidden = true;
    els.sessionActions.hidden = true;
  }

  function showShell() {
    els.loginPanel.hidden = true;
    els.shell.hidden = false;
    els.sessionActions.hidden = false;
    const email = state.user && state.user.emailId ? state.user.emailId : 'Admin session';
    els.userPill.textContent = email;
    switchView(viewFromHash());
  }

  function clearSession(message) {
    writeSession('', null);
    state.messages = [];
    state.feedback = [];
    state.feedbackSummary = null;
    state.trainingCourses = [];
    state.trainingCohorts = [];
    state.trainingApplications = [];
    state.selectedApplicationId = '';
    state.selectedApplication = null;
    state.selectedEnrolment = null;
    state.applicationCommunications = [];
    state.trainingMutationPending = false;
    state.applicationRequestSequence += 1;
    state.selectedMessageId = '';
    state.selectedFeedbackId = '';
    operationKeys.clearAll();
    if (window.sjAdminPaymentsController) window.sjAdminPaymentsController.clear();
    if (window.sjAdminGate3Controller) window.sjAdminGate3Controller.clear();
    clearNode(els.trainingCourses);
    clearNode(els.trainingCohorts);
    clearNode(els.cohortCourse);
    clearNode(els.applicationList);
    renderEmptyDetail(els.applicationDetail, 'Select an application to review.');
    els.applicationFilters.reset();
    clearCohortForm();
    showLogin();
    renderMessages();
    renderFeedback();
    if (message) setStatus(message, 'warn');
  }
  window.sjAdminClearSession = clearSession;

  function friendlyError(error) {
    const body = error.body || {};
    if (body.fields) {
      return Object.values(body.fields).join(' ');
    }
    if (error.status === 401) return 'Your admin session is missing or expired. Sign in again.';
    if (error.status === 403) return 'This account is authenticated but does not have admin access.';
    if (error.status === 404) return 'That record was not found.';
    if (error.status === 409 || error.status === 412) return 'This record changed in another action. Current data has been reloaded; review it before trying again.';
    return body.message || 'We could not connect to the service. Check your connection and try again.';
  }

  function handleRequestError(error, target) {
    if (error.status === 401) {
      clearSession('Your admin session expired. Sign in again.');
      return;
    }
    const tone = error.status === 403 ? 'error' : 'warn';
    setStatus(friendlyError(error), tone);
    if (target === 'message-detail') {
      renderEmptyDetail(els.messageDetail, error.status === 404 ? 'Message not found.' : 'Message could not be loaded.');
    }
  }

  async function validateStoredSession() {
    if (!state.token) {
      showLogin();
      return;
    }
    try {
      const data = await adminGet('/me');
      writeSession(state.token, data.user);
      showShell();
      await loadMessages();
    } catch (error) {
      handleRequestError(error);
    }
  }

  async function handleOtpRequest(event) {
    event.preventDefault();
    setStatus('', '');
    setFieldError(els.email, els.emailError, '');
    const emailId = els.email.value.trim();
    if (!isValidEmail(emailId)) {
      setFieldError(els.email, els.emailError, 'Enter a valid email address.');
      return;
    }
    setBusy(els.requestOtp, true, 'Requesting...');
    try {
      await apiRequest('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ emailId }),
      });
      state.emailId = emailId;
      els.loginForm.hidden = true;
      els.otpForm.hidden = false;
      els.otp.value = '';
      els.otp.focus();
      setStatus('If the account can sign in, an OTP has been sent.', 'success');
    } catch (error) {
      setStatus(friendlyError(error), 'error');
    } finally {
      setBusy(els.requestOtp, false);
    }
  }

  async function handleOtpVerify(event) {
    event.preventDefault();
    setStatus('', '');
    setFieldError(els.otp, els.otpError, '');
    const otp = els.otp.value.trim();
    if (!/^\d{6}$/.test(otp)) {
      setFieldError(els.otp, els.otpError, 'Enter the 6 digit OTP.');
      return;
    }
    setBusy(els.verifyOtp, true, 'Verifying...');
    try {
      const data = await apiRequest('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ emailId: state.emailId, otp }),
      });
      writeSession(data.accessToken, data.user);
      els.otp.value = '';
      els.otpForm.hidden = true;
      els.loginForm.hidden = false;
      showShell();
      setStatus('Signed in. Loading admin data...', 'success');
      await loadMessages();
      setStatus('', '');
    } catch (error) {
      if (error.status === 401) {
        setFieldError(els.otp, els.otpError, 'OTP verification failed.');
      }
      setStatus(friendlyError(error), 'error');
    } finally {
      setBusy(els.verifyOtp, false);
    }
  }

  async function logout() {
    const token = state.token;
    clearSession('Signed out.');
    if (!token) return;
    if (!state.apiBase) return;
    try {
      await fetch(state.apiBase + '/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      });
    } catch (_) {
      // Local session state is already cleared; backend expiry will handle stale tokens.
    }
  }

  async function loadMessages() {
    setStatus('Loading messages...', '');
    renderLoading(els.messagesList, 'Loading messages...');
    try {
      const data = await adminGet('/admin/messages?limit=' + LIMIT);
      state.messages = Array.isArray(data.items) ? data.items : [];
      state.selectedMessageId = state.messages[0] ? state.messages[0].messageId : '';
      renderMessages();
      if (state.selectedMessageId) {
        await loadMessageDetail(state.selectedMessageId);
      } else {
        renderEmptyDetail(els.messageDetail, 'No messages to show.');
      }
      setStatus('', '');
    } catch (error) {
      renderEmptyList(els.messagesList, 'Messages could not be loaded.');
      handleRequestError(error);
    }
  }

  async function loadMessageDetail(messageId) {
    state.selectedMessageId = messageId;
    renderMessages();
    renderLoading(els.messageDetail, 'Loading message detail...');
    try {
      const data = await adminGet('/admin/messages/' + encodeURIComponent(messageId));
      renderMessageDetail(data.message || null);
      setStatus('', '');
    } catch (error) {
      handleRequestError(error, 'message-detail');
    }
  }

  async function loadFeedback() {
    setStatus('Loading feedback...', '');
    renderLoading(els.feedbackList, 'Loading feedback...');
    try {
      const params = feedbackParams();
      const listPath = '/admin/feedback?' + params.toString();
      const summaryParams = feedbackSummaryParams();
      const summaryPath = '/admin/feedback/summary' + (summaryParams.toString() ? '?' + summaryParams.toString() : '');
      const results = await Promise.all([adminGet(listPath), adminGet(summaryPath)]);
      state.feedback = Array.isArray(results[0].items) ? results[0].items : [];
      state.feedbackSummary = results[1].summary || null;
      state.selectedFeedbackId = state.feedback[0] ? state.feedback[0].feedbackId : '';
      renderFeedback();
      setStatus('', '');
    } catch (error) {
      renderEmptyList(els.feedbackList, 'Feedback could not be loaded.');
      handleRequestError(error);
    }
  }

  function feedbackParams() {
    const params = new URLSearchParams();
    const form = new FormData(els.feedbackFilters);
    ['targetType', 'targetId', 'status'].forEach((key) => {
      const value = String(form.get(key) || '').trim();
      if (value) params.set(key, value);
    });
    params.set('limit', String(LIMIT));
    return params;
  }

  function feedbackSummaryParams() {
    const params = new URLSearchParams();
    const form = new FormData(els.feedbackFilters);
    ['targetType', 'targetId'].forEach((key) => {
      const value = String(form.get(key) || '').trim();
      if (value) params.set(key, value);
    });
    return params;
  }

  function renderLoading(container, message) {
    clearNode(container);
    container.appendChild(textEl('p', 'admin-empty', message));
  }

  function renderEmptyList(container, message) {
    clearNode(container);
    container.appendChild(textEl('p', 'admin-empty', message));
  }

  function renderEmptyDetail(container, message) {
    clearNode(container);
    container.appendChild(textEl('p', 'admin-empty', message));
  }

  function renderOverview() {
    const root = document.getElementById('admin-overview');
    if (!root) return;
    const cards = [
      ['Applications awaiting review', state.trainingApplications.filter((item) => ['NEW', 'UNDER_REVIEW'].includes(item.status)).length, 'applications'],
      ['Cohorts approaching a decision', state.trainingCohorts.filter((item) => ['OPEN', 'CLOSED'].includes(item.lifecycle)).length, 'cohort-decisions'],
      ['Recent contact messages', state.messages.length, 'messages'],
      ['Recent feedback', state.feedback.length, 'feedback'],
    ];
    root.replaceChildren();
    cards.forEach(([label, value, view]) => { const button = buttonEl('admin-overview-card', '', { adminView: view }); button.append(textEl('strong', '', String(value)), textEl('span', '', label)); root.appendChild(button); });
    const payments = buttonEl('admin-overview-card', '', { adminView: 'payments' }); payments.append(textEl('strong', '', 'Review'), textEl('span', '', 'Payment records needing attention')); root.appendChild(payments);
    const notifications = buttonEl('admin-overview-card', '', { adminView: 'interest-requests' }); notifications.append(textEl('strong', '', 'Review'), textEl('span', '', 'Failed or suppressed notifications')); root.appendChild(notifications);
  }

  function renderMessages() {
    clearNode(els.messagesList);
    if (!state.messages.length) {
      renderEmptyList(els.messagesList, 'No messages to show.');
      return;
    }
    state.messages.forEach((message) => {
      const item = buttonEl(
        'admin-list-item' + (message.messageId === state.selectedMessageId ? ' is-selected' : ''),
        '',
        { messageId: message.messageId || '' }
      );
      item.setAttribute('aria-pressed', message.messageId === state.selectedMessageId ? 'true' : 'false');
      item.appendChild(textEl('span', 'admin-list-kicker', formatDate(message.createdAt)));
      item.appendChild(textEl('strong', '', message.name || 'Unknown sender'));
      item.appendChild(textEl('span', '', message.email || 'No email'));
      item.appendChild(textEl('p', '', message.messagePreview || 'No preview returned.'));
      item.appendChild(metaRow([message.status, message.source, message.type]));
      els.messagesList.appendChild(item);
    });
    renderOverview();
  }

  function renderMessageDetail(message) {
    clearNode(els.messageDetail);
    if (!message) {
      renderEmptyDetail(els.messageDetail, 'Message detail was not returned.');
      return;
    }
    els.messageDetail.appendChild(detailHeader('Message detail', message.messageId, message.status));
    els.messageDetail.appendChild(detailGrid([
      ['Name', message.name],
      ['Email', message.email],
      ['Type', message.type],
      ['Source', message.source],
      ['Category', message.category],
      ['Created', formatDate(message.createdAt)],
      ['Updated', formatDate(message.updatedAt)],
    ]));
    const body = textEl('p', 'admin-detail-body', message.message || 'No message body returned.');
    els.messageDetail.appendChild(body);
    if (message.metadata && Object.keys(message.metadata).length) {
      els.messageDetail.appendChild(detailSection('Metadata', message.metadata));
    }
  }

  function renderFeedback() {
    renderFeedbackSummary();
    renderFeedbackList();
    renderOverview();
    const selected = state.feedback.find((item) => item.feedbackId === state.selectedFeedbackId) || null;
    renderFeedbackDetail(selected);
  }

  function renderFeedbackSummary() {
    clearNode(els.feedbackSummary);
    if (!state.feedbackSummary) return;
    const summary = state.feedbackSummary;
    const row = document.createElement('div');
    row.className = 'admin-summary-row';
    row.appendChild(summaryMetric('Total', summary.total));
    const ratings = summary.ratings || {};
    row.appendChild(summaryMetric('Up', ratings.THUMBS_UP));
    row.appendChild(summaryMetric('Down', ratings.THUMBS_DOWN));
    row.appendChild(summaryMetric('None', ratings.NONE));
    els.feedbackSummary.appendChild(row);
  }

  function renderFeedbackList() {
    clearNode(els.feedbackList);
    if (!state.feedback.length) {
      renderEmptyList(els.feedbackList, 'No feedback to show.');
      return;
    }
    state.feedback.forEach((item) => {
      const row = buttonEl(
        'admin-list-item' + (item.feedbackId === state.selectedFeedbackId ? ' is-selected' : ''),
        '',
        { feedbackId: item.feedbackId || '' }
      );
      row.setAttribute('aria-pressed', item.feedbackId === state.selectedFeedbackId ? 'true' : 'false');
      row.appendChild(textEl('span', 'admin-list-kicker', formatDate(item.createdAt)));
      row.appendChild(textEl('strong', '', targetLabel(item)));
      row.appendChild(textEl('span', '', item.rating || 'No rating'));
      row.appendChild(textEl('p', '', item.comment || 'No comment.'));
      row.appendChild(metaRow([item.status, item.feedbackId]));
      els.feedbackList.appendChild(row);
    });
  }

  function renderFeedbackDetail(item) {
    clearNode(els.feedbackDetail);
    if (!item) {
      renderEmptyDetail(els.feedbackDetail, state.feedback.length ? 'Select feedback to view its details.' : 'No feedback to show.');
      return;
    }
    els.feedbackDetail.appendChild(detailHeader('Feedback detail', item.feedbackId, item.status));
    els.feedbackDetail.appendChild(detailGrid([
      ['Target', targetLabel(item)],
      ['Rating', item.rating],
      ['Status', item.status],
      ['Created', formatDate(item.createdAt)],
      ['Updated', formatDate(item.updatedAt)],
    ]));
    els.feedbackDetail.appendChild(textEl('p', 'admin-detail-body', item.comment || 'No comment.'));
    const extra = {};
    ['sourcePageUrl', 'userId', 'anonymousId'].forEach((key) => {
      if (item[key]) extra[key] = item[key];
    });
    if (Object.keys(extra).length) {
      els.feedbackDetail.appendChild(detailSection('Additional fields', extra));
    }
  }

  function detailHeader(title, id, status) {
    const header = document.createElement('header');
    header.className = 'admin-detail-header';
    const wrap = document.createElement('div');
    wrap.appendChild(textEl('span', 'admin-list-kicker', id || 'Record'));
    wrap.appendChild(textEl('h3', '', title));
    header.appendChild(wrap);
    if (status) header.appendChild(textEl('span', 'admin-state-pill', status));
    return header;
  }

  function detailGrid(items) {
    const dl = document.createElement('dl');
    dl.className = 'admin-detail-grid';
    items.filter(([, value]) => value !== undefined && value !== null && value !== '').forEach(([label, value]) => {
      const div = document.createElement('div');
      div.appendChild(textEl('dt', '', label));
      div.appendChild(textEl('dd', '', trainingTools.detailValue(value)));
      dl.appendChild(div);
    });
    return dl;
  }

  function detailSection(title, data) {
    const section = document.createElement('section');
    section.className = 'admin-detail-section';
    section.appendChild(textEl('h4', '', title));
    section.appendChild(detailGrid(Object.entries(data)));
    return section;
  }

  function metaRow(values) {
    const row = document.createElement('span');
    row.className = 'admin-list-meta';
    values.filter(Boolean).forEach((value) => {
      row.appendChild(textEl('span', '', String(value)));
    });
    return row;
  }

  function summaryMetric(label, value) {
    const metric = document.createElement('div');
    metric.className = 'admin-summary-metric';
    metric.appendChild(textEl('strong', '', String(value ?? 0)));
    metric.appendChild(textEl('span', '', label));
    return metric;
  }

  function targetLabel(item) {
    const type = item.targetType || 'Target';
    const id = item.targetId || 'unknown';
    return type + ': ' + id;
  }

  function formatDate(value) {
    if (!value) return 'Unknown date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function switchView(view) {
    const valid = ['overview', 'courses', 'applications', 'payments', 'cohort-decisions', 'interest-requests', 'messages', 'feedback'];
    if (!valid.includes(view)) view = 'overview';
    state.activeView = view;
    els.tabs.forEach((tab) => {
      const active = tab.dataset.adminView === view;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    els.messagesPanel.hidden = view !== 'messages';
    els.feedbackPanel.hidden = view !== 'feedback';
    els.overviewPanel.hidden = view !== 'overview';
    els.coursesPanel.hidden = view !== 'courses';
    els.applicationsPanel.hidden = view !== 'applications';
    els.interestsPanel.hidden = view !== 'interest-requests';
    els.paymentsPanel.hidden = view !== 'payments';
    els.gate3Panel.hidden = view !== 'cohort-decisions';
    const copy = {
      overview: ['Overview', 'A snapshot of work that may need your attention.'], courses: ['Courses & cohorts', 'Publish courses and manage cohort schedules and application windows.'],
      applications: ['Applications', 'Review learner applications, record decisions, and send cohort offers.'], payments: ['Payments & learner requests', 'Review payment status, learner requests, refunds, and reconciliation.'],
      'cohort-decisions': ['Cohort decisions', 'Review enrolment readiness and decide whether to confirm, postpone, or cancel a cohort.'], 'interest-requests': ['Interest requests', 'Review people who asked to be notified about upcoming courses or application openings.'],
      messages: ['Contact messages', 'Read and respond to recent enquiries.'], feedback: ['Feedback', 'Review feedback submitted across articles, systems, pages, and modules.']
    };
    document.getElementById('admin-section-title').textContent = copy[view][0];
    document.getElementById('admin-section-description').textContent = copy[view][1];
    if (location.hash !== '#' + view) history.pushState(null, '', '#' + view);
    if (view === 'feedback' && !state.feedback.length && !state.feedbackSummary) {
      loadFeedback();
    }
    if ((view === 'overview' || view === 'courses' || view === 'applications') && !state.trainingCourses.length) loadTraining();
    if (view === 'payments' && window.sjAdminPaymentsController) window.sjAdminPaymentsController.load();
    if (view === 'cohort-decisions' && window.sjAdminGate3Controller) window.sjAdminGate3Controller.load();
  }

  function viewFromHash() { return (location.hash || '#overview').slice(1); }

  async function loadTraining() {
    const sessionToken = state.token;
    setStatus('Loading training setup...', '');
    try {
      const courses = await adminGet('/admin/training/courses');
      const courseItems = Array.isArray(courses.items) ? courses.items : [];
      const cohortLists = await Promise.all(
        courseItems.map((course) => loadAllCohorts(course.courseId))
      );
      if (state.token !== sessionToken) return;
      state.trainingCourses = courseItems;
      state.trainingCohorts = cohortLists.flat();
      renderTraining();
      await loadApplications();
      setStatus('', '');
    } catch (error) {
      if (state.token !== sessionToken) return;
      handleRequestError(error);
    }
  }

  async function loadAllCohorts(courseId) {
    const items = [];
    let cursor = '';
    do {
      const params = new URLSearchParams({ courseId, limit: String(LIMIT) });
      if (cursor) params.set('cursor', cursor);
      const page = await adminGet('/admin/training/cohorts?' + params.toString());
      if (Array.isArray(page.items)) items.push(...page.items);
      cursor = typeof page.nextCursor === 'string' ? page.nextCursor : '';
    } while (cursor);
    return items;
  }

  async function loadApplications() {
    const sessionToken = state.token;
    const requestSequence = ++state.applicationRequestSequence;
    renderLoading(els.applicationList, 'Loading applications...');
    try {
      const params = new URLSearchParams(new FormData(els.applicationFilters));
      Array.from(params.entries()).forEach(([key, value]) => { if (!value) params.delete(key); });
      params.set('limit', String(LIMIT));
      const items = [];
      const seen = new Set();
      let cursor = '';
      do {
        if (cursor) params.set('cursor', cursor); else params.delete('cursor');
        const data = await adminGet('/admin/training/applications?' + params.toString());
        if (Array.isArray(data.items)) items.push(...data.items);
        cursor = typeof data.nextCursor === 'string' ? data.nextCursor : '';
        if (cursor && seen.has(cursor)) throw new Error('Repeated application cursor');
        if (cursor) seen.add(cursor);
      } while (cursor);
      if (
        state.token !== sessionToken
        || state.applicationRequestSequence !== requestSequence
      ) return;
      state.trainingApplications = items;
      renderApplications();
      if (state.selectedApplicationId && state.trainingApplications.some((item) => item.applicationId === state.selectedApplicationId)) {
        await loadApplicationDetail(state.selectedApplicationId);
      } else {
        state.selectedApplicationId = '';
        state.selectedApplication = null;
        renderEmptyDetail(els.applicationDetail, 'Select an application to review.');
      }
    } catch (error) {
      if (
        state.token !== sessionToken
        || state.applicationRequestSequence !== requestSequence
      ) return;
      renderEmptyList(els.applicationList, 'Applications could not be loaded.');
      handleRequestError(error);
    }
  }

  function renderApplications() {
    clearNode(els.applicationList);
    if (!state.trainingApplications.length) return renderEmptyList(els.applicationList, 'No applications to show.');
    state.trainingApplications.forEach((application) => {
      const row = buttonEl('admin-list-item' + (application.applicationId === state.selectedApplicationId ? ' is-selected' : ''), '', { applicationId: application.applicationId });
      row.setAttribute('aria-pressed', application.applicationId === state.selectedApplicationId ? 'true' : 'false');
      row.appendChild(textEl('span', 'admin-list-kicker', formatDate(application.submittedAt)));
      row.appendChild(textEl('strong', '', application.reference || application.applicationId));
      row.appendChild(textEl('span', '', courseTitle(application.courseId)));
      row.appendChild(metaRow([application.status, 'Version ' + application.version]));
      els.applicationList.appendChild(row);
    });
    renderOverview();
  }

  async function loadApplicationDetail(applicationId) {
    if (state.selectedApplicationId !== applicationId) state.selectedEnrolment = null;
    state.selectedApplicationId = applicationId;
    const expected = {
      applicationId,
      sessionToken: state.token,
      sequence: ++state.applicationRequestSequence,
    };
    renderApplications();
    renderLoading(els.applicationDetail, 'Loading application detail...');
    try {
      const results = await Promise.all([
        adminGet('/admin/training/applications/' + encodeURIComponent(applicationId)),
        loadAllCommunications(applicationId),
      ]);
      const current = {
        applicationId: state.selectedApplicationId,
        sessionToken: state.token,
        sequence: state.applicationRequestSequence,
      };
      if (!trainingTools.requestStillCurrent(current, expected)) return;
      state.selectedApplication = results[0].application || null;
      state.selectedEnrolment = results[0].enrolment || null;
      state.applicationCommunications = results[1];
      renderApplicationDetail();
    } catch (error) {
      const current = {
        applicationId: state.selectedApplicationId,
        sessionToken: state.token,
        sequence: state.applicationRequestSequence,
      };
      if (!trainingTools.requestStillCurrent(current, expected)) return;
      renderEmptyDetail(els.applicationDetail, error.status === 404 ? 'Application not found.' : 'Application detail could not be loaded.');
      handleRequestError(error);
    }
  }

  async function loadAllCommunications(applicationId) {
    const items = [];
    const seen = new Set();
    let cursor = '';
    do {
      const params = new URLSearchParams({ limit: String(LIMIT) });
      if (cursor) params.set('cursor', cursor);
      const page = await adminGet(
        '/admin/training/applications/' + encodeURIComponent(applicationId)
        + '/communications?' + params.toString()
      );
      if (Array.isArray(page.items)) items.push(...page.items);
      cursor = typeof page.nextCursor === 'string' ? page.nextCursor : '';
      if (cursor && seen.has(cursor)) throw new Error('Repeated communication cursor');
      if (cursor) seen.add(cursor);
    } while (cursor);
    return items;
  }

  function courseTitle(courseId) {
    const course = state.trainingCourses.find((item) => item.courseId === courseId);
    return course ? course.title : courseId || 'Unknown course';
  }

  function renderApplicationDetail() {
    const application = state.selectedApplication;
    clearNode(els.applicationDetail);
    if (!application) return renderEmptyDetail(els.applicationDetail, 'Application detail was not returned.');
    els.applicationDetail.appendChild(detailHeader('Application review', application.reference || application.applicationId, application.status));
    els.applicationDetail.appendChild(detailGrid([
      ['Course', courseTitle(application.courseId)], ['Submitted', formatDate(application.submittedAt)],
      ['Current application', application.isCurrent ? 'Yes' : 'No'], ['Version', application.version],
    ]));
    if (application.profileSnapshot) els.applicationDetail.appendChild(detailSection('Profile at submission', application.profileSnapshot));
    if (application.answers) els.applicationDetail.appendChild(detailSection('Application answers', application.answers));
    if (application.acknowledgements) {
      const acknowledgements = Object.fromEntries(application.acknowledgements.map((item, index) => ['Acknowledgement ' + (index + 1), (item.documentId || 'Document') + ' version ' + (item.version || 'unknown')]));
      els.applicationDetail.appendChild(detailSection('Acknowledgements', acknowledgements));
    }
    if (application.decision) els.applicationDetail.appendChild(detailSection('Decision', application.decision));
    if (state.selectedEnrolment) {
      els.applicationDetail.appendChild(detailSection('Latest offer result', {
        Status: state.selectedEnrolment.status,
        Cohort: state.selectedEnrolment.cohortId,
        'Offered at': formatDate(state.selectedEnrolment.offeredAt),
      }));
    }
    const timeline = {
      Submitted: formatDate(application.submittedAt),
      Decision: application.decision ? (application.decision.type + ' · ' + formatDate(application.decision.decidedAt)) : 'Pending',
      Offer: state.selectedEnrolment ? (state.selectedEnrolment.status + ' · ' + formatDate(state.selectedEnrolment.offeredAt)) : 'Not created',
      'Latest communication (delivery only)': state.applicationCommunications[0] ? state.applicationCommunications[0].status + ' · ' + formatDate(state.applicationCommunications[0].updatedAt) : 'None',
    };
    els.applicationDetail.appendChild(detailSection('Operational timeline', timeline));
    renderApplicationActions(application);
    renderCommunications();
  }

  function renderApplicationActions(application) {
    const section = textEl('section', 'admin-detail-section', '');
    section.appendChild(textEl('h4', '', 'Review actions'));
    const actions = document.createElement('div'); actions.className = 'admin-form-actions';
    const available = application.status === 'NEW' ? ['start-review', 'waitlist', 'recommend', 'decline', 'withdraw'] : application.status === 'UNDER_REVIEW' ? ['waitlist', 'recommend', 'decline', 'withdraw'] : [];
    const actionLabels = { 'start-review': 'Begin review', waitlist: 'Add to waitlist', recommend: 'Recommend another course', decline: 'Decline application', withdraw: 'Mark as withdrawn' };
    available.forEach((command) => actions.appendChild(buttonEl('btn btn-secondary', actionLabels[command], { applicationCommand: command })));
    if (['NEW', 'UNDER_REVIEW'].includes(application.status)) {
      appendOfferControls(actions, application, true);
    }
    if (application.status === 'ACCEPTED') {
      appendOfferControls(actions, application, false);
    }
    if (!available.length && application.status !== 'ACCEPTED') actions.appendChild(textEl('p', 'admin-empty', 'No review transition is available for this status.'));
    section.appendChild(actions); els.applicationDetail.appendChild(section);
  }

  function appendOfferControls(actions, application, acceptFirst) {
    const select = document.createElement('select');
    select.id = 'admin-application-cohort';
    select.setAttribute('aria-label', 'Offer cohort');
    const cohorts = state.trainingCohorts.filter((cohort) => (
      trainingTools.offerableCohort(cohort, application.courseId)
    ));
    cohorts.forEach((cohort) => {
      const option = document.createElement('option');
      option.value = cohort.cohortId;
      option.textContent = cohort.label + ' (' + cohort.capacityRemaining + ' remaining)';
      select.appendChild(option);
    });
    const cohortLabel = document.createElement('label'); cohortLabel.className = 'form-field'; cohortLabel.appendChild(textEl('span', '', 'Offer cohort')); cohortLabel.appendChild(select); actions.appendChild(cohortLabel);
    const offer = buttonEl(
      'btn btn-primary', acceptFirst ? 'Accept and send offer' : 'Send offer',
      { applicationOffer: acceptFirst ? 'accept' : 'offer' }
    );
    offer.disabled = !cohorts.length;
    actions.appendChild(offer);
    if (!cohorts.length) actions.appendChild(textEl('p', 'admin-empty', 'No open cohort with capacity is available.'));
  }

  function renderCommunications() {
    const section = textEl('section', 'admin-detail-section', ''); section.appendChild(textEl('h4', '', 'Communications'));
    const title = courseTitle(state.selectedApplication && state.selectedApplication.courseId);
    if (!state.applicationCommunications.length) section.appendChild(textEl('p', 'admin-empty', 'No communication records yet.'));
    state.applicationCommunications.forEach((item) => {
      const presentation = trainingTools.communicationPresentation(item, title);
      const row = textEl('article', 'admin-training-card', '');
      row.appendChild(textEl('strong', '', presentation.purpose));
      row.appendChild(textEl('p', '', 'Expected subject: ' + presentation.expectedSubject));
      row.appendChild(textEl('p', 'admin-list-meta', 'Payment link: ' + (presentation.includesPaymentLink ? 'Included when currently authorised' : 'Not included') + ' · ' + (item.status || 'UNKNOWN') + ' · Updated ' + formatDate(item.updatedAt)));
      const diagnostic = document.createElement('details'); diagnostic.className = 'admin-technical-details'; diagnostic.appendChild(textEl('summary', '', 'Technical message type')); diagnostic.appendChild(textEl('p', '', presentation.diagnostic)); row.appendChild(diagnostic);
      if (trainingTools.resendAllowed(item)) row.appendChild(buttonEl('btn btn-secondary', presentation.actionLabel, { communicationResend: item.sk || item.logicalKey || '' }));
      section.appendChild(row);
    });
    if (state.selectedEnrolment && state.selectedEnrolment.enrolmentId) {
      const guidance = textEl('div', 'admin-payment-handoff', '');
      guidance.appendChild(textEl('p', '', 'Need to resend a current deposit payment link? Open the enrolment payment record so current eligibility can be revalidated.'));
      guidance.appendChild(buttonEl('btn btn-secondary', 'Open deposit communication', { paymentEnrolment: state.selectedEnrolment.enrolmentId }));
      section.appendChild(guidance);
    }
    els.applicationDetail.appendChild(section);
  }

  async function applicationCommand(command) {
    const application = state.selectedApplication;
    if (!application || state.trainingMutationPending) return;
    const actionLabels = { 'start-review': 'Begin review', waitlist: 'Add to waitlist', recommend: 'Recommend another course', decline: 'Decline application', withdraw: 'Mark as withdrawn' };
    const fields = ['recommend', 'decline', 'withdraw'].includes(command) ? [{ name: 'reason', label: 'Reason', type: 'textarea', maxLength: 500 }] : [];
    if (command === 'recommend') fields.push({ name: 'recommendedCourseId', label: 'Recommended course', type: 'select', options: state.trainingCourses.filter((course) => course.publicationStatus === 'PUBLISHED' && course.courseId !== application.courseId).map((course) => [course.courseId, course.title]) });
    const values = await window.sjAdminUi.dialog({ title: actionLabels[command] + '?', description: 'This updates the learner application and records the decision.', fields, confirmLabel: actionLabels[command] });
    if (!values) return;
    const reason = values.reason || null; const recommendedCourseId = values.recommendedCourseId || null;
    const body = { expectedVersion: Number(application.version) };
    if (reason) body.reason = reason.trim(); if (recommendedCourseId) body.recommendedCourseId = recommendedCourseId.trim();
    const scope = 'application-' + command + ':' + application.applicationId;
    setApplicationMutationBusy(true);
    try {
      await apiRequest('/admin/training/applications/' + encodeURIComponent(application.applicationId) + '/' + command, { method: 'POST', body: JSON.stringify(body), headers: { 'Idempotency-Key': operationKeys.key(scope, body) } });
      operationKeys.clear(scope);
      await loadApplications(); setStatus('Application updated.', 'success');
    } catch (error) {
      if (error.status && error.status < 500) operationKeys.clear(scope);
      if (error.status === 409 || error.status === 412) await loadApplicationDetail(application.applicationId);
      handleRequestError(error);
    } finally { setApplicationMutationBusy(false); }
  }

  async function offerApplication() {
    if (state.trainingMutationPending) return;
    const application = state.selectedApplication; const select = document.getElementById('admin-application-cohort');
    const cohort = select && state.trainingCohorts.find((item) => item.cohortId === select.value);
    if (!application || !cohort) return setStatus('Choose an open cohort before sending an offer.', 'warn');
    const acceptFirst = application.status === 'NEW' || application.status === 'UNDER_REVIEW';
    const confirmed = await window.sjAdminUi.dialog({ title: 'Send cohort offer?', description: (acceptFirst ? 'The application will be accepted, a seat reserved, and an offer sent for ' : 'A seat will be reserved and an offer sent for ') + cohort.label + '.', confirmLabel: acceptFirst ? 'Accept and reserve seat' : 'Send cohort offer' });
    if (!confirmed) return;
    let activeScope = '';
    let acceptCompleted = false;
    setApplicationMutationBusy(true);
    try {
      let applicationVersion = Number(application.version);
      if (acceptFirst) {
        const acceptBody = { expectedVersion: applicationVersion };
        const acceptScope = 'application-accept:' + application.applicationId;
        activeScope = acceptScope;
        const accepted = await apiRequest('/admin/training/applications/' + encodeURIComponent(application.applicationId) + '/accept', {
          method: 'POST', body: JSON.stringify(acceptBody),
          headers: { 'Idempotency-Key': operationKeys.key(acceptScope, acceptBody) },
        });
        operationKeys.clear(acceptScope);
        acceptCompleted = true;
        state.selectedApplication = accepted.application;
        applicationVersion = Number(accepted.application.version);
      }
      const offerBody = {
        expectedVersion: applicationVersion, cohortId: cohort.cohortId,
        expectedCohortVersion: Number(cohort.version),
      };
      const offerScope = 'application-offer:' + application.applicationId;
      activeScope = offerScope;
      const offered = await apiRequest('/admin/training/applications/' + encodeURIComponent(application.applicationId) + '/offer', {
        method: 'POST', body: JSON.stringify(offerBody),
        headers: { 'Idempotency-Key': operationKeys.key(offerScope, offerBody) },
      });
      operationKeys.clear(offerScope);
      state.selectedEnrolment = offered.enrolment || null;
      await loadTraining(); setStatus('Application accepted; offer created and seat reserved.', 'success');
    } catch (error) {
      if (error.status && error.status < 500 && activeScope) operationKeys.clear(activeScope);
      if (acceptCompleted && !error.status) renderApplicationDetail();
      if (acceptCompleted || error.status === 409 || error.status === 412) await loadTraining();
      handleRequestError(error);
    } finally { setApplicationMutationBusy(false); }
  }

  async function resendCommunication(logicalKey) {
    if (state.trainingMutationPending) return;
    if (!logicalKey) return setStatus('Communication identifier is unavailable.', 'warn');
    const communication = state.applicationCommunications.find((item) => (item.sk || item.logicalKey) === logicalKey);
    if (!communication || !trainingTools.resendAllowed(communication)) return setStatus('This communication is no longer eligible for resend. Refresh the application.', 'warn');
    const presentation = trainingTools.communicationPresentation(communication, courseTitle(state.selectedApplication && state.selectedApplication.courseId));
    const description = presentation.purpose + '. Expected subject: “' + presentation.expectedSubject + '”. Payment link: ' + (presentation.includesPaymentLink ? 'included when currently authorised' : 'not included') + '. The immutable original content will be resent and cannot be edited.';
    const values = await window.sjAdminUi.dialog({ title: presentation.actionLabel + '?', description, fields: [{ name: 'reason', label: 'Reason for resend', type: 'textarea', maxLength: 500 }], confirmLabel: presentation.actionLabel });
    if (!values) return;
    const body = { logicalKey, reason: values.reason.trim() };
    const scope = 'communication-resend:' + state.selectedApplicationId + ':' + logicalKey;
    setApplicationMutationBusy(true);
    try {
      await apiRequest('/admin/training/applications/' + encodeURIComponent(state.selectedApplicationId) + '/communications/resend', { method: 'POST', body: JSON.stringify(body), headers: trainingTools.idempotencyHeaders(operationKeys, scope, body) });
      operationKeys.clear(scope);
      await loadApplicationDetail(state.selectedApplicationId); setStatus('Resend queued.', 'success');
    } catch (error) {
      if (error.status && error.status < 500) operationKeys.clear(scope);
      handleRequestError(error);
    } finally { setApplicationMutationBusy(false); }
  }

  function setApplicationMutationBusy(busy) {
    state.trainingMutationPending = busy;
    document.querySelectorAll('[data-application-command], [data-application-offer], [data-communication-resend]').forEach((button) => {
      if (busy) {
        button.dataset.wasDisabled = button.disabled ? 'true' : 'false';
        button.disabled = true;
      } else {
        button.disabled = button.dataset.wasDisabled === 'true';
        delete button.dataset.wasDisabled;
      }
    });
  }

  function renderTraining() {
    clearNode(els.trainingCourses);
    clearNode(els.cohortCourse);
    state.trainingCourses.forEach((course) => {
      const card = textEl('article', 'admin-training-card', '');
      card.appendChild(textEl('h3', '', course.title));
      card.appendChild(textEl('p', 'admin-status-label', window.sjAdminUi.label(course.publicationStatus)));
      card.appendChild(textEl('p', 'admin-list-meta', state.trainingCohorts.filter((item) => item.courseId === course.courseId).length + ' cohorts'));
      const action = course.publicationStatus === 'PUBLISHED' ? 'unpublish' : 'publish';
      card.appendChild(buttonEl('btn btn-secondary', action === 'publish' ? 'Publish course' : 'Remove from public site', {
        trainingCourseId: course.courseId, trainingCourseAction: action, trainingCourseVersion: String(course.version),
      }));
      els.trainingCourses.appendChild(card);
      const option = document.createElement('option');
      option.value = course.courseId; option.textContent = course.title; els.cohortCourse.appendChild(option);
    });
    clearNode(els.trainingCohorts);
    state.trainingCohorts.forEach((cohort) => {
      const card = textEl('article', 'admin-training-card', '');
      card.appendChild(textEl('h3', '', cohort.label));
      card.appendChild(detailGrid([['Course', courseTitle(cohort.courseId)], ['Registration status', window.sjAdminUi.label(cohort.availability || cohort.lifecycle)], ['Seats', (cohort.capacityRemaining == null ? cohort.capacity : cohort.capacityRemaining) + ' remaining of ' + cohort.capacity], ['Expected dates', window.sjAdminUi.date(cohort.tentativeStartAt) + ' – ' + window.sjAdminUi.date(cohort.tentativeEndAt)], ['Current lifecycle', window.sjAdminUi.label(cohort.lifecycle)]]));
      card.appendChild(buttonEl('btn btn-secondary', 'Edit', { trainingCohortEdit: cohort.cohortId }));
      if (cohort.lifecycle === 'DRAFT') card.appendChild(buttonEl('btn btn-secondary', 'Open applications', { trainingCohortCommand: 'open', trainingCohortId: cohort.cohortId, trainingCohortCourse: cohort.courseId, trainingCohortVersion: String(cohort.version) }));
      if (cohort.lifecycle === 'OPEN') card.appendChild(buttonEl('btn btn-secondary', 'Close applications', { trainingCohortCommand: 'close', trainingCohortId: cohort.cohortId, trainingCohortCourse: cohort.courseId, trainingCohortVersion: String(cohort.version) }));
      els.trainingCohorts.appendChild(card);
    });
    const selectedCourse = els.applicationCourseFilter.value;
    const selectedCohort = els.applicationCohortFilter.value;
    clearNode(els.applicationCourseFilter); clearNode(els.applicationCohortFilter);
    [['', 'All courses'], ...state.trainingCourses.map((item) => [item.courseId, item.title])].forEach(([value, label]) => { const option = document.createElement('option'); option.value = value; option.textContent = label; els.applicationCourseFilter.appendChild(option); });
    [['', 'All cohorts'], ...state.trainingCohorts.map((item) => [item.cohortId, item.label])].forEach(([value, label]) => { const option = document.createElement('option'); option.value = value; option.textContent = label; els.applicationCohortFilter.appendChild(option); });
    els.applicationCourseFilter.value = selectedCourse; els.applicationCohortFilter.value = selectedCohort;
  }

  async function saveCohort(event) {
    event.preventDefault();
    const values = {
      courseId: els.cohortCourse.value,
      label: els.cohortLabel.value,
      timezone: els.cohortTimezone.value,
      capacity: els.cohortCapacity.value,
      minimumSize: els.cohortMinimum.value,
      tentativeStartAt: els.cohortStart.value,
      tentativeEndAt: els.cohortEnd.value,
      registrationOpensAt: els.registrationOpen.value,
      registrationClosesAt: els.registrationClose.value,
    };
    const fieldMap = {
      courseId: els.cohortCourse, label: els.cohortLabel, timezone: els.cohortTimezone,
      capacity: els.cohortCapacity, minimumSize: els.cohortMinimum,
      tentativeStartAt: els.cohortStart, tentativeEndAt: els.cohortEnd,
      registrationOpensAt: els.registrationOpen, registrationClosesAt: els.registrationClose,
    };
    Object.values(fieldMap).forEach((field) => field.setCustomValidity(''));
    const errors = trainingTools.validateCohort(values);
    Object.entries(errors).forEach(([name, message]) => fieldMap[name].setCustomValidity(message));
    if (Object.keys(errors).length || !els.cohortForm.checkValidity()) {
      els.cohortForm.reportValidity();
      return;
    }
    const body = {
      courseId: els.cohortCourse.value, label: els.cohortLabel.value.trim(), timezone: els.cohortTimezone.value.trim(),
      tentativeStartAt: trainingTools.dateToIso(els.cohortStart.value, false), tentativeEndAt: trainingTools.dateToIso(els.cohortEnd.value, true),
      capacity: Number(els.cohortCapacity.value), minimumSize: Number(els.cohortMinimum.value),
      registrationOpensAt: trainingTools.dateToIso(els.registrationOpen.value, false), registrationClosesAt: trainingTools.dateToIso(els.registrationClose.value, true),
    };
    const editing = Boolean(els.cohortId.value);
    if (editing) body.expectedVersion = Number(els.cohortVersion.value);
    const scope = 'cohort-save:' + (els.cohortId.value || 'new');
    try {
      await apiRequest(editing ? '/admin/training/cohorts/' + encodeURIComponent(els.cohortId.value) : '/admin/training/cohorts', {
        method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body), headers: { 'Idempotency-Key': operationKeys.key(scope, body) },
      });
      operationKeys.clear(scope);
      clearCohortForm(); await loadTraining(); setStatus('Cohort saved.', 'success');
    } catch (error) {
      if (error.status && error.status < 500) operationKeys.clear(scope);
      if (error.status === 409 || error.status === 412) {
        const cohortId = els.cohortId.value;
        await loadTraining();
        const current = state.trainingCohorts.find((item) => item.cohortId === cohortId);
        if (current) {
          els.cohortVersion.value = current.version;
          els.cohortCourse.value = current.courseId;
        }
      }
      handleRequestError(error);
    }
  }

  function editCohort(id) {
    const cohort = state.trainingCohorts.find((item) => item.cohortId === id); if (!cohort) return;
    els.cohortId.value = cohort.cohortId; els.cohortVersion.value = cohort.version; els.cohortCourse.value = cohort.courseId;
    els.cohortCourse.disabled = true; els.cohortLabel.value = cohort.label; els.cohortTimezone.value = cohort.timezone;
    els.cohortCapacity.value = cohort.capacity; els.cohortMinimum.value = cohort.minimumSize;
    els.cohortStart.value = trainingTools.isoToDateInput(cohort.tentativeStartAt); els.cohortEnd.value = trainingTools.isoToDateInput(cohort.tentativeEndAt);
    els.registrationOpen.value = trainingTools.isoToDateInput(cohort.registrationOpensAt); els.registrationClose.value = trainingTools.isoToDateInput(cohort.registrationClosesAt);
    els.cohortTitle.textContent = 'Edit cohort — ' + cohort.label;
    els.cohortSubmit.textContent = 'Save changes'; els.cohortCancel.textContent = 'Cancel editing';
    els.cohortLabel.focus();
  }

  function clearCohortForm() { els.cohortForm.reset(); els.cohortId.value = ''; els.cohortVersion.value = ''; els.cohortCourse.disabled = false; els.cohortTimezone.value = 'Asia/Kolkata'; if (els.cohortTitle) els.cohortTitle.textContent = 'Create cohort'; if (els.cohortSubmit) els.cohortSubmit.textContent = 'Create cohort'; if (els.cohortCancel) els.cohortCancel.textContent = 'Reset form'; }

  async function courseCommand(button) {
    const action = button.dataset.trainingCourseAction;
    const confirmed = await window.sjAdminUi.dialog({ title: action === 'publish' ? 'Publish course?' : 'Remove course from public site?', description: action === 'publish' ? 'Learners will be able to find this course on the public site.' : 'The course will no longer be listed publicly.', confirmLabel: action === 'publish' ? 'Publish course' : 'Remove from public site' });
    if (!confirmed) return;
    const body = { expectedVersion: Number(button.dataset.trainingCourseVersion) };
    const scope = 'course-' + action + ':' + button.dataset.trainingCourseId;
    try {
      await apiRequest('/admin/training/courses/' + encodeURIComponent(button.dataset.trainingCourseId) + '/' + action, {
        method: 'POST', body: JSON.stringify(body),
        headers: { 'Idempotency-Key': operationKeys.key(scope, body) },
      });
      operationKeys.clear(scope);
      await loadTraining(); setStatus('Course publication updated.', 'success');
    } catch (error) {
      if (error.status && error.status < 500) operationKeys.clear(scope);
      if (error.status === 409 || error.status === 412) await loadTraining();
      handleRequestError(error);
    }
  }

  async function cohortCommand(button) {
    const action = button.dataset.trainingCohortCommand;
    const confirmed = await window.sjAdminUi.dialog({ title: action === 'open' ? 'Open applications?' : 'Close applications?', description: action === 'open' ? 'Learners will be able to apply to this cohort.' : 'New applications will no longer be accepted for this cohort.', confirmLabel: action === 'open' ? 'Open applications' : 'Close applications' });
    if (!confirmed) return;
    const body = { courseId: button.dataset.trainingCohortCourse, expectedVersion: Number(button.dataset.trainingCohortVersion), reason: 'Manual admin ' + action };
    const scope = 'cohort-' + action + ':' + button.dataset.trainingCohortId;
    const requestOptions = {
      method: 'POST', body: JSON.stringify(body),
      headers: { 'Idempotency-Key': operationKeys.key(scope, body) },
    };
    try {
      await trainingTools.requestWithTransportRetry(() => apiRequest(
        '/admin/training/cohorts/' + encodeURIComponent(button.dataset.trainingCohortId) + '/' + action,
        requestOptions
      ));
      operationKeys.clear(scope);
      await loadTraining(); setStatus('Cohort registration updated.', 'success');
    } catch (error) {
      if (error.status && error.status < 500) operationKeys.clear(scope);
      if (error.status === 409 || error.status === 412) await loadTraining();
      handleRequestError(error);
    }
  }

  function bindEvents() {
    els.loginForm.addEventListener('submit', handleOtpRequest);
    els.otpForm.addEventListener('submit', handleOtpVerify);
    els.changeEmail.addEventListener('click', () => {
      els.otpForm.hidden = true;
      els.loginForm.hidden = false;
      els.email.focus();
      setStatus('', '');
    });
    els.email.addEventListener('input', () => setFieldError(els.email, els.emailError, ''));
    els.otp.addEventListener('input', () => setFieldError(els.otp, els.otpError, ''));
    els.logout.addEventListener('click', logout);
    els.refreshMessages.addEventListener('click', loadMessages);
    els.refreshFeedback.addEventListener('click', loadFeedback);
    els.refreshTraining.addEventListener('click', () => {
      if (['overview', 'courses', 'applications'].includes(state.activeView)) loadTraining();
      else if (state.activeView === 'messages') loadMessages();
      else if (state.activeView === 'feedback') loadFeedback();
      else if (state.activeView === 'payments' && window.sjAdminPaymentsController) window.sjAdminPaymentsController.load(true);
      else if (state.activeView === 'cohort-decisions' && window.sjAdminGate3Controller) window.sjAdminGate3Controller.load(true);
      else if (state.activeView === 'interest-requests') window.dispatchEvent(new CustomEvent('admin:authenticated'));
    });
    els.refreshApplications.addEventListener('click', loadApplications);
    els.applicationFilters.addEventListener('submit', (event) => { event.preventDefault(); state.selectedApplicationId = ''; loadApplications(); });
    els.cohortForm.addEventListener('submit', saveCohort);
    els.cohortCancel.addEventListener('click', clearCohortForm);
    els.feedbackFilters.addEventListener('submit', (event) => {
      event.preventDefault();
      state.selectedFeedbackId = '';
      loadFeedback();
    });
    els.tabs.forEach((tab, index) => {
      tab.tabIndex = index === 0 ? 0 : -1;
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = trainingTools.nextTabIndex(index, event.key, els.tabs.length);
        switchView(els.tabs[next].dataset.adminView);
        els.tabs[next].focus();
      });
    });
    window.addEventListener('popstate', () => switchView(viewFromHash()));
    window.addEventListener('hashchange', () => switchView(viewFromHash()));
    const navToggle = document.getElementById('admin-nav-toggle');
    navToggle.addEventListener('click', () => { const open = navToggle.getAttribute('aria-expanded') !== 'true'; navToggle.setAttribute('aria-expanded', String(open)); document.getElementById('admin-navigation').classList.toggle('is-open', open); });
    document.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-admin-view]');
      if (tab) {
        switchView(tab.dataset.adminView);
        return;
      }
      const message = event.target.closest('[data-message-id]');
      if (message) {
        loadMessageDetail(message.dataset.messageId);
        return;
      }
      const feedback = event.target.closest('[data-feedback-id]');
      if (feedback) {
        state.selectedFeedbackId = feedback.dataset.feedbackId;
        renderFeedback();
        return;
      }
      const courseAction = event.target.closest('[data-training-course-action]');
      if (courseAction) { courseCommand(courseAction); return; }
      const cohortAction = event.target.closest('[data-training-cohort-command]');
      if (cohortAction) { cohortCommand(cohortAction); return; }
      const cohortEdit = event.target.closest('[data-training-cohort-edit]');
      if (cohortEdit) editCohort(cohortEdit.dataset.trainingCohortEdit);
      const application = event.target.closest('[data-application-id]');
      if (application) { loadApplicationDetail(application.dataset.applicationId); return; }
      const applicationAction = event.target.closest('[data-application-command]');
      if (applicationAction) { applicationCommand(applicationAction.dataset.applicationCommand); return; }
      const offer = event.target.closest('[data-application-offer]');
      if (offer) { offerApplication(); return; }
      const payment = event.target.closest('[data-payment-enrolment]');
      if (payment && window.sjAdminPaymentsController) { switchView('payments'); window.sjAdminPaymentsController.openForEnrolment(payment.dataset.paymentEnrolment); return; }
      const resend = event.target.closest('[data-communication-resend]');
      if (resend) resendCommunication(resend.dataset.communicationResend);
    });
  }

  function init() {
    if (!els.loginPanel || !els.shell) return;
    els.apiNote.textContent = 'Service endpoint: ' + state.apiBase;
    document.getElementById('admin-environment').textContent = state.apiBase === 'https://api.suyogjoshi.com' ? 'Production' : 'Development';
    bindEvents();
    window.sjAdminPaymentsController = window.sjAdminPayments.create({
      environment: state.apiBase === 'https://api.suyogjoshi.com' ? 'production' : 'development',
      request: apiRequest,
      idempotencyKey: (scope, body) => operationKeys.key('gate2-' + scope, body),
      setStatus,
      friendlyError,
      sessionActive: () => Boolean(state.token),
      clearSession: (message) => clearSession(message),
    });
    window.sjAdminGate3Controller = window.sjAdminGate3.create({
      environment: state.apiBase === 'https://api.suyogjoshi.com' ? 'production' : 'development',
      request: apiRequest,
      idempotencyKey: (scope, body) => operationKeys.key('gate3-' + scope, body),
      setStatus,
      friendlyError,
      sessionActive: () => Boolean(state.token),
      clearSession: (message) => clearSession(message),
    });
    validateStoredSession();
  }

  init();
}());
