# Issue #513 UX assurance pilot

Status: UX accepted; pending PR review and merge under #508 and epic #503.

## Selection and approval

Suyog approved the Writing page's `Latest Writing` list as the contained pilot
on 2026-08-15. It is a real, bounded hierarchy and responsive-composition
change. It does not reopen or reuse #492.

## Gate A — context ready

UX applicability: **UX brief required**.

User goal: a reader scanning recent work should distinguish title, image, date,
topic, publication source, and destination quickly without the mobile list
feeling compressed or noisy.

Applicable direction:

- `docs/ux/site-ux-direction.md`
- `docs/ux/pages/writing.md`
- the accepted `.wp-latest-*` markup and component family

Desired outcome: keep a compact editorial stream while making each entry feel
deliberate and legible. The title remains primary; thumbnail and metadata aid
recognition. The section must not become a promotional card grid or overpower
later discovery paths.

### Design invariants

1. The list remains an editorial stream, not a grid of promotional cards.
2. Article titles are the strongest element in each row at desktop and mobile.
3. Thumbnails aid recognition but never squeeze titles into awkwardly narrow
   columns.
4. Date, topic, and source remain scannable and semantically available without
   competing with the title.
5. Internal versus external destinations remain clear.
6. The list remains visually quieter than the hero and does not overpower later
   discovery paths.

Product Owner consultation: **completed for pilot selection**. No additional
subjective fork exists in the first implementation; the established baseline
and issue intent are sufficient.

### Tech Lead feasibility

- Reuse the existing HTML, tokens, typography, and responsive breakpoints.
- Limit implementation to scoped `.wp-latest-*` CSS unless rendered evidence
  proves a semantic markup change necessary.
- Preserve link semantics, decorative image treatment, intrinsic dimensions,
  lazy loading, static rendering, and no-JavaScript operation.
- No backend, state/data, SEO, analytics, dependency, or new-media changes.
- Check the full Writing page and representative unaffected pages because
  `css/pages.css` is shared.

The approach preserves all six invariants before coding. No known compromise or
material UX/technical conflict requires escalation.

## Gate B — Iteration 1 evidence

Commit state: uncommitted coherent local implementation on issue #513 branch.

Capture method: local static server plus deterministic browser viewport.

| Surface/state | Viewport | Observed evidence |
|---|---:|---|
| Writing / default | 1440×900 | 8 rows; 11rem thumbnail; first title 23px with a 607px measure; no horizontal overflow |
| Writing / default | 390×844 | 8 rows; 5.5rem thumbnail; first title 17px, 233px wide and two lines; no horizontal overflow |

Mobile rows were 139px for two-line titles and 161px for three-line titles.
Date and topic were placed on separate lines, followed by publication source.
Screenshots were kept in the active browser review session rather than committed
as repository binaries.

### Senior UX review — Iteration 1

**Must fix**

- None.

**Should fix**

- Quiet metadata occupies two separate lines before the publication line on
  every mobile row. This makes the section cumulatively longer and gives
  supporting metadata too much vertical weight, working against invariant 6.
  Recombine date and topic into one wrapping metadata line without reducing
  title measure or returning to indistinct micro-text.

**Optional**

- None. Additional decoration or hover treatment would not advance the user
  goal.

**What works / preserve**

- The smaller mobile thumbnail gives titles a useful 233px measure.
- The 17px serif title is clearly primary and long titles wrap predictably.
- Desktop remains a compact editorial stream rather than a card grid.
- Internal/external destination copy remains explicit.
- No overflow, content, semantics, image, or JavaScript regression was observed.

Result: **another iteration required for the meaningful Should-fix finding**.

## Gate C — convergence

Iteration 2 will preserve the thumbnail/title relationship and restore date/topic
to a compact wrapping line on mobile. Publication source remains a separate,
quiet destination cue.

### Iteration 2 evidence and review

At 390×844, the first row fell from 139px to 122px and the section fell from
1480px to 1386px while retaining the 233px title measure. At 1440×900, all eight
rows remained uniform at 132px. There was no horizontal overflow at 768px,
480px, 390px, 360px, or 320px. List/list-item semantics, all eight links,
external-link new-tab disclosure and safe `rel`, and decorative lazy-loaded
images with intrinsic dimensions remained intact.

**Must fix**

- At 320px, the thumbnail reduced title width to 163px and the first row grew to
  203px. Although there was no technical overflow, imagery was squeezing the
  primary content, violating invariant 3. Hide the decorative thumbnail only at
  very narrow widths so title and metadata regain the reading measure.

**Should fix**

- None. Iteration 1's metadata-density finding is resolved.

**Optional**

- None.

**What works / preserve**

- Preserve the 390px and wider composition, recombined wrapping metadata, and
  explicit publication cue.
- Preserve current link/list semantics and the absence of JavaScript.

Result: **Iteration 3 required for narrow-width convergence**.

### Iteration 3 intent

At widths up to 360px, decorative thumbnails are omitted and the existing text
content receives the full row width. At 390px and above, Iteration 2 remains
unchanged.

## Gate D — UX acceptance

### Iteration 3 final evidence

