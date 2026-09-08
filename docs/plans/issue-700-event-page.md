# Issue 700 — canonical micro-session page

Parent: #699. Scope ends at the public page; #701 owns Luma integration,
#702 owns discovery surfaces, and #703 owns the operational release gate.

## Gate A: UX brief and architecture

UX brief required: this is a new public decision surface. Audience: students,
aspiring engineers and working engineers/leaders deciding whether to attend.
Follow `docs/ux/site-ux-direction.md`, Training and course-detail directions,
and the existing Learning visual system. Whole-page Training/course patterns
and shared header/footer were inspected before implementation.

Strongly recommended in-scope approach: a concise editorial page, native Learning
tokens, no decorative hero or sticky action. Desktop uses a bounded reading
column; mobile preserves title, date, status and action order. The role list
explains distinctions without attempting to reproduce the talk. No broader
redesign is needed; discovery remains explicitly deferred to #702.

Invariants:
1. Free/live, title, date/time, online format and current action/status are together.
2. Five full role names and practical tools remain readily scannable.
3. Neutral surfaces and restrained teal match Learning; no new visual language.
4. Narrow screens retain readable content, visible focus and thumb-sized actions.
5. All essential facts and lifecycle messaging work without JavaScript.
6. Unavailable registration is honest text, never a dead or disabled button.

Architecture: one JSON event definition generates committed static HTML using a
small standard-library Python script and a template. This follows the existing
generated sitemap/discovery pattern, adds no runtime dependency or deployment
build, and lets future discovery consume the same definition. A freshness check
runs in the existing public SEO validation. Dates, title, host, audience, roles,
tools, lifecycle and registration URL live in that definition. Date labels derive
from timezone-aware timestamps. No client fetch is needed to show the page.

Lifecycle and registration are separate: upcoming with a null registration URL
shows “Registration opens soon”. With an approved HTTPS URL it renders native
“Register Free” anchors at primary/final positions, including without JavaScript.
Closed/completed states remove registration links; completed may show a real
resource link only when supplied. This necessary pre-integration state respects
the explicit prohibition on inventing a destination; #701 enables registration.
No countdown, provider embed, private join URL, form or attendee data is added.

Event schema uses public facts and the canonical page as its virtual location.
It does not claim a schema.org Completed status (no such EventStatusType exists).
No Offer is emitted before an actual registration destination exists.
GA4 uses the existing measurement ID. Page-specific events contain only slug,
lifecycle and CTA location; no query values, identity or destination are sent.
Campaign forwarding is deferred to #701's provider/privacy validation rather
than forwarding arbitrary visitor-controlled query strings now.

The process manifest now declares the already-enforced native workspace sandbox:
evaluation previously failed because that declaration was absent. No control is
removed or relaxed. Final evidence binds the actual base/head and process revision.

## Maintenance and #701 handoff

Edit `data/training-events.json`, run `python scripts/generate_training_events.py`,
then `python scripts/generate_sitemap.py` and `python scripts/validate_public_seo.py`.
Do not edit the generated event HTML. Future homepage/Training integrations must
consume the same data, not independently copy facts. Explicit lifecycle changes
are editorial releases, not browser-clock transitions.

#701 must supply the approved final registration URL, decide normal link versus
accessible provider overlay, and validate attribution/consent and close timing.
No Luma event is created here. Production promotion remains human-controlled and
subject to #703. Existing Training still says no session is scheduled; #702 owns
that planned discovery update before release.

## Gates B–D and validation

Iteration 1 rendered at 320, 390, 768 and 1440px. Must fix: native list markers
duplicated the custom role numbers. Removed the duplicate marker and re-rendered.
Preserved the first-screen facts/action grouping, quiet host line, restrained
section borders and scannable role descriptions. No remaining visual Must fixes.
Iteration 2 includes the configured upcoming CTA, registration-closed and completed
at 390×844 without JavaScript, plus the pending state at all four widths.
The configured primary action is at least 48px high and fits the first 390px screen.
Full-page evidence is in the local ignored `test-results/700-*.png` captures.
The browser suite reproduces those captures; routine screenshots are not committed.

Senior UX implementation review: UX accepted, strongly recommended within #700.
Final independent review remains a separate required gate. No subjective decision
or wider redesign is needed. Testing uses a reserved example-domain destination
only; the checked-in registration URL remains null.

Validation: public SEO's 14 contracts, 28 focused/regression Python tests, 467 Node
tests, and all 21 Playwright browser tests passed. Browser coverage includes four
widths, overflow, semantic heading/date, skip-link focus, CTA focus/size, no-JS
lifecycle, real keyboard click events and analytics location payloads. Existing
site journeys remain covered by the full browser suite. No live registration or
operational Luma test is part of #700. Initial sandbox-only subprocess/temp-file
failures were rerun with approved access; a Windows fixture encoding failure was
fixed by explicit UTF-8 input. The route-count regression was updated by one and
now explicitly asserts the event route retains the public shell.

Rollback: revert the implementation PR in dev. No data migration or external
configuration rollback is necessary.
