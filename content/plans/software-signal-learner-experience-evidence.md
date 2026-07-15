# Software Signal learner experience evidence index

All evidence uses local fixtures or synthetic data. No OTP, private email, payment reference, token or provider secret is retained.

| Route/state | Source | Desktop | Mobile | Owner |
|---|---|---|---|---|
| Training overview and both courses | Local static render | Required at 1440×900 | Required at 390×844 | #225 |
| Email and OTP states | Local fixture | Required | Required | #225 |
| Application, correction and result | Local fixture | Required | Required | #225 |
| My Learning: received, deposit, reserved, refund, balance, active and errors | Existing test fixtures | Required | Required | #226 |
| Deposit due, confirming, complete and review | Existing test fixtures | Required | Required | #227 |
| Change form, outcome and refund stages | Existing test fixtures | Required | Required | #227 |
| Balance due, grace, extension, zero, closed and review | Existing test fixtures | Required | Required | #227 |
| Stale link, re-authentication and support handoff | Local fixture | Required | Required | #228 |
| Activation pending and active/access pending | Existing test fixtures | Required | Required | #229 |

Human-session screenshots and any signed-in development evidence must be stored in the approved private release evidence location and linked here by Suyog; they must not be committed.

## Implementation self-validation — 15 July 2026

The 110-test Node suite passes, including exact-state matrix structure, bounded status mappings, fail-closed hidden actions, payment double-activation prevention, private subpage logout, safe support context and existing contract/recovery coverage. Local browser rendering at 390×844 passed without horizontal overflow for the training overview, both course pages, email entry and safe Contact handoff. The training overview, both course pages and Contact handoff also passed at 1440×900 with no console warning/error. The closed-course action was verified hidden in computed styles. Authenticated screenshots and remaining required viewports remain part of the controlled synthetic-data sessions required by #230.

## Terminology audit

Learner-route HTML and learner JavaScript were searched for internal gate numbers, backend/provider mechanics, development fixtures and reconciliation terminology. Internal contract constants and test descriptions remain source-only. Learner rendering maps the development confirmation contract to the neutral disclosure “Payment confirmation — not a tax invoice”; exceptional money review uses “amount received but not yet applied” and “organiser review”.
