# Issue 703: event launch readiness

Read #699 and #703, including all comments, on 8 September 2026. Validation base:
`dbaba6851ae4c019d6b472bf4d93dfadcfb32a9f` on dev, containing #700/#701/#702.
Final exact target, CI and independent review are recorded on the PR.

**Release verdict: HOLD. Do not promote or publish promotional assets.**
Website evidence and provider configuration do not establish a completed real-event
attendee dry run. The prototype evidence in #703 is explicitly insufficient.

## Scope and UX

No new functionality, production promotion, provider changes or architecture change.
UX brief not required: this change adds validation coverage and operational evidence.
Preserve the accepted homepage, Learning and event compositions from #700–#702.
Test the complete journey, truthful status, visible native actions, shared facts,
keyboard focus, contrast and existing pathways at the exact required viewports.

## Website evidence

The shared definition and generated page display the full approved title, Saturday
19 September 2026, 11:00–11:30 AM IST (UTC+05:30 / Asia/Kolkata), a 30-minute
free live online micro-session, and Upcoming status. Both detail actions target
`https://luma.com/pg34dnol`. Homepage and Training discovery lead to
`https://suyogjoshi.com/training/events/ai-engineering-roles-2026/` using native
same-site routes and fixed source/CTA attribution. Luma remains the provider.

- Event generator regenerated all three surfaces without a product diff; event,
  public-discovery and sitemap freshness checks pass (71 indexable pages).
- Public SEO: all 15 contracts pass, including canonical/local links, fragments,
  metadata, schema, routes, sitemap and event freshness.
- Python: 33 tests pass. Node: 467 tests pass, no skips.
- Chromium: all 64 tests pass with no retries or skips, including the 15 new
  release-matrix cases. No product defect was found. One new assertion initially
  expected "30 minutes" instead of the existing correct "30-minute" wording;
  the test was corrected without changing product copy. The local managed-server
  launch timed out once; an explicit loopback server completed the full run.
- Existing browser suite covers native registration, no-referrer navigation,
  safe campaign forwarding, LinkedIn/WhatsApp and homepage/Training source labels,
  discovery impression/click and detail view/register events, all editorial
  lifecycle states without JavaScript, exact closing/end discovery boundaries,
  focused expiry, menu/navigation and existing site journeys.
- Added release matrix covers all three surfaces at 1440×900, 1280×720,
  768×1024, 390×844 and 360×800. It checks fact/CTA/canonical identity, one H1,
  accessible CTA names, keyboard focus, overflow and WCAG text contrast against
  the rendered solid background. This is focused checking, not screen-reader
  certification or a comprehensive accessibility audit.

Deployed dev smoke: the actual canonical event route loads with the exact title,
production self-canonical and both configured Luma actions. An anonymous Chromium
context followed the first action to the real Luma page and opened registration.
No Luma account was signed in. Submission remains pending a controlled attendee.
Deployed homepage, Training, launched-course compatibility route, pipeline course,
My Learning/sign-in, application and contact routes all returned 200 and their
expected page headings/canonical destinations. Contact submission remains mocked
in regression tests; no real enquiry or newsletter signup was generated.

## Privacy evidence

No raw meeting link is stored in this report, fixtures, tests or evidence logs.
The public anonymous Luma page and registration dialog showed only the provider
name, not a meeting URL. The DOM and 115 observed HTML/JavaScript/JSON responses
contained no raw meeting URL. This includes the loaded public client configuration
and metadata, but does not claim exhaustive knowledge of undocumented endpoints.
No public joining/calendar action was presented before registration.

A scan of 862 tracked files and local evidence/archive members found no meeting
URL matches, including HTML, data, JavaScript, metadata/schema, sitemap, logs and
fixtures. The scanner checks raw, HTML-escaped, percent-encoded and common
JSON-escaped URL forms without printing any matching value. Authenticated host
settings necessarily contain the delivery location; they were inspected only in
the provider UI and were not exported into repository evidence.

## Real-event provider observations

Read-only authenticated host UI inspection on 8 September 2026:

| Requirement | Observation | Verdict |
|---|---|---|
| Unlisted discovery | Private; not listed on the host profile | Verified setting |
| Event identity | Correct full title and 19 September, 11:00–11:30 AM IST | Verified |
| Registration close | Standard Free ticket available until 19 September, 10:55 AM | Verified setting; scheduled enforcement pending |
| Questions | Name/email; required profile, experience, role, technology; optional question | Verified configuration; persisted answers pending |
| Consent | Required event-administration communications consent | Verified configuration; submitted consent pending |
| Reminders | Enabled, Going audience, 18 September 11:00 AM and 19 September 10:00 AM | Verified configuration; delivery pending |
| Confirmation | Provider UI says registration sends confirmation with calendar invite | Actual real-event delivery pending |
| Guest/export | Guest management and Download as CSV available; no guests yet | Actual row/export fields pending |
| Feedback | Built-in post-event feedback scheduling available | No custom feedback system needed |

Event guest/contact data is for this session's confirmation, reminders, joining
instructions and session-related follow-up only. Contact membership is not
future-marketing permission. Do not send Calendar newsletters or future-event
invitations without separate consent. Software Signal Weekly uses the existing
separate Beehiiv consent/double-opt-in flow. Do not duplicate Luma email in SES.

## Remaining release gates

1. Obtain the controlled attendee email and mailbox access; complete anonymous
   registration with distinct synthetic profile/experience/role/topic answers and
   required consent. Do not put the address or attendee tokens in repository logs.
2. Verify the real confirmation, calendar timezone/time, protected attendee joining
   path, guest record, persisted answers, export columns and retained UTM values.
   Record only outcomes and column names, not attendee records or private links.
3. Observe scheduled reminder delivery and registration closure. Do not alter the
   real event date or closing time just to accelerate a test. Prototype evidence
   is supporting feasibility evidence, not proof of this event's scheduled run.
4. Keep canonical and discovery lifecycle truthful through editorial publication:
   set `registration-closed` and regenerate at closure; set `completed` and
   regenerate after completion. Discovery additionally uses a client-clock guard;
   no-JS discovery and canonical detail depend on the documented editorial update.
5. Resolve #705's declared-native-sandbox/authenticated readiness prerequisite.
6. After reviewed human-controlled production promotion, smoke-test production
   discovery, facts, registration and privacy before any promotional publishing.

Physical-device testing, assistive-technology certification, additional browser
engines and real GA4 delivery are not established by the local Chromium checks.
No anonymous privacy failure was observed; no architecture replacement is proposed.

## Evidence and reproducibility

Ignored local `.engineering/evidence/703/` contains generator/SEO, Python, Node,
browser, anonymous-provider and privacy-scan outcomes. `test-results/703-*.png`
contains the release viewport captures. CI provides reproducible browser evidence.
Provider source/body inspection stays in memory; raw attendee records and private
joining URLs must never be committed or attached to the PR.

Run `python scripts/generate_training_events.py --check`,
`python scripts/generate_public_discovery.py --check`,
`python scripts/generate_sitemap.py --check`, `python scripts/validate_public_seo.py`,
the Python/Node commands in `docs/engineering/validation-testing.md`, and
`npm run test:e2e`. Run SEO after browser completion, since temporary trace HTML
can otherwise be mistaken for repository pages by the public-route inventory.

Rollback: revert this evidence/test-only PR. Event behavior and Luma remain unchanged.
