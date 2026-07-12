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

The protected `/learn/` and `/my-learning/` pages intentionally use `noindex`
and are excluded from `sitemap.xml`. They still include canonical and social
metadata plus the existing GA4 product. Analytics receives a fixed canonical
page location/path, never the continuation query or course/application IDs.
Continuation paths are exact `/learn/`, `/my-learning/`, or `/apply/` routes,
or one bounded lowercase course slug under `/courses/`.

No application form, course content, admin behavior, or new identity mechanism is included.
