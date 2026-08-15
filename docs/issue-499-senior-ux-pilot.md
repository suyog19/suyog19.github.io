# Issue #499 Senior UX pilot: homepage #492

## Decision and scope

- Pilot surface: homepage implementation merged to `dev` by PR #498 for #492.
- UX review required: yes. #492 is a material visual refresh affecting layout,
  hierarchy, discovery, responsive composition, media, and public actions.
- Roles in this pilot are kept as explicit passes even when Codex performs more
  than one role.
- Evidence: rendered branch-preview review at 1440px and 390px, followed by a
  revised rendering and focused automated checks.

## Gate B: implementation-ready direction and feasibility

### User outcome

A first-time visitor should understand that the site connects technical
training, practical writing, and working systems; see a clear next action; and
discover a curated current item without first traversing repeated catalogue
sections.

### Hierarchy and composition

1. The hero establishes the subject and two principal actions.
2. `Featured now` is the dominant discovery region: one lead article plus three
   supporting items.
3. Training, Writing, and Systems entry points remain obvious but quieter.
4. The reading path, systems, about, and contact sections progressively calm the
   page rather than competing with the discovery region.

Desktop uses a split hero and asymmetric feature grid. Tablet may place the lead
feature above three supporting cards. Mobile keeps headline and actions before
the abstract system visual, then uses a single reading order without a
carousel.

### Components, states, and invariants

- Reuse existing serif/sans typography, buttons, neutral surfaces, deep-teal
  Training accent, runtime course-action contract, and article cover assets.
- Course availability stays backend-authoritative and fail-closed. Loading and
  unavailable states must remain comprehensible without inventing availability.
- The hero visual is explanatory abstract systems imagery, never a portrait or
  stock-person image.
- The lead feature must feel dominant without becoming a stretched standard card
  or leaving a large empty body.
- Supporting cards must remain readable rather than becoming a cramped sidebar.
- On mobile, title and actions precede the visual and `Featured now` should not
  be delayed by an unnecessarily tall decorative panel.
- Focus remains visible on image-backed and text links; DOM order stays logical;
  no horizontal overflow is acceptable.

### Team Lead feasibility disposition

The direction fits the existing static HTML/CSS/vanilla-JS architecture. The
pilot reuses current markup, tokens, assets, runtime course actions, and
homepage-scoped selectors. No framework, dependency, font, backend endpoint, or
second design system is needed. The safe correction is CSS-only: rebalance the
desktop columns, arrange the supporting group as one full-width article plus two
course cards, prevent lead-card stretching, and reduce the mobile artwork
height. This keeps the #492 content and runtime contracts intact.

## Gate C: baseline rendered review

### Must fix

1. At 1440px the lead card stretches to the combined height of three stacked
   supporting cards, creating a large dead white region below its content. This
   contradicts the immersive-lead invariant and makes the dominant card feel
   like a stretched standard card.
2. At 390px the hero occupies roughly 1083px and places `Featured now` around
   1148px from the top. The system visual is useful, but its mobile height and
   surrounding gap delay the primary discovery section more than its importance
   warrants.

### Should fix

1. Give supporting content more horizontal room so course titles and state/action
   areas do not read as a narrow utility sidebar.
2. Keep the two course cards visually related as a pair under the supporting
   article, reducing the desktop feature region's vertical length.

### Optional

- Further illustration polish and card-specific micro-adjustments may be
  revisited by the companion entrance-page work, but must not create another
  visual system or block this focused correction.

## Intermediate revision

The first revision:

- changes the desktop feature split from `1.35/0.65` to a near-balanced
  `1.05/0.95` that still gives the lead a slight advantage;
- makes the supporting region a two-column grid with the supporting article
  spanning both columns and the course cards paired below it;
- uses `align-items: start` so the lead card owns its natural height;
- reduces the sub-480px hero artwork from 17rem to 13rem and tightens hero
  padding/gap.

Final rendered review and acceptance are recorded below after validation.

## Gate D: final disposition

