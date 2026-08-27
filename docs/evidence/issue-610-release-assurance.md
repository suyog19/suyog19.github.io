# Issue #610 — final before/after release assurance

Status: accepted — READY FOR #611

Tested site revision: `62bcf47e5662514c8de50676b275de9689e2e19e`
Baseline site revision: `a6420ee8519e96da15845347b78e4d7c3fc3da89`
Process revision: `fa26e629787fbab681b389f02a9f9a6e28d8481a`

## Release recommendation

**READY FOR #611.** This authorizes production-smoke and human release review; it
does not authorize promotion to `main`.

## BEFORE-state traceability

The #604 baseline remains complete and reproducible. Its production origin,
capture window, `main` revision, Chrome viewports, and Lighthouse version are in
[`docs/issue-604-current-site-baseline.md`](../issue-604-current-site-baseline.md).
The 66-route CSV, integrity JSON, representative screenshots, browser metadata,
keyboard evidence, quality baseline, interaction contract, content-preservation
inventory, and known limitations are all present and unchanged. #610 repaired one
later #606 guide sentence that had not caught up with the already approved #608
`HOME-01` contract; it did not rewrite the historical baseline.

## Route migration and interaction audit

- Baseline routes: **66 preserved, 0 redirected, 0 retired, 0 unaccounted**.
- Additive indexable routes: `/framework/` and `/research/`.
- Current public sitemap: **68 routes**.
- `HOME-01` is the sole redesign-era outcome change: the old hero's Training
  action became `Explore the Framework` → `/framework/`; Learning remains later
  on Home. The #604 contract, #608 disposition, #606 guide, implementation, and
  Playwright assertion now agree.
- `NAV-02` changed under #607 from the legacy navigation to the approved Software
  Signal professional-platform IA; the contract and browser test remain aligned.
- All other critical interaction outcomes are preserved. No assertion was deleted,
  weakened, retried, or skipped.

The complete per-route disposition and 16-item preservation audit are in
[`issue-610-assurance-audit.json`](issue-610-assurance-audit.json).

## Functional and integrity results

| Check | Final result |
|---|---|
| Playwright Chromium 151 / Playwright 1.62.1 | 13 passed, 0 failed, 0 skipped, 0 retries |
| Node contracts | 437 passed, 0 failed |
| Focused Python inventory/training/performance suite | 32 passed, 0 failed |
| Public SEO umbrella | 13 contracts passed |
| Canonical/internal links/local assets | 81 HTML pages and 68 sitemap URLs passed; no broken link or missing asset |
| Images | 103 static images plus dynamic invoice preview passed |
| Legacy redirects | 3 inventory-derived legacy routes passed |
| Console/resources | 39 representative renders; 0 site-attributed error or failed local resource |
| Content preservation | 16/16 inventory groups present |

One parallel validation attempt allowed Playwright's ignored trace HTML to exist
while the image crawler ran, so that transient file was reported as an unregistered
social preview. After the generated test directory was removed, the sequential
public SEO run passed all 13 contracts. This was test-artifact contamination, not
a site or asset defect.

## Fresh rendered and responsive review

The reproducible #610 matrix covers Home, Framework, Research, Consulting,
Learning, Website Services, Writing, Systems, About, Weekly, Contact, one article,
and one system detail at **1440×900, 1024×768, and 390×844**. It records 39 clean
captures with one main heading, expected landmarks, valid heading progression,
image alternatives, visible form labels, a 24px control floor, no horizontal
overflow, and no site-attributed console/resource failure. Temporary images are
normal review artifacts under `test-results/issue-610/`; the durable metadata is
[`issue-610-browser-review.json`](issue-610-browser-review.json), and the capture
script reproduces them.

Manual rendered sanity review found intentional mobile reading order and CTA
ordering, legible Framework/Research structures, usable mobile navigation, stable
page-family differentiation, restrained Signal Red, and no cloned homepage
composition. The Framework's ordered branch list, cross-cutting Security region,
Methods of Investigation, and evidence-evolution copy supply a semantic equivalent
to its visual structure.

## BEFORE / AFTER UX disposition

