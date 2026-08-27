const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');

test('#609 Framework preserves the complete canonical public architecture', () => {
  const html = read('framework/index.html');
  assert.match(html, /Reliable engineering under increasing machine autonomy/);
  const branches = [
    'Context &amp; Specification Engineering',
    'AI-Assisted &amp; Agentic Software Development Lifecycle',
    'Verification, Testing &amp; Engineering Evidence',
    'Architecture of AI-Assisted &amp; Agentic Engineering Systems',
    'Autonomy, Control &amp; Governance',
    'Engineering Knowledge &amp; Organizational Memory',
    'Human &amp; Organizational Operating Model',
    'Reliability Economics'
  ];
  for (const branch of branches) assert.match(html, new RegExp(branch));
  assert.equal((html.match(/<li><span>0[1-8]<\/span>/g) || []).length, 8);
  assert.match(html, /Cross-cutting concern[\s\S]*Security/);
  assert.match(html, /Methods of Investigation/);
  assert.match(html, /strengthen, challenge, or change the Framework/);
  assert.doesNotMatch(html, /five-movement|five movement/i);
});

test('#609 Research exposes a real investigation and critical evidence method', () => {
  const html = read('research/index.html');
  assert.match(html, /AI in Teaching Workflows/);
  assert.match(html, /ai-teaching-workflows\//);
  assert.match(html, /Supporting and contradictory evidence/);
  assert.match(html, /Synthesise honestly/);
  assert.match(html, /Feed learning back/);
});

test('#609 supporting families preserve their distinct public purpose', () => {
  assert.match(read('consulting/index.html'), /not generic outsourced development/i);
  assert.match(read('training/index.html'), /Practical learning for working professionals/);
  assert.match(read('training/index.html'), /Start as small as the outcome allows/);
  const services = read('website-services/index.html');
  assert.match(services, /A clear message\. A credible presence\. A useful website\. Low maintenance\./);
  assert.doesNotMatch(services, /ws-package-number/);
  assert.match(read('writing/index.html'), /Useful thinking for reliable engineering/);
  assert.match(read('systems/index.html'), /Inspectable engineering work/);
  assert.match(read('newsletter/index.html'), /signal over noise|Useful synthesis/i);
});

test('#609 About removes stale pillar framing and keeps founder accountability', () => {
  const html = read('about/index.html');
  assert.match(html, /engineer and practitioner behind Software Signal/);
  assert.match(html, /accountable to a practitioner, not a trend/);
  assert.match(html, /Framework and Research/);
  assert.match(html, /Consulting and Learning/);
  assert.doesNotMatch(html, /Training, Writing, and Systems are three ways/);
});

test('#609 does not invent a Products route or retire public family routes', () => {
  for (const path of ['framework/index.html', 'research/index.html', 'consulting/index.html',
    'training/index.html', 'website-services/index.html', 'writing/index.html',
    'systems/index.html', 'about/index.html', 'newsletter/index.html']) {
    assert.ok(fs.existsSync(path), `${path} must remain present`);
  }
  assert.ok(!fs.existsSync('products/index.html'));
});
