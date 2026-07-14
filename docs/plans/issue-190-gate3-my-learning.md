# Issue 190: Gate 3 My Learning summary

## Scope

Extend the private My Learning shell with the owner-safe Gate 3 projection from
`GET /me/learning-summary`. Detailed payment remains in issue #189; admin and
Gate 4 delivery remain out of scope.

## Decisions

- Render only backend enums and values; do not calculate amount due, grace,
  credit, seat, activation, deposit treatment, or communication truth.
- Construct a balance link only for an exact owned enrolment plus backend
  `PAY_BALANCE`; `CONTACT_SUPPORT` is the only other Gate 3 destination.
- Confirmation, overdue/grace, non-payment closure, action-needed, activation,
  joining eligibility, and message delivery remain visibly separate.
- Joining eligibility never creates a course, session, resource, or provider
  link. Gate 4 stays inert.

## Validation and rollback

Validate all Gate 3 states, cross-shape/malformed fail-closed behavior,
deadline/grace/extension wording, credit/deposit treatment, communication
failure separation, private/session recovery, mobile/static accessibility, and
the complete frontend regression. Roll back by reverting the focused commit;
no backend or provider state is stored in the page.
