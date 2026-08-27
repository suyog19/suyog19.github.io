# Issue 604 current-production baseline

This is the Phase 0 **before** contract for epic #603. It records the production
site without redesigning or correcting it. Later work must compare intentional
changes with this evidence and classify every affected public route as
`preserved`, `redirected`, or `intentionally retired`.

UX applicability: **UX brief not required**. This is evidence-only work with no
change to layout, hierarchy, navigation, interaction, content, or responsive
behavior. The rendered-review process is used to capture the existing state, not
to accept a new design.

## Production reference

- Capture window: **27 August 2026, 01:26-01:31 UTC** (06:56-07:01 IST).
- Origin: `https://suyogjoshi.com`.
- Production repository reference: `origin/main` at
  `a6420ee8519e96da15845347b78e4d7c3fc3da89`, merged 26 August 2026 at
  20:16:32 IST.
- Baseline crawler: `python scripts/capture_production_baseline.py`, user agent
  `suyogjoshi-baseline-capture/1.0`.
- Browser evidence: Chrome at deterministic 1440x900 and 390x844 viewports.
- Quality evidence: Lighthouse 13.4.1, default simulated mobile and desktop
  preset, against production.

The production reference is the current `main` revision at capture time and was
cross-checked against the live sitemap, page titles, canonicals, and the latest
successful `main` validation runs. The GitHub Pages `builds/latest` API returned
an obsolete May 2026 record and is therefore not used as deployment proof.

## Evidence index

- [Public route inventory](evidence/issue-604-public-route-inventory.csv) - 66
  sitemap routes with status, title, canonical, sitemap membership, and inbound
  internal-link evidence.
- [Site-integrity summary](evidence/issue-604-site-integrity.json) - sitemap and
  same-origin link crawl outcome.
- [Browser capture metadata](evidence/issue-604/browser-captures.json) - exact
  URL, viewport, page metadata, overflow, console, and state data.
- [Keyboard-focus evidence](evidence/issue-604/keyboard-focus.json) - first ten
  homepage tab stops and rendered focus outline.
- [Quality baseline](evidence/issue-604/quality-baseline.json) - concise
  Lighthouse scores and browser observations. Raw Lighthouse JSON remains
  transient because six reports total several megabytes and can be reproduced.

### Rendered visual baseline

The curated screenshot set is intentionally limited to major page families and
material public states. The homepage also has one full-page desktop capture to
preserve whole-page rhythm; all other files are directly comparable viewport
captures.

| Surface/state | Desktop 1440x900 | Mobile 390x844 |
|---|---|---|
| Homepage default | [viewport](evidence/issue-604/screenshots/604-i1-home-1440x900-default.png) · [full page](evidence/issue-604/screenshots/604-i1-home-1440x900-default-fullpage.png) | [default](evidence/issue-604/screenshots/604-i1-home-390x844-default.png) · [menu open](evidence/issue-604/screenshots/604-i1-home-390x844-menu-open.png) |
| Consulting | [desktop](evidence/issue-604/screenshots/604-i1-consulting-1440x900-default.png) | [mobile](evidence/issue-604/screenshots/604-i1-consulting-390x844-default.png) |
| Website Services | [desktop](evidence/issue-604/screenshots/604-i1-website-services-1440x900-default.png) | [mobile](evidence/issue-604/screenshots/604-i1-website-services-390x844-default.png) |
| Learning/Training | [desktop](evidence/issue-604/screenshots/604-i1-training-1440x900-default.png) | [mobile](evidence/issue-604/screenshots/604-i1-training-390x844-default.png) |
| Writing | [desktop](evidence/issue-604/screenshots/604-i1-writing-1440x900-default.png) | [mobile](evidence/issue-604/screenshots/604-i1-writing-390x844-default.png) |
| Systems | [desktop](evidence/issue-604/screenshots/604-i1-systems-1440x900-default.png) | [mobile](evidence/issue-604/screenshots/604-i1-systems-390x844-default.png) |
| About | [desktop](evidence/issue-604/screenshots/604-i1-about-1440x900-default.png) | [mobile](evidence/issue-604/screenshots/604-i1-about-390x844-default.png) |
| Contact | [desktop](evidence/issue-604/screenshots/604-i1-contact-1440x900-default.png) | [default](evidence/issue-604/screenshots/604-i1-contact-390x844-default.png) · [empty-submit errors](evidence/issue-604/screenshots/604-i1-contact-390x844-validation-error.png) |
| Newsletter | [desktop](evidence/issue-604/screenshots/604-i1-newsletter-1440x900-default.png) | [mobile](evidence/issue-604/screenshots/604-i1-newsletter-390x844-default.png) |
| Representative article | [desktop](evidence/issue-604/screenshots/604-i1-article-detail-1440x900-default.png) | [mobile](evidence/issue-604/screenshots/604-i1-article-detail-390x844-default.png) |
| Representative system detail | [desktop](evidence/issue-604/screenshots/604-i1-system-detail-1440x900-default.png) | [mobile](evidence/issue-604/screenshots/604-i1-system-detail-390x844-default.png) |

