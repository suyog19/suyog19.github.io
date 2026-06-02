(function () {
  const script = document.currentScript;
  const dataUrl = new URL(script.dataset.demoSrc, window.location.href);
  const pipelineEl = document.getElementById('km-demo-pipeline');
  const primaryTitleEl = document.getElementById('km-demo-primary-title');
  const primaryDescriptionEl = document.getElementById('km-demo-primary-description');
  const primaryMetricsEl = document.getElementById('km-demo-primary-metrics');
  const primaryNotesEl = document.getElementById('km-demo-primary-notes');
  const comparisonMetricsEl = document.getElementById('km-demo-comparison-metrics');
  const artifactTabsEl = document.getElementById('km-demo-artifact-tabs');
  const artifactPanelEl = document.getElementById('km-demo-artifact-panel');
  const demonstratesEl = document.getElementById('km-demo-demonstrates');
  const limitsEl = document.getElementById('km-demo-limits');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let demoData = null;
  let selectedArtifactId = null;

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

  function renderMetricCards(metrics) {
    return metrics.map((metric) => `
      <div class="km-demo-metric">
        <strong>${escapeHtml(metric.value)}</strong>
        <span>${escapeHtml(metric.label)}</span>
      </div>
    `).join('');
  }

  function renderPipeline() {
    pipelineEl.innerHTML = demoData.pipeline.map((step, index) => `
      <article class="rag-demo-card km-demo-pipeline-card">
        <span class="rag-demo-badge">Step ${index + 1}</span>
        <h3>${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.description)}</p>
      </article>
    `).join('');
  }

  function renderMetrics() {
    primaryTitleEl.textContent = demoData.primarySample.label;
    primaryDescriptionEl.textContent = demoData.primarySample.description;
    primaryMetricsEl.innerHTML = renderMetricCards(demoData.primarySample.metrics);
    primaryNotesEl.innerHTML = demoData.primarySample.notes
      .map((note) => `<li>${escapeHtml(note)}</li>`)
      .join('');
    comparisonMetricsEl.innerHTML = renderMetricCards(demoData.comparisonSample.metrics);
  }

  function selectedArtifact() {
    return demoData.artifacts.find((artifact) => artifact.id === selectedArtifactId)
      || demoData.artifacts[0];
  }

  function renderArtifactTabs() {
    artifactTabsEl.innerHTML = demoData.artifacts.map((artifact) => {
      const selected = artifact.id === selectedArtifactId;
      return `
        <button
          class="km-demo-artifact-tab${selected ? ' is-selected' : ''}"
          type="button"
          role="tab"
          aria-selected="${selected ? 'true' : 'false'}"
          aria-controls="km-demo-artifact-panel"
          data-artifact-id="${escapeHtml(artifact.id)}"
        >
          ${escapeHtml(artifact.label)}
        </button>
      `;
    }).join('');
  }

  function renderArtifactPanel() {
    const artifact = selectedArtifact();
    artifactPanelEl.innerHTML = `
      <article class="rag-demo-card km-demo-artifact-card">
        <div class="km-demo-artifact-header">
          <div>
            <span class="rag-demo-badge">${escapeHtml(artifact.language)}</span>
            <h3>${escapeHtml(artifact.label)}</h3>
          </div>
          <p>${escapeHtml(artifact.description)}</p>
        </div>
        <pre class="km-demo-code" tabindex="0"><code>${escapeHtml(artifact.excerpt)}</code></pre>
      </article>
    `;
  }

  function renderDemonstrates() {
    demonstratesEl.innerHTML = demoData.demonstrates.map((item) => `
      <article class="rag-demo-card">
        <p>${escapeHtml(item)}</p>
      </article>
    `).join('');
  }

  function renderLimits() {
    limitsEl.innerHTML = demoData.limits.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function renderAll() {
    selectedArtifactId = demoData.artifacts[0].id;
    renderPipeline();
    renderMetrics();
    renderArtifactTabs();
    renderArtifactPanel();
    renderDemonstrates();
    renderLimits();
  }

  function handleClick(event) {
    const scrollLink = event.target.closest('[data-scroll-target]');
    if (scrollLink) {
      event.preventDefault();
      scrollToId(scrollLink.dataset.scrollTarget);
      return;
    }

    const artifactButton = event.target.closest('[data-artifact-id]');
    if (artifactButton) {
      selectedArtifactId = artifactButton.dataset.artifactId;
      renderArtifactTabs();
      renderArtifactPanel();
    }
  }

  async function init() {
    document.addEventListener('click', handleClick);

    try {
      const response = await fetch(dataUrl);
      if (!response.ok) throw new Error(`Unable to load demo data: ${response.status}`);
      demoData = await response.json();
      renderAll();
    } catch (error) {
      pipelineEl.innerHTML = '<p class="rag-demo-note">Demo data could not be loaded. Please try again from a static web server.</p>';
      console.error(error);
    }
  }

  init();
}());
