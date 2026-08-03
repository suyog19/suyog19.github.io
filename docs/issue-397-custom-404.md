# Issue #397 — Custom 404 recovery

## Recovery contract

The repository-level `404.html` is the GitHub Pages fallback for unknown public routes. It provides stable links to Home, Writing, Systems, Training, About, and Contact without reading, displaying, or guessing from the missing request path or query string.

The page uses `noindex, follow`, is intentionally absent from `sitemap.xml`, and has no canonical tag. Canonicalizing an error response to Home would risk making the result look like a soft 404.

## Dependencies and boundaries

- #391's public search/discovery experience is not yet available, so this page does not present a non-existent search control. The durable Writing, Systems, and Training hubs remain the no-JavaScript discovery path and can later link to public search when #391 supplies it.
- The known moved Training URLs are handled explicitly by `_redirects`, including slash and no-slash variants. The error page does not guess replacements or duplicate redirect logic in JavaScript.
- Private learner, application, payment, and admin routes are not exposed as recovery destinations.

## Privacy-safe analytics

GA4 remains present to satisfy the site's publishing convention, but automatic page-view collection is disabled. The manual event reports only the fixed location `https://suyogjoshi.com/404`, fixed path `/404`, fixed title `Page not found`, and an empty referrer. No runtime path, query, fragment, token, or referrer value is read.

## Validation

`python scripts/validate_custom_404.py` checks the recovery links, `noindex` treatment, lack of a canonical tag, root-relative local assets, private-route boundary, sanitized analytics, sitemap/feed exclusion, and explicit permanent redirects for known moved Training routes.

The deployed branch preview and production site must additionally prove that an arbitrary unknown route returns the branded page with HTTP status 404. Responsive browser checks cover mobile, desktop, keyboard navigation, and 200% zoom.