Representative article: `/writing/ai-governance-without-bureaucracy/`.
Representative system detail: `/systems/ai-workflow-lab/`.

## Public route inventory and migration contract

The production sitemap contained **66 routes**: home (1), other primary/public
surfaces (10), Systems (9), Training (11), and Writing (35). Every route returned
HTTP 200 and declared the expected self-canonical production URL. The crawl found
86 distinct same-origin page destinations; the 20 destinations not present in
the sitemap were checked separately and none returned 4xx/5xx.

The CSV is the authoritative per-route inventory. Its `inbound_internal_link_*`
columns identify controlled discovery paths for migration planning. A zero count
means no inbound link was observed in the sitemap-page crawl, not proof that no
external or private link exists.

Before changing a route, add one of these dispositions to the implementing issue
or PR:

| Disposition | Required evidence |
|---|---|
| `preserved` | Same public path remains reachable and canonical. |
| `redirected` | Old path, permanent destination, canonical target, updated controlled links, and deployed redirect-chain result. |
| `intentionally retired` | Product-owner approval, reason, inbound-link treatment, sitemap removal, and recovery behavior. |

Operational/private routes (`/admin/`, `/apply/`, `/my-learning/`, and training
interest registration) are deliberately outside this **public sitemap** contract.
They remain protected by their existing noindex and functional test contracts.

## Interaction contract

`Preserve` means later work must retain the outcome unless a child issue explicitly
approves a change. No production form was submitted during capture.

