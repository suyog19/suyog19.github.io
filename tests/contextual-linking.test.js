const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(route) {
  return fs.readFileSync(path.join(route, 'index.html'), 'utf8');
}

const hubRoutes = new Map([
  ['writing/coding-assistants-are-not-junior-developers', '../topics/ai-assisted-software-engineering/'],
  ['writing/business-rules-as-context', '../topics/engineering-context-and-knowledge/'],
  ['writing/human-ai-responsibility-map', '../topics/ai-agents-and-review/'],
  ['writing/ai-stress-testing-agile', '../topics/agile-process-and-engineering-leadership/'],
]);

test('only four selected cornerstone articles route to broader topic hubs', () => {
  const articlePages = fs.readdirSync('writing', { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join('writing', entry.name, 'index.html')))
    .map((entry) => path.join('writing', entry.name).split(path.sep).join('/'));
  const linkedArticles = articlePages.filter((route) => /href="\.\.\/topics\/[^"#]+\/"/.test(read(route)));
  assert.deepEqual(linkedArticles.sort(), [...hubRoutes.keys()].sort());
  for (const [route, href] of hubRoutes) assert.match(read(route), new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
});

test('cornerstone continuations preserve the strongest conceptual sequences', () => {
  assert.match(read('writing/beyond-the-repository-why-ai-needs-work-context-too'), /href="\.\.\/business-rules-as-context\/"/);
  assert.match(read('writing/how-to-tame-your-agent'), /href="\.\.\/human-ai-responsibility-map\/"/);
  const agile = read('writing/ai-stress-testing-agile');
  assert.match(agile, /href="\.\.\/enterprise-ai-adoption-is-a-context-problem\/"/);
  assert.doesNotMatch(agile, /href="\.\.\/how-modern-llm-systems-really-work\/"/);
});

test('important Writing and Systems evidence relationships are direct and bidirectional', () => {
  const orchestrator = read('systems/ai-dev-orchestrator');
  assert.match(orchestrator, /href="\.\.\/\.\.\/writing\/using-multiple-ai-agents-as-a-software-engineering-team\/"/);
  assert.match(orchestrator, /href="\.\.\/\.\.\/writing\/human-review-gates-ai-assisted-delivery\/"/);
  const workflow = read('systems/ai-workflow-lab');
  assert.match(workflow, /href="\.\.\/\.\.\/writing\/documentation-is-becoming-executable-context\/"/);
  assert.match(workflow, /href="\.\.\/\.\.\/writing\/stronger-evidence-chains-for-ai-assisted-engineering-changes\/"/);
  assert.match(read('writing/stronger-evidence-chains-for-ai-assisted-engineering-changes'), /href="\.\.\/\.\.\/systems\/ai-workflow-lab\/"/);
});

test('audit records restrained scope, Training review, and the existing maintenance mechanism', () => {
  const audit = fs.readFileSync('docs/plans/issue-389-contextual-link-audit.md', 'utf8');
  for (const phrase of ['Already strong', 'Useful but one-directional', 'Missing', 'Stale or weak', 'Intentionally absent', 'Training review', 'article publishing workflow']) {
    assert.match(audit, new RegExp(phrase, 'i'));
  }
});
