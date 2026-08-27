# Software Signal target experience

Issue: [#605](https://github.com/suyog19/suyog19.github.io/issues/605)

Parent epic: [#603](https://github.com/suyog19/suyog19.github.io/issues/603)

Before-state contract: [#604 baseline](../issue-604-current-site-baseline.md)
Status: **approved implementation reference for issues #607-#609**

This document defines the target brand architecture, information architecture,
homepage hierarchy, visual character, responsive intent, and page-family roles
for the Software Signal evolution. It is a design contract, not permission to
begin broad implementation. Issues #606-#609 retain their own gates.

## UX change brief

**Applicability:** UX brief required. This direction materially changes public
brand prominence, navigation, homepage hierarchy, cross-site discovery, visual
identity, and responsive composition.

### User and goal

- **Primary visitor:** an engineering leader, practitioner, organization, or
  learner encountering Suyog Joshi or Software Signal through search, writing,
  referral, or a direct visit.
- **First goal:** understand what Software Signal is, who stands behind it, and
  why reliable engineering matters in AI-assisted software work.
- **Next goal:** choose an appropriate path—understand the Framework, inspect
  Research/evidence, discuss Consulting, develop capability through Learning,
  or follow Software Signal Weekly.
- **Trust need:** see credible founder experience and concrete work before being
  asked to accept a broad claim or begin a commercial journey.

### Existing UX context

- Preserve the restrained editorial foundation in `site-ux-direction.md` and the
  page-family invariants under `docs/ux/pages/`.
- Use the production screenshots, route inventory, interaction contract, content
  inventory, and quality findings in #604 as the before state.
- Preserve the static HTML/CSS/progressive-JavaScript architecture, directory
  URLs, accessibility semantics, existing fonts, and working integrations.
- Treat this document's changes as **New recommendations**, not discovered
  historical intent.

### Strategic altitude

- **Whole system reviewed:** Home, Consulting, Website Services, Training,
  Writing, Systems, About, Contact, Newsletter, Support, representative details,
  shared header/footer, current navigation, SEO/route policy, and #604 evidence.
- **Current inconsistency:** Software Signal is visible mainly through Learning
  and Weekly, while the homepage reads primarily as Suyog's personal learning,
  writing, and systems hub. Consulting, research, and the proposed Framework do
  not form a legible professional-platform spine.
- **Best in-scope recommendation:** evolve the root homepage into the professional
  home of Suyog Joshi and Software Signal; keep Suyog as the parent personal
  identity and visibly accountable founder while making Software Signal the
  coherent professional body of work. Orient global navigation around Software
  Signal, Consulting, Learning, Website Services, Writing, and About; use Weekly
  as a persistent subscription action; keep Framework, Research, and Systems
  discoverable beneath the Software Signal surface without reproducing the
  internal architecture in the navbar.
- **Stronger overall recommendation:** the same. An anonymous corporate brand,
  a separate Software Signal domain, or a framework/SaaS-style replatform would
  weaken trust and exceed approved scope.
- **Recommendation strength:** approved by the Product Owner, with the material
  dispositions and provenance recorded at the end.

## Brand architecture

### Relationship

```text
suyogjoshi.com — professional home of Suyog Joshi + Software Signal
├── Suyog Joshi — founder, practitioner, and parent personal trust identity
└── Software Signal — professional/intellectual platform and body of work
    ├── founded and led by Suyog Joshi
    ├── Reliable Engineering Framework — intellectual center
    ├── Research — evidence and evolution loop
    ├── Consulting — primary professional engagement
    ├── Learning — capability-building practice
    ├── Writing + Systems — public evidence
    ├── Software Signal Weekly — recurring editorial channel
    └── Website Services — adjacent professional service
```

Software Signal is the primary professional/body-of-work brand, not the parent
identity replacing Suyog Joshi. The site must never read as an anonymous corporate
Software Signal property. Software Signal is not represented as a separate legal
company. Structured identity continues to resolve to Suyog's Person entity unless
a separately approved legal/organizational change provides authoritative truth.

### Naming and endorsement

- **Primary platform name:** `Software Signal`.
- **Founder endorsement:** `Founded by Suyog Joshi` or `By Suyog Joshi`, chosen
  according to available space and context.
- **Motto:** `Move fast. Engineer reliably.` It is a recognizable platform
  expression, not a decorative slogan repeated in every section.
- **Domain:** remain on `suyogjoshi.com`; do not imply a domain or company change.
- **Learning identity:** `Software Signal Learning` remains the named learning
  practice within the larger platform, not the definition of the whole platform.
- **Weekly identity:** `Software Signal Weekly` remains the editorial newsletter.

### Brand lockup intent

The shared header must preserve Suyog Joshi as the site owner/trust identity while
giving Software Signal first-class navigation presence. Senior UX may use a compact
`Suyog Joshi` / `Software Signal` relationship or keep the site identity and first
navigation item distinct, but both names must remain understandable without an
image logo. On narrow screens, never reduce the relationship to unexplained
initials or make Software Signal appear ownerless.

## First-impression proposition

The opening viewport should answer four questions in this order:

1. **What:** Software Signal is a practical platform for engineering reliable
   software and AI-enabled systems.
2. **Who:** it is founded and led by Suyog Joshi, an experienced software
   practitioner.
3. **Why:** teams need to move quickly without losing architecture, judgment,
   controls, or evidence.
4. **Next:** explore the Framework or choose Consulting, Learning, Research, or
   another clearly labelled path.

### Recommended hero message architecture

- Eyebrow/endorsement: `Suyog Joshi · Software Signal`
- H1: `Move fast. Engineer reliably.`
- Supporting proposition: explain in one compact paragraph that Software Signal
  connects a reliable-engineering framework, active research, practical writing
  and systems, consulting, and learning for AI-assisted software work.
- Primary action: `Explore the Framework`.
- Secondary action: `See how Software Signal helps` (in-page jump to engagement
  paths), with `Read the research` as a quieter text link when current research
  exists.

The exact final prose may be editorially refined in #608, but these information
roles and action ranking are contractual. The hero must not lead with courses,
an exhaustive service list, or unsupported transformation claims.

## Target information architecture

### Primary navigation

| Label | Target | Role |
|---|---|---|
| Software Signal | `/` (Software Signal homepage surface) | Platform overview and gateway to Framework, Research, current signals, evidence, and engagement paths. |
| Consulting | `/consulting/` | Primary professional engagement path. Existing route preserved. |
| Learning | `/training/` | Capability-building practice. Existing route preserved; label changes from Training in global navigation. |
| Website Services | `/website-services/` | Active adjacent professional service. Existing route preserved and clearly discoverable. |
| Writing | `/writing/` | Editorial evidence and discovery. Existing route preserved. |
| About | `/about/` | Founder credibility and platform relationship. Existing route preserved. |

`Software Signal Weekly` appears as a distinct, restrained `Subscribe` action
linking to `/newsletter/`, not as a seventh equal navigation item. Contact remains
available through high-intent CTAs and the footer. This avoids a crowded header
while keeping the recurring channel visible.

The site identity and `Software Signal` navigation item may both return to `/`.
#607 should avoid redundant announcements or focus stops in the final header: the
rendered solution may combine the site identity and Software Signal destination
at narrower widths while preserving the approved information architecture.

### Intentionally not primary navigation

- **Framework and Research:** durable Software Signal surfaces, deliberately
  below the top-level navbar. They are prominent within the homepage Software
  Signal narrative, cross-linked from each other, and available from relevant
  Writing/Systems evidence and the footer.
- **Systems:** preserved at `/systems/` and promoted within Framework, Research,
  Writing, homepage evidence, and footer navigation. It is proof, not a top-level
  business pillar.
- **Weekly:** represented by the `Subscribe` action rather than an equal nav item.
- **Contact:** high-intent destination, not a browsing category.
- **Support, Search, Privacy, Card:** utility/contextual destinations.
- **Products:** absent until a real product with approved public truth exists.

### Navigation behavior

- Use one flat primary navigation; do not introduce a mega-menu or nested desktop
  dropdown solely to expose every workstream.
- Preserve the current progressive mobile-menu contract: native button,
  `aria-expanded`, Escape, click-outside, visible focus, and content access
  without complex application state.
- Mobile order: Software Signal, Consulting, Learning, Website Services, Writing,
  About, Subscribe. Contact and utility routes follow in the footer or contextual
  CTAs.
- Keep current-page semantics with `aria-current="page"`.

### Route policy

- All 66 routes in the #604 public inventory begin as `preserved`.
- #605 proposes two additions, `/framework/` and `/research/`; it proposes no
  rename, redirect, or retirement.
- `Training` becomes `Learning` only as a navigation/content label; the canonical
  route remains `/training/` unless a later issue separately approves migration.
- `/systems/`, `/website-services/`, and `/newsletter/` remain canonical even
  though their global discovery treatment changes.

## Homepage experience hierarchy

### 1. Hero — proposition and authorship

Make the Suyog Joshi + Software Signal relationship, platform promise, tension,
and primary next step legible in the first viewport. Use typography and
composition rather than a generic technology illustration.

### 2. Why Software Signal exists — the engineering tension

Explain the practical problem: AI increases delivery speed and possibility, but
speed without context, architecture, review, ownership, and evidence increases
risk. Use a concise editorial split or tension statement rather than three equal
feature cards.

### 3. Reliable Engineering Framework — recognizable intellectual artifact

Introduce one versioned framework map, a short purpose statement, and the primary
Framework action. The diagram must help a visitor understand relationships and
movement; it must not be an ornamental wheel or a forced sales funnel.

### 4. Current Research / signals — evidence and evolution

Show one current research question or finding and a small number of related
signals. Clearly distinguish observed evidence, interpretation, and open question.
This section explains how research updates or challenges the Framework.

### 5. Ways Software Signal helps — engagement choices

Give Consulting and Learning primary peer visibility with distinct intent:

- Consulting: apply the thinking to a real organizational or engineering problem.
- Learning: build practical capability through guided learning.

Writing and Systems are evidence paths, not equal commercial offers. Products do
not appear until real. Use descriptive modules rather than a pricing grid.

### 6. Website Services — adjacent professional service

Use an explicit boundary such as `Also available from Suyog` or `Adjacent
service`. Explain that Website Services applies the same care for clarity and
quality but is not a pillar of the Reliable Engineering Framework. Give it a
clear route without equal visual weight to the platform's intellectual spine.

### 7. Evidence / open work — Writing and Systems

Compose selected writing and systems as proof of thinking and practice. Lead with
one substantial item or relationship, supported by a smaller editorial set; do
not render a uniform catalogue grid on the homepage.

### 8. Software Signal Weekly — recurring channel

Offer the calm weekly note after visitors have seen the platform's substance.
Preserve explicit consent, provider confirmation, privacy link, and hosted
fallback. Do not use a modal, interruption, or repeated sticky prompt.

### 9. Founder credibility — earlier trust, concise proof

Introduce Suyog before the final decision with a compact founder statement:
relevant 20+ years of experience, banking/payments systems, current AI/software
focus, and links to evidence/About. This supports the platform without becoming a
résumé timeline on Home.

### 10. Intent-based final CTA

End with differentiated next steps, not one generic `Get in touch`:

- `Discuss a consulting problem`
- `Find a learning path`
- `Explore the Framework`

Website Services may have a quieter adjacent link. Contact remains the destination
for qualified enquiries with existing contextual parameters preserved.

## Reliable Engineering Framework and Research

### Public presentation contract

The Framework should behave like a maintained public engineering artifact:

- one canonical `/framework/` explainer;
- a visible version or maturity label (`working`, `published`, or another honest
  state approved with the content);
- a stable conceptual map with a textual equivalent;
- principles and practical questions, not only abstract nouns;
- links to supporting research, writing, systems, and field examples;
- a visible `what changed / what we are testing` mechanism where evidence exists;
- no gated PDF as the only useful representation.

Research should use `/research/` as an index that distinguishes active studies,
published findings, and open questions. Research informs the Framework; it is not
presented as proof when evidence is preliminary.

### Five-movement scaffold review — disposition approved

The first #605 draft proposed five movements. They are **withdrawn as the public
Framework structure**:

| Proposed movement | Purpose | Mapping to canonical Framework |
|---|---|---|
| **1. Frame the work** | Establish purpose, outcomes, constraints, requirements, and the context needed before action. | Draws primarily from **Context & Specification Engineering** and **Engineering Knowledge & Organizational Memory**, with parts of governance and human accountability. |
| **2. Design the system** | Make boundaries, architecture, data, failure modes, and operational constraints explicit before implementation. | Draws primarily from **Architecture of AI-Assisted & Agentic Engineering Systems**. Security would need to remain visibly cross-cutting. |
| **3. Direct AI and automation** | Decide what humans, agents, and conventional automation should do, under what authority and supervision. | Combines **AI-Assisted & Agentic SDLC**, **Autonomy, Control & Governance**, and parts of **Human & Organizational Operating Model**. |
| **4. Verify with evidence** | Establish justified confidence through tests, checks, provenance, traceability, review, and risk-proportional assurance. | Draws primarily from **Verification, Testing & Engineering Evidence**, with governance and Security concerns. |
| **5. Learn and adapt** | Use operational outcomes, research, experiments, and practitioner feedback to update knowledge and the Framework. | Combines the canonical **Methods of Investigation** learning loop with **Engineering Knowledge & Organizational Memory** and parts of **Reliability Economics**. |

#### What a visitor would understand

Presented on the website, the five movements would give a simple lifecycle:
frame → design → direct → verify → learn. It would help a visitor understand how
reliable AI-assisted engineering work might progress from intent to feedback and
would be easier to scan than eight investigation branches.

#### Fidelity finding

The five movements are **not a faithful one-to-one presentation of the canonical
Software Signal Reliable Engineering Framework** in `software-signal/strategy`.
The canonical Framework defines eight investigation branches, Security as a
cross-cutting concern, and a separate evidence-seeking Method of Investigation.
The five movements reorganize those thematic branches into a lifecycle. That is a
new conceptual interpretation and risks making Reliability Economics, Human and
Organizational Operating Model, Security, and the distinction between knowledge
and task context appear secondary.

The five movements could be used later as an explicitly labelled application or
visitor-orientation pathway, but they must not replace or silently redefine the
canonical Framework.

#### Approved presentation direction

Do **not** use the five movements as the public structure of the Framework. For
`/framework/`, faithfully present:

1. the canonical North Star;
2. the eight named investigation branches;
3. Security as cross-cutting across all branches;
4. the canonical Methods of Investigation as a learning loop; and
5. how evidence may strengthen, challenge, or change the Framework.

The homepage can show a concise overview of that structure and link to the full
page without forcing all eight branches into equal cards. This approved direction
preserves the intellectual model and uses composition—not conceptual rewriting—to
reduce visitor complexity. The five movements may be reconsidered only as an
explicitly labelled future application pathway; they are not canonical Framework
architecture.

### Sales boundary

The Framework may demonstrate Consulting and Learning relevance through quiet,
contextual links after the useful explanation. It must remain valuable without a
sales action and must not turn every principle into a service package.

## Visual character and colour direction

### Character

Target: **quietly premium + editorial + engineered**.

- Preserve Playfair Display for editorial hierarchy and Inter for interface/body
  roles; do not add fonts.
- Use disciplined rules, alignment, bounded measures, whitespace, and type scale
  to communicate craft.
- Introduce framework diagrams as explanatory artifacts with semantic text
  equivalents, not decorative tech imagery.
- Keep surfaces flat and purposeful. Avoid glass effects, heavy shadows, glowing
  gradients, abstract AI networks, stock dashboards, floating blobs, and ambient
  animation.
- Motion is optional and only supports state or diagram comprehension; the
  experience remains complete with reduced motion or no JavaScript.

### Software Signal accent

**Current Product Owner decision (#650):** Petrol Teal is the active platform
accent. It supersedes Signal Red, which was approved under #605/#624 by promoting
an existing site token into the shared identity. That historical rationale is
preserved here; production review later found red more urgent/assertive than the
intended calm, technical character.

| Role | Direction |
|---|---|
| Petrol Teal | `#1f5a5a`; selected emphasis, key rules/markers, primary platform links or controls where contrast passes. |
| Dark Petrol Teal | `#174646`; darker text/control, hover, and active state. |
| Petrol Teal Wash | `#f1f6f5`; sparse background or diagram emphasis, never a default card colour. |
| Neutral foundation | Existing white, near-black, grey text, pale surfaces, and borders remain dominant. |
| Learning | Inherits the neutral foundation and restrained Petrol Teal emphasis; status/action meaning remains explicit without colour. |

Do not assign different bright colours to Framework, Research, Consulting,
Learning, Writing, Systems, or Website Services. Hierarchy comes from structure,
not a rainbow taxonomy. All text/control combinations must meet applicable WCAG
contrast; colour never carries state or category alone.

## Composition and rhythm

### Desktop

- Use a bounded but asymmetric hero: proposition and actions carry more visual
  weight than a compact founder/platform endorsement.
- Alternate full-width editorial statements, split text/evidence compositions,
  the framework diagram, one dominant evidence item with supporting entries, and
  restrained modules. Do not repeat `heading → paragraph → three cards`.
- Allow one or two typography-led pauses with generous whitespace; density should
  rise around evidence and fall before major decisions.
- Keep content order identical to semantic order. Any visual offset must not
  create a contradictory reading sequence.

### Intermediate/tablet

- Collapse asymmetry before text measures or diagram labels become cramped.
- Prefer a strong single column plus occasional two-column modules over miniature
  desktop grids.
- Preserve CTA ranking and section relationships; do not hide important routes in
  hover-only behavior.

### Mobile

Reading order is contractual:

1. Software Signal + founder relationship
2. motto and proposition
3. Framework primary action
4. engineering tension
5. Framework explanation/map text
6. current research signal
7. Consulting, then Learning
8. Website Services adjacent boundary
9. Writing/Systems evidence
10. Weekly
11. founder proof
12. final intent choices

Diagrams must recompose into a readable linear sequence or labelled list. Avoid
horizontal scroll, miniature dense maps, reordered CSS grids, sticky sales CTAs,
or repeated subscription prompts. Touch actions remain comfortably sized and
labels remain explicit.

## Page-family implications

| Family | Target role and change | Preserve |
|---|---|---|
| Consulting | First-class engagement path. Connect offers to Framework/research thinking where truthful; lead with problem fit and evidence, not generic agency claims. | Existing offers, boundaries, pricing truth, contextual Contact handoff, analytics contract. |
| Learning | Capability-building practice within Software Signal, not the homepage's dominant identity. Global label becomes Learning while canonical `/training/` remains. | Course truth, readiness/pathway decision order, shared site palette, application/interest contracts. |
| Website Services | Professionally discoverable adjacent service, clearly endorsed by Suyog but outside the Framework spine. | Existing route, package truth, context handoff, analytics, scoped styling. |
| Writing | Evidence and explanation engine. Curate relationships to Framework and Research without converting every article into brand marketing. | Latest, paths, topic hubs, series, external-source distinctions, reading flow, feedback. |
| Systems | Practical proof and experiments. Surface relevant systems contextually from Framework/Research and keep maturity/status honest. | `/systems/`, demos, problem/approach/learning structure, limitations. |
| About | Explain founder ↔ platform relationship early, then selective relevant experience and principles/evidence. | Personal voice, selective credibility, existing identity graph and professional links. |
| Weekly | Recurring distribution/editorial channel with a persistent Subscribe action and one substantive homepage section. | Consent, double opt-in, privacy/provider disclosure, archive/fallback. |
| Contact | Intent-aware handoff for Consulting, Learning, Website Services, and general collaboration. | Current fields, validation, API/payload, privacy, accessible recovery. |
| Article detail | Retain reading-first experience; contextual Framework/Research relationships belong after or around—not inside—the reading flow. | Metadata, line length, diagrams, original-source credit, feedback position. |
| Course detail | Continue as an enrolment decision aid, with platform endorsement quiet relative to fit/status/action. | All commercial, availability, prerequisite, effort, project, and action truth. |
| Support | Remain a voluntary utility route supporting independent work, not a primary platform pillar or homepage sales block. | Approved equal provider treatment, boundaries, non-financial paths. |

## Design invariants

1. Within the first homepage viewport, visitors can name Software Signal's purpose,
   its relationship to Suyog, and one clear next step without interpreting a list
   of unrelated offerings.
2. Suyog remains the parent personal trust identity while Software Signal is the
   first-class professional/body-of-work brand; neither identity disappears or
   becomes subordinate to an anonymous corporate treatment at mobile.
3. The Reliable Engineering Framework is the first substantive intellectual
   artifact and remains useful before any Consulting or Learning action appears.
4. Consulting and Learning are clear primary engagement paths, while Website
   Services is visibly available but explicitly adjacent rather than forced into
   the Framework.
5. Writing and Systems read as evidence of thinking and practice, not as the site's
   business architecture or a uniform card catalogue.
6. Petrol Teal is the only site-wide brand accent, including restrained emphasis
   on Learning surfaces, and no workstream depends on colour alone.
7. The page varies composition through typography, framework/evidence structures,
   density, and whitespace without adopting generic AI/SaaS/agency aesthetics.
8. Desktop sophistication preserves a single coherent semantic and mobile reading
   order with no horizontal overflow, hidden essential content, or hover dependency.
9. Existing public routes, useful content, form/provider contracts, and truthful
   states remain preserved unless a traced later issue records an approved route or
   behavior disposition.
10. The resulting site demonstrates the clarity, accessibility, restraint, and
    engineering care promised by Website Services.

## Material intentional departures from #604

| #604 before state | Target change | Reason | Later owner |
|---|---|---|---|
| Header identity is `suyogjoshi.com`/SJ. | Preserve Suyog as site/trust identity while giving Software Signal first-class endorsed presence. | Make the relationship legible without creating an anonymous corporate parent. | #607 |
| Primary nav: Training, Writing, Systems, About, Contact. | Software Signal, Consulting, Learning, Website Services, Writing, About + Subscribe action. | Reflect visitor engagement needs while keeping Framework/Research beneath the Software Signal surface. | #607 |
| Hero leads with Suyog's training/writing proposition and Training CTA. | Hero leads with Suyog Joshi + Software Signal identity, motto, problem framing, and Framework direction. | Prevent training-first interpretation while preserving personal trust. | #608 |
| Learning pathway appears immediately after hero. | Framework and Research precede engagement paths; Learning becomes one primary path beside Consulting. | Establish intellectual spine before offer selection. | #608 |
| No public Framework route; one research detail lacks an index. | Add `/framework/` and `/research/`. | Provide canonical intellectual/evidence surfaces. | #608/#609 |
| Systems is primary navigation and a major homepage catalogue. | Systems remains preserved as contextual evidence and footer destination. | Evidence should support, not define, business architecture. | #607/#608 |
| Website Services is a secondary homepage link. | Make it top-level navigation and give it a deliberate adjacent-service module with explicit boundary. | Reflect its active professional-service role without distorting the Framework. | #607/#608 |
| Weekly appears mid/late page and in some navigation/footer contexts. | Make Subscribe a persistent header action and retain one substantive late-page section. | Support recurring audience growth without interruption. | #607/#608 |
| Founder credibility appears late. | Show endorsement in hero/header and concise proof before final CTA. | Establish trust earlier without résumé-first composition. | #607/#608 |
| Near-monochrome public system used red sparingly; Learning previously owned teal. | Signal Red was formalized across the site in #607/#624, then superseded by one shared Petrol Teal system in #650. | Preserve one recognizable identity while shifting its personality from urgent to calm and engineered. | #607/#624/#650 |

No #604 route is retired or redirected by this direction.

## Tech Lead / architecture feasibility

**Decision:** feasible within the existing static architecture; no framework,
dependency, CMS, font, client router, or backend change is required.

- Hand-authored HTML can implement the new `/framework/` and `/research/` index
  routes using existing metadata, sitemap, directory URL, GA4, and asset-depth
  conventions.
- The flat navigation model extends the current progressive menu without nested
  state. Shared header/footer updates should remain in existing HTML/CSS/JS patterns.
- Petrol Teal reuses the semantic aliases established by #607/#624; #650 changes
  their authoritative values rather than creating a second design system.
- Framework diagrams can use semantic HTML/CSS and accessible prose. Add raster or
  SVG media only if it communicates relationships more clearly and passes image
  performance/alternative-text review.
- Learning inherits the shared neutral and Petrol Teal tokens while its components
  remain route-scoped. Shared components must never make colour the only
  distinction between platform and Learning state.
- The homepage hierarchy is long but feasible if #608 curates each section and
  varies density. It must not duplicate full landing-page content.
- Existing Contact, newsletter, feedback, learner, payment, support, analytics,
  canonical, and structured-data contracts remain unchanged unless their owning
  issue explicitly authorizes a change.
- #606 should bind regression checks to the #604 interaction and route contracts
  before #607/#608 change shared navigation or homepage behavior.

### Alternatives rejected

- **Anonymous Software Signal corporate site:** loses the founder trust anchor and
  contradicts the domain/person identity.
- **Framework and Research as separate primary items:** reproduces internal
  architecture in scarce navigation space and displaces the active Website
  Services engagement path.
- **Every workstream in primary navigation:** produces a crowded catalogue and
  leaves no room for future Products or other validated evolution.
- **Nested mega-menu:** unnecessary interaction and maintenance complexity for a
  static editorial site.
- **Training → `/learning/` route rename:** label improvement does not justify URL
  churn; preserve `/training/`.
- **New blue/purple AI palette:** generic category styling and needless departure
  from the established red/neutral foundation.
- **A separate Learning accent:** creates an unnecessary second visual identity
  within the larger platform.
- **Illustration/animation-led hero:** adds spectacle before comprehension and
  risks generic AI/agency character.

## Gate A disposition and approval record

### Senior UX strategic review

- **Reviewed:** complete target, #604 desktop/mobile evidence, shared site
  direction, every affected page-family direction, navigation model, homepage
  sequence, Framework/Research relationship, visual/colour system, responsive
  order, and departures table.
- **Must fix:** none in the proposed direction.
- **Should fix:** none before Product Owner decision. During #608, actively
  control homepage length by keeping each section selective; the ten-part
  hierarchy is a narrative order, not permission for ten catalogue-sized blocks.
- **Optional:** #607 may test whether the compact founder endorsement reads more
  naturally as `By Suyog Joshi` or `Founded by Suyog Joshi`, provided the
  relationship remains equally clear.
- **What works / preserve:** the Suyog/Software Signal relationship is explicit;
  the Framework precedes commercial paths after identity/problem framing;
  Consulting, Learning, and Website Services are discoverable by visitor intent;
  Framework and Research remain strong beneath Software Signal; Writing and
  Systems remain evidence; the colour proposal grows from an existing token; and
  mobile has an explicit linear order rather than inheriting desktop layout.
- **Result:** approved; ready to govern implementation issues #607-#609.
- **Recommendation strength:** strongly recommended.
- **Broader recommendation:** none. A separate domain, anonymous corporate
  identity, or replatform would be strategically weaker and outside the epic.
- **Residual design risks:** final framework wording must not overstate maturity;
  the long homepage needs strict content curation; the header must prove at
  rendered widths that six labels plus Subscribe remain calm before collapsing;
  and the canonical eight-branch Framework needs a concise homepage treatment
  without being rewritten into a simpler but different model.

### Gate A status

- **Senior UX direction:** complete and Product Owner approved. No rendered
  implementation exists to receive Gate B-D acceptance.
- **Tech Lead feasibility:** accepted as written; no material technical trade-off
  remains open.
- **Implementation boundary:** #607-#609 may use this direction, but must retain
  their own implementation, rendered-review, and acceptance gates.
- **Product Owner dispositions recorded:**
  1. **Approved with nuance:** Suyog remains the parent personal trust identity;
     Software Signal is the primary professional/body-of-work brand.
  2. **Approved after revision:** Software Signal, Consulting, Learning, Website
     Services, Writing, About + Subscribe; Framework/Research sit beneath the
     Software Signal surface.
  3. **Approved:** identity/problem framing → Framework → Research/evidence →
     engagement paths, with Senior UX control of section weight and rhythm.
  4. **Historical decision, superseded by #650:** #624 made Signal Red
     (`#b91c1c`) the primary platform accent across the main website and Learning.
     The Product Owner later selected Petrol Teal (`#1f5a5a`) with dark
     `#174646` and wash `#f1f6f5` variants after production review.
  5. **Approved after revision:** withdraw the five-movement scaffold as the
     public Framework structure. Present the canonical North Star, eight branches,
     cross-cutting Security, Methods of Investigation, and evidence-feedback loop.
     Preserve the five movements only as an optional future application pathway.
  6. **Approved:** add `/framework/` and `/research/` while preserving all #604
     routes unless a separately approved disposition changes one.

### Product Owner approval provenance

- **Approver:** Suyog Joshi, Product Owner
- **Date:** 2026-08-27
- **Record:** [issue #605 approval comment](https://github.com/suyog19/suyog19.github.io/issues/605#issuecomment-5433352779)
- **Accepted direction:** all six dispositions above, including withdrawal of the
  five-movement scaffold as canonical architecture and adoption of the faithful
  eight-branch Framework presentation.
- **Accepted deviation:** none.