| ID | Surface | User action | Current expected outcome | Default |
|---|---|---|---|---|
| NAV-01 | Desktop header | Activate logo | Home loads. | Preserve |
| NAV-02 | Desktop header | Activate Software Signal, Consulting, Learning, Website Services, Writing, About, or Subscribe | Corresponding approved directory landing loads; current page is indicated with `aria-current` where applicable. Before #607 this was Training, Writing, Systems, About, and Contact; #605 Product Owner approval intentionally moved Systems and Contact to footer discovery and added the professional-platform destinations. | Intentionally changed by #607 |
| NAV-03 | Mobile header | Activate Toggle navigation | Primary navigation becomes visible and the button exposes `aria-expanded=true`. | Preserve |
| NAV-04 | Mobile header | Activate a primary item | Destination loads and menu does not block the new page. | Preserve |
| NAV-05 | Mobile header | Press Escape or click outside an open menu | Menu closes and focus/reading flow remains usable. | Preserve |
| HOME-01 | Homepage hero | Activate Explore the Framework | `/framework/` loads. This intentionally replaces the #604 `Explore training` hero behavior under the approved #605/#608 hierarchy; Learning remains available later on Home. | Approved change in #608 |
| HOME-02 | Homepage hero | Activate Browse writing | `/writing/` loads. | Preserve |
| HOME-03 | Homepage learning section | Activate starting-point or pathway CTA | Relevant Training fragment loads. | Preserve |
| HOME-04 | Homepage cards | Activate writing or system card | The selected canonical detail page loads. | Preserve |
| CON-01 | Consulting | Activate primary enquiry CTA | Contact journey loads with Consulting context. | Preserve |
| WEB-01 | Website Services | Activate primary enquiry CTA | Contact journey loads with Website Services context. | Preserve |
| LEARN-01 | Training | Activate course card/details | Canonical course detail loads. | Preserve |
| LEARN-02 | Course detail | Activate eligible application/interest CTA | Existing application or interest-registration journey starts with course/source context. | Preserve |
| WEEKLY-01 | Homepage/Newsletter | Activate About the newsletter | `/newsletter/` loads. | Preserve |
| WEEKLY-02 | Newsletter embed | Enter email and request subscription | beehiiv confirmation flow begins; subscription starts only after email confirmation. | Preserve |
| WRITE-01 | Writing | Activate article, series, or topic card | Canonical detail/hub loads. | Preserve |
| WRITE-02 | Article detail | Activate original-source link where present | The declared external source opens. | Preserve |
| WRITE-03 | Article detail | Submit feedback | Existing anonymous feedback contract returns accepted/success or an accessible error. | Preserve |
| SYS-01 | Systems | Activate a system card | Canonical system detail loads. | Preserve |
| SYS-02 | AI Workflow Lab | Activate a demo | Nested interactive demo loads. | Preserve |
| FOOT-01 | Footer | Activate internal link | Canonical destination loads. | Preserve |
| EXT-01 | Footer/About/Card | Activate LinkedIn, Medium, or GitHub | Declared external profile opens. | Preserve |
| CONTACT-01 | Contact | Submit empty form | Name, email, and message receive visible accessible errors; no request is sent. | Preserve |
| CONTACT-02 | Contact | Submit malformed/short values | Field-specific validation explains the correction; no request is sent. | Preserve |
| CONTACT-03 | Contact | Submit valid form | `/messages` receives the current payload; HTTP 202 produces the success outcome. | Preserve |
| CONTACT-04 | Contact | Receive API/transport failure | General accessible fallback is shown and entered context is not silently presented as sent. | Preserve |
| SEARCH-01 | Search | Enter a query/select a result | Matching public content is exposed and canonical result loads. | Preserve |
| SUPPORT-01 | Support | Activate a supported contribution option | Existing provider journey/availability state is shown without implying success before provider confirmation. | Preserve |

The observed empty-submit state exposed three alerts and bound each invalid field
with `aria-invalid=true` and `aria-describedby`. The first ten homepage keyboard
stops followed logo, desktop navigation, then primary content CTAs; each showed a
solid 2px focus outline.

## Content preservation inventory

The inventory protects content value, not immutable wording or layout.

| ID | Content/assets to account for before removal | Current evidence |
|---|---|---|
| CONTENT-01 | Founder identity, 20+ years of experience, banking/payments credibility, AI/software focus | Home and About |
| CONTENT-02 | Consulting proposition, discovery expectations, enquiry path, consulting analytics/context | `/consulting/`, Contact integration |
| CONTENT-03 | Website Services proposition, process, scope cues, enquiry path, service analytics/context | `/website-services/`, Contact integration |
| CONTENT-04 | Software Signal Learning journey, five-stage catalogue, launched/pipeline states, provider and policy material | `/training/` and 10 sitemap descendants |
| CONTENT-05 | Published writing catalogue, series, topic hubs, article metadata, original-source links, feedback targets | `/writing/` and 34 sitemap descendants |
| CONTENT-06 | Systems catalogue, system case studies, AI Workflow Lab and four nested demos | `/systems/` and 8 sitemap descendants |
| CONTENT-07 | Software Signal Weekly proposition, privacy disclosure, beehiiv confirmation entry points | Home and `/newsletter/` |
| CONTENT-08 | Research survey and its purpose/context | `/research/ai-teaching-workflows/` |
| CONTENT-09 | Public search and generated search index | `/search/`, `data/search-index.json` |
| CONTENT-10 | Support/sponsorship surfaces and provider-status truth | `/support/`, related evidence/contracts |
| CONTENT-11 | Contact form validation, payload, host selection, success/error behavior, and contextual enquiry parameters | `/contact/`, `js/contact.js` |
| CONTENT-12 | Digital card, downloadable vCard, QR asset, external identity destinations | `/card/`, `card/suyog-joshi.vcf`, `assets/card-qr.svg` |
| CONTENT-13 | Privacy notice and Training policies | `/privacy/`, `/training/policies/` descendants |
| ASSET-01 | Social previews listed in `data/social-previews.json` | `assets/social-previews/` |
| ASSET-02 | Article covers and explanatory diagrams, including WebP delivery variants | `writing/**` image assets |
| ASSET-03 | Shared restrained editorial tokens, Playfair Display/Inter typography, and established red accent | `css/base.css`, `css/components.css`, `css/pages.css` |

