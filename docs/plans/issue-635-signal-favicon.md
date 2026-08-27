# Issue #635 — Software Signal favicon

## UX applicability

UX brief required. The change is mechanically small but updates a global visual-identity mark visible in browser chrome across every public page.

## Context and recommendation

The existing near-black `SJ` favicon represents the earlier personal-site identity. The accepted cross-site direction now presents Software Signal as the professional platform, endorsed by Suyog Joshi, and uses a compact Signal Red `SS` mark in the shared header.

Senior UX strongly recommends one global favicon: a white `SS` monogram on Signal Red (`#b91c1c`). A separate Learning favicon or a more decorative mark would create an unnecessary second identity.

## User and goal

A returning visitor should recognize a Software Signal tab quickly and encounter the same identity on the main site and Learning routes. The favicon must remain distinct and legible in small browser-tab and bookmark contexts.

## Design invariants

1. At 16, 32, and 48 px, the mark reads as a compact white `SS` rather than an indistinct texture.
2. The square Signal Red field and white monogram remain recognizable against both light and dark browser chrome.
3. The favicon feels like the shared header mark at browser-chrome scale; it does not introduce a separate logo style.
4. Main-site, Learning, and nested public routes resolve the same global asset without broken relative paths.

## Implementation direction

- Preserve the existing square-monogram construction and dependency-free SVG approach.
- Replace `SJ`/near-black with `SS`/Signal Red.
- Keep the SVG and multi-resolution ICO visually synchronized.
- Do not change headers, logos, page layouts, or broader brand tokens.

## Feasibility

The static architecture already uses root-level `favicon.svg` and `favicon.ico` assets. Updating those shared files requires no page markup, dependency, route, or responsive-layout change. The SVG remains the primary scalable source; the ICO supplies synchronized fallback sizes.

## Review evidence

Review the isolated mark at 16, 32, and 48 px on both light and dark neutral surrounds, then load representative root, one-level, two-level, and three-level routes in a browser to confirm resolution. Senior UX acceptance remains separate from functional and independent review.
