# Issue #609 — Supporting page-family evolution

Status: Gate A accepted for implementation  
Baseline: `6fff11e2e13af19045014f20eeae0c1515a46773`  
Parent: #603

## UX change brief

**Applicability:** UX brief required. #609 materially changes page-family
composition, hierarchy, discovery, and responsive reading order.

### Page jobs and first-screen outcomes

| Family | Primary job | The visitor should understand quickly |
| --- | --- | --- |
| Software Signal | Orient the body of work | Framework and Research form the intellectual core; services, evidence, and Weekly provide ways to apply or follow it. |
| Framework | Comprehension | The North Star, eight canonical branches, Security, investigation methods, and evidence-feedback relationship. |
| Research | Investigation discovery | What is being investigated, its status, method, evidence posture, and relationship to the Framework. |
| Consulting | Trust and appropriate enquiry | Whether senior advisory/review can help, which engagement fits, what it produces, and how to start. |
| Learning | Starting-point selection | What a working professional can learn, the commitment involved, and which current route fits. |
| Website Services | Service decision | What can be built or improved, packages/process/ownership/cost boundaries, and how to enquire. |
| Writing | Reading discovery | Which current article, topic, series, or path is useful now. |
| Systems | Practical-work inspection | What was built or tested, what can be inspected, and what the artifact does and does not establish. |
| About | Founder trust | Who Suyog is, what shaped his view, why Software Signal exists, and how its work manifests. |
| Weekly | Subscription decision | What arrives, why it is useful, its attention cost, and the safe subscription path. |

Products has no dedicated public surface in #609: the repository contains product
concepts and drafts, not a validated public offer. This follows “productize repeated
value” without inventing inventory.

### Primary hierarchy

- Primary: the page-family task and the most useful real content/action.
- Secondary: context, evidence, trust, boundaries, and adjacent discovery.
- Intentionally quiet: internal business architecture, exhaustive inventories,
  decorative brand statements, and future products.

### Composition and responsive intent

- Framework uses a compact orienting masthead, a readable structural map, then
  branch explanations and method/feedback context.
- Research uses an index/method composition that exposes the real active
  investigation immediately.
- Service pages expose proposition, fit, offer/process, evidence, boundaries, and
  enquiry without an oversized editorial preamble.
- Learning preserves its scoped teal system and functioning journey while widening
  the framing to practical professional formats and starting-point choice.
- Writing and Systems use editorial/technical indexes with unequal hierarchy,
  rather than uniform card catalogues.
- About remains narrative; Weekly stays compact and conversion-focused.
- Mobile order follows the decision task; no desktop side content precedes the
  title, proposition, or useful primary action.

### Design invariants

1. Every page exposes task-relevant content or an action in its first meaningful
   viewport; no family copies the homepage opening composition wholesale.
2. Framework always presents the exact eight canonical branches, Security as
   cross-cutting, Methods of Investigation, and evidence-driven evolution.
3. Consulting, Learning, and Website Services remain distinct offers: advisory,
   professional learning, and an adjacent website service respectively.
4. Writing and Systems read as evidence/discovery surfaces, while About keeps
   Suyog visibly accountable for Software Signal.
5. Signal Red remains restrained, black surfaces are exceptional, and numbering
   appears only for canonical branches or genuinely ordered processes.
6. All #604 routes and preserved interactions remain functional at desktop and
   390px mobile; authenticated and third-party mutations remain untouched.

### Out of scope / preserve

- No route retirement, frontend framework, dependency, backend change, new
  product inventory, article rewrite, or independent redesign of every detail page.
- Preserve contact, newsletter, analytics, course action, learner, feedback,
  external-link, canonical, and sitemap contracts.
- #610 release-wide validation and production promotion remain separate.

### Tech Lead feasibility / architecture decision

**Decision (`architecture-decision/v1` intent):** evolve the existing hand-authored
HTML and scoped page-family CSS. Reuse #607 tokens, shell, CTA/link language, and
opening primitives; add only purpose-specific semantic classes in `pages.css` and
retain `learning.css` for Learning. No JavaScript or runtime architecture change is
needed.

Alternatives rejected:

- one shared homepage-derived template, because it would erase page purpose;
- a component/build-system migration, because static HTML/CSS already supports the
  required variation and a migration adds unrelated risk;
- a new Products route, because no validated public product exists;
- route renames, because approved directory routes already match the target IA.

Consequences: some repeated shell markup remains consistent with repository
architecture; CSS must stay rooted to the changed family classes; representative
index pages can establish patterns without rewriting detail pages. Residual risk is
cross-family CSS growth and page-length drift, controlled through scoped selectors,
rendered cross-page review, performance contracts, and the #606 suite.

The final purpose-specific additions bring `css/pages.css` to 167,931 raw bytes.
The evidence-backed ceiling moves from 165,000 to 175,000 bytes (4.0% headroom);
this is not permission for unrelated growth and avoids a second stylesheet or
abstraction solely for Framework and Research.

## Migration and interaction disposition

- All 66 #604 sitemap routes: `preserved`; no redirect or retirement proposed.
- `/framework/` and `/research/`: approved durable surfaces retained and expanded.
- Operational/private learner/admin routes: unchanged and preserved.
- Interaction contract: no approved outcome changes anticipated. If implementation
  reveals one, record it before changing its regression assertion.

## Evidence plan

Capture deterministic 1440×900, 1024×768, and 390×844 renders for Framework,
Research, Consulting, Learning, Website Services, Writing, Systems, About, and
Weekly. Compare against #604 where available and the #607 shell captures for the
new Framework/Research routes. Review family slices before the final cross-page
acceptance pass.