## Quality baseline

| Sample/profile | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| Home mobile | 76 | 96 | 77 | 100 | 4.9 s | 0 | 60 ms |
| Home desktop | 99 | 96 | 77 | 100 | 0.7 s | 0.027 | 0 ms |
| Contact mobile | 75 | 95 | 100 | 100 | 4.8 s | 0 | 130 ms |
| Contact desktop | 99 | 95 | 100 | 100 | 0.7 s | 0 | 0 ms |
| Article mobile | 74 | 100 | 100 | 100 | 5.1 s | 0 | 120 ms |
| Article desktop | 100 | 100 | 100 | 100 | 0.6 s | 0.001 | 0 ms |

Recorded baseline findings, not fixes:

- automated contrast findings affect sampled Home and Contact pages;
- a visible-label/accessibility-name mismatch audit appears in sampled reports;
- Home best-practices findings concern third-party cookies and Chrome's Issues
  panel, consistent with embedded third-party content;
- mobile lab LCP is 4.8-5.1 seconds on the three samples, materially slower than
  desktop;
- 24 viewport captures showed no horizontal overflow;
- no site-attributed console error or warning was observed; one repeated warning
  came from a Chrome extension;
- route integrity was clean at capture time: 66/66 sitemap routes returned 200,
  canonicals matched, and no crawled same-origin page link returned 4xx/5xx.

These results are lab/crawl observations, not field Core Web Vitals. Later work
should compare like-for-like profiles and separate intentional improvements from
regressions.

## Known limitations and exclusions

- Valid Contact, feedback, newsletter, support/payment, application, and private
  learner/admin outcomes were not submitted against production. Their expected
  outcomes are grounded in current source contracts and tests; only safe public
  validation/menu states were exercised.
- Authenticated/private screenshots were not captured because #604 does not
  justify exposing or manufacturing private state. Child issues must use synthetic
  data and approved evidence storage if those surfaces change.
- The crawler begins with sitemap pages and follows their same-origin page links.
  It is not a guarantee that every externally linked, orphaned, historical, query,
  or private URL has been discovered.
- External destinations were inventoried from controlled links but not treated as
  site-owned availability guarantees.
- Lighthouse is variable and affected by network and third-party timing; retain
  raw reports only while actively comparing or regenerate with the recorded
  command/version.
- Tall full-page capture timed out for Consulting in the browser environment, so
  comparable viewport images are used for all families and a full-page image is
  retained only for Home.

## Reproduction

```powershell
python scripts/capture_production_baseline.py `
  --csv docs/evidence/issue-604-public-route-inventory.csv `
  --summary docs/evidence/issue-604-site-integrity.json
python -m unittest tests/test_capture_production_baseline.py
```

For screenshots, follow `docs/ux/rendered-review.md` with the URLs and dimensions
in `browser-captures.json`. For Lighthouse, use version 13.4.1 against the three
recorded URLs with the default mobile profile and `--preset=desktop`; do not
silently replace the committed baseline with a later production state.
