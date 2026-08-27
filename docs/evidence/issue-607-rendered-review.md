# Issue 607 rendered evidence and Senior UX review

## Evidence method

- Local feature-branch render: `http://127.0.0.1:8080`
- Capture tool: Playwright Chromium, deterministic 1440×900 and 390×844
  viewports, device scale 1, animations disabled
- Reproduction: `node scripts/capture_issue_607_evidence.js` while serving the
  repository on port 8080
- BEFORE comparison: `docs/evidence/issue-604/screenshots/`
- AFTER captures: `docs/evidence/issue-607/screenshots/`

The full-page home capture proves page-shell and footer continuity. Focus and
mobile state behaviour are asserted functionally by the #606 Playwright suite;
screenshots support design judgment rather than replacing those checks.

## Iteration 1

Reviewed Home desktop/mobile default, Home mobile menu open, full-page shell and
footer, Framework desktop, and Research mobile against the #604 evidence and
approved #605 direction.

### Must fix

- The Framework shell exposed internal delivery-phase language on a public route.
  It needed to state canonical Framework truth without presenting an incomplete
  release plan as visitor content.

### Should fix

- Bound mobile-menu height and lock background scrolling while open so the longer
  approved navigation remains stable on short screens.
- Ensure new shared CSS cannot be served behind cached pre-#607 styles; mixed old
  CSS/new HTML made brand and primary-action foregrounds appear without their red
  surfaces during the first browser inspection.

### Optional

- Substantive Framework diagram and Research investigation hierarchy remain
  intentionally deferred to #608/#609.

### What works / preserve

- Software Signal is first-class while “by Suyog Joshi” remains visible in both
  closed desktop and mobile headers.
- The desktop navigation remains restrained at 1440px and moves to a deliberate
  vertical menu before labels wrap.
- Signal Red creates a recognizable thread through the mark, current state,
  primary actions, focus, and small editorial rule without colouring sections.
- Framework and Research already demonstrate distinct editorial and index
  openings rather than one universal hero.
- The dark footer closes the page clearly and provides concise platform,
  engagement, evidence, utility, and founder discovery.

Result: another iteration required.

## Iteration 2

Compared with iteration 1 at the same viewports and states.

### Resolutions

- Framework copy now names the approved North Star, eight branches, cross-cutting
  Security, Methods of Investigation, and evidence-feedback loop.
- Mobile navigation has bounded overflow and background scroll lock; the visible
  dual-identity lockup, menu order, and underlying reading position are preserved.
- Public shared styles use the `v=607` cache key across every migrated shell.
- My Learning remains reachable inside the scoped Software Signal Learning
  sub-navigation without adding an eighth competing primary destination.

### Must fix

- None.

### Should fix

- None in #607 scope.

### Optional

- Homepage and supporting page openings still expose their existing content and
  composition. Their strategic hierarchy/content migration belongs to #608/#609.

### What works / preserve

- All iteration 1 strengths above remain.
- The two new opening exemplars are visibly related through type, measure, rules,
  and spacing while retaining different composition and density.
- Existing Learning teal remains scoped; the shared shell does not introduce a
  second workstream palette.

### UX acceptance

**UX accepted — strongly recommended within the approved #607 boundary.** The
shared foundation is visibly more professional, editorial, and engineered; it
does not obscure Suyog, force one hero pattern, or introduce generic SaaS/AI
decoration. No unresolved Must-fix or Should-fix finding remains.

Broader recommendation: proceed through #608 and #609 as planned rather than
quietly restructuring existing page content in this issue.

## Accessibility-oriented rendered findings

- Primary and footer navigation use semantic `nav` labels and one `aria-current`
  state where applicable.
- Mobile toggle exposes `aria-expanded`/`aria-controls`; Escape closes and restores
  focus; outside activation and resize close safely.
- Touch navigation items have a minimum 44px height at the mobile breakpoint.
- Global focus uses a visible 3px Signal Red outline and does not rely on colour
  alone for current state (weight and underline are also present).
- Calculated contrast ratios: Signal Red/white 6.47:1, dark Signal Red/white
  8.31:1, muted text/white 6.10:1, footer muted text/dark surface 7.48:1.
- DOM order matches the visual desktop/mobile order; no horizontal overflow was
  observed in the evidence matrix.

