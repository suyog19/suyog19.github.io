# Issue #395 public performance audit

Measured on 19 August 2026 from the production CDN with Lighthouse 13.4.1.
Mobile uses Lighthouse's simulated mobile profile; desktop uses `--preset=desktop`.
Raw local file sizes are recorded only for deterministic repository budgets, not
as production transfer evidence.

## Representative cold-load baseline

| Page | Mobile score / LCP / CLS | Desktop score / LCP / CLS | Transfer / requests |
| --- | --- | --- | --- |
| Home | 98 / 1.83 s / .001 | 100 / .55 s / .026 | 376 KB / 16 mobile |
| Writing | 76 / 4.99 s / .002 | 100 / .57 s / .001 | 893 KB / 20 |
| Article | 88 / 3.40 s / .039 | 100 / .59 s / .028 | 492 KB / 14 |
| Topic hub | 80 / 4.29 s / 0 | 100 / .53 s / .004 | 284 KB / 12 |
| Systems | 80 / 4.30 s / 0 | 100 / .50 s / .001 | 283 KB / 12 |
| Training | 78 / 4.67 s / 0 | 100 / .52 s / .006 | 302 KB / 15 |
| Course | 74 / 5.25 s / .034 | 99 / .77 s / .022 | 402 KB / 22 |
| Search | 80 / 4.31 s / 0 | 100 / .53 s / .001 | 291 KB / 14 |
| Research survey | 63 / 8.60 s / .020 | 100 / .52 s / .001 | 4,868 KB / 102 |

Scores are context, not CI thresholds. Mobile variability is dominated by image,
font, analytics, and simulated-network timing already noted in #394.

## Cost findings and decisions

### Shared CSS and warm navigation

Production compressed transfer is approximately 1.1 KB for `base.css`, 2.3 KB for
`components.css`, 19.7 KB for `pages.css`, and 8.8 KB for `learning.css`. Lighthouse
reported roughly 10–19 KB unused CSS depending on the route, but the three common
stylesheets are cached for ten minutes and Google font files for one year. A broad
page-family split would add ownership and inclusion risk for a small one-time saving,
so the shared architecture remains. These cache headers make repeat reuse eligible,
but the supplied Lighthouse runs do not directly demonstrate a true warm-navigation
transfer saving. Training pages deliberately add `learning.css`;
the repository audit confirms unrelated routes do not load it.

Raw growth budgets preserve today's architecture with reviewed headroom: 3,000
bytes for base, 12,000 for components, 150,000 for pages, and 54,000 for learning.
They are deterministic change-review signals, not claims about network transfer.

Issue #607 intentionally expands the two smallest shared files to establish the
approved brand, navigation, responsive menu, focus, CTA/link, footer, and flexible
page-opening foundation. The accepted files are 3,322 raw bytes for `base.css` and
13,708 raw bytes for `components.css`; their deterministic review ceilings are now
3,600 and 14,500 bytes respectively (less than 9% headroom). The larger page-family
budgets are unchanged. This is reviewed foundation cost, not permission for
unbounded shared-style growth.

Issue #608 adds a responsive, semantic homepage Framework map and art-directed
homepage composition to `pages.css`. The accepted file measures 160,794 raw bytes;
its deterministic ceiling is 165,000 bytes (2.62% headroom). The homepage adds no
image, script, font, framework, or runtime dependency, and all other asset budgets
remain unchanged.

### Fonts

Rendered inspection found Inter 400/500/600 and Playfair Display 400/500/600/700.
No CSS uses Inter 300, so that unused requested weight is removed. Google currently
serves one Latin WOFF2 per family (about 47.3 KB Inter and 37.6 KB Playfair) because
the files cover multiple weights; removing the declaration improves the explicit
contract but is not represented as an 85 KB saving. Playfair 500 remains browser-
interpolated from the delivered variable font file. Existing `display=swap`, both
preconnects, family identity, and fallback stacks remain unchanged. Preload and
self-hosting were rejected because no additional critical-path benefit or approved
licensing/operations model was established.

### JavaScript and analytics

First-party JavaScript remains page-scoped and small: shared navigation is about
.5 KB compressed; search is 2.4 KB only on `/search/`; feedback is 3.4 KB on its
eligible pages; Training scripts are individually about 1–5 KB. Core content is
static before these enhancements. Combining or globally deferring them would not
produce a material benefit.

Google Analytics is asynchronous and transferred about 168 KB in these cold runs.
Measured total blocking time stayed 0–80 ms, with zero desktop TBT. Analytics is a
material transfer but not demonstrated to block core rendering, so its required
identity and privacy-safe event contract remain unchanged.

### Research third-party embed

The lazy Google Forms iframe entered the measured viewport and loaded immediately.
Compared with the deferred preview, it added about 4.58 MB and 89 requests; the
baseline trace classified 74 requests as fonts, or 78 when the four font stylesheet
requests are included. This was the only material avoidable
residual cost. The embed now loads only after the user
presses a disclosed native button; the direct Google Forms link remains available
with or without JavaScript.

## After evidence

The Cloudflare branch preview at commit `f2b8c04` used the same Lighthouse version
and profiles as the baseline:

| Research initial state | Mobile | Desktop |
| --- | --- | --- |
| Before | score 63; LCP 8.60 s; CLS .020; 4,868 KB; 102 requests | score 100; LCP .52 s; CLS .001; 4,869 KB; 102 requests |
| After | score 78; LCP 4.56 s; CLS 0; 286 KB; 13 requests | score 100; LCP .54 s; CLS .001; 287 KB; 13 requests |

The after trace contains only the site's two font files, font CSS, asynchronous
analytics, and eight first-party requests. No Google Forms document, script, or
form-owned font loads before activation. This removes about 94% of initial transfer
and 87% of requests from this page. After activation, browser review confirmed the
same titled Google Forms iframe loads successfully.

Rendered review covered 1440×900 desktop and 390×844 mobile at the feature state.
The default and loaded states had no horizontal overflow; the native button had a
unique accessible name and visible focus behavior; Enter activated one iframe; the
live status announced loading/completion; and the direct fallback remained visible.
Typography hierarchy, page rhythm, mobile reading order, and the existing research
and Training visual boundaries were preserved.

## Accepted residual costs

- Shared CSS stays global because its compressed cold cost is modest and its cache
  headers permit repeat reuse; raw size alone does not justify fragmentation.
- Google Fonts and Analytics remain because they support approved identity and
  measurement, and neither showed a material blocking/CLS regression.
- Course pages retain several small, scoped scripts because they progressively
  enhance distinct availability, feedback, authentication, and learner-context
  contracts without withholding core public content.
- The Google Form remains an external dependency after explicit activation; replacing
  the survey platform is outside this issue.
