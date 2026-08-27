# Issue 606 delivery record

## Decision

Use pinned Playwright Chromium for the smallest reliable rendered-behavior layer,
retain existing Python/Node validators for exhaustive static contracts, and run
both in a dedicated PR/push workflow. This is a development-only test dependency;
the production site remains hand-authored and dependency-free at runtime.

Alternatives rejected:

- source-only Node assertions cannot prove mobile menu, focus, navigation, or
  form behavior in a browser;
- an additional test server or application framework is unnecessary;
- exhaustive browser tests for every card and route would duplicate static
  checks and create brittle maintenance cost;
- live third-party/backend submissions would make CI unsafe and flaky.

## BEFORE-state proof

The suite commit `4501400abe8ef6436992c46c30c7627436c55912` was run locally
against its static rendered source. Compared with accepted `dev` at
`8da75cfe1a826125bd6cfe1b9f976de96e21e4ae`, that revision changes test,
workflow, validator, and documentation-support files only—no public HTML, CSS,
JavaScript, sitemap, route, or production integration behavior.

- Browser: 13 passed, 0 failed, 0 skipped, 0 flaky.
- Route inventory: 66/66 HTTP 200 and 66/66 expected self-canonical.
- Internal links/assets: pass across 79 HTML pages and 66 sitemap URLs.
- Representative browser health: zero site-attributed console errors and zero
  local HTTP/resource failures on eight major surfaces.
- Baseline defects found by this suite: none.
- Evidence: [`issue-606-before-state.json`](../evidence/issue-606-before-state.json).
- Operating guide: [`browser-regression.md`](../engineering/browser-regression.md).

## Scope and gates

- UX applicability: brief not required; test/CI/documentation work changes no
  rendered public experience.
- Gates A-D: not applicable. Automated functional regression is explicitly
  separate from Senior UX rendered review.
- No #607 implementation or broad redesign is included.
- Exact-revision architecture, functional QA, CI, and fresh independent review
  remain required before merge.
