# Issue #433 course-page validation

## Event contract

Course pages emit the three decision-section view events once per page load at 35% visibility, stable FAQ topic opens, and primary CTA clicks with course identity, CTA location, viewport category, and booleans recording whether participation and application-process sections were already viewed. No learner, application, payment, capacity, answer, or free-text data is sent.

## Clarity feedback

Launched pages use the existing `/feedback` endpoint with `targetType: PAGE`, a stable `<course-slug>-application-decision` target ID, and the `course-decision` widget variant. Yes maps to `THUMBS_UP`; Not yet maps to `THUMBS_DOWN`; the optional missing-information note remains bounded to 1,800 characters. Source URLs omit query parameters.

## Automated and device validation

- Full Node test suite: 277 tests passed locally, including explicit JavaScript-disabled transactional-action checks.
- Catalogue, commercial, canonical-link, and public-route validators: passed locally.
- Desktop, tablet (768px), 390px, 360px, and 640px reflow equivalent to a 1280px viewport at 200% zoom passed with no horizontal overflow or console warnings. Decision cards stack to one column, and the clarity prompt remains above the final CTA.
- Keyboard activation of `Not yet` reveals the optional form, updates `aria-pressed`, advances focus in logical order, and retains a visible solid focus outline.
- Screen-reader semantics spot check passed: one page `<h1>`, logical section headings, text certainty labels, labelled feedback group and textarea, descriptive button text, `aria-pressed` state, and polite live status.
- API-failure tests confirm that unknown, malformed, and network-failure responses hide transactional actions. JavaScript-disabled source checks confirm that every launched-page Apply/Get notified action starts hidden while planning, curriculum, and `<noscript>` recovery guidance remain available.

## Learner validation

The product owner confirmed that the development pages were presented to learners and further feedback was collected. The non-sensitive synthesis became follow-up issues #441, #442, and #443: remove stale and duplicated commitments, prevent cross-surface drift, and restore the established teal-only Training palette. Participant identity and raw feedback are intentionally not stored in the repository.

Issue #442 owns the final fresh-learner re-review after those follow-ups are available together on the development deployment.

## Residual limitation

The original review produced actionable follow-up scope rather than a production release. Final release readiness now depends on completing #441–#443, the fresh re-review recorded for #442, and resolving any Critical or High confusion.
