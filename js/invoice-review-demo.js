(function () {
  const script = document.currentScript;
  const dataUrl = new URL(script.dataset.demoSrc, window.location.href);
  const samplesEl = document.getElementById('invoice-demo-samples');
  const timelineEl = document.getElementById('invoice-demo-timeline');
  const resultsEl = document.getElementById('invoice-demo-results');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const instantMode = reducedMotion || new URLSearchParams(window.location.search).has('instant');
  const timelineSteps = [
    'Invoice selected',
    'Text extracted',
    'Document classified',
    'Fields extracted',
    'Business rules checked',
    'Reviewer summary generated',
  ];

  let demoData = null;
  let selectedScenario = null;
  let completedStep = -1;
  let action = null;
  let timelineTimer = null;
  let selectedEvidence = null;

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const outcomeLabel = (scenario) => scenario.expectedOutcome === 'Low Risk'
    ? 'Expected: Low Risk'
    : 'Expected: Human Review';

  const actionMessages = {
    Approve: 'Demo action recorded: Approved. No real approval was submitted.',
    'Needs More Info': 'Demo action recorded: Needs More Info. No message was sent.',
    Reject: 'Demo action recorded: Rejected. No real rejection was submitted.',
  };

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function renderSamples() {
    samplesEl.innerHTML = demoData.scenarios.map((scenario) => `
      <article class="invoice-demo-sample${selectedScenario?.id === scenario.id ? ' is-selected' : ''}">
        <div>
          <span class="invoice-demo-badge">${escapeHtml(outcomeLabel(scenario))}</span>
          <h3>${escapeHtml(scenario.title)}</h3>
          <p>${escapeHtml(scenario.description)}</p>
        </div>
        <button class="btn btn-secondary" type="button" data-run-scenario="${escapeHtml(scenario.id)}">
          Run Review
        </button>
      </article>
    `).join('');
  }

  function renderTimeline() {
    timelineEl.innerHTML = timelineSteps.map((step, index) => {
      let state = 'pending';
      if (index < completedStep) state = 'complete';
      if (index === completedStep) state = 'active';
      if (completedStep >= timelineSteps.length) state = 'complete';

      return `
        <li class="invoice-demo-timeline-step is-${state}">
          <span class="invoice-demo-timeline-icon" aria-hidden="true">${state === 'complete' ? '&#10003;' : index + 1}</span>
          <span>${escapeHtml(step)}</span>
        </li>
      `;
    }).join('');
  }

  function runScenario(scenarioId) {
    selectedScenario = demoData.scenarios.find((scenario) => scenario.id === scenarioId);
    completedStep = instantMode ? timelineSteps.length : 0;
    action = null;
    selectedEvidence = null;

    clearInterval(timelineTimer);
    renderSamples();
    renderTimeline();
    renderResults();
    scrollToId('processing-title');

    if (instantMode) {
      renderResults();
      scrollToId('invoice-demo-results');
      return;
    }

    timelineTimer = setInterval(() => {
      completedStep += 1;
      renderTimeline();
      if (completedStep >= timelineSteps.length) {
        clearInterval(timelineTimer);
        renderResults();
        scrollToId('invoice-demo-results');
      }
    }, 350);
  }

  function metadataRows(scenario) {
    return [
      ['Document type', scenario.document.type],
      ['Classification confidence', scenario.document.classificationConfidence],
      ['Text source', scenario.document.textSource],
      ['Processing mode', scenario.document.processingMode],
    ];
  }

  function getField(scenario, label) {
    return scenario.fields.find((field) => field.label === label);
  }

  function renderLineItems(scenario) {
    if (!scenario.lineItems?.length) return '';

    return `
      <div class="invoice-demo-line-items" aria-label="Detected line items">
        <strong>Detected line items</strong>
        <ul>
          ${scenario.lineItems.map((item) => `
            <li>
              <span>${escapeHtml(item.description)}</span>
              <small>${escapeHtml(item.quantity)} &middot; ${escapeHtml(item.amount)}</small>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  function renderSyntheticPaper(scenario) {
    const vendor = getField(scenario, 'Vendor Name');
    const invoiceNumber = getField(scenario, 'Invoice Number');
    const invoiceDate = getField(scenario, 'Invoice Date');
    const dueDate = getField(scenario, 'Due Date');
    const total = getField(scenario, 'Total Amount');
    const gstin = getField(scenario, 'GSTIN');
    const terms = getField(scenario, 'Payment Terms');
    const title = scenario.document.type === 'Vendor Bill' ? 'Vendor Bill' : 'Invoice';

    return `
      <div class="invoice-demo-paper" aria-label="Synthetic ${escapeHtml(title.toLowerCase())} preview">
        <div class="invoice-demo-paper-header">
          <span>${escapeHtml(title)}</span>
          <strong>${escapeHtml(invoiceNumber.displayValue)}</strong>
        </div>
        <div class="invoice-demo-paper-row">
          <span>Vendor</span>
          <strong>${escapeHtml(vendor.displayValue)}</strong>
        </div>
        <div class="invoice-demo-paper-row">
          <span>GSTIN</span>
          <strong>${escapeHtml(gstin.displayValue)}</strong>
        </div>
        <div class="invoice-demo-paper-grid">
          <div><span>Invoice date</span><strong>${escapeHtml(invoiceDate.displayValue)}</strong></div>
          <div><span>Due date</span><strong>${escapeHtml(dueDate.displayValue)}</strong></div>
          <div><span>Terms</span><strong>${escapeHtml(terms.displayValue)}</strong></div>
          <div><span>Total</span><strong>${escapeHtml(total.displayValue)}</strong></div>
        </div>
      </div>
    `;
  }

  function renderImagePreview(scenario) {
    if (scenario.document.syntheticDocumentName !== 'handwritten-vendor-bill.png') {
      return renderSyntheticPaper(scenario);
    }

    return `
      <figure class="invoice-demo-scan-preview">
        <img
          src="../../../public/images/demos/invoice-review/handwritten-vendor-bill.png"
          alt="Synthetic scanned vendor cash bill from Shree Demo Enterprises used to demonstrate OCR fallback."
          loading="lazy"
        >
        <figcaption>Synthetic demo image. No real vendor, customer, tax, or payment data is used.</figcaption>
      </figure>
    `;
  }

  function renderInvoicePreview(scenario) {
    return `
      <article class="invoice-demo-card invoice-demo-card--preview">
        <h3>Invoice Snapshot</h3>
        ${renderImagePreview(scenario)}
        <dl class="invoice-demo-metadata">
          ${metadataRows(scenario).map(([label, value]) => `
            <div>
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>
          `).join('')}
        </dl>
        ${renderLineItems(scenario)}
      </article>
    `;
  }

  function renderOcrPreview(scenario) {
    if (!scenario.ocrPreview) return '';

    return `
      <article class="invoice-demo-card invoice-demo-card--wide invoice-demo-ocr-card">
        <h3>${escapeHtml(scenario.ocrPreview.title)}</h3>
        <p>The original bill is an image. OCR converts the visible text into a rough text layer before field extraction.</p>
        <pre>${escapeHtml(scenario.ocrPreview.text)}</pre>
      </article>
    `;
  }

  function renderFields(scenario) {
    return `
      <article class="invoice-demo-card">
        <h3>Extracted Fields</h3>
        <div class="invoice-demo-table-wrap">
          <table class="invoice-demo-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Extracted Value</th>
                <th>Confidence</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              ${scenario.fields.map((field) => `
                <tr class="${field.confidence === 'Missing' ? 'is-missing' : ''}">
                  <td data-label="Field">${escapeHtml(field.label)}</td>
                  <td data-label="Extracted Value">${escapeHtml(field.displayValue)}</td>
                  <td data-label="Confidence"><span class="invoice-demo-status is-${field.confidence.toLowerCase()}">${escapeHtml(field.confidence)}</span></td>
                  <td data-label="Evidence">
                    ${field.evidence ? `<button type="button" class="invoice-demo-evidence-btn" data-evidence-field="${escapeHtml(field.label)}">View</button>` : '<span aria-label="No evidence">&mdash;</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="invoice-demo-evidence-panel" id="invoice-demo-evidence-panel" tabindex="-1" ${selectedEvidence ? '' : 'hidden'}>
          ${selectedEvidence ? `
            <h4>${escapeHtml(selectedEvidence.label)} evidence</h4>
            <p>${escapeHtml(selectedEvidence.evidence)}</p>
            <span>${escapeHtml(selectedEvidence.sourceLabel)}</span>
          ` : ''}
        </div>
      </article>
    `;
  }

  function renderBusinessChecks(scenario) {
    return `
      <article class="invoice-demo-card invoice-demo-card--wide">
        <h3>Business Checks</h3>
        <div class="invoice-demo-table-wrap">
          <table class="invoice-demo-table">
            <thead>
              <tr>
                <th>Check</th>
                <th>Result</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              ${scenario.businessChecks.map((check) => `
                <tr>
                  <td data-label="Check">${escapeHtml(check.check)}</td>
                  <td data-label="Result"><span class="invoice-demo-status is-${check.result.toLowerCase()}">${escapeHtml(check.result)}</span></td>
                  <td data-label="Meaning">${escapeHtml(check.meaning)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="invoice-demo-decision">
          <strong>Decision: ${escapeHtml(scenario.decision.label)}</strong>
          <ul>
            ${scenario.decision.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}
          </ul>
        </div>
      </article>
    `;
  }

  function renderAiSummary(scenario) {
    return `
      <article class="invoice-demo-card invoice-demo-card--wide">
        <h3>AI Reviewer Summary</h3>
        <p>${escapeHtml(scenario.aiSummary.summary)}</p>
        <div class="invoice-demo-summary-block">
          <strong>Suggested next action</strong>
          <p>${escapeHtml(scenario.aiSummary.suggestedNextAction)}</p>
        </div>
        <div class="invoice-demo-summary-block">
          <strong>Draft message</strong>
          <pre>${escapeHtml(scenario.aiSummary.draftMessage)}</pre>
        </div>
        <p class="invoice-demo-note">AI summary is generated for review assistance only. Final action remains with the human reviewer.</p>
      </article>
    `;
  }

  function renderActions() {
    const actions = ['Approve', 'Needs More Info', 'Reject'];
    return `
      <article class="invoice-demo-card invoice-demo-card--wide">
        <h3>Human Review Action</h3>
        <div class="invoice-demo-action-row">
          ${actions.map((label) => `
            <button type="button" class="btn ${action === label ? 'btn-primary' : 'btn-secondary'}" data-review-action="${label}" ${action && action !== label ? 'disabled' : ''}>
              ${escapeHtml(label)}
            </button>
          `).join('')}
          ${action ? '<button type="button" class="invoice-demo-reset" data-reset-action>Reset Demo</button>' : ''}
        </div>
        ${action ? `<p class="invoice-demo-confirmation">${escapeHtml(actionMessages[action])}</p>` : '<p class="invoice-demo-note">These controls update this page only. No external system, email, approval, or rejection is submitted.</p>'}
      </article>
    `;
  }

  function auditTrailEntries(scenario) {
    const entries = [...scenario.auditTrail];
    if (action) {
      entries.push({ time: '00:06', event: `Reviewer selected: ${action}` });
    }
    return entries;
  }

  function renderAuditTrail(scenario) {
    return `
      <article class="invoice-demo-card invoice-demo-card--wide">
        <h3>Demo Audit Trail</h3>
        <ol class="invoice-demo-audit">
          ${auditTrailEntries(scenario).map((entry) => `
            <li><span>${escapeHtml(entry.time)}</span>${escapeHtml(entry.event)}</li>
          `).join('')}
        </ol>
      </article>
    `;
  }

  function renderAiValueLayer() {
    return `
      <section class="invoice-demo-ai-layer invoice-demo-card invoice-demo-card--wide" aria-labelledby="ai-value-title">
        <div class="invoice-demo-section-header">
          <p class="eyebrow">AI value</p>
          <h3 id="ai-value-title">Where AI assists the review</h3>
        </div>
        <div class="invoice-demo-value-grid invoice-demo-comparison">
          <article class="invoice-demo-value-card">
            <h4>Manual Review vs AI-Assisted Review</h4>
            <div class="invoice-demo-comparison-grid">
              <div>
                <strong>Manual invoice review</strong>
                <ul>
                  <li>Reviewer opens invoice manually</li>
                  <li>Reviewer searches for invoice number, date, amount, GSTIN</li>
                  <li>Reviewer checks policy manually</li>
                  <li>Reviewer writes clarification email manually</li>
                  <li>Review reasoning may stay informal</li>
                </ul>
              </div>
              <div>
                <strong>AI-assisted review</strong>
                <ul>
                  <li>System reads invoice text using native extraction or OCR fallback</li>
                  <li>Extracted fields are shown directly with confidence and evidence</li>
                  <li>Business checks highlight missing or risky information</li>
                  <li>AI prepares a draft follow-up message</li>
                  <li>Audit trail records review steps and human action</li>
                </ul>
              </div>
            </div>
          </article>
          <article class="invoice-demo-value-card">
            <h4>Where AI Helps in This Workflow</h4>
            <div class="invoice-demo-help-grid">
              <div><strong>Reading scanned invoices</strong><p>OCR helps convert scanned, photographed, or image-based invoices into readable text when native document text is unavailable or weak.</p></div>
              <div><strong>Extracting useful information</strong><p>Important invoice details such as invoice number, dates, amount, GSTIN, vendor name, and payment terms are surfaced as structured fields.</p></div>
              <div><strong>Explaining review reasons</strong><p>AI-generated reviewer summaries explain why an invoice needs attention in plain business language.</p></div>
              <div><strong>Drafting follow-up communication</strong><p>AI can prepare a first draft for requesting missing or corrected information, so the reviewer does not start from a blank page.</p></div>
            </div>
            <p class="invoice-demo-note">Business rules still make deterministic checks. AI assists reading, summarizing, and drafting; the human reviewer makes the final decision.</p>
          </article>
          <article class="invoice-demo-value-card">
            <h4>Potential Workflow Improvement</h4>
            <dl class="invoice-demo-metric-list">
              <div><dt>Manual review effort</dt><dd>5-10 minutes per invoice</dd></div>
              <div><dt>AI-assisted review effort</dt><dd>1-3 minutes for review and decision</dd></div>
              <div><dt>Main improvement</dt><dd>Less manual searching, faster issue detection, clearer reviewer communication</dd></div>
            </dl>
            <p class="invoice-demo-note">These are illustrative estimates for demo purposes. Actual savings depend on invoice quality, business rules, and review process.</p>
          </article>
          <article class="invoice-demo-value-card">
            <h4>Responsible AI Design</h4>
            <ul>
              <li>AI output is shown as assistance, not final authority.</li>
              <li>Extracted fields include evidence where available.</li>
              <li>Deterministic business rules decide when review is required.</li>
              <li>Human reviewer actions remain explicit and auditable.</li>
              <li>No real documents are uploaded in this public static demo.</li>
            </ul>
            <p>The goal is not blind automation. The goal is faster, clearer, and more controlled review.</p>
          </article>
        </div>
      </section>
    `;
  }

  function renderDemonstrates() {
    return `
      <article class="invoice-demo-card invoice-demo-card--wide invoice-demo-explainer-card">
        <h3>What This Demonstrates</h3>
        <ul>
          <li>Converts invoice documents into structured, reviewable fields</li>
          <li>Highlights missing or risky information before approval</li>
          <li>Combines deterministic business rules with AI-assisted explanation</li>
          <li>Keeps humans in control through review actions and audit history</li>
        </ul>
        <a class="btn btn-secondary" href="../">Read the build notes</a>
      </article>
    `;
  }

  function renderResults() {
    if (!selectedScenario) {
      resultsEl.innerHTML = '';
      return;
    }

    if (completedStep < timelineSteps.length) {
      resultsEl.innerHTML = `
        <div class="container">
          <p class="invoice-demo-note">Processing selected invoice...</p>
        </div>
      `;
      return;
    }

    resultsEl.innerHTML = `
      <div class="container">
        <div class="invoice-demo-section-header">
          <p class="eyebrow">Review output</p>
          <h2>${escapeHtml(selectedScenario.title)} results</h2>
        </div>
        <div class="invoice-demo-result-grid">
          ${renderInvoicePreview(selectedScenario)}
          ${renderOcrPreview(selectedScenario)}
          ${renderFields(selectedScenario)}
          ${renderBusinessChecks(selectedScenario)}
          ${renderAiSummary(selectedScenario)}
          ${renderActions()}
          ${renderAuditTrail(selectedScenario)}
          ${renderAiValueLayer()}
          ${renderDemonstrates()}
        </div>
      </div>
    `;
  }

  function handleClick(event) {
    const scrollLink = event.target.closest('[data-scroll-target]');
    if (scrollLink) {
      event.preventDefault();
      scrollToId(scrollLink.dataset.scrollTarget);
      return;
    }

    const runButton = event.target.closest('[data-run-scenario]');
    if (runButton) {
      runScenario(runButton.dataset.runScenario);
      return;
    }

    const evidenceButton = event.target.closest('[data-evidence-field]');
    if (evidenceButton && selectedScenario) {
      selectedEvidence = selectedScenario.fields.find((field) => field.label === evidenceButton.dataset.evidenceField);
      renderResults();
      document.getElementById('invoice-demo-evidence-panel')?.focus();
      return;
    }

    const actionButton = event.target.closest('[data-review-action]');
    if (actionButton) {
      action = actionButton.dataset.reviewAction;
      renderResults();
      return;
    }

    if (event.target.closest('[data-reset-action]')) {
      action = null;
      renderResults();
    }
  }

  async function init() {
    renderTimeline();
    document.addEventListener('click', handleClick);

    try {
      const response = await fetch(dataUrl);
      if (!response.ok) throw new Error(`Unable to load demo data: ${response.status}`);
      demoData = await response.json();
      renderSamples();
    } catch (error) {
      samplesEl.innerHTML = '<p class="invoice-demo-note">Demo data could not be loaded. Please try again from a static web server.</p>';
      console.error(error);
    }
  }

  init();
}());
