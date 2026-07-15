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

Local Chromium rendering at 390×844 passed without horizontal overflow for the training overview, both course pages, email entry and application authentication return. Contact, Writing and Admin did not load `css/learning.css` or receive the learning wrapper. The training overview also passed at 1440×900 with no console warning/error and computed deep-teal identifier/action styling. Authenticated state screenshots remain part of the controlled synthetic-data session required by #230.

## Terminology audit

Learner-route HTML and learner JavaScript were searched for `Gate 1–4`, backend, webhook, allocation, provider status, development, mock, test payment, canonical, projection and reconciliation. Internal constants, comments and test descriptions are safe. Learner-visible occurrences are remediation findings and must use the plain-language mappings in the matrix. Exceptional money review uses “amount received but not yet applied” and “organiser review”.