| Dimension | BEFORE (#604) | AFTER (#610) | Disposition |
|---|---|---|---|
| First impression | Personal knowledge/training-oriented site | Professional Suyog Joshi + Software Signal platform | Improved |
| Brand relationship | Software Signal had limited/sub-brand presence | Software Signal is first-class; Suyog remains founder and trust anchor | Accepted |
| Framework | Low/absent from the opening architecture | Canonical eight-branch intellectual spine with Security and evidence loop | Improved |
| Research | Outputs existed; method was unclear | Visible evidence engine with investigation method and contradictory evidence | Improved |
| Consulting | Lower prominence | Clear senior advisory path, explicitly not outsourced development | Improved |
| Learning | Dominant fixed AI/data curriculum impression | Practical learning for working professionals with choices visible early | Improved |
| Website Services | Credible service proposition existed | Proposition preserved; evolved site itself demonstrates clarity and delivery craft | Accepted as credible evidence |
| Writing and Systems | Read as peer pillars | Read as editorial and inspectable engineering evidence | Improved |
| About | Legacy three-pillar framing | Human founder story and accountable reason for Software Signal | Improved |
| Navigation | Personal-site destinations | Approved visitor-needs IA with Framework/Research beneath Software Signal | Improved |
| Mobile | Functional baseline without overflow | Purposeful hierarchy, usable actions/diagram adaptation, no overflow in 13-page matrix | Accepted |
| Cross-page system | Mixed legacy families | Family resemblance without identical composition or a second design system | Accepted |

The comparison uses #604 screenshots, #608 Home evidence, #609 family evidence,
and the fresh #610 renders. It is qualitative design judgment, not a pixel score.

## Accessibility

The initial final-site Lighthouse detail exposed redesign-era contrast contributors
inside the same category already noted in #604: reduced-opacity eyebrows, pale red
labels on white, and pale text on Signal Red. #610 made the narrow token correction
and reran all affected evidence. Final Lighthouse accessibility is **100** for Home,
Contact, and the representative article on both mobile and desktop. Signal Red is
6.47:1 on white and 6.18:1 on the neutral background.

The browser matrix additionally passed headings, landmarks, image alternatives,
form labels, control sizing, semantic Framework/Research equivalents, responsive
order, and overflow checks. Playwright passed mobile-menu expansion, Escape,
outside close, focus restoration, contextual navigation, and accessible Contact
validation. Information does not depend on colour alone.

## Performance and architecture

Lighthouse 13.4.1 used the same three representative page families and profiles
as #604. Full results are in [`issue-610-lighthouse.json`](issue-610-lighthouse.json).

| Sample | BEFORE performance / LCP | AFTER performance / LCP | Result |
|---|---:|---:|---|
| Home mobile | 76 / 4.9s | 85 / 3.3s | Improved |
| Contact mobile | 75 / 4.8s | 75 / 5.1s | Within lab variability; no material regression |
| Article mobile | 74 / 5.1s | 93 / 2.9s | Improved |
| Home desktop | 99 / 0.7s | 99 / 0.8s | Preserved |
| Contact desktop | 99 / 0.7s | 99 / 0.8s | Preserved |
| Article desktop | 100 / 0.6s | 99 / 0.8s | Preserved within lab variability |

CSS, fonts, stylesheet/script scope, image contracts, and deferred loading remain
inside established budgets. The site still uses static HTML, scoped CSS, and
progressive vanilla JavaScript; no new framework, runtime, backend, build system,
font family, or production dependency was introduced. Home best-practices remains
77, matching #604's third-party cookie/Chrome Issues observation.

## SEO and content preservation

All 68 public pages are in the generated sitemap; 81 HTML pages pass canonical and
local-link validation. `/framework/` and `/research/` are indexable, self-canonical,
linked from the shared shell and Software Signal surfaces, and not accidentally
`noindex`. Existing Writing, Systems, Learning, service, policy, search, support,
card, Contact, and Weekly routes/capabilities remain present. No Products page or
offer was invented.

## Intentional changes, regressions, and limitations

Intentional approved changes: first-class Software Signal identity; approved
navigation IA; Framework-first `HOME-01`; additive Framework and Research routes;
canonical Framework/Research presentation; revised Learning and About framing;
and purpose-specific supporting-page composition.

Regressions found and fixed in #610:

1. Stale #606 prose contradicted the approved `HOME-01` contract; corrected.
2. Several muted/red label combinations failed automated contrast; corrected
   without changing layout, Signal Red, or page composition and revalidated to 100.

Residual limitations for #611/manual production smoke:

- No real Contact message, newsletter subscription, feedback, payment,
  application, email delivery, or authenticated/private mutation was created.
- The external beehiiv UI and third-party availability remain provider-controlled.
- Contact mobile performance remains near the #604 lab baseline and should not be
  represented as a field Core Web Vitals result.
- Physical-device/browser-specific behavior and the promoted production host are
  intentionally checked during #611 smoke, under human release control.

## Canonical evidence matrix

| Dimension | BEFORE reference | AFTER evidence | Result |
|---|---|---|---|
| 66 baseline routes | #604 route CSV | assurance audit + Playwright inventory | Pass: 66 preserved |
| Critical journeys | #606 BEFORE 13/13 | #610 Playwright 13/13 | Pass |
| Internal links/assets | #604 clean crawl | 81 pages, 68 sitemap URLs, 103 images | Pass |
| Canonicals/SEO | #604 66 self-canonical | 68 self-canonical public routes; 13 contracts | Pass |
| Homepage UX | #604 screenshots | #608 + fresh #610 renders | UX-ready |
| Supporting UX | #604 screenshots | #609 + fresh #610 renders | UX-ready |
| Accessibility | #604 95–100 with contrast findings | sampled 100; 39-render semantic matrix | Improved |
| Responsive | #604 24 captures/no overflow | 39 captures/no overflow | Pass |
| Performance | #604 Lighthouse | #610 Lighthouse | No material regression; sampled mobile improvement |
| Console/resources | #604 no site error | 39 renders, zero site failure | Pass |
| Content preservation | #604 CONTENT/ASSET inventory | 16/16 groups | Pass |
| Website Services credibility | Service existed | service plus evolved site demonstrates delivery quality | Accepted |

## Fresh-context review verdicts

- Senior UX whole-site review: **UX Gate D accepted / READY / strongly
  recommended**. No Must or Should finding. Website Services credibility was
  explicitly accepted, and page families were found related without cloning Home.
- Architecture: **pass / READY**. The static HTML/CSS/vanilla-JavaScript boundary,
  runtime dependencies, public contracts, and maintainability remain safe.
- Accessibility: **pass / READY**. The narrow contrast corrections are accepted;
  sampled Lighthouse is 100 and no critical or material regression remains.
- Functional QA: **pass / READY**. No finding or blocker; 66 routes, 13 journeys,
  integrity, safe side-effect boundaries, and 16 preservation groups were
  independently verified.
- Independent final review: **pass / READY**, fresh context and read-only, with no
  finding or blocker. Residual risk is low and belongs to #611 production smoke.

The reviewed delivery target is
`95bb9531a8b1a936e9e3879d9f068b553592821e`; the final delivery record contains
the machine-readable exact-revision verdicts. The only later commit adds these
review results and does not change the tested site.
