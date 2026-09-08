# Issue 701 — Luma registration

Parent #699; builds on #700 / PR #704. No #702 discovery or #703 release work.

## Gate A: intent and implementation

UX brief required: the existing event page now hands visitors to registration.
Audience: students and working engineers deciding to attend the free session.
Preserve the complete #700 editorial page, shared site shell, Learning tokens,
title/date/action order and static lifecycle. Context: site UX direction,
Training page direction and the #700 brief. No broader redesign is needed.

Primary action: Register Free; secondary explanation: registration is handled
by Luma. Keep event facts on the canonical suyogjoshi.com route. A same-tab
native link preserves keyboard, browser Back and no-JavaScript operation.
Luma owns the form, confirmation, calendar, reminders and guest operations.
No registration payload or completion event is copied into website analytics.

The preferred provider button was assessed against Luma's current documentation:
https://help.luma.com/p/embed-luma-on-your-website
It automatically forwards ad identifiers and emits registration purchase events
to the host GA4 tag, including free orders. Use the issue's native-link fallback
to preserve the specified analytics/privacy boundary and reliable no-JS access.
This is an integration suitability decision, not a claim of a tested overlay defect.

Invariants:
1. Free/live, exact title/date/time and the primary action remain grouped.
2. Both actions clearly identify Luma as the next step and work by keyboard.
3. At 360/390px, actions are thumb-friendly and content does not overflow.
4. Closed/completed states contain truthful text and no registration action.
5. Event identity and lifecycle work without JavaScript; canonical/share URLs
   remain on suyogjoshi.com.
6. Only bounded campaign labels cross to Luma; guest data never enters GA4.

Tech Lead: reuse the existing Python generator, native links and scoped script.
No framework, third-party script, iframe, custom form or backend is needed.
Campaign forwarding is progressive: standard UTM labels only, bounded to slug
characters, with a source alias for untagged `source` links. Unknown parameters,
email, tokens, fragments and advertising IDs are excluded. Analytics source is
a fixed category, not arbitrary query text. Luma's documented source attribution:
https://help.luma.com/p/event-insights

## Lifecycle maintenance

The provider enforces the ticket closing time. The static site's lifecycle is
still an editorial release: set `registration-closed` at closing, and `completed`
after the session, then regenerate. No visitor-clock status or countdown.
Edit shared event data, run `python scripts/generate_training_events.py`, then
`python scripts/generate_sitemap.py --check` and public SEO validation.

## Provider operations and evidence

Verified on 8 September 2026 against the supplied real event URL:

- Exact title, 19 September 11:00–11:30 AM IST, free ticket and Private Event.
- Name/email, required learner-profile and full-role-name questions, optional
  session question and required event-administration terms were already present.
- Added required single-select experience-band (all six issue choices) and
  technology-interest (all nine issue choices) questions in Luma.
- Changed the free ticket's sales end from 11:00 to 10:55 AM IST; verified both
  saved ticket settings and anonymous public closing-time text.
- Consent text explicitly covers session confirmation, calendar/joining details,
  reminders and session-related follow-up. No newsletter consent is collected
  by this integration; contact use is limited to administering this event.
- Registration settings state that confirmation includes a calendar invite.
  Automatic reminders are enabled for 18 September 11:00 AM and
  19 September 10:00 AM. No email/blast was sent by this work.
- Guest management is available, with zero guests and a Download as CSV control.
  No guest list was exported and no completed-registration/export-row evidence
  is claimed. The separate feasibility dry run is recorded in the issue.
- Anonymous Chromium sessions at 360x844 and 390x844 followed the website CTA
  to the correct event, retained `utm_source=linkedin` and the campaign label,
  and opened registration without a Luma login. All five custom questions and
  the consent control were present; the technology options and full consent
  text were reachable. Neither page overflowed horizontally.

The supported embed preview was also inspected. Its outer close button lacked
an accessible name in the accessibility tree. Together with the automatic
analytics forwarding documented above, this supports the native-link fallback.
The native Luma page still uses Luma's own form dialog; this work adds no wrapper.

No attendee registration was submitted, no personal data entered, and no terms
accepted. Therefore actual registration persistence, confirmation delivery and
CSV attribution/answer fields for this real event remain unverified. Browser
mobile emulation was used; no physical mobile device or screen reader was available.
Meet-link attachment/privacy and reminder delivery when due remain #703 work;
this implementation does not start that issue or certify its release gate.

## Rendered review and validation

UX implementation review: accepted within the native-link fallback constraints.
The existing title/date/action grouping, teal buttons and reading rhythm remain
intact. Both actions have a visible provider/consent note and semantic closing time.
Full-page captures at 320, 360, 390, 768 and 1440px show no overflow. Primary/final
actions remain at least 48px high; the primary fits the first 390x844 screen.
Keyboard focus, skip-link navigation, accessible descriptions and no-JS lifecycle
were verified. No website UX Must fixes remain. Native link is the recommended
in-scope outcome; provider registration remains visually owned by Luma.

Validation before final independent review:

- Public SEO: 15 contracts including generated event freshness and event tests.
- Python: 30 tests across event, inventory and existing Training contracts.
- Node: 467 tests; no failures or skipped tests.
- Playwright: all 25 tests, including responsive, lifecycle, keyboard, campaign
  filtering, CTA view/click analytics and native navigation/referrer tests.
- Live anonymous Luma handoff/form inspection at 360/390px as described above.
- Canonical, Open Graph, Event identity and sitemap remain on suyogjoshi.com;
  only the schema Offer and registration links use the external provider.
- `git diff --check` and repository scan for raw meeting URLs pass.

Local evidence: ignored `.engineering/evidence/701/{seo,node,python,browser,live-luma}.log`,
`test-results/701-event-*.png`, lifecycle captures `test-results/700-*-390.png`,
and `.engineering/evidence/701/luma-*.png`. Screenshots contain no guest records.
An initial fixture omitted the newly introduced closing-date update; corrected.
The local full-suite web-server startup timed out; rerun against an explicit
loopback server passed after removing an existing hardcoded fixture port.

Process 1.4.1 at `9f023d4bfd11552b17175698892efe6d9402e4f8`: the pinned CLI was
found in the adjacent process repository. Preliminary classification is Standard;
evaluation still fails with `Standard execution requires a declared native sandbox`.
The effective current task environment is unrestricted and is not asserted to
provide native sandbox enforcement. No process configuration, workflow or trust
declaration is changed. #705's authenticated evidence gap remains unresolved.
Final exact-SHA classification, CI and fresh independent review are recorded in
the PR; local logs are not authenticated v2 evidence. Do not merge this PR here.

Rollback: revert the website PR to restore pending registration. Provider changes
are separate: added two required questions and moved ticket closing from 11:00
to 10:55 AM IST on 19 September; do not erase responses if registrations exist.
