const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const analytics = fs.readFileSync('js/homepage.js', 'utf8');

test('homepage follows the approved Software Signal hierarchy', () => {
  const ids = ['id="hero"', 'class="home-tension"', 'id="framework"', 'id="research"',
    'id="ways-to-engage"', 'class="home-website-service"', 'class="home-evidence"',
    'id="newsletter"', 'class="home-founder"', 'class="home-final"'];
  ids.reduce((previous, marker) => {
    const current = html.indexOf(marker);
    assert.ok(current > previous, `${marker} must follow the approved hierarchy`);
    return current;
  }, -1);
});

test('homepage Framework preserves canonical architecture and learning loop', () => {
  const map = html.match(/<div class="framework-map"[\s\S]*?<\/div><\/div><\/section>/)?.[0] || '';
  assert.match(map, /North Star/);
  assert.equal((map.match(/<li>/g) || []).length, 8);
  for (const branch of ['Context &amp; Specification Engineering', 'AI-Assisted &amp; Agentic SDLC',
    'Verification, Testing &amp; Engineering Evidence', 'Architecture of AI-Assisted &amp; Agentic Systems',
    'Autonomy, Control &amp; Governance', 'Engineering Knowledge &amp; Organizational Memory',
    'Human &amp; Organizational Operating Model', 'Reliability Economics']) assert.match(map, new RegExp(branch));
  assert.match(map, /Cross-cutting concern[\s\S]*Security/);
  assert.match(map, /Methods of Investigation/);
  assert.match(map, /Findings may strengthen, challenge, or change the Framework/);
});

test('homepage uses real research and curated evidence', () => {
  assert.match(html, /AI in Teaching Workflows/);
  assert.match(html, /research\/ai-teaching-workflows\//);
  assert.match(html, /AI-Assisted Software Engineering/);
  assert.match(html, /AI Dev Orchestrator/);
  assert.match(html, /Stronger evidence chains/);
  assert.doesNotMatch(html, /testimonial|customer logo|product catalogue/i);
});

test('homepage instruments bounded engagement without private data', () => {
  for (const event of ['home_framework_click', 'home_training_click', 'home_writing_series_click',
    'home_system_click', 'home_consulting_click', 'home_website_services_click']) {
    assert.match(`${html}\n${analytics}`, new RegExp(event));
  }
  assert.doesNotMatch(analytics, /email|application_id|cohort_id/i);
});
