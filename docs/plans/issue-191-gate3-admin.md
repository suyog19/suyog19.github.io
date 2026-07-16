# Issue 191: Gate 3 admin workspace

## Scope

Extend the existing private/noindex admin shell with backend-owned Gate 3
cohort decisions and remaining-fee operations. Preserve Messages, Feedback,
Gate 1 training, Gate 2 payments/changes and authentication/logout behavior.

## Decisions

- A separate accessible Gate 3 tab consumes only server-derived eligibility,
  threshold, reconciliation and allowed-command fields.
- Confirmation displays and submits the final schedule plus approved,
  development-versioned commercial policy; revision and cancellation require
  explicit reason, evidence, confirmation and concurrency versions.
- The existing Payments tab branches on backend `purpose`. BALANCE operations
  use exact obligation/cohort/version binding for initial mock request,
  credit/waiver, extension, overdue and non-payment closure commands.
- Browser time never decides overdue/grace/closure, and the browser never
  calculates amount due, eligibility, seat release, activation or deposit
  treatment. Gate 4 links and provider resources remain absent.

## Validation and rollback

Validate command payloads, stale/authorization recovery, idempotency,
purpose/state fail-closed behavior, complete frontend regression, keyboard and
responsive accessibility, preview deployment and independent review. Roll back
by reverting the focused frontend commit; no local commercial truth is stored.
