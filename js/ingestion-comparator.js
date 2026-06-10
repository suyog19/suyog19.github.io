(function () {
  const API_PATH = '/ai-workflow/ingestion-comparator/jobs';
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const POLL_MS = 2000;
  const MAX_POLLS = 45;
  const PARSERS = [
    {
      id: 'baseline',
      name: 'Platform Baseline',
      description: 'Backend baseline converter for PDF, DOCX, and HTML.',
      enabled: true,
    },
    {
      id: 'pymupdf',
      name: 'PyMuPDF',
      description: 'PDF-focused text extraction adapter.',
      enabled: true,
    },
    {
      id: 'markitdown',
      name: 'MarkItDown',
      description: 'Accepted by the API; may be skipped until enabled.',
      enabled: true,
    },
    {
      id: 'docling',
      name: 'Docling',
      description: 'Accepted by the API; may be skipped until enabled.',
      enabled: true,
    },
    {
      id: 'unstructured',
      name: 'Unstructured',
      description: 'Accepted by the API; may be skipped until enabled.',
      enabled: true,
    },
  ];

  const formEl = document.getElementById('ingestion-comparator-form');
  const fileEl = document.getElementById('ingestion-file');
  const fileMetaEl = document.getElementById('ingestion-file-meta');
  const parserGridEl = document.getElementById('ingestion-parser-grid');
  const llmEl = document.getElementById('ingestion-llm');
  const submitEl = document.getElementById('ingestion-submit');
  const resetEl = document.getElementById('ingestion-reset');
  const progressEl = document.getElementById('ingestion-progress');
  const jobEl = document.getElementById('ingestion-job');
  const resultsSectionEl = document.getElementById('ingestion-results-section');
  const resultGridEl = document.getElementById('ingestion-result-grid');
  const tabsEl = document.getElementById('ingestion-tabs');
  const panelEl = document.getElementById('ingestion-panel');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let state = initialState();

  function initialState() {
    return {
      apiBase: apiBaseUrl(),
      job: null,
      status: null,
      result: null,
      markdownByParser: {},
      selectedView: 'preview',
      selectedParserId: null,
      pollCount: 0,
      pollTimer: null,
    };
  }

  function apiBaseUrl() {
    const override = new URLSearchParams(window.location.search).get('apiBase');
    if (override) return override.replace(/\/$/, '');
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === 'dev.suyogjoshi.com') {
      return 'https://api-dev.suyogjoshi.com';
    }
    return 'https://api.suyogjoshi.com';
  }

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function renderParsers() {
    parserGridEl.innerHTML = PARSERS.map((parser, index) => `
      <label class="ingestion-demo-parser${parser.enabled ? '' : ' is-disabled'}">
        <input
          type="checkbox"
          name="parser"
          value="${escapeHtml(parser.id)}"
          ${index < 2 ? 'checked' : ''}
          ${parser.enabled ? '' : 'disabled'}
        >
        <span>
          <strong>${escapeHtml(parser.name)}</strong>
          <small>${escapeHtml(parser.description)}</small>
        </span>
      </label>
    `).join('');
  }

  function selectedParsers() {
    return Array.from(formEl.querySelectorAll('input[name="parser"]:checked'))
      .map((input) => input.value)
      .slice(0, 3);
  }

  function enforceParserLimit(changedInput) {
    const checked = Array.from(formEl.querySelectorAll('input[name="parser"]:checked'));
    if (checked.length <= 3) return;
    changedInput.checked = false;
    renderProgress(['Select at most three parsers for one comparison run.'], 'warn');
  }

  function contentTypeFor(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'pdf') return 'application/pdf';
    if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (extension === 'html') return 'text/html';
    return file.type || 'application/octet-stream';
  }

  function validateInput() {
    const file = fileEl.files[0];
    const parsers = selectedParsers();
    if (!file) return 'Choose a PDF, DOCX, or HTML file.';
    if (file.size <= 0) return 'The selected file is empty.';
    if (file.size > MAX_FILE_BYTES) return 'The selected file exceeds the 10 MB limit.';
    if (!['pdf', 'docx', 'html'].includes(file.name.split('.').pop().toLowerCase())) {
      return 'Supported file types are PDF, DOCX, and HTML.';
    }
    if (!parsers.length) return 'Select at least one parser.';
    if (parsers.length > 3) return 'Select at most three parsers.';
    if (llmEl.checked && parsers.length < 2) {
      return 'AI comparison requires at least two selected parsers.';
    }
    return null;
  }

  function setBusy(isBusy) {
    submitEl.disabled = isBusy;
    fileEl.disabled = isBusy;
    llmEl.disabled = isBusy;
    formEl.querySelectorAll('input[name="parser"]').forEach((input) => {
      input.disabled = isBusy;
    });
  }

  function renderProgress(items, tone) {
    progressEl.innerHTML = `
      <div class="ingestion-demo-message${tone ? ` is-${tone}` : ''}">
        ${items.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
      </div>
    `;
  }

  function renderJob() {
    if (!state.job && !state.status) {
      jobEl.innerHTML = `
        <dl class="ingestion-demo-job-list">
          <div><dt>API</dt><dd>${escapeHtml(state.apiBase)}</dd></div>
          <div><dt>Retention</dt><dd>15 minute upload, 24 hour result metadata</dd></div>
        </dl>
      `;
      return;
    }
    const source = state.status || state.job;
    jobEl.innerHTML = `
      <dl class="ingestion-demo-job-list">
        <div><dt>Job</dt><dd>${escapeHtml(source.jobId)}</dd></div>
        <div><dt>Status</dt><dd>${escapeHtml(source.status)}</dd></div>
        ${source.uploadExpiresAt ? `<div><dt>Upload expires</dt><dd>${escapeHtml(source.uploadExpiresAt)}</dd></div>` : ''}
        ${source.expiresAt ? `<div><dt>Result expires</dt><dd>${escapeHtml(source.expiresAt)}</dd></div>` : ''}
      </dl>
    `;
  }

  async function parseJsonResponse(response) {
    const text = await response.text();
    let body = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (error) {
        body = { message: text };
      }
    }
    if (!response.ok) {
      const error = new Error(body.message || body.error || `Request failed: ${response.status}`);
      error.body = body;
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async function createJob(file, parsers) {
    const response = await fetch(`${state.apiBase}${API_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: contentTypeFor(file),
        sizeBytes: file.size,
        parsers,
        includeLlmComparison: llmEl.checked,
        source: 'suyogjoshi.com',
      }),
    });
    return parseJsonResponse(response);
  }

  async function uploadFile(job, file) {
    const response = await fetch(job.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentTypeFor(file) },
      body: file,
    });
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
  }

  async function completeUpload(job) {
    const response = await fetch(`${state.apiBase}${API_PATH}/${encodeURIComponent(job.jobId)}/complete-upload`, {
      method: 'POST',
    });
    return parseJsonResponse(response);
  }

  async function getStatus(jobId) {
    const response = await fetch(`${state.apiBase}${API_PATH}/${encodeURIComponent(jobId)}`);
    return parseJsonResponse(response);
  }

  async function getResult(jobId) {
    const response = await fetch(`${state.apiBase}${API_PATH}/${encodeURIComponent(jobId)}/result`);
    return parseJsonResponse(response);
  }

  async function pollUntilReady() {
    clearTimeout(state.pollTimer);
    state.pollCount += 1;
    state.status = await getStatus(state.job.jobId);
    renderJob();
    renderParserRuns(state.status.parserRuns || []);
    if (state.status.status === 'ready' || state.status.status === 'failed') {
      await loadResult();
      return;
    }
    if (state.pollCount >= MAX_POLLS) {
      renderProgress(['Processing is still running. You can retry result loading in a moment.'], 'warn');
      setBusy(false);
      return;
    }
    state.pollTimer = setTimeout(() => {
      pollUntilReady().catch(showError);
    }, POLL_MS);
  }

  async function loadResult() {
    try {
      state.result = await getResult(state.job.jobId);
    } catch (error) {
      if (error.status === 409) {
        state.pollTimer = setTimeout(() => {
          pollUntilReady().catch(showError);
        }, POLL_MS);
        return;
      }
      throw error;
    }
    await loadMarkdownArtifacts();
    setBusy(false);
    renderProgress(['Results are ready. Review parser outputs and AI comparison below.'], 'success');
    renderResults();
    resultsSectionEl.hidden = false;
    resultsSectionEl.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  async function loadMarkdownArtifacts() {
    const readyResults = (state.result.parserResults || [])
      .filter((item) => item.status === 'ready' && item.markdown && item.markdown.downloadUrl);
    await Promise.all(readyResults.map(async (item) => {
      try {
        const response = await fetch(item.markdown.downloadUrl);
        if (!response.ok) throw new Error(`Markdown fetch failed: ${response.status}`);
        state.markdownByParser[item.parserId] = await response.text();
      } catch (error) {
        state.markdownByParser[item.parserId] = '';
        item.markdownFetchError = 'Open the Markdown link if browser fetch is blocked.';
      }
    }));
  }

  function renderParserRuns(runs) {
    resultGridEl.innerHTML = runs.map((run) => parserRunCard(run)).join('');
    resultsSectionEl.hidden = false;
  }

  function renderResults() {
    const parserResults = state.result.parserResults || [];
    state.selectedParserId = state.selectedParserId || parserResults.find((item) => item.status === 'ready')?.parserId || parserResults[0]?.parserId;
    resultGridEl.innerHTML = parserResults.map((item) => parserRunCard(item)).join('');
    renderTabs();
    renderPanel();
  }

  function parserRunCard(item) {
    const status = item.status || 'pending';
    const warnings = item.warnings || [];
    const error = item.error;
    const markdown = item.markdown || {};
    return `
      <article class="ingestion-demo-result-card is-${escapeHtml(status)}">
        <div class="ingestion-demo-result-head">
          <div>
            <span class="rag-demo-badge">${escapeHtml(status)}</span>
            <h3>${escapeHtml(item.parserName || item.parserId)}</h3>
          </div>
          ${item.durationMs !== undefined && item.durationMs !== null ? `<strong>${escapeHtml(item.durationMs)} ms</strong>` : ''}
        </div>
        ${item.metadata ? `<p>${escapeHtml(metadataSummary(item.metadata))}</p>` : ''}
        ${warnings.length ? `<ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>` : ''}
        ${error ? `<p class="ingestion-demo-error">${escapeHtml(error.message || error.code)}</p>` : ''}
        ${markdown.downloadUrl ? `<a class="rag-demo-text-link" href="${escapeHtml(markdown.downloadUrl)}" target="_blank" rel="noopener noreferrer">Open Markdown artifact</a>` : ''}
        ${item.markdownFetchError ? `<p class="rag-demo-note">${escapeHtml(item.markdownFetchError)}</p>` : ''}
      </article>
    `;
  }

  function metadataSummary(metadata) {
    const entries = Object.entries(metadata || {});
    if (!entries.length) return 'No parser metadata returned.';
    return entries.map(([key, value]) => `${key}: ${value}`).join(' · ');
  }

  function renderTabs() {
    const views = [
      ['preview', 'Preview'],
      ['raw', 'Raw Markdown'],
      ['compare', 'Side by side'],
      ['ai', 'AI comparison'],
    ];
    tabsEl.innerHTML = views.map(([id, label]) => `
      <button
        class="ingestion-demo-tab${state.selectedView === id ? ' is-selected' : ''}"
        type="button"
        role="tab"
        aria-selected="${state.selectedView === id ? 'true' : 'false'}"
        data-view="${escapeHtml(id)}"
      >${escapeHtml(label)}</button>
    `).join('');
  }

  function selectedParserResult() {
    const results = state.result.parserResults || [];
    return results.find((item) => item.parserId === state.selectedParserId) || results[0];
  }

  function renderParserPicker(results) {
    const ready = results.filter((item) => item.status === 'ready');
    if (!ready.length) return '';
    return `
      <div class="ingestion-demo-picker">
        ${ready.map((item) => `
          <button
            class="ingestion-demo-picker-button${state.selectedParserId === item.parserId ? ' is-selected' : ''}"
            type="button"
            data-parser-id="${escapeHtml(item.parserId)}"
          >${escapeHtml(item.parserName || item.parserId)}</button>
        `).join('')}
      </div>
    `;
  }

  function renderPanel() {
    if (!state.result) {
      panelEl.innerHTML = '';
      return;
    }
    const results = state.result.parserResults || [];
    const selected = selectedParserResult();
    const markdown = selected ? state.markdownByParser[selected.parserId] : '';
    if (state.selectedView === 'ai') {
      panelEl.innerHTML = renderAiComparison();
      return;
    }
    if (state.selectedView === 'compare') {
      panelEl.innerHTML = `
        <div class="ingestion-demo-compare-grid">
          ${results.filter((item) => item.status === 'ready').map((item) => `
            <article class="rag-demo-card">
              <h3>${escapeHtml(item.parserName || item.parserId)}</h3>
              <pre class="km-demo-code" tabindex="0"><code>${escapeHtml(state.markdownByParser[item.parserId] || 'Markdown preview could not be loaded in the browser. Use the artifact link above.')}</code></pre>
            </article>
          `).join('') || '<p class="rag-demo-note">No ready Markdown outputs to compare.</p>'}
        </div>
      `;
      return;
    }
    panelEl.innerHTML = `
      ${renderParserPicker(results)}
      <article class="rag-demo-card ingestion-demo-markdown-card">
        <div class="ingestion-demo-markdown-actions">
          <h3>${escapeHtml(selected?.parserName || selected?.parserId || 'Markdown')}</h3>
          <div>
            <button class="btn btn-secondary" type="button" data-copy-markdown>Copy</button>
            ${markdown ? '<button class="btn btn-secondary" type="button" data-download-markdown>Download</button>' : ''}
            ${selected?.markdown?.downloadUrl ? `<a class="btn btn-secondary" href="${escapeHtml(selected.markdown.downloadUrl)}" target="_blank" rel="noopener noreferrer">Open</a>` : ''}
          </div>
        </div>
        ${state.selectedView === 'raw'
          ? `<pre class="km-demo-code" tabindex="0"><code>${escapeHtml(markdown || 'Markdown preview could not be loaded in the browser. Use the artifact link above.')}</code></pre>`
          : `<div class="ingestion-demo-markdown-preview">${markdownToHtml(markdown)}</div>`}
      </article>
    `;
  }

  function renderAiComparison() {
    const comparison = state.result.llmComparison || { status: 'disabled', requested: false };
    if (comparison.status !== 'ready') {
      const reason = comparison.error?.message || (comparison.warnings || []).join(' ') || 'AI comparison was not returned for this run.';
      return `
        <article class="rag-demo-card">
          <span class="rag-demo-badge">${escapeHtml(comparison.status || 'not requested')}</span>
          <h3>AI-generated comparison</h3>
          <p>${escapeHtml(reason)}</p>
        </article>
      `;
    }
    return `
      <article class="rag-demo-card ingestion-demo-ai-card">
        <span class="rag-demo-badge">${escapeHtml(comparison.analysisLabel || 'AI-generated comparison')}</span>
        <h3>Recommendation: ${escapeHtml(comparison.recommendedParserId)}</h3>
        <p>${escapeHtml(comparison.summary)}</p>
        <div class="ingestion-demo-ai-grid">
          <section>
            <h4>Strengths</h4>
            <ul>${(comparison.strengths || []).map((item) => `<li><strong>${escapeHtml(item.parserId)}:</strong> ${escapeHtml(item.note)}</li>`).join('')}</ul>
          </section>
          <section>
            <h4>Weaknesses</h4>
            <ul>${(comparison.weaknesses || []).map((item) => `<li><strong>${escapeHtml(item.parserId)}:</strong> ${escapeHtml(item.note)}</li>`).join('')}</ul>
          </section>
        </div>
        <dl class="ingestion-demo-ai-notes">
          <div><dt>Structure</dt><dd>${escapeHtml(comparison.structuralFidelity)}</dd></div>
          <div><dt>Missing or duplicate content</dt><dd>${escapeHtml(comparison.missingOrDuplicatedContent)}</dd></div>
          <div><dt>Readability</dt><dd>${escapeHtml(comparison.readability)}</dd></div>
          <div><dt>Recommendation</dt><dd>${escapeHtml(comparison.recommendation)}</dd></div>
          <div><dt>Confidence</dt><dd>${escapeHtml(comparison.confidence)}</dd></div>
        </dl>
        <p class="rag-demo-note">${escapeHtml((comparison.limitations || []).join(' '))}</p>
      </article>
    `;
  }

  function markdownToHtml(markdown) {
    if (!markdown) {
      return '<p class="rag-demo-note">Markdown preview could not be loaded in the browser. Use the artifact link above.</p>';
    }
    const lines = markdown.split(/\r?\n/);
    return lines.map((line) => {
      if (line.startsWith('### ')) return `<h4>${escapeHtml(line.slice(4))}</h4>`;
      if (line.startsWith('## ')) return `<h3>${escapeHtml(line.slice(3))}</h3>`;
      if (line.startsWith('# ')) return `<h2>${escapeHtml(line.slice(2))}</h2>`;
      if (line.startsWith('- ')) return `<p>• ${escapeHtml(line.slice(2))}</p>`;
      if (!line.trim()) return '';
      return `<p>${escapeHtml(line)}</p>`;
    }).join('');
  }

  function showError(error) {
    clearTimeout(state.pollTimer);
    setBusy(false);
    const body = error.body || {};
    const fields = body.fields ? Object.values(body.fields).join(' ') : '';
    const message = fields || body.message || error.message || 'Something went wrong.';
    renderProgress([message], body.error === 'JOB_EXPIRED' || body.error === 'UPLOAD_EXPIRED' ? 'warn' : 'error');
    renderJob();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validation = validateInput();
    if (validation) {
      renderProgress([validation], 'error');
      return;
    }
    const file = fileEl.files[0];
    const parsers = selectedParsers();
    state = { ...initialState(), apiBase: state.apiBase };
    setBusy(true);
    resultsSectionEl.hidden = true;
    resultGridEl.innerHTML = '';
    tabsEl.innerHTML = '';
    panelEl.innerHTML = '';

    try {
      renderProgress(['Creating comparator job...']);
      state.job = await createJob(file, parsers);
      renderJob();
      renderProgress(['Uploading document to the temporary upload URL...']);
      await uploadFile(state.job, file);
      renderProgress(['Upload complete. Queueing parser comparison...']);
      state.status = await completeUpload(state.job);
      renderJob();
      renderProgress(['Processing started. Polling parser runs...']);
      await pollUntilReady();
    } catch (error) {
      showError(error);
    }
  }

  function handleClick(event) {
    const tab = event.target.closest('[data-view]');
    if (tab) {
      state.selectedView = tab.dataset.view;
      renderTabs();
      renderPanel();
      return;
    }
    const parserButton = event.target.closest('[data-parser-id]');
    if (parserButton) {
      state.selectedParserId = parserButton.dataset.parserId;
      renderPanel();
      return;
    }
    const copyButton = event.target.closest('[data-copy-markdown]');
    if (copyButton) {
      const selected = selectedParserResult();
      const markdown = selected ? state.markdownByParser[selected.parserId] : '';
      if (markdown && navigator.clipboard) {
        navigator.clipboard.writeText(markdown).then(() => {
          copyButton.textContent = 'Copied';
          setTimeout(() => { copyButton.textContent = 'Copy'; }, 1200);
        });
      }
    }
    const downloadButton = event.target.closest('[data-download-markdown]');
    if (downloadButton) {
      const selected = selectedParserResult();
      const markdown = selected ? state.markdownByParser[selected.parserId] : '';
      if (selected && markdown) {
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selected.parserId || 'parser'}-output.md`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }
    }
  }

  function handleFileChange() {
    const file = fileEl.files[0];
    fileMetaEl.textContent = file
      ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`
      : 'Maximum file size: 10 MB';
  }

  function reset() {
    clearTimeout(state.pollTimer);
    formEl.reset();
    state = initialState();
    renderParsers();
    renderProgress(['Choose a document to begin.']);
    renderJob();
    resultsSectionEl.hidden = true;
    resultGridEl.innerHTML = '';
    tabsEl.innerHTML = '';
    panelEl.innerHTML = '';
    fileMetaEl.textContent = 'Maximum file size: 10 MB';
    setBusy(false);
  }

  function init() {
    renderParsers();
    renderProgress(['Choose a document to begin.']);
    renderJob();
    formEl.addEventListener('submit', handleSubmit);
    resetEl.addEventListener('click', reset);
    document.addEventListener('click', handleClick);
    fileEl.addEventListener('change', handleFileChange);
    parserGridEl.addEventListener('change', (event) => {
      if (event.target.matches('input[name="parser"]')) {
        enforceParserLimit(event.target);
      }
    });
  }

  init();
}());
