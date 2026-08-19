# Issue #396 legacy public-route redirect audit

Audited on 19 August 2026 from the authoritative public-page inventory and the
deployed production and development hosts.

## Inventory and destinations

The repository has exactly three `legacy-noncanonical` pages. No Writing,
Systems, Research, or other public aliases were found.

| Legacy route | One canonical destination | Repository evidence |
| --- | --- | --- |
| `/training/python-foundations-ai-data/` | `/training/python-foundations-for-data-science/` | Historical course slug retained as `compatibilityPath`; both slash variants have host rules. |
| `/training/applied-python-ai-ml/` | `/training/applied-data-analysis-with-python/` | Historical course slug retained as `compatibilityPath`; both slash variants have host rules. |
| `/training/policies/privacy/` | `/privacy/` | Existing non-self canonical Training summary; consolidated into the site-wide canonical Privacy Notice. |

The first two aliases remain documented in the historical #385 audit. The
Training catalogue keeps their compatibility paths because external links may
survive indefinitely. No verified external-backlink inventory is available, and
no typo or keyword-based redirect was invented.

Controlled Training policy links and the active learner-experience matrix now use
the canonical destinations. Historical audit references, compatibility metadata,
and validators intentionally retain legacy strings as evidence or guardrails.

## Hosting behavior

Baseline requests before implementation showed:

| Environment | Course aliases | Training privacy alias | Query behavior |
| --- | --- | --- | --- |
| GitHub Pages production | Slash URL returned the static fallback with `200`; no-slash normalized to slash with `301`. | Static summary returned `200`. | GitHub's no-slash normalization preserved the query. |
| Cloudflare development | `_redirects` returned one direct `301` to each course destination. | No host rule existed, so the page returned `200`. | Pages preserved the incoming query on the redirect. |

The implementation adds matching slash/no-slash `301` rules for all three aliases.
Cloudflare Pages applies `_redirects` before static assets; GitHub Pages does not
consume that file, so production retains the HTML fallback. Cloudflare documents
the supported Pages redirect format and that fragments never reach the server:
[Cloudflare Pages redirects](https://developers.cloudflare.com/pages/configuration/redirects/).

Cloudflare Pages currently preserves incoming query strings for these static rules,
as confirmed by the deployed request. Its `_redirects` syntax does not expose the
explicit `preserve_query_string: false` control available in account-level Redirect
Rules. Changing account routing or adding a Function solely to strip this state is
outside #396. The repository no longer appends any query or fragment in JavaScript;
all HTML mechanisms target the clean canonical directory URL.

## Fallback and validation decision

Each alias now has the same smallest production-compatible fallback:

- `noindex, follow`;
- one destination canonical;
- one immediate meta refresh to that destination;
- one visible keyboard-accessible link with concise moved-page copy;
- no JavaScript and therefore no client-side query/fragment propagation.

`scripts/validate_legacy_redirects.py` derives aliases from
`public_page_inventory.py`; it does not maintain another redirect catalogue. It
checks fallback agreement, clean direct destinations, slash variants, permanent
status, duplicate/extra rules, chains/loops, missing targets, controlled HTML links,
and sitemap/feed/search exclusion. `validate_public_seo.py` runs it as part of the
complete offline publishing contract. Existing 404 and Training validators now
derive the legacy boundary from the same inventory.

## UX applicability and residual risk

**Lightweight UX note.** The change alters only obsolete-route transfer behavior,
not a current page hierarchy or design system. The static fallback preserves a clear
heading and one descriptive link without JavaScript. The canonical Privacy Notice
remains unchanged and continues to own all privacy truth.

Residual behavior is host-owned: Cloudflare preserves an incoming query on its
direct redirect, while URL fragments remain browser-side. The destination ignores
both, and the repository constructs no destination from untrusted state. Production
deployment verification remains required after the later human-controlled promotion.
