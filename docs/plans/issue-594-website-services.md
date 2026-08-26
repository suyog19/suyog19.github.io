# Issue #594 — Website Services discovery and enquiry

## Traceability and UX applicability

- Issue: `suyog19/suyog19.github.io#594`
- Strategy: `suyog19/software-signal/strategy/website-services-strategy.md`
- Validation context only: `suyog19/software-signal#48`
- Route: `/website-services/`, consistent with the canonical directory URL policy.
- UX applicability: **UX brief required** — this is a material new public surface,
  information hierarchy, discovery path, and service-aware Contact journey.
- Baseline: the current site, `docs/ux/site-ux-direction.md`, Home and Contact
  page-family guidance, and the accepted Consulting implementation from #593.

## UX change brief

### User and goal

- Primary users: individual professionals, consultants, trainers/coaches,
  creators, independent providers, local/service businesses, and very small
  companies.
- Main decision: recognise whether a sensible website service fits their current
  situation, understand the likely level of engagement and price, and make a
  lightweight enquiry without needing technical knowledge.
- First-seconds outcome: “Software Signal can help me get a clear, credible,
  useful website without making ongoing maintenance my job.”

### Strategic altitude

- Whole-page and cross-site review: Home, Contact, About, Consulting, Training,
  Support, shared header/footer, and existing typography/card/button patterns.
- Relationship to the site: Website Services is an adjacent commercial work
  stream. It remains visually secondary to the broader Software Signal
  engineering and learning identity and does not enter primary navigation.
- Difference from Consulting: Consulting sells senior engineering judgment and
  a defined assessment; Website Services delivers a concrete website outcome,
  launch, handover, and optional care.
- Best in-scope recommendation: one editorial service page, a quiet secondary
  Home discovery link near existing commercial contact context, and safe fixed
  Contact topics.
- Stronger overall recommendation: the same. There is no evidence for a separate
  agency identity, primary-navigation placement, imagery, or a larger funnel.
- Recommendation strength: strongly recommended.

### Hierarchy and composition

- Primary: outcome-led promise; common customer situations; five primary offers
  with indicative prices; one clear enquiry path.
- Secondary: normal engagement scope and delivery sequence; ownership and
  third-party cost model; delivery-quality reasons to trust the work.
- Intentionally quiet: Custom Website and Website Enhancement; content
  responsibility; exclusions and assurance limitations.
- Desktop: bounded editorial hero; two-column situation group; a structured
  package list that avoids commodity price-table styling; split explanatory
  sections; compact nine-step process; final enquiry band.
- Tablet: package and split layouts collapse before text becomes cramped;
  process becomes three columns.
- Mobile: promise → situations → packages → engagement → ownership/costs →
  process → trust/boundaries → enquiry. Actions become full width; prices stay
  attached to their package headings; no horizontal overflow at 390px or 360px.
- No imagery is needed: typography, whitespace, rules, and specific copy perform
  the comprehension and trust work more faithfully.

### Interaction and states

- Native anchor links provide package-to-Contact navigation without JavaScript.
- Fixed allow-listed `topic` values convey service choice; free text never enters
  a URL or analytics event.
- Contact shows a contextual note and starter prompt, requires meaningful added
  detail, and preserves the existing validation, API payload, honeypot, error,
  and success behavior.
- Analytics observes only fixed page/service/source identifiers. It never reads
  or emits form values, supplied URLs, referrers, or free text.

### Design invariants

1. Visitors understand the service outcome before encountering package detail.
2. Packages are easy to compare by situation, objective, and complexity without
   becoming a page-count commodity table.
3. Ownership and low lock-in feel reassuring and practical, not technical.
4. The page remains recognisably part of suyogjoshi.com and does not create an
   agency identity or visually compete with the broader Software Signal site.
5. Mobile preserves promise → package understanding → enquiry in that order.
6. Website Care reads as optional, while boundaries and separate third-party
   costs remain clear before enquiry.

### Open subjective decisions

- None. Primary navigation is explicitly unchanged. Existing typography,
  palette, component language, and page rhythm resolve the material visual
  choices without a new brand decision.

### Out of scope / preserve

- No quoting, CRM, portal, booking, payment, checkout, website builder, managed
  hosting platform, e-commerce, SaaS, marketplace, or custom-application offer.
- Preserve Consulting, Learning, Support, existing Home hierarchy, Contact API
  contract, analytics identity, deployment, dependencies, and global navigation.

## Tech Lead feasibility review

**Decision:** feasible in the existing static HTML/CSS/vanilla-JavaScript
architecture with no material trade-off or escalation.

- Reuse the standard page shell, site tokens, serif/sans roles, buttons, eyebrow,
  flat borders, muted surfaces, and progressive mobile navigation.
- Add one scoped stylesheet and one small scoped analytics file; no dependency,
  font, framework, image, backend, or deployment change.
