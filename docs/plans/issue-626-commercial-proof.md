# Issue 626 — Commercial proof near buying decisions

## UX change brief

**Applicability:** UX brief required. This change adds a reusable proof hierarchy
to Consulting, Website Services, and Learning, including responsive visual
evidence on Website Services.

### User and goal

- **Affected users:** prospects deciding whether to enquire about consulting or
  website work, and learners deciding whether Software Signal's teaching approach
  suits them.
- **Goal:** inspect relevant, attributable evidence without leaving the decision
  context or relying on unsupported social proof.

### Existing UX context

- Preserve the quietly premium, editorial, engineered direction in
  `docs/ux/site-ux-direction.md` and `docs/ux/software-signal-target.md`.
- Preserve both Consulting offers, Website Services packages and prices, Learning
  readiness/pathway order, Contact handoffs, analytics contracts, and the existing
  Signal Red/neutral system.
- Existing public writing, systems, course curricula, project briefs, and #603
  render evidence are the source of truth. No new customer truth is inferred.

### Strategic altitude

- The three complete pages and their cross-site evidence routes were reviewed.
- The in-scope recommendation is one restrained proof-item grammar with different
  evidence types per decision: public work for Consulting, a self-case-study for
  Website Services, and inspectable teaching material for Learning.
- A stronger future recommendation is to replace or supplement these launch proofs
  with permissioned customer/learner evidence and measured outcomes when they
  genuinely exist. That is outside this issue.
- **Recommendation strength:** strongly recommended.

### Desired outcome and hierarchy

- **Primary:** the offer, package, or learning choice remains the decision.
- **Secondary:** concise evidence immediately answers “why believe this can be
  delivered well?”
- **Intentionally quiet:** provenance labels and limitations prevent internal
  examples from resembling customer claims.

### Composition and responsive intent

- Consulting places one compact public-work proof inside each offer before price
  and enquiry action.
- Website Services places one clearly labelled Software Signal self-case-study
  immediately after packages, with paired before/current renders and a concise
  explanation of the UX/quality decisions demonstrated.
- Learning places a three-item “experience before paying” module after the learning
  model, linking to published lesson structure, project expectations, and a free
  explanatory sample.
- Desktop supports two- or three-column inspection where useful. Mobile preserves
  provenance → evidence → explanation → link, with the before image preceding the
  current image and no horizontal scrolling.

### Media intent

- The Website Services images prove visible hierarchy and responsive craft; they
  are not decoration or implied client work.
- Source renders are repository evidence from before and after the #603 platform
  evolution. Display copies use WebP, explicit intrinsic dimensions, lazy loading,
  async decoding, descriptive alternative text, and captions.

### Design invariants

1. Offers and learning choices remain more visually prominent than their proof.
2. Every proof item identifies its provenance before making a claim.
3. The Website Services example is unmistakably Software Signal's own platform
   work and makes no conversion or customer-outcome claim.
4. A learner can inspect real teaching structure and applied expectations without
   payment, registration, or JavaScript.
5. Mobile preserves a calm single-column reading order with no horizontal overflow.
6. No testimonial, client identity, affiliation, rating, vanity metric, or
   unmeasured outcome is introduced.

### Out of scope / preserve

- No new case-study CMS, testimonial collection, video platform, analytics event,
  Contact topic, package, course, price, or transactional behavior.
- Do not redesign the full pages or promote all public work equally.

### Tech Lead feasibility

- Reuse a small semantic `.proof-*` component in `css/components.css` and keep
  page-specific placement in existing scoped styles.
- Static HTML remains complete without JavaScript. Existing local links and image
  validation cover the new evidence. No dependency, API, or data contract changes.
- Gate B–D evidence will render all three pages at 1440×900 and 390×844, then check
  hierarchy, image purpose, reading order, focus, overflow, console/resource errors,
  accessibility, and performance.

## Gate A disposition

- Material subjective direction is resolved by issue #626 and the approved #603
  platform direction: truthful evidence close to decisions, no generic trust
  decoration, and #603 explicitly permitted as a self-case-study.
- No Product Owner taste decision remains open before implementation.

