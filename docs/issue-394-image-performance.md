# Issue #394 — Public-page image performance

Measured and implemented on 3 August 2026. The production baseline used Lighthouse 13.4.1 against `https://suyogjoshi.com`; the after measurement used the same Lighthouse version and profiles against the local feature branch served over HTTP. Mobile uses Lighthouse's default simulated mobile profile and desktop uses `--preset=desktop`.

## Inventory and decisions

- 94 static public `<img>` elements appear across 29 pages; the invoice demo creates one additional image dynamically.
- 90 referenced PNG display assets totalled 127,427,252 bytes. Quality-90 WebP alternatives total 10,759,146 bytes, a 91.6% storage/transfer reduction for the same intrinsic pixel dimensions.
- All static content images now declare their exact intrinsic `width` and `height`, `decoding="async"`, and an explicit eager/lazy policy.
- The first image on each article uses `loading="eager"` and `fetchpriority="high"`. Representative Lighthouse traces confirmed this template position as the desktop LCP image on both sampled articles and the mobile LCP image on the long article baseline. Every subsequent article diagram and every Systems image is lazy-loaded.
- Systems artwork remains SVG where it was already compact and crisp. The invoice demo's 2.9 MB scanned PNG now displays as a 422 KB WebP while retaining its dimensions and alt text.
- Training, Home, Writing index, Systems index, course detail, and About currently contain no content `<img>` elements. They remain in the measurement matrix as regression controls.
- Original PNG/JPEG files and all existing `og:image` and `twitter:image` URLs remain unchanged for social-crawler compatibility. Browser content uses WebP directly.

## LCP candidates

| Page type | Mobile LCP | Desktop LCP | Image priority decision |
|---|---|---|---|
| Home | Hero heading | Hero heading | No image priority |
| Writing index | Hero heading | Hero heading | No image priority |
| Recent article | Article heading | First/cover image | Eager, high priority |
| Long image-rich article | First/cover image | First/cover image | Eager, high priority |
| Systems index | Intro text | Intro text | No image priority |
| AI Workflow Lab | Intro paragraph | Intro paragraph | Demo images lazy |
| Training hub | Hero lead | Hero heading | No image priority |
| Course detail | Hero lead | Course heading | No image priority |
| About | Hero heading | Hero heading | No image priority |

## Lighthouse baseline and after evidence

Scores are performance scores. Times are milliseconds; transfer is Lighthouse total byte weight in KB. Absolute transfer for image-free control pages is higher locally because Python's development server does not apply the production compression/CDN path. The article reductions remain directly attributable to images and are also isolated below.

### Mobile

| Page | Score before → after | LCP before → after | CLS before → after | Total KB before → after |
|---|---:|---:|---:|---:|
| Home | 99 → 97 | 1,619 → 2,105 | 0.001 → 0.001 | 282 → 417 |
| Writing index | 79 → 97 | 4,468 → 2,103 | 0.000 → 0.001 | 278 → 421 |
| Recent image-rich article | 98 → 96 | 1,647 → 2,403 | 0.056 → 0.040 | 2,212 → 485 |
| Long article | 62 → 85 | 24,200 → 4,053 | 0.172 → 0.039 | 4,566 → 838 |
| Systems index | 80 → 98 | 4,316 → 1,952 | 0.001 → 0.001 | 276 → 403 |
| AI Workflow Lab | 76 → 97 | 4,535 → 2,102 | 0.000 → 0.001 | 281 → 414 |
| Training hub | 80 → 95 | 4,426 → 2,406 | 0.000 → 0.006 | 293 → 477 |
| Course detail | 75 → 93 | 5,034 → 2,555 | 0.034 → 0.043 | 386 → 582 |
| About | 78 → 98 | 4,506 → 1,953 | 0.000 → 0.041 | 277 → 403 |

### Desktop

| Page | Score before → after | LCP before → after | CLS before → after | Total KB before → after |
|---|---:|---:|---:|---:|
| Home | 100 → 100 | 505 → 564 | 0.027 → 0.026 | 282 → 417 |
| Writing index | 100 → 100 | 510 → 524 | 0.004 → 0.004 | 278 → 422 |
| Recent image-rich article | 88 → 100 | 1,564 → 564 | 0.154 → 0.026 | 2,212 → 485 |
| Long article | 78 → 99 | 4,095 → 845 | 0.055 → 0.011 | 4,566 → 838 |
| Systems index | 100 → 100 | 534 → 483 | 0.001 → 0.002 | 276 → 403 |
| AI Workflow Lab | 100 → 100 | 523 → 523 | 0.004 → 0.002 | 281 → 417 |
| Training hub | 100 → 100 | 521 → 566 | 0.006 → 0.006 | 293 → 477 |
| Course detail | 100 → 100 | 602 → 604 | 0.018 → 0.022 | 386 → 582 |
| About | 100 → 100 | 500 → 483 | 0.032 → 0.031 | 277 → 403 |

### Isolated image transfer

Lighthouse loaded both PNGs on the recent article before the change (1,926 KB) but only its eager WebP cover after the change (50 KB). On the long article it loaded all six PNGs before the change (4,280 KB); WebP plus lazy loading reduced initial-run image transfer to 397 KB. Deferred diagrams were separately scrolled into view and verified to load successfully at their original intrinsic dimensions.

## Validation and quality checks

- `python scripts/validate_image_performance.py` verifies local references, exact declared dimensions, alt presence, loading/decoding policy, no more than one high-priority image per article, WebP display use, dynamic-demo markup, and PNG/JPEG social fallbacks.
- The same validation runs in GitHub Actions for relevant HTML, image, JavaScript, script, and workflow changes.
- Browser checks covered the recent and long articles at 390×844 and 1440×900, all six deferred diagrams in the long article, and the scanned-invoice scenario. No horizontal overflow or broken images was observed.
- Quality-90 WebP output was reviewed at original resolution on text-heavy editorial artwork and on the scanned invoice; labels and document text remain readable, with zoom retaining the original pixel dimensions.

## Residual risks and follow-up

- Search Console/Core Web Vitals field data was not available in the repository or through an authenticated connector, so this issue records Lighthouse lab evidence only. Field CWV should be reviewed after sufficient production traffic accumulates.
- Local after measurements use an uncompressed development server; image-specific byte totals are the reliable transfer comparison, while control-page total bytes should not be interpreted as a production regression.
- Lighthouse runs vary with network and third-party font/analytics timing. The acceptance target is the structural improvement and material image reduction, not a guaranteed score.
- PNG originals remain in the repository because current social metadata deliberately references them. Removing those originals would break social preview compatibility.
