# Issue 626 rendered evidence and Senior UX review

## Target and method

- Final implementation revision: `61a661d` (with `79fe972` as its initial
  implementation parent). This evidence-only successor binds the rendered review
  and validation record to that corrected target.
- Local routes rendered from the repository root at 1440×900 and 390×844:
  `/consulting/`, `/website-services/`, and `/training/`.
- Browser inspection checked computed columns, placement, intrinsic/display image
  sizes, horizontal overflow, console errors, and transactional links inside the
  proof modules.
- Representative Website Services desktop capture:
  `docs/evidence/issue-626/screenshots/website-services-1440x900.png`.

## Gate B — first rendered review

### Must fix

- None.

### Should fix

- None. The proof modules are proportionate to their decisions and do not compete
  with the offer headings or primary actions.

### Optional

- A future permissioned customer Website Services case can replace or follow the
  self-case-study without changing the component structure.
- A future recorded micro-session can supplement the current inspectable teaching
  sample after accessibility, hosting, and transcript requirements are defined.

### What works / preserve

- Consulting's proof is inside each offer and precedes pricing/action, so a visitor
  can inspect relevant judgment without searching through the broader site.
- Website Services labels the example as Software Signal's own platform before the
  visual comparison and explicitly rejects unmeasured conversion claims.
- The before/current images are large enough to compare hierarchy, navigation, and
  visual language. Captions explain the intended evidence rather than asking the
  images to carry meaning alone.
- Learning provides three low-friction evidence types—lesson structure, project
  expectations, and free explanation—with no registration, Contact, application,
  interest, or payment link in the module.

## Responsive and technical observations

| Surface | 1440×900 | 390×844 |
| --- | --- | --- |
| Consulting | Two equal offer columns; two proof items visible; zero overflow | One 335 px offer column; proof items 277 px inside cards; zero overflow |
| Website Services | Before/current visual columns 550 px each; three notes about 361 px each; proof immediately follows packages; zero overflow | Visual pair and notes each become one 335 px column; images display at 333 px; zero overflow |
| Learning | Three proof columns about 361 px each; proof immediately follows learning model; zero transactional proof links; zero overflow | One 335 px proof column; three items remain visible; zero overflow |

- Both Website Services WebP images loaded successfully at 1425×891 and 1440×900.
- No warning or error console entries were observed on the final Learning render;
  local source and image validators found no missing evidence resource.
- Links remain ordinary semantic anchors with existing focus-visible treatment;
  proof remains complete without JavaScript.

## Gate C — convergence

- The initial implementation converged in one rendered cycle.
- Source validation identified and corrected only an intrinsic-dimension declaration
  mismatch before final rendering; no visual hierarchy or interaction change was
  required.
- All six design invariants in
  `docs/plans/issue-626-commercial-proof.md` remain satisfied.

## Gate D — UX acceptance

**UX accepted.** The in-scope result is strongly recommended: each commercial
surface now uses a decision-relevant proof type with explicit provenance, restrained
visual weight, and a clean future path to genuine customer/learner evidence. There
are no unresolved Must fix or accepted-deviation items.
