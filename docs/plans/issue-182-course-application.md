# Issue #182 — OTP-gated course application

Dependencies #179, #180, platform #394, and platform #400 are satisfied on
their respective development branches. This change implements the approved
three-answer application contract and learner-profile bootstrap without
enabling production applications.

## Plan

1. Accept only the two source-controlled course IDs and preserve that bounded
   selection through the existing OTP `continue` allowlist.
2. Restore the authenticated session, bootstrap the minimal learner profile
   when absent, and submit only the exact #400 answer/acknowledgement contract.
3. Persist recoverable drafts in session storage only. Reuse one idempotency key
   for identical retries and rotate it when material input changes.
4. Map closed/full/waitlist/duplicate/validation/session/network/backend states
   to accessible recovery guidance without inferring domain truth.
5. Emit aggregate start/completion analytics with course slug only; never email,
   learner data, answers, token, or application reference.

Optional consent, phone, payment, scoring, and Gate 2–4 fields remain excluded.
The page is unlinked and `noindex` until the #405 public-application launch gate.

