const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const read = (path) => fs.readFileSync(path, 'utf8');
const launched = [
  'python-foundations-for-data-science',
  'applied-data-analysis-with-python',
];

test('launched pages show age, total workload, IST, and planned cohort size before application', () => {
  const expected = {
    'python-foundations-for-data-science': ['5–6 hours total', 'up to about 7 hours total'],
    'applied-data-analysis-with-python': ['6–7 hours total', 'up to about 8 hours total'],
  };
  for (const slug of launched) {
    const html = read(`training/${slug}/index.html`);
    const beforeFirstCta = html.slice(0, html.indexOf('data-cta-location="hero"'));
    assert.match(beforeFirstCta, /Applicants must be 18 or older/);
    assert.match(html, /India Standard Time \(IST\)/);
    assert.match(html, /10–15 learners/);
    for (const phrase of expected[slug]) assert.match(html, new RegExp(phrase));
  }
});

test('launched pages have one canonical commitment surface and no stale uncertainty copy', () => {
  const stale = /Time commitment and learner responsibility|weekly range (?:will be stated|is not yet confirmed)|criteria are not (?:yet |currently )?published|selected work may be reviewed|review availability will be stated|Scripts are central/i;
  for (const slug of launched) {
    const html = read(`training/${slug}/index.html`);
    assert.equal((html.match(/id="participation"/g) || []).length, 1);
    assert.doesNotMatch(html, stale);
  }
});

test('support, recording, and certificate summaries use the agreed learner commitments', () => {
  for (const slug of launched) {
    const html = read(`training/${slug}/index.html`);
    for (const phrase of [
      'WhatsApp group is optional',
      'phone number and profile information',
      'no essential announcement or support information is available only through WhatsApp',
      'Assignments and capstones are not submitted through WhatsApp',
      'formally confirmed in the cohort offer and recording notice',
      '90 days after the final regular session',
      'do not replace practice or count toward certificate attendance',
      'An agreed capstone extension preserves eligibility',
      'normally within 10 business days',
      'No grade or pass mark is required',
    ]) assert.match(html, new RegExp(phrase, 'i'));
  }
});

test('Python capstone terminology is consistent across catalogue, page, metadata, and curriculum', () => {
  const html = read('training/python-foundations-for-data-science/index.html');
  const catalogue = read('data/training-courses.json');
  assert.ok((html.match(/Core-Python structured-data analyser/gi) || []).length >= 5);
  assert.match(catalogue, /"exampleTitle": "Core-Python structured-data analyser"/);
  assert.doesNotMatch(`${html}\n${catalogue}`, /example structured-data analyser|personal data analyser/i);
});

test('application summary repeats the decision-critical commitments without backend jargon', () => {
  const html = read('apply/index.html');
  for (const phrase of [
    'Applicants must be 18 or older',
    '5–6 total hours',
    'India Standard Time (IST)',
    'normally review applications within five business days',
    'Free application',
    'No payment is collected with an application',
    '90 days after the final regular session',
    '11 of 14 regular live sessions',
  ]) assert.match(html, new RegExp(phrase.replace(/[()]/g, '\\$&'), 'i'));
  assert.doesNotMatch(html, /publicStatus|primaryAction|minimumSize|capacityRemaining/);
});
