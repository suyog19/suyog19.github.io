# Non-production indexing boundary

Production is intentionally indexable at `https://suyogjoshi.com`. Development and
preview deployments must not become search results or competing canonical identities.

## Host inventory and controls

| Environment | Host pattern | Indexing control |
| --- | --- | --- |
| Production | `suyogjoshi.com` | No `X-Robots-Tag`; page-level metadata and `robots.txt` remain authoritative. |
| Stable development | `dev.suyogjoshi.com` | Host-scoped `_headers` rule emits `X-Robots-Tag: noindex, nofollow`. |
| Stable Pages project | `suyogjoshi-dev.pages.dev` | Host-scoped `_headers` rule emits `X-Robots-Tag: noindex, nofollow`. |
| Branch and commit previews | Cloudflare-generated preview subdomains | Cloudflare Pages supplies `X-Robots-Tag: noindex` on preview responses. Preview aliases are platform-generated and are not a finite repository-owned host list. |

The `_headers` rules are absolute and limited to the two stable non-production
hosts. No development-only robots metadata belongs in shared HTML. GitHub Pages
does not interpret Cloudflare's `_headers` configuration, and the deployed-host
validator separately fails if production ever emits an `X-Robots-Tag` response.

`robots.txt` and `sitemap.xml` can remain reachable on development deployments.
They are not the enforcement boundary; the response header or an access restriction
is. Canonical page metadata continues to identify only the production URL.

## Regression validation

Run the network check against the stable deployed hosts:

```powershell
python scripts/validate_deployment_indexing.py
```

The check covers the home page, Writing index, a Writing article, Systems index,
Training index, and a course detail page. Each non-production response must either
be access-restricted or emit both `noindex` and `nofollow`. Each production response
must succeed without `X-Robots-Tag`.

The `Validate deployment indexing boundaries` workflow retries after changes to
`dev`, can be run manually, and runs weekly to detect hosting drift. This deployed
check is intentionally separate from `scripts/validate_public_seo.py`, which validates
repository artifacts offline.

If a search-engine audit later finds a non-production URL indexed, request removal
only after this response-level control is live. The August 2026 audit found no
confirmed indexed non-production URLs, so no removal action was warranted.
