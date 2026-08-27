# Issue 608 rendered evidence and Senior UX review

## Evidence method

- BEFORE: `docs/evidence/issue-604/screenshots/604-i1-home-*`
- AFTER: `docs/evidence/issue-608/screenshots/i2/`
- Capture: Playwright Chromium, device scale 1, animations disabled, at
  1440×900, 1024×768, and 390×844; default and full-page states
- Captured implementation revision: `b7648976d0f5262fbd5758eb01df6671996d2a0b`
- Baseline revision: `0528e18856701a8298ba6fde802356860f831cf7`
- Process revision: `fa26e629787fbab681b389f02a9f9a6e28d8481a`
- Reproduce: serve on port 8080, then set `ISSUE_608_ITERATION=i2` and
  `ISSUE_608_EVIDENCE_ROOT=docs/evidence/issue-608/screenshots` before running
  `node scripts/capture_issue_608_evidence.js`.

The final delivery revision is an evidence-only successor to the captured
implementation. `issue-608-delivery.json` binds the exact revisions, rendered
evidence, validation, route integrity, and intentional interaction change.

## BEFORE / AFTER comparison

### First impression and brand

The #604 homepage opened as Suyog's personal training/writing/systems hub and led
with training. The accepted #608 opening names Software Signal and Suyog together,
states the reliability problem in one paragraph, uses `Move fast. Engineer
reliably.`, and leads to the Framework. The lockup and founder endorsement keep
the site personal and accountable rather than corporate.

### Hierarchy and visual quality

The old page moved directly from a generic hero to course inventory and repeated
large grids. The new page establishes the problem before presenting the canonical
Framework, Research, engagement paths, adjacent Website Services, curated evidence,
Weekly, founder trust, and an intent-based conclusion. Alternating editorial
fields, one semantic diagram, paired service composition, and a single evidence
feature create rhythm without decorative imagery or a component-catalogue feel.

### Mobile

The 390px opening keeps identity, proposition, and both main actions ahead of the
editorial note. The Framework changes from a two-column field to a numbered
sequence; Security and the investigation loop remain explicit rather than becoming
an unreadable scaled diagram. Commercial, evidence, Weekly, founder, and final
actions retain the approved semantic reading order with no horizontal overflow.

## Iteration 1

Reviewed default and full-page Home at 1440×900, 1024×768, and 390×844.

### Must fix

- The dark tension, evidence feature, and final intent section used an undefined
  surface token, leaving white text/background relationships invalid and making
  important content visually disappear.

### Should fix

- The desktop proposition wrapped `Engineer reliably.` across two lines despite
  sufficient width, weakening the intended editorial statement.
- Bound deterministic capture time independently of the third-party newsletter
  form so evidence creation does not depend on network-idle behavior.

### What works / preserve

- Strong Software Signal/Suyog relationship and immediate proposition.
- Canonical eight-branch Framework with genuinely different mobile composition.
- Research appears before commercial paths; Website Services is clearly adjacent.
- Restrained palette, meaningful rules, asymmetric evidence, and no filler media.

Result: another iteration required.

## Iteration 2

Compared at the same six viewport/state combinations.

### Resolutions

- All intended dark editorial fields use the accepted shared text surface and
  now expose their content with strong contrast.
- The desktop proposition holds `Engineer reliably.` as one decisive line while
  retaining an effective two-line mobile treatment.
- Capture waits for semantic content plus a bounded delay, not third-party idle.
- Fresh review found and the final render restores the exact canonical branch name
  `Architecture of AI-Assisted & Agentic Engineering Systems`.

### Must fix

- None.

### Should fix

- None within #608 scope.

### Optional / deferred

- Supporting pages have not yet adopted this level of content composition; that
  is the explicit #609 migration rather than a reason to broaden #608.
- A future social-preview refresh could reflect the new proposition, but the
  existing registered image remains accurate and contract-safe.

### What works / preserve

- The full page reads as one professional editorial experience and reaches an
  intent-based conclusion rather than fading into legacy fragments.
- Consulting is materially prominent, Learning remains primary but no longer
  defines the platform, and Website Services retains a credible separate boundary.
- Writing/Systems are curated proof; Weekly and founder trust are calm supporting
  moments rather than competing hero sections.

### UX acceptance

**UX accepted — strongly recommended within the approved #608 direction.** The
result is quietly premium, editorial, and engineered; it remains recognizably
Suyog's professional home and does not materially introduce an unapproved brand
personality. The Framework presentation preserves canonical meaning. No Product
Owner taste or Framework decision remains before merge.

## Accessibility-oriented findings

- One H1 and a sequential H2 section hierarchy describe the page structure.
- The Framework is an ordered semantic list with complete text; no meaning relies
  on layout or Signal Red alone.
- Visual and DOM order match at all widths. Actions retain visible focus and
  minimum touch sizing through the accepted #607 foundation.
- Dark surfaces use white or muted-white text; Signal Red is reserved for labels,
  hierarchy, actions, and the Security band rather than body text on dark surfaces.
