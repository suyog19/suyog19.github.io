# Frontend validation and test context

The repository has no build or lint step. Select validation proportionally to the
changed paths and the Effective Obligation Set. The complete public SEO safety net
is:

```powershell
python scripts/generate_sitemap.py
python scripts/validate_public_seo.py
```

The first command refreshes the committed artifact; the second checks sitemap
freshness and orchestrates the focused validators below. To check without writing,
run `python scripts/generate_sitemap.py --check`.

The complete focused local suite remains independently runnable:

```powershell
python scripts/validate_article_structured_data.py
python scripts/validate_canonical_urls.py
python scripts/validate_custom_404.py
python scripts/validate_image_performance.py
python scripts/validate_public_routes.py
python scripts/validate_public_discovery.py
python scripts/validate_site_identity.py
python scripts/validate_training_catalogue_schema.py
python scripts/validate_training_commercials.py
python scripts/validate_training_consistency.py
python scripts/validate_training_discoverability.py
python -m unittest tests/test_public_page_inventory.py
python -m unittest tests/test_training_consistency.py tests/test_training_delivery_profile.py
node --test tests/*.test.js
```

Existing `.github/workflows/validate-*.yml` files run relevant subsets on pull
requests and pushes to `dev` or `main`. `validate-public-seo.yml` runs the complete
umbrella command without path filtering, while focused workflows retain concise
ownership-specific failures. `.github/workflows/process-validation.yml` adds
canonical-process validation and must not replace or weaken those workflows.

For visible frontend changes, also render the actual nested routes at realistic
desktop and mobile widths, check asset/link depth, keyboard and focus behavior,
horizontal overflow, important states, console/resource failures, and semantics.
Material UX work follows `docs/ux/rendered-review.md`. Record skipped commands,
manual checks, and residual risks in the PR.
