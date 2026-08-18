const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(route) {
  return fs.readFileSync(path.join(route, 'index.html'), 'utf8');
}

const systemRoutes = [
  'systems/ai-dev-orchestrator',
  'systems/ai-workflow-lab',
  'systems/ai-native-learning-platform',
  'systems/survey-poll-serverless',
];

const demoRoutes = [
  'systems/ai-workflow-lab/invoice-review-demo',
  'systems/ai-workflow-lab/vendor-onboarding-rag-demo',
  'systems/ai-workflow-lab/knowledge-markdown-demo',
  'systems/ai-workflow-lab/ingestion-comparator',
];

test('important System pages expose a proportional engineering evidence hierarchy', () => {
  for (const route of systemRoutes) {
    const source = read(route);
    assert.match(source, /<strong>Status:<\/strong>/, `${route} must state maturity`);
    assert.match(source, /<h2>System boundary<\/h2>/, `${route} must state its boundary`);
    assert.match(source, /<h2>(?:Key decisions and trade-offs|Implementation and decisions)<\/h2>/, `${route} must explain decisions`);
    assert.match(source, /<h2>(?:Inspectable evidence|What the public evidence demonstrates)<\/h2>/, `${route} must explain evidence`);
    assert.match(source, /<h2>Limitations and what remains unproven<\/h2>|<h2>Limitations<\/h2>/, `${route} must state limits`);
    assert.match(source, /<h2>Outcome and learning<\/h2>/, `${route} must state learning`);
  }
});

test('System and demo structured data uses only the accepted page-type contracts', () => {
  for (const route of systemRoutes) assert.match(read(route), /"@type": "TechArticle"/);
  for (const route of demoRoutes.slice(0, 3)) assert.match(read(route), /"@type": "CreativeWork"/);
  assert.match(read(demoRoutes[3]), /"@type": "WebApplication"/);
  for (const route of [...systemRoutes, ...demoRoutes]) {
    const source = read(route);
    assert.doesNotMatch(source, /aggregateRating|offers|downloadUrl|operatingSystem/);
  }
});

test('all four distinct demos remain indexable, canonical, and in the sitemap', () => {
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  for (const route of demoRoutes) {
    const source = read(route);
    const url = `https://suyogjoshi.com/${route}/`;
    assert.doesNotMatch(source, /noindex/i);
    assert.match(source, new RegExp(`<link rel="canonical" href="${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(sitemap, new RegExp(`<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`));
  }
});

test('child demos retain their direct-entry parent context and honest boundaries', () => {
  for (const route of demoRoutes) assert.match(read(route), /Back to AI Workflow Lab/);
  const invoice = read(demoRoutes[0]);
  assert.match(invoice, /static interactive simulation/i);
  assert.match(invoice, /What this does not prove/);
  assert.match(read(demoRoutes[1]), /Static demo using synthetic process documents/);
  assert.match(read(demoRoutes[2]), /Static demo using pre-generated sample outputs/);
  const comparator = read(demoRoutes[3]);
  assert.match(comparator, /production-facing tool/);
  assert.match(comparator, /Privacy and retention/);
});

test('issue #389 relationship work remains present without a new link campaign', () => {
  const orchestrator = read('systems/ai-dev-orchestrator');
  assert.match(orchestrator, /using-multiple-ai-agents-as-a-software-engineering-team/);
  assert.match(orchestrator, /human-review-gates-ai-assisted-delivery/);
  const workflow = read('systems/ai-workflow-lab');
  assert.match(workflow, /documentation-is-becoming-executable-context/);
  assert.match(workflow, /stronger-evidence-chains-for-ai-assisted-engineering-changes/);
});

test('the audit records proportional treatment and every demo indexability decision', () => {
  const audit = fs.readFileSync('docs/plans/issue-390-systems-evidence-audit.md', 'utf8');
  for (const phrase of ['Already substantial', 'Useful but incomplete', 'Thin', 'Focused static demo', 'Substantial live tool', 'No route is low-value']) {
    assert.match(audit, new RegExp(phrase, 'i'));
  }
  for (const route of demoRoutes) assert.match(audit, new RegExp(route.replace('systems/', '/systems/').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
