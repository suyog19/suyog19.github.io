# UX change brief and consultation protocol

Use this document to prepare user-visible work before substantial implementation.
It supplements the linked GitHub issue and its acceptance criteria; it does not
replace them. The issue defines scope and required behavior. The UX brief makes
the intended experience, hierarchy, and preservation constraints explicit.

Use the smallest durable location that fits the work: a completed section in the
issue, a linked issue/PR comment, or a source-controlled document for a large or
long-lived change. Do not commit a separate brief for every trivial change.

## 1. Classify UX applicability

Classify actual user impact, not issue labels. The Engineering Manager/
Orchestrator or Tech Lead records the classification at work start. If impact
grows during implementation, raise the classification and complete the missing
preparation before continuing.

### UX brief required

Use the full compact brief for material changes to any of these:

- page layout, composition, or information hierarchy;
- navigation, discovery, forms, or task flows;
- significant component presentation or responsive behavior;
- visual identity or section language;
- user understanding of status, action, or next step;
- a new or substantially redesigned public or learner surface.

A clearly material redesign cannot be classified as not required for speed.

### Lightweight UX note

Record the affected user, intended result, applicable existing pattern, and one
or two preservation constraints for:

- a local hierarchy adjustment;
- an isolated component within an accepted pattern;
- a meaningful image or crop decision;
- a visible accessibility improvement;
- a focused CSS change with a real design trade-off.

### UX brief not required

Record `UX brief: not required — <reason>` for work with no material visible
effect, normally:

- metadata or sitemap-only changes;
- invisible refactors;
- test-only or backend-only work;
- mechanical corrections with no meaningful presentation choice.

If there is doubt between adjacent levels, choose the higher level only long
enough to identify the actual impact; then record the reason for the final
classification.

## 2. Compact UX change brief template

Copy only the relevant optional subsections. An ordinary material change should
fit in a short issue description or comment.

```markdown
## UX change brief

**Applicability:** UX brief required | Lightweight UX note

### User and goal

- Affected user:
- What they are trying to understand or accomplish:

### Existing UX context

- Applicable site direction: `docs/ux/site-ux-direction.md#...`
- Applicable page-family direction: `docs/ux/pages/...`
- Existing patterns and prior decisions to preserve:

### Desired outcome

- What becomes easier, clearer, or smoother:
- What the user should understand in the first few seconds:

### Primary hierarchy

- Primary:
- Secondary:
- Intentionally quiet:

### Composition and responsive intent (when material)

- Desktop structure:
- Intermediate/tablet transition:
- Mobile reading and action order:
- Important spatial relationships:

### Interaction and state intent (when relevant)

- Default:
- Selected/recommended/current:
- Loading, empty, or unavailable:
- Error and success:
- Hover and focus:

### Media intent (when relevant)

- Why a visual is needed and what job it performs:
- Appropriate visual character / what to avoid:
- Mobile, alternative-text, and performance considerations:

### Design invariants

1. [Rendered-observable experience that must survive implementation.]
2. [...]

### Open subjective decisions

- [Only decisions that legitimately require Product Owner taste or intent.]

### Out of scope / preserve

- [Adjacent surfaces or accepted patterns that must not be redesigned.]

### Tech Lead feasibility

- Existing patterns/tokens reused:
- Responsive, accessibility, progressive-enhancement, state/data, media, and
  maintainability findings:
