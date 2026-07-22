# Admin UX workflow and contract audit

Issue: #337  
Parent epic: #336  
Date: 2026-07-22

## Decision

The existing `/admin/` workspace has the required authentication and many of
the required commands, but it cannot deliver the learner-, cohort-, and
task-oriented experience in #336 from its current read contracts alone. The
frontend must not compensate by joining domain records or reproducing payment,
enrolment, cohort, or communication rules in the browser.

The delivery approach is therefore:

1. preserve the existing authenticated shell and every working command;
2. introduce the task-oriented shell while old views remain reachable;
3. consume new backend-owned operational projections;
4. move existing commands into learner and cohort context;
5. add intent-level communication actions only after the backend owns current
   eligibility and resend-versus-replacement selection; and
6. retire redundant navigation only after end-to-end parity is proven.

The minimal backend work is tracked in platform issues
[`#623`](https://github.com/suyog19/suyogjoshi-platform/issues/623),
[`#624`](https://github.com/suyog19/suyogjoshi-platform/issues/624), and
[`#625`](https://github.com/suyog19/suyogjoshi-platform/issues/625). These are
projection and orchestration contracts; they do not change domain business
rules.

## Current-state workflow and friction

| Admin job | Current route through the UI | Friction or risk |
|---|---|---|
| Find a learner | Start in Applications, filter a domain record, then inspect its detail | There is no learner directory or global learner search; an admin must know which stage owns the learner now. |
| Understand one learner | Cross-reference application detail, payment obligation detail, learner requests, communications, and cohort decision views | Current truth is split by backend aggregate. The browser has no authoritative unified timeline or next-action projection. |
| Send a deposit link | Application → Communications → Open deposit communication → payment obligation → communication attempt → resend | The admin must understand obligations, logical messages, and resend eligibility. Expired links require a different replacement command. |
| Understand a cohort | Courses & cohorts for configuration, then Cohort decisions for threshold/decision data, then Payments for individual obligations | There is no operational cohort list, roster, or consolidated payment/enrolment/communication breakdown. |
| Follow up outstanding balances | Scan the payment list and individual obligation detail | There is no cohort-filtered authoritative audience or exclusion preview. |
| See today's work | Overview cards are assembled from whichever module data has loaded | There is no backend-owned attention queue, priority, or stable destination context. |
| Diagnose delivery | Inspect technical communication attempts inside application/payment detail | Useful evidence exists, but it dominates the normal workflow instead of being progressive detail. |

The current primary navigation—Courses & cohorts, Applications, Payments &
learner requests, Cohort decisions, and Interest requests—mirrors storage and
release-gate boundaries. The existing hand-off from an application to a
deposit obligation is safe, but it demonstrates why commands alone do not
form an intuitive operating workspace.

## Target information architecture

### Today

The default workspace is a bounded operational queue. Each item answers:

- who or which cohort is affected;
- what happened;
- what safe action is next;
- when it matters, if an authoritative deadline exists; and
- where to continue.

This is not an analytics dashboard. Priority and eligibility come from the
platform #624 projection.

### Learners

A searchable directory opens a Learner 360 workspace containing:

- current journey and course/cohort context;
- application and enrolment summary;
- deposit and remaining-fee summary;
- refund/change-request and communication exceptions;
- delivery/access/completion summary when present;
- a canonical operational timeline; and
- backend-projected available actions and blocking reasons.

Platform #623 owns search, summary, timeline, and action projection.

### Cohorts

An operational cohort directory opens a Cohort 360 workspace containing:

- schedule, capacity, threshold, and decision;
- a paginated roster;
- enrolment/payment/communication breakdowns;
- actionable filters and exceptions;
- decision history and existing authorised commands; and
- links to the corresponding learner workspace.

Platform #624 owns counts, roster membership, statuses, and attention state.

### Inbox

Contact Messages and Feedback remain separate inbox tasks. Interest requests
remain available as a lead/notification workflow and may be placed under Inbox
or an explicit secondary operation group; #336 does not merge them into
enrolled-learner truth.

## Administrator-facing vocabulary

Technical values remain available in diagnostic details, not as primary
labels.

| Domain concept | Primary admin wording | Notes |
|---|---|---|
| `NEW`, `UNDER_REVIEW` | Awaiting review / In review | Application context only. |
| `OFFERED` with open deposit | Deposit needed | Do not imply payment failure. |
| `RESERVED` | Place reserved | Payment allocation and enrolment truth remain distinct in details. |
| pending cohort decision | Waiting for cohort decision | Show authoritative revised date when supplied. |
| open balance obligation | Remaining fee due | Amount and deadline are backend-provided. |
| `OVERDUE` but payable | Remaining fee overdue | Show grace/extension without calculating it. |
| `CLOSED_NON_PAYMENT` | Place released after non-payment | Deposit treatment remains a separate backend outcome. |
| `ACTIVE` | Enrolled and active | Never infer from payment or dates. |
| failed/uncertain delivery | Notification needs attention | Domain truth is unchanged. |
| provider/manual exception | Review needed | Do not expose raw provider state as the headline. |
| resend current message | Send again | Backend must still authorise it. |
| replace obsolete payment request | Create and send a current link | Normal intent flow hides the mechanism. |

Approved intent labels for #343 are **Send deposit payment link**,
**Remind about remaining fee**, and **Send cohort update**. The platform #625
contract decides whether the safe result is resend, replacement, suppression,
or escalation.

## Existing contract reuse and gaps

| Existing contract | Safe reuse | Missing for #336 |
|---|---|---|
| `GET /admin/training/applications` and application detail | Application review queue, answers, decisions, enrolment hand-off | Search across learner journeys; unified current status; learner timeline. |
| Application communications list/resend | Historical application delivery and canonical resend | Intent-level action and current cross-domain eligibility. |
| `GET /admin/training/payments` and payment detail/reconciliation | Authoritative obligation evidence and existing payment/refund commands | Learner/cohort lookup, concise operational projection, grouped exceptions. |
| Enrolment communications list/resend | Technical history and approved original resend | Backend selection of resend versus payment-link replacement. |
| Payment request replace/disable | Existing audited mechanism | One intent endpoint that safely selects the mechanism. |
| Courses and course-scoped cohorts | Configuration and publication operations | Cross-course operational cohort directory and attention counts. |
| Gate 3 cohort summary/commands | Threshold/decision evidence and audited decisions | Roster and unified enrolment/payment/communication breakdown. |
| Course-interest eligibility/send | Useful precedent for audience preview | It is limited to applications-open interests and cannot represent enrolled learner obligations. |
| Existing overview module loads | Temporary navigation counts | Backend-owned, paginated Today queue with priority and destinations. |

### Contract ownership

- Platform #623: learner search and list summary at
  `GET /admin/training/learners`, plus Learner 360, timeline, and projected
  actions/blockers at `GET /admin/training/learners/{learnerId}`.
- Platform #624: operational cohort list at
  `GET /admin/training/operations/cohorts`, Cohort 360 and roster at
  `GET /admin/training/operations/cohorts/{cohortId}`, and the attention queue
  at `GET /admin/training/operations/today`.
- Platform #625: individual and cohort communication intent preview at
  `POST /admin/training/communication-intents/preview` and idempotent execution
  at `POST /admin/training/communication-intents/execute`.

Intent execution uses the complete preview returned by the backend. The UI
must submit its `previewToken`, an admin `reason`, an `evidenceReference`, and
an `Idempotency-Key`; it must never reconstruct recipients or eligibility in
the browser.

All responses must remain ADMIN-authorised, private/no-store, bounded,
cursor-paginated where applicable, privacy-safe in logs, and explicit about
stale or inconsistent evidence. Opaque identifiers may be used for routing;
email addresses, payment references, tokens, and private search values must not
enter URLs or analytics.

## Representative validation scenarios

These scenarios are the shared acceptance fixtures for #338–#345.

1. **Find and explain a learner** — Search a learner with more than one
   application and explain the authoritative current journey in under one
   minute without visiting a backend-shaped module.
2. **Send a current deposit link** — From Learner 360, preview and send the
   authorised payment action without selecting a logical communication key.
3. **Replace an expired deposit link** — Use the same admin intent; the backend
   reports that a current replacement was created and sent.
4. **Prevent a dangerous resend** — A satisfied, closed, obsolete, or
   uncertain-payment case is excluded with a plain-language reason and no
   second payment encouragement.
5. **Inspect cohort health** — Open a cohort and identify deposit outstanding,
   reserved, balance due, overdue/in grace, active, and communication-failure
   learners without cross-referencing lists.
6. **Preview cohort follow-up** — Show recipient and exclusion counts/reasons,
   inspect the audience, confirm once, and retain per-recipient audit outcome.
7. **Use Today** — Open an attention item, complete or review its safe action,
   refresh, and observe the resolved/stale item update authoritatively.
8. **Diagnose failure** — Open progressive technical details for an uncertain
   delivery while the learner/cohort/payment truth remains unchanged.
9. **Recover safely** — Expired session, stale version, conflict, partial
   delivery, and backend failure preserve context and never double-submit.
10. **Operate accessibly** — Complete the primary journeys by keyboard at
    desktop and emergency mobile widths with visible focus and announced
    status changes.

## Delivery dependency map

| Frontend issue | Contract dependency | Start condition |
|---|---|---|
| #338 shell/patterns | None beyond existing APIs | Can start immediately; retain legacy access. |
| #339 learner directory | Platform #623 list/search | Contract and representative fixtures agreed. |
| #340 Learner 360 | Platform #623 detail/timeline/actions | Directory identity and detail contract stable. |
| #341 cohort directory | Platform #624 cohort list | Summary/count vocabulary stable. |
| #342 Cohort 360 | Platform #624 detail/roster | Roster pagination/filter contract stable. |
| #345 Today queue | Platform #624 attention queue | Learner/cohort destinations exist. |
| #343 intent actions | Platform #625 | Learner/Cohort 360 action locations exist. |
| #344 hardening | All functional children | Parity demonstrated; legacy retirement remains reversible. |

Platform #623, #624, and #625 may be developed in parallel after this audit.
Frontend #338 may also proceed in parallel. Learner (#339 → #340) and cohort
(#341 → #342) vertical slices can run independently once their contracts are
available. Today (#345) follows stable destinations; intent actions (#343)
follow stable learner/cohort contexts; #344 runs last.

## Non-negotiable preservation

- Existing OTP authentication, logout, session expiry/clearing, environment
  routing, noindex treatment, and private rendering.
- Existing Messages, Feedback, course configuration, application, payment,
  refund, cohort-decision, and interest workflows until replacements have
  proven parity.
- Backend authority for all amounts, allocation, deadlines, capacity,
  threshold, enrolment, recipients, communication eligibility, and state
  transitions.
- Confirmation, reason/evidence, idempotency, stale-state handling, audit, and
  canonical immutable communication content.

No frontend issue in #336 authorises a new business rule, a browser-side domain
join, arbitrary bulk messaging, editable HTML email, or a second admin/auth
shell.
