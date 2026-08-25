# Issue 575 — deliberate Support entry points

Issue: [#575](https://github.com/suyog19/suyog19.github.io/issues/575)  
Parent epic: [#570](https://github.com/suyog19/suyog19.github.io/issues/570)

## Gate A — UX context and brief

**Applicability:** UX brief required. The change introduces persistent discovery
of a voluntary financial-support journey and therefore changes site-wide
information architecture, even though it reuses the existing footer pattern.

**Affected visitor:** someone who has read, explored, or learned from the public
site and wants a quiet way to find the already-established Support page.

**First-impression outcome:** Support is available as an optional, secondary
site destination. It does not interrupt reading, compete with learning or
commercial actions, or imply that public work is gated.

### Context reviewed

- `docs/ux/site-ux-direction.md`
- `docs/ux/pages/support.md`
- `docs/ux/pages/article-detail.md`
- `docs/ux/pages/system-detail.md`
- `docs/ux/pages/writing.md`
- the existing public footer across root, Writing, Systems, newsletter,
  research, Support, and Training surfaces
- representative post-value endings on articles and system pages

### Placement disposition

| Candidate | Disposition | Reason |
|---|---|---|
| Existing public-shell footer | Approve | A plain `Support` text link is persistent, predictable, and subordinate to page content and primary navigation. |
| Article endings | Do not add in this issue | Feedback and related reading already form the accepted post-reading sequence. Repeating a financial prompt across every article would compete with that sequence and the article-detail invariant that reading flow takes precedence over promotion. |
| System/open-resource endings | Do not add in this issue | Demos, limitations, feedback, and related engineering context are the appropriate completion path. The footer provides discovery without turning an engineering account into a fundraising CTA. |
| Newsletter and confirmation surfaces | Do not add contextually | Subscription or confirmation is the primary task. The shared footer remains available without introducing a competing prompt. |
| Training and commercial flows | Footer utility only | No contextual Support CTA is added. The low-priority footer link does not compete with course, application, registration, or consulting intent. |
| Primary header navigation | Reject | Explicitly outside approved scope and materially too prominent for an optional support journey. |

No repeated contextual CTA component is warranted by the approved placement
set. Creating one would add unused abstraction and encourage mechanical reuse.

### Rendered-observable invariants

1. `Support` appears once in each existing public-shell footer and never in the
   primary header navigation.
2. The link uses the footer's existing typography, spacing, focus treatment,
   and responsive wrapping without button or promotional emphasis.
3. Page-specific primary actions remain visually and semantically dominant,
   especially subscription, training, registration, contact, feedback, and
   related-reading actions.
4. Every footer link resolves to the canonical `/support/` route from its real
   directory depth, including deep article, topic, system-demo, and return pages.

### Strategic-altitude and feasibility decision

The best in-scope and strongest overall recommendation are the same for this
initial discovery step: one restrained footer destination, with no contextual
financial prompts until there is evidence that a specific post-value surface
needs one. This direction is strongly recommended.

The existing hand-authored footer is repeated across static pages, so the
implementation is a mechanical HTML update plus a repository contract test.
It requires no CSS, JavaScript, dependency, provider, analytics, payment, or
primary-navigation change. Relative links remain explicit and depth-correct.

## Gates B–D — rendered review and acceptance

### Gate B — first rendered review

**Iteration:** 1  
**Capture method:** browser-controlled local render at `http://127.0.0.1:8080/`  
**Viewports:** 1440×900 and 390×844 (browser content widths 1425 and 375 after
scrollbar allocation)

Representative routes reviewed:

- `/`
- `/writing/human-review-gates-ai-assisted-delivery/`
- `/systems/ai-workflow-lab/invoice-review-demo/`
- `/newsletter/`
- `/training/`
- `/support/`

For every route and viewport, the footer contained exactly one visible Support
link resolving to `http://127.0.0.1:8080/support/`; primary navigation contained
none; and document width did not exceed the viewport. The Training footer
wrapped to an additional quiet row on mobile without crowding or horizontal
overflow. All requested HTML, CSS, JavaScript, image, and demo-data resources
returned 200/304 during the review.

Keyboard review on the 390px root page reached Support in normal reverse-tab
order. The focused link retained the established visible 2px solid outline.
The captured viewport showed Support aligned with the other footer utilities,
below the page's dominant contact action and without button treatment.

One browser-extension message-channel error was logged while navigating the
representative article. It was not emitted by a site script, did not recur as a
resource failure, and did not affect rendering or interaction.

### Gate C — convergence

**Must fix:** none.  
**Should fix:** none.  
**Optional:** none required for this scope.

**What works / preserve:** the footer's existing type, spacing, wrapping, focus
treatment, and low visual weight keep Support discoverable without competing
with reading, feedback, newsletter, Training, or payment actions. The absence
of contextual prompts preserves each page family's accepted completion path.

No second iteration was necessary because all four invariants passed on the
first coherent render and no material finding required refinement.

### Gate D — Senior UX disposition

**UX accepted** for the final placement set: one `Support` text link in every
existing public-shell footer and no header or contextual support prompts.

**Recommendation strength:** strongly recommended. The result satisfies the
initial discovery need while preserving the site's editorial restraint and
commercial boundaries. There are no accepted deviations or unresolved Must-fix
findings. A future contextual placement requires its own evidence and issue;
none is implied by this acceptance.
