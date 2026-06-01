(function () {
  const script = document.currentScript;
  const dataUrl = new URL(script.dataset.demoSrc, window.location.href);
  const documentsEl = document.getElementById('rag-demo-documents');
  const questionsEl = document.getElementById('rag-demo-questions');
  const timelineEl = document.getElementById('rag-demo-timeline');
  const resultsEl = document.getElementById('rag-demo-results');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const instantMode = reducedMotion || new URLSearchParams(window.location.search).has('instant');
  const timelineSteps = [
    'Question embedded',
    'Relevant process sections retrieved',
    'Answer generated from sources',
    'Source references attached',
  ];

  let demoData = null;
  let selectedQuestion = null;
  let completedStep = -1;
  let timelineTimer = null;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function renderDocuments() {
    const docs = demoData.collection.documents;
    documentsEl.innerHTML = docs.map((doc) => `
      <article class="rag-demo-document-card">
        <span class="rag-demo-badge">Synthetic demo document</span>
        <h3>${escapeHtml(doc.title)}</h3>
        <p>${escapeHtml(doc.description)}</p>
        <small>${escapeHtml(doc.sourcePath)}</small>
      </article>
    `).join('');
  }

  function renderQuestions() {
    questionsEl.innerHTML = demoData.sampleQuestions.map((item) => `
      <button class="rag-demo-question${selectedQuestion?.id === item.id ? ' is-selected' : ''}" type="button" data-question-id="${escapeHtml(item.id)}">
        <span>${escapeHtml(item.expectedNoAnswer ? 'Unsupported example' : 'Process question')}</span>
        <strong>${escapeHtml(item.question)}</strong>
      </button>
    `).join('');
  }

  function renderTimeline() {
    timelineEl.innerHTML = timelineSteps.map((step, index) => {
      let state = 'pending';
      if (index < completedStep) state = 'complete';
      if (index === completedStep) state = 'active';
      if (completedStep >= timelineSteps.length) state = 'complete';

      return `
        <li class="rag-demo-timeline-step is-${state}">
          <span class="rag-demo-timeline-icon" aria-hidden="true">${state === 'complete' ? '&#10003;' : index + 1}</span>
          <span>${escapeHtml(step)}</span>
        </li>
      `;
    }).join('');
  }

  function runQuestion(questionId) {
    selectedQuestion = demoData.sampleQuestions.find((item) => item.id === questionId);
    completedStep = instantMode ? timelineSteps.length : 0;
    clearInterval(timelineTimer);
    renderQuestions();
    renderTimeline();
    renderResults();
    scrollToId('retrieval-title');

    if (instantMode) {
      renderResults();
      scrollToId('rag-demo-results');
      return;
    }

    timelineTimer = setInterval(() => {
      completedStep += 1;
      renderTimeline();
      if (completedStep >= timelineSteps.length) {
        clearInterval(timelineTimer);
        renderResults();
        scrollToId('rag-demo-results');
      }
    }, 400);
  }

  function confidenceLabel(value) {
    const clean = String(value || 'unknown').toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  function renderSources(item) {
    if (!item.sources.length) {
      return `
        <article class="rag-demo-card">
          <h3>Retrieved Sources</h3>
          <p class="rag-demo-empty">No sufficiently relevant process section was found.</p>
        </article>
      `;
    }

    return `
      <article class="rag-demo-card">
        <h3>Retrieved Sources</h3>
        <div class="rag-demo-source-list">
          ${item.sources.map((source) => `
            <section class="rag-demo-source">
              <span>${escapeHtml(source.title)}</span>
              <strong>${escapeHtml(source.sourceRef)}</strong>
              <p>&ldquo;${escapeHtml(source.snippet)}&rdquo;</p>
              ${source.score ? `<small>Relevance: ${escapeHtml(source.score)}</small>` : '<small>Static retrieved source</small>'}
            </section>
          `).join('')}
        </div>
      </article>
    `;
  }

  function renderAnswer(item) {
    return `
      <article class="rag-demo-card">
        <h3>Grounded Answer</h3>
        <span class="rag-demo-status is-${escapeHtml(item.confidence)}">Confidence: ${escapeHtml(confidenceLabel(item.confidence))}</span>
        <p class="rag-demo-answer">${escapeHtml(item.answer)}</p>
        <div class="rag-demo-answer-meta">
          <strong>Source count</strong>
          <span>${item.sources.length}</span>
        </div>
        ${item.sources.length ? `
          <div class="rag-demo-citations">
            <strong>Visual citations</strong>
            <ul>
              ${item.sources.map((source) => `<li>${escapeHtml(source.sourceRef)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <div class="rag-demo-limitations">
          <strong>Limitations</strong>
          <ul>
            ${item.limitations.map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join('')}
          </ul>
        </div>
      </article>
    `;
  }

  function renderResults() {
    if (!selectedQuestion) {
      resultsEl.innerHTML = '';
      return;
    }

    if (completedStep < timelineSteps.length) {
      resultsEl.innerHTML = `
        <div class="container">
          <p class="rag-demo-note">Retrieving relevant process sections...</p>
        </div>
      `;
      return;
    }

    resultsEl.innerHTML = `
      <div class="container">
        <div class="rag-demo-section-header">
          <p class="eyebrow">Grounded response</p>
          <h2>${escapeHtml(selectedQuestion.question)}</h2>
        </div>
        <div class="rag-demo-result-grid">
          ${renderSources(selectedQuestion)}
          ${renderAnswer(selectedQuestion)}
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

    const questionButton = event.target.closest('[data-question-id]');
    if (questionButton) {
      runQuestion(questionButton.dataset.questionId);
    }
  }

  async function init() {
    renderTimeline();
    document.addEventListener('click', handleClick);

    try {
      const response = await fetch(dataUrl);
      if (!response.ok) throw new Error(`Unable to load demo data: ${response.status}`);
      demoData = await response.json();
      renderDocuments();
      renderQuestions();
    } catch (error) {
      documentsEl.innerHTML = '<p class="rag-demo-note">Demo data could not be loaded. Please try again from a static web server.</p>';
      questionsEl.innerHTML = '';
      console.error(error);
    }
  }

  init();
}());
