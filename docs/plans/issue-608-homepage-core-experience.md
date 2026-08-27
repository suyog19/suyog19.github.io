# Issue 608 homepage and Software Signal core experience

## Traceability and boundary

- Issue: #608; parent epic: #603
- Baseline: #604; approved direction: #605; regression gate: #606
- Accepted shared foundation: #607
- UX applicability: full brief required. The homepage proposition, hierarchy,
  engagement journey, responsive composition, and primary intellectual visual all
  materially change.
- In scope: root homepage and the minimum shared/test/evidence work required for
  that experience. Broad supporting-page migration remains #609.

## Gate A UX change brief

### Visitor and intended inference

An engineering practitioner or leader should infer within the opening viewport
that Software Signal is Suyog Joshi's practical body of work for keeping software
engineering reliable as machines perform more of it. They should next understand
the problem, encounter the canonical Reliable Engineering Framework, see how
research changes the work, and choose an appropriate engagement path.

### Observable invariants

1. Software Signal is the dominant professional proposition while Suyog Joshi is
   visibly its accountable founder and practitioner.
2. The Framework moment includes the North Star, all eight canonical branches,
   cross-cutting Security, Methods of Investigation, and evidence feedback. It has
   a complete semantic text structure and a purpose-built mobile composition.
3. Research precedes commercial pathways and distinguishes observation,
   contradictory evidence, testing, synthesis, and Framework updates.
4. Consulting and Learning are the primary engagement choices; Website Services
   is visibly adjacent rather than a Framework branch.
5. Writing and Systems appear as curated evidence, Weekly as a calm recurring
   relationship, and founder credibility supports rather than overtakes the work.
6. At 1440px, an intermediate width, and about 390px, the page reads as one
   deliberately paced experience with visible early actions, no horizontal
   overflow, and no repetitive catalogue grid rhythm.

### Mandatory direction and resolved choices

- Use the #607 brand/proposition opening, Signal Red, typography, CTA hierarchy,
  and shared shell. Add homepage composition in `pages.css`; do not create a new
  design system, dependency, framework, animation layer, or image language.
- Render the canonical Framework as semantic HTML rather than reusing the dense
  raster strategy diagram. Desktop uses a disciplined two-column branch field;
  mobile becomes a numbered editorial sequence. This changes presentation, not
  architecture or meaning.
- Use the real AI teaching workflows investigation and real Writing/Systems
  artifacts. Do not invent study outcomes, metrics, testimonials, or products.
- The hero primary action changes from Training to Framework under approved #605
  direction. Record this against #604 HOME-01 before updating its test.
- Use two bounded rendered iterations initially. Product Owner review is required
  before merge only if the rendered result creates a materially new personality,
  reframes the Framework, or fails to converge within the accepted direction.

## Team Lead feasibility decision

Use one hand-authored static homepage, existing CSS layers, and existing vanilla
analytics/navigation. The Framework is content-first HTML/CSS and therefore
indexable, accessible, responsive, and independent of JavaScript. Reuse current
routes and real content. Alternatives rejected: the canonical raster as primary
content (too dense on mobile), SVG-only semantics, a JavaScript visualization,
and a generic card-component expansion. Main risks are page length, duplicated
branch copy, shared CSS budget growth, and regression of existing homepage CTA
coverage; mitigate through concise copy, homepage-scoped CSS, performance-contract
validation, rendered full-page review, and explicit E2E contract updates.

## Intentional interaction-contract change

| ID | Accepted #604 behavior | Approved #608 behavior | Evidence |
| --- | --- | --- | --- |
| HOME-01 | Hero `Explore training` opens `/training/`. | Hero `Explore the Framework` opens `/framework/`; Learning remains a later primary engagement path through `Explore Learning`. | #605 approved hero hierarchy and #608 brief. |

No route, form, navigation, newsletter-provider, or backend contract changes.

### Asset-budget consequence

The semantic Framework map and homepage compositions bring `pages.css` to 160,794
raw bytes. Its review ceiling is narrowly reset from 150,000 to 165,000 bytes
(2.62% headroom); every other asset budget and scoping rule remains unchanged.
