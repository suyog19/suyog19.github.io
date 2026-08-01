# Issue #385: Training discoverability audit

Audit date: 1 August 2026

## Route classification

| Classification | Routes | Search treatment |
|---|---|---|
| Public and indexable | `/training/`; the five canonical course pages; `/training/provider/`; `/training/policies/`; terms, cancellation/refunds, and conduct/recording policies | Self-canonical, complete social metadata, crawlable HTML, and included in `sitemap.xml` |
| Public but noindex | `/training/register-interest/` | `noindex, nofollow`; excluded from the sitemap because its content is transactional and selected dynamically |
| Duplicate public policy alias | `/training/policies/privacy/` | `noindex, follow`; canonicalized to the durable `/privacy/` notice and excluded from the sitemap |
| Private or operational | `/apply/`, `/my-learning/` and its balance/change/payment routes, `/admin/` | `noindex, nofollow`; excluded from the sitemap |
| Legacy redirect | `/training/python-foundations-ai-data/`, `/training/applied-python-ai-ml/` | `noindex`, canonicalized and redirected to the replacement course URL; excluded from the sitemap |

The canonical course routes are:

- `/training/python-foundations-for-data-science/`
- `/training/applied-data-analysis-with-python/`
- `/training/practical-machine-learning-foundations/`
- `/training/generative-ai-application-development/`
- `/training/engineering-reliable-ai-systems/`

## Crawl and content findings

- Every canonical course is linked with a normal anchor from the Training hub and appears in the production sitemap.
- Every indexable Training page has a unique title, description, canonical URL, H1, Open Graph block, Twitter block, and useful static HTML.
- Course titles and introductory copy accurately distinguish launched courses from in-pipeline courses. Pipeline metadata does not announce an unconfirmed schedule or fee.
- Home, About, Writing, and Systems now provide contextual crawlable paths into Training. The global navigation remains an additional site-wide path.
- Registration, application, learner, payment, and admin surfaces remain outside the index and sitemap.

Run `python scripts/validate_training_discoverability.py` to enforce these boundaries.

## Measurement baseline

The existing privacy-safe GA4 contract records course discovery without learner PII. It includes page views, primary-CTA views/clicks, curriculum interactions, readiness results, course-journey navigation, policy/instructor clicks, and pipeline interest interactions. Event properties are limited to course identifiers, stage/availability state, CTA location, curriculum position, and readiness result.

Google Search Console account data is not available from this repository, so impressions, indexed-page counts, common queries, and URL-inspection submission evidence could not be captured locally. The production sitemap is the submission source of truth. After the promotion reaches production, record the Search Console baseline for the 11 indexable Training URLs and request re-crawling for the hub and five course pages if needed.
