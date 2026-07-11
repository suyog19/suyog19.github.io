# Issue #184 — Gate 1 admin application review

## Dependencies

- Backend #401 supplies the admin queue/detail and authoritative decision/offer commands.
- Backend #404 supplies communication status and controlled resend.
- Website #183 supplies the existing Training admin shell and cohort management.

This PR is stacked on #183 and remains draft until the backend dependencies merge.

## Plan

1. Add a minimal filtered application queue to the existing Training tab.
2. Render profile snapshots, learner answers, acknowledgements, decision truth, and a compact operational timeline using DOM text nodes.
3. Bind version-checked decision and offer commands with confirmation, required reasons, cohort selection, and idempotency keys.
4. Show communication delivery separately from domain status and expose only backend-approved controlled resend.
5. Preserve admin authentication, Messages, Feedback, noindex, environment routing, and existing styles.

## Scope controls

- No arbitrary email editing, CRM activity feed, payments, refunds, or Gate 2 functionality.
- Backend authorization, validation, auditing, conflict handling, and canonical templates remain authoritative.
- Public launch and production deployment remain outside this PR.

## Validation

- `node --check js/admin.js`
- HTML script/reference and duplicate-ID checks
- `git diff --check`
- Browser/responsive acceptance QA is required when the in-app browser is available.
