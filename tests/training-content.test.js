const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const pages = [
  ['training/index.html', 'https://suyogjoshi.com/training/'],
  ['training/python-foundations-ai-data/index.html', 'https://suyogjoshi.com/training/python-foundations-ai-data/'],
  ['training/applied-python-ai-ml/index.html', 'https://suyogjoshi.com/training/applied-python-ai-ml/'],
  ['training/policies/index.html', 'https://suyogjoshi.com/training/policies/'],
  ['training/provider/index.html', 'https://suyogjoshi.com/training/provider/'],
];

test('training pages include canonical SEO, GA4, and correct asset depth', () => {
  for (const [relative, canonical] of pages) {
    const html = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.match(html, new RegExp(`rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, /G-PKL56GJ38H/);
    assert.match(html, /<meta name="description"/);
    const depth = relative.split('/').length - 1;
    const prefix = '../'.repeat(depth);
    assert.match(html, new RegExp(`href="${prefix}css/base\\.css"`));
    assert.match(html, new RegExp(`src="${prefix}js/script\\.js"`));
  }
});

test('course schema matches approved platform facts', () => {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data/training-courses.json'), 'utf8'));
  assert.deepEqual(data.provider, {
    name: 'Suyog Joshi', brand: 'Software Signal',
    location: 'Pune, Maharashtra, India', contact: 'contact@suyogjoshi.com',
  });
  assert.deepEqual(data.courses.map(({ slug, feeAmountPaise, depositAmountPaise, minimumCohortSize }) => ({
    slug, feeAmountPaise, depositAmountPaise, minimumCohortSize,
  })), [
    { slug: 'python-foundations-ai-data', feeAmountPaise: 400000, depositAmountPaise: 100000, minimumCohortSize: 10 },
    { slug: 'applied-python-ai-ml', feeAmountPaise: 800000, depositAmountPaise: 200000, minimumCohortSize: 5 },
  ]);
});

test('course application actions are hidden by default and payment stays disabled', () => {
  const combined = pages.map(([relative]) => fs.readFileSync(path.join(root, relative), 'utf8')).join('\n');
  assert.match(combined, /Applications not currently open/);
  assert.match(combined, /data-course-availability-action hidden/);
  assert.doesNotMatch(combined, /href="[^\"]*(checkout|payment)/i);
  assert.doesNotMatch(combined, /Razorpay|payment-button|checkout\.js/i);
});

test('learning styles preserve fail-closed hidden controls over button display rules', () => {
  const css = fs.readFileSync('css/learning.css', 'utf8');
  assert.match(css, /\.software-signal-learning \[hidden\]\s*\{[^}]*display:\s*none\s*!important/s);
});

test('course comparison has readable cells and a responsive scroll treatment', () => {
  const html = fs.readFileSync('training/index.html', 'utf8');
  const css = fs.readFileSync('css/learning.css', 'utf8');
  assert.match(html, /class="training-comparison-scroll-hint"/);
  assert.match(html, /class="table-scroll" tabindex="0" aria-describedby="comparison-scroll-hint"/);
  assert.match(css, /\.training-page \.training-comparison :is\(th, td\)\s*\{[^}]*padding:\s*\.9rem 1rem/s);
  assert.match(css, /\.training-page \.training-comparison \.table-scroll\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /@media \(max-width: 480px\)[\s\S]*\.training-page \.training-comparison table\s*\{[^}]*min-width:\s*42rem/s);
});

test('Python Foundations publishes a concrete, bounded foundations syllabus', () => {
  const html = fs.readFileSync('training/python-foundations-ai-data/index.html', 'utf8');
  const modules = html.match(/data-syllabus-module/g) || [];
  assert.equal(modules.length, 8);
  for (const topic of [
    'Values, variables and expressions',
    'Decisions, loops and problem decomposition',
    'Strings and core collections',
    'Functions and reusable code',
    'Files and structured data',
    'Errors, debugging and confidence checks',
    'Integrated data exercise',
  ]) assert.match(html, new RegExp(topic));
  assert.doesNotMatch(html, /The detailed syllabus and project format are not yet published/);
  assert.match(html, /learning objectives, not guaranteed outcomes/i);
  assert.match(html, /Exact submission, review and support arrangements will be published before applications open/);
});

test('Python Foundations detail UX exposes anchored decision sections', () => {
  const html = fs.readFileSync('training/python-foundations-ai-data/index.html', 'utf8');
  assert.match(html, /aria-label="On this page"/);
  for (const id of ['overview', 'outcomes', 'syllabus', 'course-facts', 'fees']) {
    assert.match(html, new RegExp(`href="#${id}"`));
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /data-course-id="crs_python_foundations"/);
  assert.match(html, /data-course-availability-action hidden/);
});

test('Applied Python publishes a concrete, bounded applied syllabus', () => {
  const html = fs.readFileSync('training/applied-python-ai-ml/index.html', 'utf8');
  const modules = html.match(/data-applied-syllabus-module/g) || [];
  assert.equal(modules.length, 8);
  for (const topic of [
    'Applied workflow and problem framing',
    'Numerical work with NumPy',
    'Tabular workflows with pandas',
    'Data quality and feature preparation',
    'Exploration and visual reasoning',
    'Machine-learning framing and baselines',
    'scikit-learn pipelines and evaluation',
    'Integrated applied project',
  ]) assert.match(html, new RegExp(topic));
  assert.doesNotMatch(html, /The detailed syllabus and project format are not yet published/);
  assert.match(html, /learning objectives, not guaranteed outcomes/i);
  assert.match(html, /Exact dataset, submission, review and support arrangements will be published before applications open/);
});

test('Applied Python detail UX preserves level, commercial facts and anchored sections', () => {
  const html = fs.readFileSync('training/applied-python-ai-ml/index.html', 'utf8');
  assert.match(html, /Python basics required/);
  assert.match(html, /Start with Python Foundations/);
  assert.match(html, /data-course-id="crs_applied_python"/);
  assert.match(html, /&#8377;8,000 INR/);
  assert.match(html, /&#8377;2,000 INR/);
  assert.match(html, /&#8377;6,000 INR/);
  for (const id of ['overview', 'outcomes', 'syllabus', 'course-facts', 'fees']) {
    assert.match(html, new RegExp(`href="#${id}"`));
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /data-course-availability-action hidden/);
});

test('course pages load the fail-closed availability controller', () => {
  for (const relative of ['training/python-foundations-ai-data/index.html', 'training/applied-python-ai-ml/index.html']) {
    const html = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.match(html, /data-course-availability/);
    assert.match(html, /src="\.\.\/\.\.\/js\/training-availability\.js"/);
  }
});

test('all training URLs are present in the sitemap', () => {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  for (const [, canonical] of pages) assert.match(sitemap, new RegExp(canonical));
});