### Final rendered review

- At 1440px the lead card now keeps its natural 659px height instead of
  stretching to the 916px supporting group. Its content ends deliberately;
  there is no empty card body. The supporting article spans a readable row and
  the two 239px course cards form a clear pair below it.
- The complete `Featured now` section is about 1272px tall, down from the
  1845px baseline (roughly 31% shorter), without removing content or actions.
- At 390px the hero is about 971px and `Featured now` starts around 1036px,
  bringing discovery 112px earlier than the baseline. The headline and both
  hero actions still precede the compact system visual.
- Browser geometry at 1440, 1280, 1024, 768, 720 (the 200% zoom layout
  equivalent), 430, 390, and 360px showed `scrollWidth === clientWidth`; no
  horizontal overflow was introduced.
- Desktop and mobile screenshots were reviewed after the second iteration.
  The supporting cards retain readable content hierarchy, the lower page
  remains calmer, and course availability remains visibly fail-closed on the
  local unknown host.

### Findings disposition

- Must fix 1 (stretched lead/dead card body): resolved.
- Must fix 2 (mobile artwork delaying discovery): resolved.
- Should fix 1 (cramped supporting column): resolved by the near-balanced split.
- Should fix 2 (course-card relationship and feature length): resolved by the
  paired course row.
- Optional illustration polish: non-blocking follow-up territory for the
  companion entrance-page issues; it is not required for this pilot.
- Accepted deviations: none.

### Validation

- 325/325 Node tests passed.
- 10/10 Python training consistency and delivery-profile tests passed.
- `git diff --check` passed.
- Existing focus, DOM-order, media, analytics, SEO, and backend-authoritative
  Training contracts were not changed by the CSS-only pilot correction.

### Senior UX acceptance

The initial `Accepted` disposition was withdrawn after Product Owner review on
the real `dev.suyogjoshi.com` surface. The first correction improved geometry
but did not materially improve the page's visual character: the hero remained a
conventional text/diagram split, the diagram felt generic, and the page still
read as a cautious rearrangement rather than the approved editorial Option 2
direction. Passing structural and responsive checks was not sufficient evidence
of UX quality.

### Reopened Must-fix findings

1. Replace the generic CSS system diagram with meaningful, purpose-built
   architectural media that gives the hero depth and a memorable point of view.
2. Make the headline, media, surface, and spatial rhythm read as one editorial
   composition rather than two unrelated columns on a white page.
3. Give `Featured now` a clearly distinct visual register from the lower card
   grids while preserving the authoritative Training state contract.

### Corrective iteration

- A purpose-built architectural systems image now serves as the hero's LCP
  candidate. It uses layered physical structures and a single signal path to
  express boundaries, context, and orchestration without stock people, AI
  clichés, labels, or decorative-only imagery.
- The hero now uses an off-white editorial field, a stronger display scale,
  asymmetric near-full-width composition, a fine warm accent, tactile image
  offset, and an explicit study caption.
- `Featured now` uses a warmer section field and a dark editorial body for the
  lead feature, creating a deliberate transition from hero to discovery while
  leaving the lower homepage calm.
- The image is a 1536x1024 WebP (about 186 KB) with intrinsic dimensions,
  meaningful alt text, and high fetch priority because it is now the intended
  LCP media.

Final acceptance for this corrective iteration must be based on the deployed
`dev` rendering and Product Owner feedback; it is not self-approved from local
geometry alone.

## Pilot process retrospective

- Worked well: writing invariants before editing made the dead-space defect
  objectively reviewable; explicit Must-fix/Should-fix/Optional categories kept
  the second iteration focused; numeric geometry supported the visual review.
- Initially unclear: the original workflow did not say where to record UX
  status. The PR template added by #499 provides one lightweight, durable place.
- No further process adjustment is needed after the pilot. The canonical
  contract and template are sufficient for the next entrance-page issues.
- #493-#497 should use this accepted homepage composition and visual language,
  not the pre-pilot PR #498 rendering, as their starting reference.
