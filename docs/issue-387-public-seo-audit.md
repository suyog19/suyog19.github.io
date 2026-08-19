# Issue #387 public SEO validation audit

## Decision

The repository keeps its hand-authored static HTML and focused validators. Public
page classification is derived from each HTML page's route, canonical and robots
metadata, with a short denylist for private/operational route families. That shared
inventory generates `sitemap.xml`; it is not a second content catalogue.

The inventory classifications are:

- `public-indexable`: self-canonical, production HTTPS, directory-form pages without
  `noindex`;
- `public-noindex`: intentionally public non-index pages such as `404.html`;
- `private-operational`: admin, application, learner, payment and registration flows,
  which must remain `noindex, nofollow`;
- `legacy-noncanonical`: `noindex` aliases whose canonical points to a real indexable
  replacement.

The generator emits `lastmod` only when a page exposes a visible semantic
`Last updated` `<time datetime="YYYY-MM-DD">`. It does not infer freshness from Git
or filesystem timestamps. Broader meaningful-update semantics remain owned by #398.

## Existing validator ownership

| Existing check | Existing owner retained | #387 action |
| --- | --- | --- |
| Canonical, `og:url`, structured-data URL form, local links, existing sitemap targets | `validate_canonical_urls.py` / `validate-canonical-urls.yml` | Reuse; add reverse sitemap completeness through the shared inventory. |
| Article `BlogPosting` schema | `validate_article_structured_data.py` / focused workflow | Reuse unchanged. |
| Person, WebSite and collection identity graph | `validate_site_identity.py` / focused workflow | Reuse unchanged. |
| Training catalogue schema | `validate_training_catalogue_schema.py` / focused workflow | Reuse unchanged. |
| Training indexability, aliases and sitemap rules | `validate_training_discoverability.py` | Reuse; the inventory generalizes the shared sitemap boundary. |
| Training prices, lifecycle and delivery consistency | Training commercial/consistency validators | Reuse unchanged. |
| Stable privacy routes | `validate_public_routes.py` / focused workflow | Reuse unchanged. |
| Feed and search generation, freshness and internal canonical destinations | `validate_public_discovery.py` plus `generate_public_discovery.py` | Reuse unchanged; umbrella command runs it. |
| Local images and social-preview metadata/assets | `validate_image_performance.py` / focused workflow | Reuse unchanged. |
| Error-page noindex and exclusion contracts | `validate_custom_404.py` / focused workflow | Reuse unchanged. |

## Original requirement disposition

| Requirement | Disposition |
| --- | --- |
| One authoritative public-page inventory | Genuinely missing; implemented in `scripts/public_page_inventory.py`. |
| Deterministic committed sitemap and drift check | Genuinely missing; implemented in `scripts/generate_sitemap.py`. |
| Reverse sitemap completeness and exclusion checks | Partially enforced; completed through inventory-to-sitemap set equality. |
| Production HTTPS, directory URLs and canonical target validity | Already enforced; retained and also inherent in inventory validation. |
| Remove `priority` and `changefreq` | Implemented by the generator; unsupported sitemap metadata fails validation. |
| Trustworthy optional `lastmod` mechanism | Implemented only for explicit visible Last updated dates; article update semantics remain #398. |
| Umbrella offline public SEO command | Genuinely missing; implemented in `scripts/validate_public_seo.py` by orchestration. |
| Consolidated CI safety net | Genuinely missing; added without removing focused workflows. |
| Search, canonical, structured data and social cross-consistency | Already owned by focused validators; orchestrated together, with sitemap completeness added. |
| Authoring guidance | Updated to generation, validation and committed-artifact workflow. |

The consolidated workflow intentionally has no path filter. Any change may run the
offline safety net, so a relevant SEO change cannot bypass it through an incomplete
path list.
