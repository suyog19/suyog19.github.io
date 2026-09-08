# Issue 702 — event discovery

Parent #699; both issues and their comments read in full before implementation.
Builds on #700/#701. Scope is the homepage and Training discovery journey only.
No provider operations, promotion, posters or #703 release testing.

## Gate A: UX brief

UX brief required: new discovery surfaces on two existing entry points.
Visitor goal: notice a relevant free session, understand who it is for, and
reach the canonical website explanation before choosing Luma registration.
Context: `docs/ux/site-ux-direction.md`, Home/Training page-family directions,
existing whole-page composition, shared header/footer, #700 and #701 briefs.

Best in-scope recommendation: a quiet strip between the homepage header and
hero; one bordered Learning feature after its introduction. Preserve hero copy,
navigation, course pathway, existing focus/colour tokens and all course flows.
No imagery or sticky CTA. The full title belongs on Training; the homepage uses
the title before its em-dash subtitle, derived rather than stored independently.
The event audience is the existing shared full audience, including students.
The focused-learning empty state becomes evergreen interest-gathering copy,
and the generic micro-session duration accommodates this 30-minute session.

Invariants:
1. The homepage hero remains the largest type and primary positioning; the strip
   is a compact secondary notice, with its whole short title readable on mobile.
2. Training introduction precedes the card, followed by the existing journey.
3. Free/status, title, date/time, online format, audience and action scan together.
4. Links are native, keyboard-visible and at least 48px high; no mobile collision,
   horizontal overflow, new sticky elements or ARIA-live promotional announcements.
5. Both links lead to the canonical website event route, carrying a fixed
   homepage/Training source and CTA location through the existing UTM handoff.
6. Closed discovery has no registration promise; completed promotion disappears.

Tech Lead: extend the existing standard-library event generator with bounded
HTML slots. Facts and URL derive from `data/training-events.json`; no client fetch
or deployment build. Reuse shared palette/buttons through a scoped stylesheet;
do not load Learning-only styles on the homepage. A small synchronous head script
reads generated lifecycle metadata before body layout, preventing a late banner
insertion/removal on page load. No independent event facts in handwritten pages.

## Lifecycle contract

The shared editorial status remains authoritative: completed generates no
homepage strip or Training feature; registration-closed generates truthful
closed labels and View session links. Upcoming without a configured registration
URL links to details without promising registration. Canonical content remains
accessible at its existing route in all states.

As an extra stale-promotion guard, a pre-layout browser check advances discovery
to registration-closed at the shared closing timestamp and completed at the shared
end timestamp. It never reopens an editorially closed/completed session. On a
long-open page, refresh the guard on focus/visibility and at the next boundary.
No countdown or live announcements. Without JavaScript, static generated content
and links remain useful; the owner must still publish editorial lifecycle changes
for no-JS clients and the canonical event page. No hosting/workflow change here.

## Validation and review

Implementation UX review: **UX accepted, strongly recommended in scope**. Whole
homepage and Training renders preserve their existing sequence and primary hero.
The mobile announcement takes approximately 122px at 390px width, with untruncated
short title, date and a native action. The Training feature retains a clear full
title, compact facts, inclusive audience and a thumb-sized action. No poster or
competing sticky action was introduced. No UX Must fixes remain.

Rendered iterations: first slice verified all states and widths; final polish
uses the existing surface colour token and a scroll margin for the featured
section. Review capture positioning now accounts for the existing sticky header,
so the card label/title can be inspected without an overlay from that header.
Both page heroes, shared headers and footers were also compared byte-for-byte
with the dev base and are unchanged. The only existing Training content edits
are its contradictory empty-state copy and 10–30-minute generic format range.

Validation on 8 September 2026:

- `python scripts/generate_training_events.py` generates canonical detail plus
  the two bounded discovery slots and their lifecycle metadata. `--check` passes.
- Public discovery/feed/search generator and sitemap `--check` pass with no
  derived changes required outside the event surfaces; sitemap still has 71 pages.
- `python scripts/validate_public_seo.py`: all 15 focused contracts pass, including
  canonical/local links, shared facts/freshness, structured data, public discovery,
  Training schema/consistency/commercials, images and public-route safety.
- Python: 33 event/inventory/Training tests pass, including 10 event tests.
- Node: all 467 tests pass, including existing pathway, navigation and flow tests.
- Playwright: all 49 tests pass. Discovery matrix: 320/360/390/768/1440px on both
  pages; no-JS upcoming/closed/completed; pending registration; mobile menu/focus;
  fixed-location impression/click and website-to-canonical-to-Luma attribution;
  exact closing/end boundaries and focused long-open expiry. Existing site and
  canonical-event browser regressions also pass.
- Independent review found that Training expiry could move keyboard focus above
  the viewport. The fix removes the expired layout before positioning the focused
  heading below the sticky header, without smooth scrolling. Expiry tests now
  assert the entire focused heading stays visible on both pages at 390/1440px.
- Semantic links, one H1, appropriate Training H2, visible keyboard focus,
  minimum 48px action height, no horizontal overflow and no promotional live
  regions checked. Native mobile emulation was used, not a physical device or
  screen-reader certification. No live GA4 delivery claim.
- `git diff --check` and full tracked-file scan for raw meeting URLs pass.

Local ignored evidence: `.engineering/evidence/702/{seo,node,python,browser}.log`;
`test-results/702-{homepage,training}-*.png`, with first-screen/card captures and
full-page/state views. Browser fixtures derive from the real generator and freeze
the clock where needed; no repository files are rewritten by browser scenarios.
The first concurrent SEO/browser run saw a temporary trace HTML file as a public
page. Sequential validation after browser artifact cleanup passed; no validator
or production rule was weakened to hide the transient failure.

Process 1.4.1 / `9f023d4bfd11552b17175698892efe6d9402e4f8`: preliminary Standard
classification; evaluation still reports `Standard execution requires a declared
native sandbox`. #705's authenticated readiness gap remains unresolved. This PR
does not change process declarations, workflow trust, branch protection or hosting.
Exact-head classification, final fresh-context independent review and CI results
are recorded on the PR. Local review/logs do not assert authenticated v2 evidence.
The PR remains unmerged; #703 is not started.

Rollback: revert this PR; event detail and Luma settings remain intact.
