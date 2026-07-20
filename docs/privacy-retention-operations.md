# Privacy retention operations

This runbook records the current manual handling behind the public Privacy
Notice. It does not replace the notice, create an automatic deletion promise,
or authorize deletion where financial, dispute, security, or legal evidence
must be preserved.

## Intake and verification

1. Receive privacy requests through `contact@suyogjoshi.com` or the public
   contact route and record the request date and a non-sensitive reference.
2. Verify the requester using the minimum information needed. Do not place
   identity documents, message bodies, raw email addresses, payment data, or
   presigned URLs in durable operational logs.
3. Identify the applicable records and any preservation requirement. Escalate
   uncertainty before changing data.

## Review cadence and boundaries

- Review application and learner-profile records when they reach the published
  365-day baseline and when a verified request is received.
- Preserve payment, refund, tax, dispute, consent, and operational evidence for
  at least the published 365-day baseline and longer when a documented legal or
  operational requirement applies.
- Remove cohort recordings no later than the published 90-day maximum. Record
  only the recording reference, removal date, and outcome in the operations
  log; never copy the recording URL into that log.

## Manual action and evidence

1. Classify each record as delete, anonymise, retain with reason, or outside
   scope. Obtain the required human approval before irreversible deletion.
2. Perform the action through the owning backend or provider control. Do not
   edit production data through browser storage or ad-hoc public scripts.
3. Record the bounded record category, action, timestamp, operator, approval
   reference, and any retention reason. Do not record the deleted content.
4. Confirm completion or provide a progress update through the verified contact
   channel within the response windows stated in the Privacy Notice.

## Escalation

If an owning system lacks a safe deletion or anonymisation operation, stop and
raise a backend operations issue. Until that capability exists, record the
dependency and do not represent the lifecycle as automatic or complete.

Public source of truth: [Privacy Notice](../privacy/index.html).