| Surface/state | Viewport | Final evidence |
|---|---:|---|
| Writing / default | 1440×900 | thumbnails visible; 607px first-title measure; 8 uniform 132px rows; no overflow |
| Writing / default | 768×844 | thumbnails visible; 502px first-title measure; no overflow |
| Writing / default | 480×844 | thumbnails visible; 323px first-title measure; no overflow |
| Writing / default | 390×844 | thumbnails visible; 233px first-title measure; 122px first row; no overflow |
| Writing / default | 360×844 | decorative thumbnails omitted; 305px first-title measure; 122px first row; no overflow |
| Writing / default | 320×844 | decorative thumbnails omitted; 265px first-title measure; 122px first row; no overflow |

Semantic evidence: `Latest Writing` remains a `ul` containing eight `li`
items and eight links. All four external links retain new-tab disclosure,
`noopener noreferrer`, and accessible labels. All thumbnails remain decorative,
lazy-loaded, and dimensioned; hiding them at very narrow widths removes no
semantic information. The implementation remains static and JavaScript-free.

### Final invariant status

1. **Pass:** flat bordered editorial stream retained; no card grid introduced.
2. **Pass:** serif titles are the strongest row element at every checked width.
3. **Pass:** thumbnails support recognition at 390px and above and yield before
   squeezing titles at 360px and below.
4. **Pass:** date, topic, and source remain present, wrapping, and subordinate.
5. **Pass:** internal/external destination copy and semantics remain explicit.
6. **Pass:** section palette, surface, density, and hierarchy remain quieter than
   the hero and preserve the transition into later discovery paths.

Remaining Should-fix findings: **none**.

Remaining Optional findings: **none**.

Approved deviations: **none**.

Final status: **UX accepted** after rendered review at 1440px, 768px, 480px,
390px, 360px, and 320px. Product Owner consultation beyond approved pilot
selection was not required; the baseline and invariants resolved the direction
without a genuine subjective fork.

## Independent QA

- `node --test tests/writing-catalogue.test.js tests/public-navigation.test.js tests/homepage-training.test.js` — 11/11 pass after updating the intentional responsive contract.
- `node --test tests/*.test.js` — full JavaScript suite, 323/323 pass.
- `python -m unittest discover -s tests -p "test_*.py"` — 10/10 pass.
- `python scripts/validate_canonical_urls.py` — 67 pages and 56 sitemap URLs pass.
- `python scripts/validate_site_identity.py` — person/site graph, three public collections, 28 articles, and five courses pass.
- `python scripts/validate_article_structured_data.py` — 28 articles and two series pages pass.
- `git diff --check` — pass.
- Browser regression at 1440×900 and 390×844 — Home, Training, Systems,
  About, Contact, and a representative article retain one main landmark,
  expected title/active navigation, and no horizontal overflow.
- Writing semantics — list/list-item structure, link count, external-link safety
  and disclosure, decorative alt behavior, intrinsic image dimensions, and lazy
  loading pass.
- Keyboard/focus contract — row anchors remain native links and inherit the
  unchanged global 2px `:focus-visible` outline with 3px offset from
  `css/base.css`.
- Progressive enhancement — only CSS and its structural test changed; content,
  link targets, and list semantics remain available without JavaScript.

The first targeted test run correctly failed because its old assertion required
the superseded 6.75rem mobile thumbnail column. The test was updated to assert
the approved 5.5rem column and the ≤360px title-protection behavior, then passed.

## Retrospective

1. **Was #504 sufficient?** Yes. The site and Writing page direction prevented
   the pilot from drifting into cards, decorative colour, or a broader redesign.
2. **Was #505 appropriately weighted?** Yes. Six invariants and a compact issue
   brief were enough; no separate design specification was necessary.
3. **Did invariants help?** Yes. Invariant 3 turned a technically valid 320px
   layout into an observable Must-fix rather than subjective polish.
4. **Was #506 evidence practical?** Yes. Deterministic browser metrics and
   screenshots made Iterations 1–3 directly comparable without repository
   binaries.
5. **Were finding levels actionable?** Yes. Iteration 1's metadata density was a
   Should-fix; Iteration 2's 320px squeeze was a Must-fix; preserve notes stopped
   the improved 390px layout from regressing.
6. **Was #499 role clarity sufficient?** Yes. Senior UX judged rendered hierarchy
   and invariants while Tech Lead constrained the solution to scoped static CSS
   and QA independently verified behavior.
7. **Was Product Owner involvement timed correctly?** Yes. Suyog selected the
   pilot. No artificial CSS-level choice was escalated afterward.
8. **Did #507 gates help?** Yes. Gate A prevented scope drift, Gates B/C required
   evidence and convergence, and Gate D kept UX acceptance distinct from QA.
9. **Did the loop catch more than ordinary AC review?** Yes. No-overflow checks
   passed at 320px, but rendered measurement exposed a 163px title column and
   203px row that violated the intended hierarchy.
10. **What should change?** Add a narrow 320–360px check when media and text share
    limited horizontal space. `docs/ux/rendered-review.md` now records that small,
    evidence-backed refinement. No larger process change is warranted.

Recommendation: the Frontend UX Assurance Loop is ready for routine use after
the pilot PR and epic audit pass normal review.
