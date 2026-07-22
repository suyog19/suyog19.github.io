# Admin UX migration validation

Issue: #344  
Epic: #336  
Date: 2026-07-22

## Outcome

The task-oriented admin implementation is complete on `dev`. Today, Learners,
Cohorts, and Inbox are the primary navigation. Existing backend-shaped
operations remain in a clearly demoted **Legacy operations** group because they
still contain guarded mutation workflows; no launch-critical command was
removed or reimplemented.

The authenticated shell also provides a persistent learner/cohort search. It
passes the bounded value directly to the selected directory controller, clears
conflicting filters, and never places the value in the page URL or analytics.

The automated and source-level checks below pass. Authenticated live-browser
and assistive-technology evidence could not be captured because the approved
browser-control runtime was unavailable. That release-evidence limitation is
tracked in [#354](https://github.com/suyog19/suyog19.github.io/issues/354) and
must be completed before the coordinated production promotion of frontend epic
#336 and backend issue #622.

## Traceability

| Requirement | Delivery evidence |
|---|---|
| Workflow/contract audit | #337, PR #346 |
| Task-oriented shell and preserved legacy access | #338, PR #347 |
| Learner directory | #339, PR #348 |
| Learner 360 | #340, PR #349 |
| Cohort directory | #341, PR #350 |
| Cohort 360 and roster | #342, PR #351 |
| Intent-based communications | #343, PR #353 |
| Today queue | #345, PR #352 |
| Learner projections | platform #623, PR #626 |
| Cohort and Today projections | platform #624, PR #629 |
| Communication intents | platform #625, PR #630 |
| Backend #622 delivery retained | platform PR #627 remains in backend `dev` |

## Representative task scenarios

| Scenario | Evidence and result |
|---|---|
| Find and explain a learner | Learner search is bounded and private; one #623 detail projection renders current journey, distinct payment/enrolment/cohort/communication truth, blockers, actions, and authoritative timeline. Covered by `tests/admin-learners.test.js`. |
| Send a current deposit link | Learner 360 offers **Send deposit payment link** using only the enrolment ID. #625 preview selects resend versus replacement and execution requires the bound preview token, confirmation, reason, evidence, and idempotency key. Covered by `tests/admin-communication-intents.test.js`. |
| Replace an expired deposit link | The same deposit intent renders the backend `REPLACE_EXPIRED` decision as “Create and send a current payment link”; the browser does not select a mechanism. |
| Prevent a dangerous send | Zero-eligible, incomplete, stale, settled, blocked, uncertain, or unsupported previews cannot execute. A stale conflict disables the old confirmation and requires a new preview. |
| Inspect cohort health | One #624 projection renders authoritative overview counts, operational breakdowns, decision history, and a server-filtered roster that separates enrolment, deposit, balance, and communication state. Covered by `tests/admin-cohorts.test.js`. |
| Preview cohort follow-up | A complete bounded preview requests up to the backend limit, displays eligible/excluded counts, recipients and reasons, and receives an execution token only when complete. |
| Use Today | The old module-count overview is bypassed. The #624 queue supplies priority order, subject, explanation, deadline, next action, and learner/cohort destination. Covered by `tests/admin-today.test.js`. |
| Diagnose failure | Learner/cohort technical evidence, exclusion reason counts, and per-recipient outcomes use progressive `<details>` disclosures while current operational truth remains prominent. |
| Recover safely | Request generations prevent stale reads from repopulating current/private views; session clearing cancels controllers; stale communication previews cannot retry; ambiguous execution failures retain the idempotency key. |

## Accessibility and responsive evidence

- All workspace navigation remains keyboard reachable; arrow, Home, and End
  behavior is regression-tested.
- Active tabs expose `aria-selected`; panels retain labelled `tabpanel`
  semantics; page status, directories, workspaces, previews, and Today use live
  regions and busy states.
- Contextual navigation moves focus to the new workspace heading. Mobile menu
  state closes after navigation.
- Cohort roster and communication preview tables include captions and remain in
  horizontally scrollable containers.
- Dialogs use native `<dialog>`, labelled headings, required controls, visible
  errors, double-submit prevention, and native Escape/focus behavior.
- Layouts collapse at 800px; a 480px emergency layout stacks summaries,
  actions, pagination, and workspace columns. All new CSS remains scoped to
  `.admin-page`.
- Visible focus styles are supplied for task navigation and existing global
  form/button focus styles remain in force.
- The complete automated suite passes, including authentication/logout,
  Messages, Feedback, applications, payments/refunds, cohort decisions, and
  public/learner isolation.
- Live keyboard, screen-reader, contrast, 400% zoom, and device screenshots are
  explicitly deferred to #354; they are not represented as completed here.

## Security and privacy evidence

- `/admin/` remains `noindex, nofollow` and now uses `no-referrer`.
- Analytics is not loaded on the private admin page. Search terms, email
  addresses, learner identifiers, preview tokens, and cursors are never added
  to browser URLs or analytics.
- All private rendering uses `textContent`; no new admin module uses
  `innerHTML`, editable HTML, or arbitrary provider content.
- Learner and cohort IDs are bounded opaque values. Preview tokens remain only
  in controller memory and are not shown in technical disclosures.
- Logout/session expiry clears controller data, pending request generations,
  dialogs, idempotency state, legacy details, and authenticated shell content.
- Counts, thresholds, priorities, recipients, eligibility, deadlines, amounts,
  decisions, and timeline order are rendered from backend projections; the
  browser does not join or infer domain truth.

## Failure and concurrency matrix

| State | Expected behavior |
|---|---|
| Loading | Target region is busy and retains an announced loading label. |
| Empty | Plain-language empty state explains what to do next. |
| 401/403 | Session and all private controller state are cleared; sign-in is shown. |
| 404 | Selected learner/cohort is cleared from actionable context and a safe not-found state is shown. |
| 409/412 stale preview | Confirmation is disabled; a fresh preview is required. |
| 503 projection limit | No partial or potentially misleading cohort/Today projection is rendered. |
| Network/5xx during execution | Exact payload and idempotency key remain available for an ambiguity-safe retry. |
| Partial communication result | Accepted/replayed, skipped-after-revalidation, and excluded counts plus safe per-recipient outcomes are shown; domain truth is unchanged. |
| Out-of-order response | Request generation checks prevent older responses replacing current results. |

## Legacy migration and rollback

Legacy operations remain available for course configuration, application
review, payment/refund commands, and cohort decisions. Their navigation is
visually demoted, not removed. This is intentional: the new workspaces provide
discovery and context while the existing controllers retain mature mutation
protections. Removing those routes would reduce capability and is not required
to make the daily-task information architecture primary.

Every frontend story was merged as a separate squash commit and can be reverted
independently. No backend endpoint, authentication contract, production branch,
domain, deployment workflow, or public URL changed. Promotion from `dev` to
`main` remains human-controlled and must be coordinated with backend #622 while
retaining backend PR #627.
