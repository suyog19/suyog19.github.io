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

- `python scripts/validate_training_consistency.py`: passed locally.
- `python -m unittest tests/test_training_consistency.py tests/test_training_delivery_profile.py`: passed locally.
- Full Node suite and all repository `validate_*.py` scripts: to be recorded after the issue diff is complete.
- CI runs the consistency validator and its Python tests for relevant catalogue, course, application, policy, runtime, and test changes.

## Development-environment smoke test

To be completed on the merged development deployment for both launched course pages, the application routes, Terms, Conduct/Recording, and Privacy:

- desktop, 390px mobile, keyboard navigation, and 200% reflow;
- successful runtime cohort/action response and safe API failure;
- JavaScript-disabled public fallback;
- policy version `1.1.0` and corrected launched-course commitments.

## Fresh learner re-review

Pending the final development deployment. Ask at least one fresh learner unfamiliar with the implementation the 14 questions in issue #442 without coaching. Record only answer correctness, search effort, confusing wording/layout, viewport category, and resulting changes. Do not record identity or raw sensitive feedback. Critical or High confusion must be resolved before production readiness.

## Residual boundary

The checks validate source-controlled public commitments and known rendering hooks. They do not reproduce backend cohort, application, payment, attendance, recording-consumption, or certificate business logic.
