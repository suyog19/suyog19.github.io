# Issue #442 course consistency and production re-review

## Canonical consistency contract

The source-controlled training catalogue owns durable launched-course values for minimum age, timezone, session cadence, independent workload, recording retention, certificate threshold, and capstone identity. Successful runtime cohort responses remain authoritative for exact dates, minimum size, capacity, registration, and the permitted public action.

`scripts/validate_training_consistency.py` checks only the two launched courses and their application/policy surfaces. Pipeline courses retain tentative language and are deliberately outside the launched stale-copy gate.

The validator checks:

- catalogue-derived normal and capstone weekly totals;
- minimum age 18 and learner-facing IST cadence;
- planned 10–15 learner fallback plus the runtime minimum/capacity override;
- scoped stale uncertainty phrases and duplicate commitment sections;
- optional WhatsApp/privacy/email/submission boundaries;
- planned recording, 90-day access, failure fallback, and attendance distinction;
- 11-of-14 live-session attendance, capstone, extension, issuance, and no-grade certificate rules;
- Python’s canonical `Core-Python structured-data analyser` terminology;
- application-summary and policy-version `1.1.0` consistency.

Representative fixture tests prove that stale copy and catalogue workload drift fail with a page-specific message, while pipeline wording is not caught by a fragile global ban.

## Automated validation

- `python scripts/validate_training_consistency.py`: passed locally and in CI.
- `python -m unittest tests/test_training_consistency.py tests/test_training_delivery_profile.py`: 9 passed locally and in CI.
- `node --test tests/*.test.js`: 286 passed locally.
- All repository `validate_*.py` scripts passed locally; the combined `dev` checks and Cloudflare Pages deployment passed at commit `787846c`.
- CI runs the consistency validator and its Python tests for relevant catalogue, course, application, policy, runtime, and test changes.

## Development-environment smoke test

Completed on the merged development deployment for both launched course pages, the application routes, Terms, Conduct/Recording, and Privacy:

- Desktop, 390px, 360px, and 640px reflow equivalent to a 1280px viewport at 200% zoom had no horizontal overflow. Decision grids stacked to one column at the constrained widths.
- The shared certainty treatment computed to teal-only values: soft surface `rgb(240, 253, 250)`, text `rgb(17, 94, 89)`, and border/emphasis `rgb(15, 118, 110)`.
- `Confirmed`, `Currently planned`, and `Confirmed before payment` remained explicit text. Keyboard navigation advanced in order and showed a solid 3px teal focus outline.
- Both launched pages exposed one `<h1>`, age, total workload, IST, planned cohort range, and safe closed transactional actions when no authorised runtime action was available.
- Unauthenticated application routes redirected to the email-verification gate without exposing the private form. Source and automated checks cover both launched course IDs, successful cohort override, malformed/unknown/network failure, and JavaScript-disabled closed-action fallback.
- Terms, Conduct/Recording, and Privacy rendered without overflow and exposed policy version `1.1.0` with the corrected certificate, recording, and WhatsApp commitments.
- Browser console output contained only a Chrome-extension message-channel warning; no site-script warning or error was observed.

## Fresh learner re-review

Pending the final development deployment. Ask at least one fresh learner unfamiliar with the implementation the 14 questions in issue #442 without coaching. Record only answer correctness, search effort, confusing wording/layout, viewport category, and resulting changes. Do not record identity or raw sensitive feedback. Critical or High confusion must be resolved before production readiness.

## Residual boundary

The checks validate source-controlled public commitments and known rendering hooks. They do not reproduce backend cohort, application, payment, attendance, recording-consumption, or certificate business logic.
