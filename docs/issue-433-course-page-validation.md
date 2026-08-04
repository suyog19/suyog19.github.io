# Issue #433 course-page validation

## Event contract

Course pages emit the three decision-section view events once per page load at 35% visibility, stable FAQ topic opens, and primary CTA clicks with course identity, CTA location, viewport category, and booleans recording whether participation and application-process sections were already viewed. No learner, application, payment, capacity, answer, or free-text data is sent.

## Clarity feedback

Launched pages use the existing `/feedback` endpoint with `targetType: PAGE`, a stable `<course-slug>-application-decision` target ID, and the `course-decision` widget variant. Yes maps to `THUMBS_UP`; Not yet maps to `THUMBS_DOWN`; the optional missing-information note remains bounded to 1,800 characters. Source URLs omit query parameters.

## Automated and device validation

- Full Node test suite: 276 tests passed locally.
- Catalogue, commercial, canonical-link, and public-route validators: passed locally.
- Desktop, 390px, and 360px layout checks passed with no horizontal overflow or console warnings; the clarity prompt and operational support link remain above the final CTA.
- Tablet, 200% zoom, keyboard, visible focus, screen-reader spot checks, and final API-failure/JavaScript-fallback review remain part of the `dev` acceptance pass.

## Learner validation

The required three-to-five unfamiliar learner sessions cannot be truthfully completed by repository automation. Use the eight questions in issue #433 without coaching, record only answer correctness, search effort, confusing wording/layout, viewport category, and resulting changes, and add anonymised findings here before closing the issue. No participant identity or raw sensitive feedback belongs in this repository.

## Residual limitation

Human learner validation remains a release-readiness input. The implementation can be deployed for review, but issue #433 should remain open until those sessions are completed and any Critical or High confusion is resolved.
