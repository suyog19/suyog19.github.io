const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const detail = fs.readFileSync('js/course-detail.js', 'utf8');
const widget = fs.readFileSync('js/feedback-widget.js', 'utf8');

test('decision analytics are allow-listed, once-observed, contextual, and non-PII', () => {
  for (const event of ['training_course_participation_plan_view', 'training_course_application_process_view', 'training_course_support_feedback_view', 'training_course_faq_topic_open', 'training_course_primary_cta_click']) assert.match(detail, new RegExp(event));
  for (const key of ['faq_topic', 'participation_viewed', 'application_process_viewed', 'cta_location']) assert.match(detail, new RegExp(key));
  assert.match(detail, /observer\.disconnect\(\)/);
  assert.doesNotMatch(detail, /application_reference|email|phone|payment_reference|learner_id/);
});

test('course decision feedback reuses the bounded public contract', () => {
  for (const phrase of ['course-decision', 'Did this page give you enough information', 'Not yet', 'What information is still missing']) assert.match(widget, new RegExp(phrase));
  assert.match(widget, /THUMBS_UP/); assert.match(widget, /THUMBS_DOWN/); assert.match(widget, /COMMENT_LIMIT = 1800/); assert.match(widget, /\/feedback/);
});
