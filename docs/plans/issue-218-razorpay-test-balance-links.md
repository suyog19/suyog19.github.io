# Issue 218 — Razorpay test balance links

## Scope

Allow the learner balance experience to render an exact HTTPS `rzp.io`
Payment Link only when the backend marks the current payment action available.
Retain the existing mock host for local and development regression coverage.

## Security boundary

The frontend accepts only the exact hosts `pay.test.invalid` and `rzp.io` on
`dev.suyogjoshi.com`, `localhost`, or `127.0.0.1`, with HTTPS, no credentials,
fragment, query string, or non-default port. Production and unknown page hosts
reject both test-link hosts. Deceptive subdomains remain non-actionable. The backend remains authoritative for
availability, amount, deadline, expiry, and payment state.

## Validation and rollback

Run the existing Node learner-balance suite and inspect the acknowledgement
flow at a development hostname. Roll back by reverting this focused change;
the backend can independently disable or hide every payment action.
