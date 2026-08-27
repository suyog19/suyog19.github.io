# Issue 624 UX change brief

## Applicability

**UX brief required.** This change materially revises the Learning landing page's information hierarchy, commitment model, and relationship to substantial course pages.

## User and goal

- **Affected user:** A working professional with either a narrow, current skill need or a need for deeper structured capability.
- **Goal:** Understand within seconds that Software Signal offers practical learning at multiple levels of commitment, then choose an honest available next step without assuming every need requires a long AI/data course.

## Existing UX context

- Shared direction: `docs/ux/site-ux-direction.md`
- Landing-page direction: `docs/ux/pages/training.md`
- Course-page direction: `docs/ux/pages/course-detail.md`
- Preserve the editorial, restrained Software Signal character, the scoped Learning visual identity, explicit availability, progressive enhancement, and existing public course/application URLs.

## Strategic altitude

- **Reviewed:** The complete Learning landing page, the launched and pipeline course families, the cross-site public navigation and visual system, and the canonical Learning strategy.
- **Broader inconsistency exposed:** The existing public experience still makes the five-stage AI/data pathway feel like the whole Learning identity; it lacks a first-class commitment ladder for focused current-skill needs.
- **Best in-scope recommendation:** Make the landing page lead with one flexible learning promise and a commitment ladder, show current-skill topic directions without presenting them as scheduled inventory, and reframe the existing five-course sequence as the deeper structured pathway. On course pages, move decision-critical fit, outcome, prerequisites, format, commitment, price/availability, and support evidence ahead of detailed curriculum.
- **Stronger overall recommendation:** None beyond the parent epic; inventory creation and backend changes remain separate, demand-led work.
- **Recommendation strength:** Strongly recommended.

## Desired outcome and hierarchy

- **First seconds:** “Practical learning for working professionals” and “the shortest format that can genuinely deliver the outcome.”
- **Primary:** The learning promise, commitment ladder, and an honest choice between focused learning and the deeper pathway.
- **Secondary:** Illustrative current-skill directions and the preserved five-stage pathway with starting-point guidance.
- **Intentionally quiet:** Detailed operating policies, future catalog possibilities, and curriculum depth until the learner has established relevance.

## Composition and responsive intent

- **Desktop:** A calm editorial hero followed by a scannable format ladder and two clearly distinct routes: focused/current learning and the connected deeper pathway.
- **Intermediate:** Columns reduce without changing reading or decision order.
- **Mobile:** Promise, shortest-format principle, format choices, truthful availability, and deeper-pathway entry appear in that order; cards stack without horizontal overflow.
- **Course details:** A compact decision summary precedes long curriculum and policy sections at every width.

## Interaction and state intent

- **Default:** All essential positioning and format information remains available without JavaScript.
- **Selected/recommended:** Existing starting-point recommendations remain semantically explicit and do not imply mandatory sequential purchase.
- **Empty/unavailable:** Focused formats and example topics are clearly labelled as upcoming/demand-led, never as scheduled offerings.
- **Focus:** Existing visible keyboard focus and native link/control semantics are preserved.

## Design invariants

1. A first-time visitor can identify a low-friction learning rung before encountering the full five-course pathway.
2. The page presents one Software Signal Learning system, not a generic marketplace or a disconnected tool catalog.
3. Illustrative tool and technology topics are visibly examples of capability-led learning, not invented inventory.
4. The existing Python/Data/ML/GenAI/Reliable AI route remains discoverable as a deeper connected pathway with truthful status and flexible entry.
5. On substantial course pages, fit, practical outcome, prerequisites, format/effort, availability/price, and support are findable before detailed curriculum.
6. Desktop and mobile preserve the same decision order, explicit state language, readable density, and scoped Learning identity.

## Open subjective decisions

None. The issue and canonical strategy establish the direction; exact composition and wording can be resolved within the accepted site and Learning patterns.

## Out of scope / preserve

- Do not invent dates, prices, testimonials, demand, or scheduled offerings.
- Preserve public URLs, course lifecycle truth, application/interest journeys, analytics identity, policy contracts, and the static HTML/CSS/vanilla-JavaScript architecture.
- Do not create a speculative catalog or modify the Learning backend.

## Tech Lead feasibility

- **Reuse:** Existing typography/tokens, Learning cards, status chips, buttons, journey components, native HTML disclosure, and analytics data attributes.
- **Feasibility:** Static semantic HTML and scoped `css/learning.css` can express the hierarchy and truthful empty states without new dependencies or client state. Existing course data/lifecycle hooks remain authoritative.
- **Adaptations:** Use editorial sections and compact summary grids rather than a filterable catalog; retain existing progressive recommendation behavior as a secondary aid.
- **Unresolved trade-offs:** None. Any new transactional format inventory would require separate product/data work.