- Adaptations that preserve the invariants:
- Unresolved material trade-offs and escalation owner:
```

Pixel values belong in implementation notes only when they are genuinely
contractual. The brief describes relationships and experience.

## 3. Write useful design invariants

A design invariant states what must remain perceptually or functionally true
after technical adaptation. Use two to six for material work. Each must be:

- oriented to the user's understanding, task, or perception;
- observable in the rendered interface or an important state;
- specific enough for two reviewers to evaluate;
- important enough that violating it can make the UX unacceptable even when
  functional acceptance criteria pass.

Good invariants:

> The primary article feels intentionally dominant because of composition and
> content, not because an ordinary card is stretched vertically.

> The form remains the centre of gravity; secondary guidance does not push it
> far below the first task screen.

> On mobile, the course title and current action appear before any large
> supporting image.

> The page becomes progressively calmer after the discovery region.

> Availability is visible but does not visually dominate the course identity.

These are not invariants:

- `Use 36px top padding` — a pixel prescription without the experience it
  protects.
- `Border radius must be 12px` — a component implementation detail unless the
  issue explicitly changes an identity token.
- `Make it modern` or `make it premium` — vague adjectives that cannot be
  evaluated consistently.

Review invariants against desktop, mobile, and relevant states. If an invariant
is intentionally changed, update the brief and obtain the required decision;
do not silently reinterpret it after implementation.

## 4. Product Owner consultation

The Senior UX Designer owns design diagnosis and recommendation. Consult Suyog
about intent and taste when his judgment materially changes the direction; do
not ask him to perform design execution.

### Consult Suyog when

- introducing a genuinely new visual direction;
- choosing between materially different, reasonable UX directions;
- changing site personality, tone, brand character, or content prominence;
- departing from an earlier preference or accepted pattern;
- uncertainty remains after inspecting the actual rendered interface;
- normal bounded iteration is not converging;
- the final implementation needs a material deviation from the approved brief.

### Resolve within the team when

- choosing exact spacing, border radius, or minor font-size adjustments inside
  existing patterns;
- making routine responsive CSS decisions;
- selecting a minor crop when media intent is already settled;
- resolving implementation details that do not alter hierarchy, character, or
  an invariant.

When consultation is needed, present the rendered context, explain the decision
in plain language, make a recommendation, and ask only the question that needs
Product Owner judgment.

## 5. Translate subjective feedback

Reactions such as `too busy`, `too empty`, `too muted`, `doesn't feel like the
site`, `the previous version felt calmer`, or `this section is getting too much
attention` are valid product and design evidence. Suyog does not need to provide
a CSS-level diagnosis.

The Senior UX Designer translates the reaction into a testable design diagnosis:

> Product Owner: “This feels too busy.”
>
> UX diagnosis: Four adjacent elements have equal visual weight, three emphasis
> treatments compete simultaneously, and the primary reading path is unclear.
> Reduce competing emphasis while preserving the primary action; do not merely
> shrink every element.

Record the original reaction, the diagnosis, the intended adjustment, and which
invariant or direction statement it affects. Confirm the translation with Suyog
only if it could materially misread his intent.

## 6. Use multiple options only for a real fork

Show options when two distinct hierarchy or composition strategies are viable,
the choice is genuinely subjective, or it will define long-lived page
character. Do not manufacture three decorative variants to simulate choice.

For each real option:

1. Name the meaningful difference.
2. Show comparable rendered evidence in the relevant viewport/state.
3. Explain the trade-off against the baseline and invariants.
4. Recommend one and explain why.
5. Ask Suyog only for the unresolved intent/taste decision.

## 7. Tech Lead feasibility handoff

Before substantial implementation of UX-brief-required work, the Tech Lead
reviews the brief against:

- existing static HTML/CSS/vanilla-JavaScript architecture;
- reuse of established patterns and tokens;
- responsive feasibility and reading/action order;
- accessibility and progressive enhancement;
- state and data availability;
- image performance and media behavior;
- maintainability and the risk of creating a second design system.

Legitimate constraints may adapt the implementation. The handoff must state how
the adaptation preserves each affected invariant. Convenience alone is not a
reason to erase an invariant.

If a material trade-off remains, the Tech Lead and Senior UX Designer present it
to the Engineering Manager/Orchestrator. Escalate to Suyog when it changes
product intent, site character, content prominence, or an approved invariant.

## 8. Completion check

Before substantial implementation begins, confirm:

- the applicability level and reason are recorded;
- required context links and prior decisions are identified;
- two to six rendered-observable invariants exist for material work;
- open subjective decisions are either resolved or explicitly assigned;
- Tech Lead feasibility findings are recorded for UX-brief-required work;
- the brief supplements rather than duplicates the issue acceptance criteria;
- adjacent accepted surfaces are explicitly preserved.

This preparation does not itself grant UX acceptance. Rendered review and UX
acceptance are defined separately by #506 and #507.
