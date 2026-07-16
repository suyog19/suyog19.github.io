# Issue 189: Gate 3 remaining-fee experience

## Scope

Add a private, no-index learner page for the backend-owned Gate 3 balance
projection and development-only test payment action. My Learning integration is
kept in issue #190; admin operations remain in #191.

## Decisions

- The browser displays server-provided money, deadline, extension, seat,
  deposit-treatment, receipt, and action fields without recalculation.
- Only an HTTPS `pay.test.invalid` URL can become actionable in this gate. Live
  Razorpay hosts remain deliberately blocked pending explicit approval.
- Request creation reuses one session-scoped idempotency key. Ambiguous or
  conflicting outcomes never invite another payment and recover by re-reading
  authoritative status.
- Closed non-payment and action-needed states provide support guidance and no
  payment or activation action. No Gate 4 access link is rendered.

## Validation and rollback

Validate state rendering, URL/identifier allowlists, idempotent request
creation, session recovery, inaccessible/failed API behavior, private-page
metadata, keyboard/accessibility structure, responsive layout, and existing
Gate 1–2 frontend regressions. Roll back by reverting the focused PR; the page
has no persistence and the backend remains development/test-only.
