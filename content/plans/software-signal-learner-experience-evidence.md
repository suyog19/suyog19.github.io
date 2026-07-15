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

The 110-test Node suite passes, including exact-state matrix structure, bounded status mappings, fail-closed hidden actions, payment double-activation prevention, private subpage logout, safe support context and existing contract/recovery coverage. An agent-run browser matrix completed 90 checks across 18 learning, support and representative non-learning routes at 1440×900, 1280×720, 768×1024, 390×844 and 360×800 with no horizontal overflow, learning-stylesheet leakage or visually exposed hidden controls. A 640×360 reflow proxy passed critical signed-out routes, public email focus order was exercised with keyboard input, and semantic accessibility-tree inspection covered the payment-support handoff. Suyog explicitly waived independent human, authenticated integrated, real screen-reader and second-browser observation on 15 July 2026. Those gaps are not represented as passing evidence.

## Terminology audit

Learner-route HTML and learner JavaScript were searched for internal gate numbers, backend/provider mechanics, development fixtures and reconciliation terminology. Internal contract constants and test descriptions remain source-only. Learner rendering maps the development confirmation contract to the neutral disclosure “Payment confirmation — not a tax invoice”; exceptional money review uses “amount received but not yet applied” and “organiser review”.
