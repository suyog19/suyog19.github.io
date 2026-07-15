const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

test('the #223 approval matrix has every required column and one exact-state row shape', () => {
  const markdown = fs.readFileSync('content/plans/software-signal-learner-experience-matrix.md', 'utf8');
  const section = markdown.split('## Exact-state approval matrix')[1];
  assert.ok(section, 'exact-state approval matrix is required');
  const rows = section.split(/\r?\n/).filter((line) => line.startsWith('|'));
  assert.ok(rows.length >= 70, 'matrix should cover materially distinct states rather than grouped examples');
  for (const row of rows) assert.equal((row.match(/\|/g) || []).length, 23, row);
  for (const column of [
    'Journey stage', 'Starting condition', 'Route', 'Backend learner-safe input',
    'Current visible heading', 'Current explanation', 'Current primary action',
    'Current secondary actions', 'Required status heading', 'Required explanation',
    'Required primary action', 'Required secondary action', 'Deadline/update',
    'Details disclosure', 'Support guidance', 'Recovery behaviour',
    'Accessibility notes', 'Mobile notes', 'Severity', 'Resolution owner',
    'Backend status', 'Validation',
  ]) assert.match(rows[0], new RegExp(`\\| ${column.replace('/', '\\/')} `));
});

test('the closeout record captures matrix approval while human and integrated gates remain pending', () => {
  const closeout = fs.readFileSync('content/plans/software-signal-learner-experience-closeout.md', 'utf8');
  assert.match(closeout, /remediation matrix approved; independent human validation pending/i);
  assert.match(closeout, /approved by Suyog on 15 July 2026 without recorded exceptions/i);
  assert.match(closeout, /three distinct roles/i);
  assert.match(closeout, /claims no production deployment/i);
});
