# Issue #628 rendered UX review

## Target and method

- Page: `/consulting/`
- Branch: `feat/issue-628-consulting-breadth`
- Method: local static server with browser-controlled Chromium
- Viewports: 1440×900 and 390×844
- Direction: `docs/ux/site-ux-direction.md`
- Brief: `docs/plans/issue-628-consulting-breadth.md`

## Gate B — first coherent render

The complete page was reviewed with focused inspection of the launch-offer introduction, five problem families, engagement-depth guide, implementation boundary, and unsure-prospect intake.

| Observation | 1440×900 | 390×844 |
|---|---:|---:|
| Packaged offer cards | 2 | 2, stacked |
| Problem-family items | 5 | 5 at 335px |
| Engagement-depth items | 3 equal columns at 372px | 3 stacked at 335px |
| Intake context | `consulting-help-choose` | `consulting-help-choose` |
| Horizontal overflow | 0px | 0px |

No site console warnings, errors, or failed resources were observed.

### Must fix

- None.

### Should fix

- None.

### Optional

- None within issue scope.

### What works / preserve

- The two price-bearing offer cards remain the first and strongest commercial comparison.
- “Standardized launch offers” makes the current launch posture explicit without diminishing either offer.
- Customer-problem language separates AI adoption from AI-assisted engineering practice and completes the five-family coverage.
- The engagement guide adds breadth through three increasingly involved needs rather than another catalog of packages.
- Advisory Engagement is time-bounded, has no public price or direct-buy claim, and explicitly leaves delivery and implementation with the customer.
- The existing final enquiry remains the strongest CTA; the earlier text link helps an unsure prospect exit taxonomy quickly without competing visually.

## Gate C — convergence

The first render satisfies all six brief invariants. The new content uses existing typography, borders, spacing, links, and breakpoints; no material refinement cycle was required. Semantic source order matches the prospect decision sequence, and the three engagement items use an ordered list.

## Gate D status

UX-ready, subject to Senior UX acceptance and final independent review against the committed revision. Recommendation strength: strongly recommended. No broader redesign or deferred finding is required for issue #628.
