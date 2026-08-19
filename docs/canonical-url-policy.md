# Canonical URL Policy

Public pages use directory-style URLs consistently. For example, use
`https://suyogjoshi.com/writing/` and `/writing/`, never an explicit
`index.html` URL.

## Hosting behaviour

- The development deployment runs on Cloudflare Pages. Cloudflare Pages
  automatically redirects `/index.html` and nested `*/index.html` requests to
  their extensionless directory equivalents with a permanent `308` response.
- Production runs on GitHub Pages. GitHub Pages serves `index.html` as the
  directory entry point but provides no repository-level facility for a
  site-wide permanent redirect from explicit `index.html` paths. Production
  therefore uses directory-style internal links, canonicals, Open Graph URLs,
  structured-data URLs, and sitemap entries as its unambiguous fallback.
- URL fragments are browser-side state and are not sent to the hosting server.
  Cloudflare's redirect preserves tested query strings; browsers carry an
  original fragment through a redirect whose `Location` has no fragment.

Private learner, application, interest-registration, and administration routes
use the same directory-style canonical form while retaining `noindex,
nofollow`.

## Regression validation

Run:

```powershell
python scripts/validate_canonical_urls.py
```

The validator checks every HTML page for canonical and Open Graph consistency,
directory-style structured-data URLs, private-route indexing controls, existing
sitemap targets, explicit `index.html` links, broken local links/resources, and
missing in-page fragment targets. `python scripts/generate_sitemap.py --check`
adds the reverse guarantee that every indexable canonical page appears exactly
once and every noindex, private or non-canonical page is excluded. Run
`python scripts/validate_public_seo.py` for the complete public publishing contract.
The same validation runs for pull requests and pushes targeting `dev` or `main`.
