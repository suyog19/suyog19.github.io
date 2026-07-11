(function () {
  const TOKEN_KEY = 'sj_admin_access_token';
  const USER_KEY = 'sj_admin_user';
  const LIMIT = 50;
  const trainingTools = window.sjAdminTraining;
  const operationKeys = trainingTools.createIdempotencyTracker((prefix) => {
    const value = window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(16).slice(2);
    return prefix + '-' + value;
  });

  const state = {
    apiBase: apiBaseUrl(),
    token: sessionStorage.getItem(TOKEN_KEY) || '',
    user: readSessionUser(),
    emailId: '',
    activeView: 'messages',
    messages: [],
    feedback: [],
    trainingCourses: [],
    trainingCohorts: [],
    trainingApplications: [],
    selectedApplicationId: '',
    selectedApplication: null,
    applicationCommunications: [],
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
    trainingPanel: document.getElementById('admin-training-panel'),
    refreshTraining: document.getElementById('admin-refresh-training'),
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
    if (isLocal || host === 'dev.suyogjoshi.com') {
      return 'https://api-dev.suyogjoshi.com';
    }
    return 'https://api.suyogjoshi.com';
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
  }

  function clearSession(message) {
    writeSession('', null);
    state.messages = [];
    state.feedback = [];
    state.feedbackSummary = null;
    state.trainingCourses = [];
    state.trainingCohorts = [];
    state.selectedMessageId = '';
    state.selectedFeedbackId = '';
    operationKeys.clearAll();
    clearNode(els.trainingCourses);
    clearNode(els.trainingCohorts);
    clearNode(els.cohortCourse);
    clearCohortForm();
    showLogin();
    renderMessages();
    renderFeedback();
    if (message) setStatus(message, 'warn');
  }

  function friendlyError(error) {
    const body = error.body || {};
    if (body.fields) {
      return Object.values(body.fields).join(' ');
    }
    if (error.status === 401) return 'Your admin session is missing or expired. Sign in again.';
    if (error.status === 403) return 'This account is authenticated but does not have admin access.';
    if (error.status === 404) return 'That record was not found.';
    if (error.status === 409 || error.status === 412) return 'This record changed in another action. Current data has been reloaded; review it before trying again.';
    return body.message || 'Something went wrong. Please retry.';
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
      div.appendChild(textEl('dd', '', String(value)));
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
    state.activeView = view;
    els.tabs.forEach((tab) => {
      const active = tab.dataset.adminView === view;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    els.messagesPanel.hidden = view !== 'messages';
    els.feedbackPanel.hidden = view !== 'feedback';
    els.trainingPanel.hidden = view !== 'training';
    if (view === 'feedback' && !state.feedback.length && !state.feedbackSummary) {
      loadFeedback();
    }
    if (view === 'training' && !state.trainingCourses.length) loadTraining();
  }

  async function loadTraining() {
    setStatus('Loading training setup...', '');
    try {
      const courses = await adminGet('/admin/training/courses');
      state.trainingCourses = Array.isArray(courses.items) ? courses.items : [];
      const cohortLists = await Promise.all(
        state.trainingCourses.map((course) => loadAllCohorts(course.courseId))
      );
      state.trainingCohorts = cohortLists.flat();
      renderTraining();
      await loadApplications();
      setStatus('', '');
    } catch (error) { handleRequestError(error); }
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
    renderLoading(els.applicationList, 'Loading applications...');
    try {
      const params = new URLSearchParams(new FormData(els.applicationFilters));
      Array.from(params.entries()).forEach(([key, value]) => { if (!value) params.delete(key); });
      params.set('limit', String(LIMIT));
      const data = await adminGet('/admin/training/applications?' + params.toString());
      state.trainingApplications = Array.isArray(data.items) ? data.items : [];
      renderApplications();
      if (state.selectedApplicationId && state.trainingApplications.some((item) => item.applicationId === state.selectedApplicationId)) {
        await loadApplicationDetail(state.selectedApplicationId);
      } else {
        state.selectedApplicationId = '';
        state.selectedApplication = null;
        renderEmptyDetail(els.applicationDetail, 'Select an application to review.');
      }
    } catch (error) {
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
  }

  async function loadApplicationDetail(applicationId) {
    state.selectedApplicationId = applicationId;
    renderApplications();
    renderLoading(els.applicationDetail, 'Loading application detail...');
    try {
      const results = await Promise.all([
        adminGet('/admin/training/applications/' + encodeURIComponent(applicationId)),
        adminGet('/admin/training/applications/' + encodeURIComponent(applicationId) + '/communications'),
      ]);
      state.selectedApplication = results[0].application || null;
      state.applicationCommunications = Array.isArray(results[1].items) ? results[1].items : [];
      renderApplicationDetail();
    } catch (error) {
      renderEmptyDetail(els.applicationDetail, error.status === 404 ? 'Application not found.' : 'Application detail could not be loaded.');
      handleRequestError(error);
    }
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
    const timeline = {
      Submitted: formatDate(application.submittedAt),
      Decision: application.decision ? (application.decision.type + ' · ' + formatDate(application.decision.decidedAt)) : 'Pending',
      Offer: application.status === 'OFFERED' ? 'Created' : 'Not created',
      'Latest communication': state.applicationCommunications[0] ? state.applicationCommunications[0].status + ' · ' + formatDate(state.applicationCommunications[0].updatedAt) : 'None',
    };
    els.applicationDetail.appendChild(detailSection('Operational timeline', timeline));
    renderApplicationActions(application);
    renderCommunications();
  }

  function renderApplicationActions(application) {
    const section = textEl('section', 'admin-detail-section', '');
    section.appendChild(textEl('h4', '', 'Review actions'));
    const actions = document.createElement('div'); actions.className = 'admin-form-actions';
    const available = application.status === 'NEW' ? ['start-review', 'accept', 'waitlist', 'recommend', 'decline', 'withdraw'] : application.status === 'UNDER_REVIEW' ? ['accept', 'waitlist', 'recommend', 'decline', 'withdraw'] : [];
    available.forEach((command) => actions.appendChild(buttonEl('btn btn-secondary', command.replace('-', ' '), { applicationCommand: command })));
    if (application.status === 'ACCEPTED') {
      const select = document.createElement('select'); select.id = 'admin-application-cohort'; select.setAttribute('aria-label', 'Offer cohort');
      state.trainingCohorts.filter((cohort) => cohort.courseId === application.courseId && cohort.lifecycle === 'OPEN').forEach((cohort) => {
        const option = document.createElement('option'); option.value = cohort.cohortId; option.textContent = cohort.label + ' (' + cohort.capacityRemaining + ' remaining)'; select.appendChild(option);
      });
      actions.appendChild(select);
      actions.appendChild(buttonEl('btn btn-primary', 'Send offer', { applicationOffer: 'true' }));
    }
    if (!available.length && application.status !== 'ACCEPTED') actions.appendChild(textEl('p', 'admin-empty', 'No review transition is available for this status.'));
    section.appendChild(actions); els.applicationDetail.appendChild(section);
  }

  function renderCommunications() {
    const section = textEl('section', 'admin-detail-section', ''); section.appendChild(textEl('h4', '', 'Communications'));
    if (!state.applicationCommunications.length) section.appendChild(textEl('p', 'admin-empty', 'No communication records yet.'));
    state.applicationCommunications.forEach((item) => {
      const row = textEl('article', 'admin-training-card', '');
      row.appendChild(textEl('strong', '', (item.family || 'Communication') + ' — ' + (item.variant || '')));
      row.appendChild(textEl('p', '', (item.status || 'UNKNOWN') + ' · Updated ' + formatDate(item.updatedAt)));
      const blocked = ['DISPATCH_UNCERTAIN', 'DELIVERY_UNCERTAIN', 'RECIPIENT_UNAVAILABLE'].includes(item.failureCategory);
      if (['SENT', 'FAILED_FINAL', 'FAILED_RETRYABLE'].includes(item.status) && !blocked) row.appendChild(buttonEl('btn btn-secondary', 'Resend', { communicationResend: item.sk || item.logicalKey || '' }));
      section.appendChild(row);
    });
    els.applicationDetail.appendChild(section);
  }

  async function applicationCommand(command) {
    const application = state.selectedApplication; if (!application) return;
    let reason = null; let recommendedCourseId = null;
    if (['recommend', 'decline', 'withdraw'].includes(command)) {
      reason = window.prompt('Reason (required, maximum 500 characters):');
      if (!reason || !reason.trim()) return;
    }
    if (command === 'recommend') {
      recommendedCourseId = window.prompt('Published recommended course ID:');
      if (!recommendedCourseId || !recommendedCourseId.trim()) return;
    }
    if (!window.confirm('Confirm ' + command.replace('-', ' ') + ' for this application?')) return;
    const body = { expectedVersion: Number(application.version) };
    if (reason) body.reason = reason.trim(); if (recommendedCourseId) body.recommendedCourseId = recommendedCourseId.trim();
    try {
      await apiRequest('/admin/training/applications/' + encodeURIComponent(application.applicationId) + '/' + command, { method: 'POST', body: JSON.stringify(body), headers: { 'Idempotency-Key': idempotencyKey('application-' + command) } });
      await loadApplications(); setStatus('Application updated.', 'success');
    } catch (error) { handleRequestError(error); }
  }

  async function offerApplication() {
    const application = state.selectedApplication; const select = document.getElementById('admin-application-cohort');
    const cohort = select && state.trainingCohorts.find((item) => item.cohortId === select.value);
    if (!application || !cohort) return setStatus('Choose an open cohort before sending an offer.', 'warn');
    if (!window.confirm('Reserve a seat in ' + cohort.label + ' and send this offer?')) return;
    try {
      await apiRequest('/admin/training/applications/' + encodeURIComponent(application.applicationId) + '/offer', { method: 'POST', body: JSON.stringify({ expectedVersion: Number(application.version), cohortId: cohort.cohortId, expectedCohortVersion: Number(cohort.version) }), headers: { 'Idempotency-Key': idempotencyKey('application-offer') } });
      await loadTraining(); setStatus('Offer created and seat reserved.', 'success');
    } catch (error) { handleRequestError(error); }
  }

  async function resendCommunication(logicalKey) {
    if (!logicalKey) return setStatus('Communication identifier is unavailable.', 'warn');
    const reason = window.prompt('Reason for resend (required, maximum 500 characters):'); if (!reason || !reason.trim()) return;
    if (!window.confirm('Queue one controlled resend attempt?')) return;
    try {
      await apiRequest('/admin/training/applications/' + encodeURIComponent(state.selectedApplicationId) + '/communications/resend', { method: 'POST', body: JSON.stringify({ logicalKey, reason: reason.trim() }), headers: { 'Idempotency-Key': idempotencyKey('communication-resend') } });
      await loadApplicationDetail(state.selectedApplicationId); setStatus('Resend queued.', 'success');
    } catch (error) { handleRequestError(error); }
  }

  function renderTraining() {
    clearNode(els.trainingCourses);
    clearNode(els.cohortCourse);
    state.trainingCourses.forEach((course) => {
      const card = textEl('article', 'admin-training-card', '');
      card.appendChild(textEl('h3', '', course.title));
      card.appendChild(textEl('p', '', course.publicationStatus + ' · Version ' + course.version));
      const action = course.publicationStatus === 'PUBLISHED' ? 'unpublish' : 'publish';
      card.appendChild(buttonEl('btn btn-secondary', action === 'publish' ? 'Publish' : 'Unpublish', {
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
      card.appendChild(textEl('p', '', cohort.lifecycle + ' · Availability ' + (cohort.availability || 'CLOSED') + ' · Remaining ' + (cohort.capacityRemaining == null ? cohort.capacity : cohort.capacityRemaining) + ' of ' + cohort.capacity + ' · Minimum ' + cohort.minimumSize));
      card.appendChild(buttonEl('btn btn-secondary', 'Edit', { trainingCohortEdit: cohort.cohortId }));
      if (cohort.lifecycle === 'DRAFT') card.appendChild(buttonEl('btn btn-secondary', 'Open registration', { trainingCohortCommand: 'open', trainingCohortId: cohort.cohortId, trainingCohortCourse: cohort.courseId, trainingCohortVersion: String(cohort.version) }));
      if (cohort.lifecycle === 'OPEN') card.appendChild(buttonEl('btn btn-secondary', 'Close registration', { trainingCohortCommand: 'close', trainingCohortId: cohort.cohortId, trainingCohortCourse: cohort.courseId, trainingCohortVersion: String(cohort.version) }));
      els.trainingCohorts.appendChild(card);
    });
    const selectedCourse = els.applicationCourseFilter.value;
    const selectedCohort = els.applicationCohortFilter.value;
    clearNode(els.applicationCourseFilter); clearNode(els.applicationCohortFilter);
    [['', 'All courses'], ...state.trainingCourses.map((item) => [item.courseId, item.title])].forEach(([value, label]) => { const option = document.createElement('option'); option.value = value; option.textContent = label; els.applicationCourseFilter.appendChild(option); });
    [['', 'All cohorts'], ...state.trainingCohorts.map((item) => [item.cohortId, item.label])].forEach(([value, label]) => { const option = document.createElement('option'); option.value = value; option.textContent = label; els.applicationCohortFilter.appendChild(option); });
    els.applicationCourseFilter.value = selectedCourse; els.applicationCohortFilter.value = selectedCohort;
  }

  function iso(value) { return value ? new Date(value).toISOString() : null; }
  function localDate(value) { if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }

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
      tentativeStartAt: iso(els.cohortStart.value), tentativeEndAt: iso(els.cohortEnd.value),
      capacity: Number(els.cohortCapacity.value), minimumSize: Number(els.cohortMinimum.value),
      registrationOpensAt: iso(els.registrationOpen.value), registrationClosesAt: iso(els.registrationClose.value),
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
    els.cohortStart.value = localDate(cohort.tentativeStartAt); els.cohortEnd.value = localDate(cohort.tentativeEndAt);
    els.registrationOpen.value = localDate(cohort.registrationOpensAt); els.registrationClose.value = localDate(cohort.registrationClosesAt);
    els.cohortLabel.focus();
  }

  function clearCohortForm() { els.cohortForm.reset(); els.cohortId.value = ''; els.cohortVersion.value = ''; els.cohortCourse.disabled = false; els.cohortTimezone.value = 'Asia/Kolkata'; }

  async function courseCommand(button) {
    const action = button.dataset.trainingCourseAction;
    if (!window.confirm((action === 'publish' ? 'Publish' : 'Unpublish') + ' this seeded course?')) return;
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
    if (!window.confirm((action === 'open' ? 'Open' : 'Close') + ' registration for this cohort?')) return;
    const body = { courseId: button.dataset.trainingCohortCourse, expectedVersion: Number(button.dataset.trainingCohortVersion), reason: 'Manual admin ' + action };
    const scope = 'cohort-' + action + ':' + button.dataset.trainingCohortId;
    try {
      await apiRequest('/admin/training/cohorts/' + encodeURIComponent(button.dataset.trainingCohortId) + '/' + action, {
        method: 'POST', body: JSON.stringify(body),
        headers: { 'Idempotency-Key': operationKeys.key(scope, body) },
      });
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
    els.refreshTraining.addEventListener('click', loadTraining);
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
      const resend = event.target.closest('[data-communication-resend]');
      if (resend) resendCommunication(resend.dataset.communicationResend);
    });
  }

  function init() {
    if (!els.loginPanel || !els.shell) return;
    els.apiNote.textContent = 'API: ' + state.apiBase;
    bindEvents();
    validateStoredSession();
  }

  init();
}());
