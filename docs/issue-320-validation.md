# Epic #320 validation record

## Scope

Frontend-only implementation of #321–#327. No backend contract, endpoint, state-machine, payment, refund, enrolment, or course-hub capability was changed.

## Automated validation

- `node --test tests/*.test.js`: all tests passed.
- `git diff --check`: passed.
- Presentation fixtures cover early application, offer/deposit, confirmation, reservation, cohort, balance, activation, active access, requests/refunds, unknown state, multiple journeys, and communication failure.
- Invariants cover obsolete payment suppression, zero-due suppression, explicit active course-area eligibility, bounded protected routes, journey isolation, private-state clearing, and public fallback.

## Browser validation

Local pages were served with `python -m http.server 8080` using synthetic/no-session state.

| Scenario | Viewport | Result |
|---|---:|---|
| Training landing | desktop | Rendered with no horizontal overflow |
| Training landing | 390 × 844 | Rendered with no horizontal overflow |
| My Learning logged out | 390 × 844 | `noindex, nofollow`, `no-store`, exact return to `/my-learning/` through `/learn/` |
| Remaining-fee deep link logged out | 360 × 800 | Exact allow-listed route and enrolment identifier preserved through `/learn/`; no horizontal overflow |

## Accessibility and privacy checks

- Status, meaning, date, and action retain DOM reading order.
- Journey stages expose completed/current/future text and `aria-current="step"`; colour is not the only state signal.
- Repeated journey actions include the course title in their accessible label.
- Details use native `details`/`summary` controls.
- Public enhancement runs only for an existing session, matches one exact course ID, uses no private analytics, and leaves static public content untouched on failure.
- Auth and refresh failures clear private content before recovery UI.

## Residual manual validation

Real OTPs, learner identities, payment-provider links, and production records were intentionally not used. A final approved synthetic authenticated session should spot-check keyboard/screen-reader behaviour, 200% zoom, multi-tab payment completion, and each live backend-projected state before applications reopen.
