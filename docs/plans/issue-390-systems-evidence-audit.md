# Issue #390 — Systems evidence audit and UX brief

Status: Gate A accepted for implementation

Baseline revision: `fb7ab27dfbe1f3f9866fc497bb2502b807fe5f02`

Issue: [#390](https://github.com/suyog19/suyog19.github.io/issues/390)

## Inventory audit and treatment

The audit covers every intentionally public route under `/systems/`. Depth is
proportional to the evidence that can be supported; equal page length is not a
goal.

| Route | Baseline state | Indexability | Treatment |
| --- | --- | --- | --- |
| `/systems/` | Already substantial collection | Index; retain sitemap entry | Preserve the category-led index. Refine maturity language only where strengthened detail pages require it. |
| `/systems/ai-dev-orchestrator/` | Useful but incomplete | Index; retain sitemap entry | Strengthen materially from the public repository: working prototype boundary, workflow, operator/human gates, implemented evidence, trade-offs, limitations, and learning. |
| `/systems/ai-workflow-lab/` | Already substantial | Index; retain sitemap entry | Preserve the existing examples. Add a current status, system boundary, architecture, and decisions; correct outdated phase/OCR wording without rewriting the evidence gallery. |
| `/systems/ai-native-learning-platform/` | Thin | Index; retain sitemap entry | Reframe honestly as an early architecture exploration. Distinguish the implemented structured learning surface from unbuilt AI assistance; add boundary, decisions, evidence, limitations, and learning. |
| `/systems/survey-poll-serverless/` | Useful but incomplete | Index; retain sitemap entry | Strengthen from its public FastAPI/AWS SAM repository: request path, atomic vote update, environment separation, evidence, security/operational limits, and learning. |
| `/systems/ai-workflow-lab/invoice-review-demo/` | Focused static demo | Index; retain sitemap entry | Keep demo-focused. Add an explicit static-simulation status and what it does not prove. Do not duplicate parent architecture. |
| `/systems/ai-workflow-lab/vendor-onboarding-rag-demo/` | Substantial static demo | Index; retain sitemap entry | Preserve. It already explains scenario, synthetic boundary, retrieval sequence, sources, no-answer behavior, and limits on direct entry. |
| `/systems/ai-workflow-lab/knowledge-markdown-demo/` | Substantial static demo | Index; retain sitemap entry | Preserve. It already explains pre-generated artifacts, pipeline purpose, direct-entry boundary, and limitations. |
| `/systems/ai-workflow-lab/ingestion-comparator/` | Substantial live tool | Index; retain sitemap entry | Preserve its distinct live-tool status, upload constraints, privacy/retention note, parser boundaries, and temporary result behavior. |

No route is low-value, duplicative, or unstable enough to justify `noindex`.
The three static demos each expose a distinct inspectable scenario; the
ingestion comparator is a distinct usable tool. All four therefore continue to
deserve unique canonicals and sitemap entries.

## UX change brief

**Applicability:** UX brief required — the issue materially changes visible
information hierarchy across several System detail pages.

### User and goal

- Affected user: a software engineer, technical learner, or decision maker
  evaluating what was actually built.
- Goal: understand the engineering question, maturity, boundary, workflow,
  evidence, trade-offs, limitations, and learning without mistaking a polished
  page for a production-product claim.

### Existing UX context

- Preserve the calm editorial direction in
  `docs/ux/site-ux-direction.md`.
- Preserve the content-led Systems index in `docs/ux/pages/systems.md`.
- Preserve article-like readability and evidence-linked prose from
  `docs/ux/pages/system-detail.md`.
- Preserve #389 related-reading relationships. #390 improves destination
  quality rather than reopening the site-wide link graph.

### Strategic altitude

- Whole-page and cross-site system reviewed: Systems index, all four System
  details, all four child demos, representative Writing relationships, and the
  existing article/system CSS family.
- Broader inconsistency exposed: none requiring adjacent redesign. The index
  already supports the intended categories and summaries.
- Best in-scope recommendation: establish a prose-first evidence hierarchy
  inside the existing reading column, with a quiet status line and existing
  flow components where sequence materially improves understanding.
- Stronger overall recommendation: none. A new product-like component system
  would weaken the editorial evidence model.
- Recommendation strength: strongly recommended.

### Desired outcome and hierarchy

- First seconds: identify what kind of thing the page describes and the
  concrete engineering question it tests.
- Primary: problem/question, status, and system boundary.
- Secondary: architecture/workflow, key decisions, inspectable evidence, and
  outcome.
- Intentionally quiet: implementation technology names, future possibilities,
  and related reading.

### Composition and responsive intent

- Desktop: retain the single bounded reading column; use existing flat flow
  sequences only where they clarify a real request or workflow path.
- Tablet/mobile: preserve semantic document order, natural wrapping, and the
  current reading rhythm. Do not introduce side-by-side evidence panels that
  become a second layout system.
- Demo actions remain visually distinct buttons; repository and reading links
  remain ordinary textual evidence/navigation.

### Design invariants

1. The page identifies maturity and boundary before detailed implementation,
   so polish cannot imply production readiness.
2. A reader can scan problem, architecture, evidence, limitations, and learning
   from meaningful headings without reading every paragraph.
3. Evidence is explained next to the claim it supports; diagrams and demos do
   not become unexplained decoration.
4. On mobile, the same semantic reading order remains clear with no horizontal
   page overflow.
5. AI Workflow Lab retains its richer evidence gallery, while child demos stay
   focused on their own scenario and link back to the parent.
6. The result remains an editorial engineering account, not a SaaS landing
   page or a keyword inventory.

### Open subjective decisions

None. The issue and existing page-family direction resolve the material choices.

### Out of scope / preserve

- No Systems-index redesign.
- No social-preview image work (#392).
- No new cross-site linking campaign (#389).
- No new framework, CMS, build step, interactive dashboard, or fabricated
  benchmark.

### Tech Lead feasibility

- Reuse existing static HTML, `.article-*`, `.flow-sequence`, `.process-flow`,
  button, list, and related-reading patterns.
- Native headings, lists, links, and status prose preserve accessibility and
  progressive enhancement. No JavaScript is needed for the new evidence
  hierarchy.
- Existing responsive rules already support the reading column and flow
  components. Long labels and 200% zoom remain explicit rendered-review risks.
- No new media is required; existing synthetic images and interactive demo
  artifacts retain their current purposes.
- No unresolved feasibility trade-off or Product Owner taste decision remains.

## Architecture decision

### Decision

Keep System evidence pages as hand-authored editorial HTML within the current
article-detail architecture. Add only truthful page-specific prose and existing
flow primitives. Introduce a small structured-data contract by page type:

- `CollectionPage` remains the Systems-index contract;
- `TechArticle` describes the four engineering-account System pages;
- `CreativeWork` describes the three pre-generated static demos;
- `WebApplication` describes only the publicly usable ingestion comparator.

Extend the existing structured-data validator rather than creating a parallel
SEO validation framework. Visible titles, descriptions, status, boundaries, and
capabilities remain authoritative over schema.

### Constraints

- No speculative application metadata, ratings, pricing, operating-system,
  usage, performance, scale, or production-traffic claims.
- No private endpoints, credentials, operational configuration, learner/client
  data, or private source links.
- A repository link or public demo counts as evidence only when accompanying
  prose says what it supports and what it does not prove.
- Preserve directory-style canonicals, existing sitemap decisions, GA4,
  external-link safety, active Systems navigation, and #389 relationships.

### Alternatives rejected

- A uniform card/dashboard template: rejected because evidence depth differs
  materially and the page family is intentionally editorial.
- A new `SoftwareApplication` graph for every route: rejected because concept
  and static-demo pages are not all usable applications.
- New architecture illustrations: rejected because existing prose and simple
  flow sequences communicate the verified implementation without decorative
  diagrams.
- `noindex` on child demos: rejected because each route has unique,
  public-safe, standalone evidence and a stable canonical.

### Consequences and residual risks

The result remains easy to maintain and reversible, but System facts can become
stale as sibling implementations evolve. The audit and focused validation make
the current contract explicit; future material system changes still require
editorial review. Rendered UX and functional QA must verify long-page rhythm,
flow wrapping, heading hierarchy, keyboard focus, and claim/schema agreement.

## Gate A baseline evidence

- Rendered locally from the baseline at 1440×900 and 390×844.
- AI Dev Orchestrator, AI-native Learning Platform, and Survey/Poll were short,
  generic narratives with no explicit maturity or boundary hierarchy.
- AI Workflow Lab was materially deeper and already included explained
  synthetic evidence, demo actions, a flow sequence, and limitations.
- Representative baseline pages had no horizontal overflow; the mobile menu
  correctly replaced desktop navigation.
- Mandatory direction: preserve those responsive and editorial strengths while
  making evidence quality, maturity, and limitations explicit.

## Gate B implementation evidence

- First coherent slice rendered locally at 1440×900 and 390×844; all nine
  public Systems routes were then checked at 1440, 768, and 390 CSS pixels.
- The four primary/detail pages each retain exactly one H1, active Systems
  navigation, meaningful H2 hierarchy, working nested assets, and no document-
  level horizontal overflow.
- Existing AI Workflow Lab images remain loaded and explained; its long evidence
  gallery stays intact beneath the new status, boundary, architecture, and
  decision context.
- The new flow sequences stay within their reading columns. A 720-pixel
  reflow-equivalent check for a 1440-pixel viewport at 200% and an additional
  360×800 narrow check found no page, flow, or button overflow.
- Keyboard traversal exposes a visible two-pixel focus outline. At mobile width,
  the navigation toggle receives focus, reports `aria-expanded`, and opens the
  existing menu with Enter.
- Gate B result: no Must-fix finding. Preserve the quiet status prose, single
  reading column, semantic scan path, and existing demo-action distinction.
