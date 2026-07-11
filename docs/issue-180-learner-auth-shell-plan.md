# Issue 180: learner authentication shell

## Dependencies

- Platform IAM foundation #231: satisfied.
- Learner bootstrap APIs #397: merged and available for downstream learner flows.

## Plan

1. Add one learner-facing email OTP page with safe destination restoration.
2. Add a reusable session client and protected-route guard backed by the existing IAM API.
3. Add the empty My Learning shell required for route and session validation.
4. Validate anonymous, restored-session, error, logout, accessibility, and mobile states locally.

Implementation note: the unified first step makes the existing generic,
idempotent registration request before requesting OTP, so new and returning
learners receive the same non-enumerating flow. Safe destinations discard URL
fragments and all query parameters except validated course/application IDs.

No application form, course content, admin behavior, or new identity mechanism is included.