- Extend #593's fixed-topic Contact mechanism into a small shared service-context
  path while preserving all existing Learning and Consulting behavior.
- Use semantic sections, articles, lists, headings, links, and definition-like
  package facts; no complex client state or ARIA widget is required.
- Generate sitemap from the public-page inventory and validate nested asset depth,
  canonical metadata, responsive behavior, keyboard focus, and analytics privacy.
- All six invariants are technically achievable with existing tokens and patterns.

## Rendered review record

### Iteration 1 — first rendered review

- Target: feature branch working tree for #594.
- Method: local HTTP render in Chrome; 1440×900, 768×900, 390×844, and
  360×800; viewport and full-page/section captures; computed overflow and layout
  checks.
- Pages/states: Website Services default, hero, package region, responsive
  transformations, and Contact-bound fixed links.
- Observed: no horizontal overflow at any reviewed width; the promise and actions
  fit the first mobile viewport; packages stack with price, situation, detail, and
  action in a coherent order; 768px collapses split/package layouts and retains a
  three-column process; headings remain sequential and all seven Website Services
  Contact links use fixed topics.

#### Must fix

- None.

#### Should fix

- The nine-stage process rendered as nine narrow desktop columns. Although
  readable, it was compressed relative to the page's calm hierarchy. Use a
  three-by-three sequence on desktop/tablet while retaining two columns on mobile.

#### Optional

- None.

#### What works / preserve

- The hero makes the outcome clear before package detail.
- The package list feels editorial and situation-led rather than like a commodity
  pricing table.
- Ownership/cost information is visibly reassuring but quieter than package choice.
- The monochrome typography, rules, and surfaces remain recognisably part of the
  existing site; there is no separate agency treatment.
- At 390px and 360px, promise → action → situation → package order remains intact.

**Result:** needs one bounded refinement. **Recommendation strength:** strongly
recommended. **Broader UX recommendation:** none.

### Iteration 2 — convergence and acceptance

- Changed only the process composition to three columns at desktop/tablet and two
  on mobile, with a modestly larger stage label.
- Re-rendered at 1440×900 and 390×844. Computed columns are three equal desktop
  tracks and two equal mobile tracks; both retain zero horizontal overflow.
- The iteration-1 hierarchy, package treatment, ownership reassurance, site
  identity, and mobile order remain preserved.
- Must fix: none. Should fix: none. Optional: none. Accepted deviations: none.

**Gate C:** converged after two iterations.

**Gate D:** **UX accepted** — all six invariants pass in the rendered evidence.

**Recommendation strength:** strongly recommended.
**Residual UX risk:** screenshots are local-browser evidence rather than a deployed
branch preview; deployment behavior remains covered by static route/asset checks
and CI.

### Post-acceptance correction — native list markers

Product Owner testing identified that the delivery-process `<ol>` displayed both
the browser's native `1.`–`9.` markers and the intended visible `01`–`09` labels.
This was a Must-fix rendered defect that the original review missed, so the earlier
unqualified acceptance was not sufficient.

The correction explicitly removes native list styling from `.ws-process` while
retaining the semantic ordered list and authored labels. The focused regression
test now requires this CSS contract.

Re-rendered evidence after correction:

- 1440×900: three-by-three grid shows only `01`–`09`; computed
  `list-style-type` is `none`; no horizontal overflow.
- 390×844: two-column grid shows only `01`–`09`; computed `list-style-type` is
  `none`; no horizontal overflow.

**Corrected UX disposition:** Must fix resolved. The process remains semantically
ordered, visually clear, responsive, and consistent with the original invariant
that the delivery sequence should be understandable without visual noise.

### Senior UX follow-up — explanatory process copy

Product Owner review correctly identified that removing duplicate numbering did
not resolve the larger comprehension problem. The section heading promises a
clear understanding of what happens, but nine bare internal verbs did not fulfil
that promise.

Fresh Senior UX review classified explanatory copy as a Must fix and recommended
this hierarchy: quiet step number, prominent verb, then one muted customer-facing
sentence. All nine steps now explain what happens without exposing internal
engineering ceremony. The semantic ordered list and sequential reading order are
preserved.

The review also classified a single-column phone layout as a Should fix. With the
new descriptions, two narrow columns at 360px or 390px would produce cramped and
uneven tiles. Desktop retains three columns; widths up to 480px use one compact
column. No decorative connector was added because the ordered numbering already
communicates sequence.

Re-rendered evidence after the content and responsive correction:

- 1440×900: nine descriptive steps in three equal columns; native list style is
  `none`; no horizontal overflow.
- 390×844: nine descriptive steps in one 335px column; native list style is
  `none`; no horizontal overflow.
- 360×800: one 305px column; no horizontal overflow.

**Senior UX disposition:** Must fixes and accepted Should fix resolved. The
delivery process is UX accepted for this follow-up: customer-facing, semantically
ordered, visually subordinate to the main service decision, and readable at the
required desktop and phone widths.
