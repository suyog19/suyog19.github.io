(function () {
  'use strict';

  const COURSES = {
    crs_ml_foundations: {
      title: 'Practical Machine Learning Foundations', stage: 3,
      slug: 'practical-machine-learning-foundations',
      topics: ['Problem framing and baselines', 'Model families', 'Evaluation and thresholds', 'Leakage and reproducibility', 'Interpretation and error analysis']
    },
    crs_genai_apps: {
      title: 'Generative AI Application Development', stage: 4,
      slug: 'generative-ai-application-development',
      topics: ['Model APIs and structured outputs', 'Embeddings and retrieval', 'Grounding and citations', 'Bounded tools and workflows', 'Evaluation, security and reliability']
    },
    crs_reliable_ai: {
      title: 'Engineering Reliable AI Systems', stage: 5,
      slug: 'engineering-reliable-ai-systems',
      topics: ['Architecture and traceability', 'Evaluation and release gates', 'Security and human oversight', 'Observability, cost and rollout', 'Incidents, recovery and governance']
    }
  };
  const CONSENT_VERSION = 'course-interest-v1-2026-07-17';
  const form = document.querySelector('[data-interest-form]');
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const course = COURSES[params.get('courseId')];
  const selector = document.querySelector('[data-course-selection]');
  const details = document.querySelector('[data-selected-course]');
  const fields = document.querySelector('[data-interest-fields]');
  const summary = document.querySelector('[data-error-summary]');
  const success = document.querySelector('[data-interest-success]');
  const submit = form.querySelector('button[type="submit"]');
  const apiBase = ['dev.suyogjoshi.com', 'localhost', '127.0.0.1'].includes(location.hostname)
    ? 'https://api-dev.suyogjoshi.com' : 'https://api.suyogjoshi.com';
  let submitting = false;
  const field = name => form.elements.namedItem(name);

  const emit = (name, extra) => {
    if (typeof window.gtag === 'function') window.gtag('event', name, Object.assign({
      course_id: params.get('courseId') || 'invalid', course_stage: course && course.stage,
      course_slug: course && course.slug, pipeline_state: 'pipeline-interest-open',
      viewport_category: innerWidth < 600 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop'
    }, extra || {}));
  };

  const selectCourse = (id) => {
    const next = new URL(location.href); next.searchParams.set('courseId', id); location.assign(next);
  };
  Object.entries(COURSES).forEach(([id, item]) => {
    const option = document.createElement('option'); option.value = id; option.textContent = `Stage ${item.stage} — ${item.title}`;
    selector.append(option);
  });
  selector.addEventListener('change', () => selector.value && selectCourse(selector.value));

  if (!course) {
    details.innerHTML = '<h1>Register interest in a pipeline course</h1><p>Select a supported course to continue. No information can be submitted until a valid course is selected.</p>';
    fields.hidden = true; selector.closest('.form-group').hidden = false; selector.focus();
    return;
  }

  selector.value = params.get('courseId');
  details.innerHTML = `<p class="learning-eyebrow">Software Signal Learning · Stage ${course.stage} · In pipeline</p><h1>Register interest</h1><p class="course-detail-lead">${course.title}</p><p>Registering interest is not an application, enrolment, waitlist position, or seat reservation. It creates no payment obligation or admission preference.</p>`;
  field('courseId').value = params.get('courseId');
  field('courseTitle').value = course.title;
  field('courseStage').value = String(course.stage);
  field('sourcePageUrl').value = document.referrer || `/training/${course.slug}/`;
  field('consentVersion').value = CONSENT_VERSION;
  const topicBox = form.querySelector('[data-topic-options]');
  course.topics.forEach((topic, index) => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" name="topicInterests" value="${topic}"> <span>${topic}</span>`;
    topicBox.append(label);
    if (index === 0) label.querySelector('input').setAttribute('data-first-topic', '');
  });
  emit('pipeline_interest_form_view');

  const clearErrors = () => {
    summary.hidden = true; summary.innerHTML = '';
    form.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.hidden = true; });
  };
  const addError = (field, message, errors) => {
    const input = form.elements[field]; if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    const error = document.getElementById(`${field}-error`); error.textContent = message; error.hidden = false;
    errors.push({ input, message });
  };
  const validate = () => {
    clearErrors(); const errors = [];
    if (!field('name').value.trim()) addError('name', 'Enter your name.', errors);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field('email').value.trim())) addError('email', 'Enter a valid email address.', errors);
    if (field('background').value.trim().length < 10) addError('background', 'Describe your current role or learning background in at least 10 characters.', errors);
    if (field('capability').value.trim().length < 20) addError('capability', 'Describe your relevant current capability in at least 20 characters.', errors);
    if (field('intendedOutcome').value.trim().length < 20) addError('intendedOutcome', 'Describe what you hope to do in at least 20 characters.', errors);
    if (!field('consent').checked) addError('consent', 'Course-specific consent is required to record your interest.', errors);
    if (errors.length) {
      summary.innerHTML = `<strong>Please correct ${errors.length} ${errors.length === 1 ? 'error' : 'errors'}.</strong><ul>${errors.map(e => `<li>${e.message}</li>`).join('')}</ul>`;
      summary.hidden = false; summary.focus();
    }
    return errors.length === 0;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); if (submitting || !validate()) return;
    submitting = true; submit.disabled = true; submit.textContent = 'Recording interest…';
    const selectedTopics = Array.from(form.querySelectorAll('[name="topicInterests"]:checked')).map(el => el.value);
    const campaign = {}; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(key => { if (params.has(key)) campaign[key] = params.get(key); });
    const body = {
      courseId: field('courseId').value, courseTitle: field('courseTitle').value, courseStage: Number(field('courseStage').value),
      name: field('name').value.trim(), email: field('email').value.trim(), background: field('background').value.trim(),
      capability: field('capability').value.trim(), intendedOutcome: field('intendedOutcome').value.trim(),
      preferredTimeframe: field('preferredTimeframe').value || null, topicInterests: selectedTopics,
      instructorQuestion: field('instructorQuestion').value.trim() || null, consent: true,
      consentVersion: field('consentVersion').value, sourcePageUrl: field('sourcePageUrl').value, campaign,
      website: field('website').value
    };
    try {
      const response = await fetch(`${apiBase}/course-interests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error('submission'), { response, payload });
      form.hidden = true; success.hidden = false;
      success.querySelector('[data-return-course]').href = `../${course.slug}/`;
      success.focus(); emit('pipeline_interest_submit_success');
    } catch (error) {
      const duplicate = error.response && error.response.status === 409;
      summary.innerHTML = duplicate
        ? '<strong>Interest already recorded.</strong><p>This email already has active interest for this course. No duplicate record was created.</p>'
        : '<strong>We could not record your interest.</strong><p>Your entries are still here. Please try again, or return later if the service remains unavailable.</p>';
      summary.hidden = false; summary.focus(); emit('pipeline_interest_submit_error', { error_type: duplicate ? 'duplicate' : 'service' });
    } finally {
      submitting = false; submit.disabled = false; submit.textContent = 'Record my interest';
    }
  });
}());
