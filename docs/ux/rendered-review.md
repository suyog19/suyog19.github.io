# Rendered UX evidence and review

This is the V1 browser-evidence procedure for material frontend work. It keeps
the production site dependency-free and works with either browser automation
already available to the developer/reviewer or an ordinary browser with manual
capture.

The objective is not pixel matching. It is to evaluate the interface users
actually receive through a bounded loop:

```text
implement → render → inspect → critique → refine → render again
```

## V1 approach and rationale

Use the browser capability already available in the working environment when it
can set a viewport and capture a screenshot. Playwright, browser-agent tooling,
or equivalent is suitable, but no particular product is mandatory. Fall back to
the documented manual procedure below when automation is unavailable.

This approach was selected because it:

- works against this static site locally or at an approved review URL;
- produces deterministic representative viewport evidence;
- can inspect important states and, where supported, the accessibility tree;
- requires no application framework, build system, production dependency, or
  committed binary baseline;
- remains usable by a developer or reviewer with only a browser.

Residual V1 limitation: manual captures are less mechanically reproducible than
scripted screenshots and do not provide automated visual diffs. Record the URL,
viewport, state, iteration, and capture method so another reviewer can recreate
the evidence. Visual regression automation is a separate future concern.

## Prepare the review

1. Read the linked issue, the completed
   [UX change brief](ux-change-brief.md), the applicable
   [site direction](site-ux-direction.md), and page-family direction.
2. List the changed pages, two to six design invariants, and important states.
3. Choose the smallest viewport/state matrix that can prove the intended
   experience. Do not capture unrelated pages merely to make the set look large.
4. Use a feature-branch local render or approved review/dev URL. Do not use
   production as evidence for an unpromoted change.

## Serve or access the page

From the repository root, serve the feature branch with either existing local
option:

```powershell
python -m http.server 8080
```

or:

```powershell
npx serve .
```

Open the exact route at `http://localhost:8080/…`. If an approved branch preview
or dev deployment is used, record its commit SHA and URL. Confirm that assets
load at the page's actual directory depth; opening a root page alone is not
sufficient evidence for a nested detail page.

## Select viewports and states

Default minimum for UX-brief-required work:

| Evidence | Normal size | Include when |
|---|---:|---|
| Wide desktop | 1440px wide | Always |
| Mobile | 390px wide | Always |
| Intermediate | 768px, 1024px, or 1280px wide | A breakpoint or composition changes materially |
| Additional width | Brief-specific | A known content or layout risk requires it |

Include a 320–360px narrow-width check when media and text share a row, long
content has limited wrapping room, or the 390px composition could conceal a
minimum-content squeeze. The #513 pilot caught an invariant violation at 320px
despite a clean 390px render and no horizontal overflow.

Viewport height may match the review environment (about 844–900px is useful),
but always record it. Capture a full page when page rhythm or overall flow
matters. Capture a viewport or focused region when detail would become illegible
in a full-page image; include enough surrounding context to understand it.

The UX brief—not a universal matrix—selects relevant states. Examples include:

- default and selected/recommended/current;
- loading, empty, unavailable, error, and success;
- expanded and collapsed;
- keyboard focus and mobile navigation;
- safe public and authenticated variants where applicable.

Hover-only evidence is insufficient for information or actions that must remain
available on touch devices.

## Capture procedure

### Automated browser capability

1. Set the exact viewport dimensions.
2. Navigate directly to the review URL and wait for the page's meaningful state,
   including required images or intentionally loaded status.
3. Establish the target state using normal user interactions. Do not mutate the
   DOM solely to manufacture a screenshot.
4. Capture the screenshot and record URL, viewport, state, commit SHA, capture
   method, and iteration.
5. Inspect horizontal overflow and obvious console/resource failures when the
   change could cause them.
6. When useful, capture a semantic/accessibility snapshot alongside the image.

### Manual browser fallback

1. Open browser developer tools and select a responsive device viewport.
2. Enter the exact width and height; keep browser zoom at 100%.
3. Reload the page, establish the target state through the UI, and capture the
   full page or focused viewport.
4. Record the same metadata as the automated procedure.
5. Repeat once at the same dimensions if loading or font rendering appears
   unstable. Explain any non-deterministic content.

If a state cannot be reproduced, do not substitute an unrelated screenshot.
Record the missing state, attempted setup, reason, residual UX risk, and who must
provide access/data or verify it later.

## Semantic and accessibility evidence

For material interaction, ordering, or media changes, use an accessibility-tree
snapshot, browser accessibility inspector, or equivalent semantic inspection
when available. Check the relevant questions, such as:

- Does semantic order match the intended visual reading/action order?
- Does an interactive card or control have a meaningful accessible name?
- Is current, selected, expanded, error, or status information represented
  semantically rather than by colour or position alone?
- Is an image correctly informative or decorative?
- Are visually hidden variants also hidden or exposed appropriately?
- Is keyboard focus visible in the rendered design?

Include concise findings or an evidence excerpt rather than an indiscriminate
full-page tree dump. This is design evidence for Senior UX review; it does not
replace QA's functional accessibility verification.

## Evidence naming and storage

Use a compact identifier:

```text
<issue>-i<iteration>-<page>-<width>x<height>-<state>
```

Example: `508-i2-home-390x844-menu-open`.

During active iteration, keep the current and immediately previous meaningful
sets available. Share images in PR comments/attachments, approved artifact
storage, or a temporary review workspace. Do not commit routine screenshots or
large binary histories to this repository. Source-control concise text findings
only when they provide durable value.

An evidence index in a PR comment should look like:

```markdown
## Rendered evidence — Iteration 2

Commit: `<sha>`
Capture method: `<browser/tool and version if known>`

| Page/state | Viewport | Evidence |
|---|---:|---|
| Home/default | 1440×900 | [attachment or approved location] |
| Home/default | 390×844 | [attachment or approved location] |

Compared with: Iteration 1 at `<comment/artifact link>`
Known omissions or instability: None | <explanation and residual risk>
```

## Senior UX rendered-review template

```markdown
## Senior UX rendered review

**Target:** Issue #… / PR #… / commit `…`
**Iteration:** …
**Reviewed:** <pages, viewports, states>
**Direction:** <site/page guidance links>
**Invariants:** <links or concise list>
**Compared with:** <previous meaningful iteration or “first iteration”>

### Must fix

- **<observable finding>** — Evidence: <page/viewport/state>. Violates:
  <direction or invariant>. Expected UX: <clear outcome>.

### Should fix

- **<observable in-scope improvement>** — Evidence and expected outcome.

### Optional

- <non-blocking polish with rationale>.

### What works / preserve

- **<successful decision>** — Preserve <specific relationship/behavior> in the
  next iteration because <reason tied to intent or invariant>.

### Result

Needs another iteration | UX-ready subject to stated deferrals | Escalation
required

**Deferrals/risks:** <owner, destination issue, and rationale>
```

### Finding levels

- **Must fix:** prevents UX acceptance because it materially harms hierarchy,
  task comprehension, an invariant, site/page consistency, responsive intent,
  important state clarity, or accessibility-aware design.
- **Should fix:** meaningful in-scope quality issue that should normally be
  addressed; defer only with an explicit delivery trade-off, owner, and risk.
- **Optional:** non-blocking polish that does not undermine the approved intent.
- **What works / preserve:** a successful decision that must not be lost while
  addressing other findings.

Findings must be observable. `Looks bad` is not actionable. A useful finding
identifies the affected evidence, the competing or broken relationship, the
direction/invariant at risk, and the desired experience—without prescribing CSS
unless the implementation itself is the problem.

## Review dimensions

Exercise senior judgment over the relevant subset; do not produce a numeric
scorecard for every item:

- first-impression comprehension and primary hierarchy;
- composition, balance, whitespace, density, and section rhythm;
- typography hierarchy and reading comfort;
- media appropriateness and performance-aware behavior;
- consistency with site/page direction and issue invariants;
- action prominence, form/task focus, and state clarity;
- responsive transformation and mobile reading/action order;
- keyboard focus and semantic state at the design level;
- interaction continuity with adjacent pages;
- signs of a second design system;
- superficial imitation of a mockup that loses its intended purpose.

## Bounded iteration and escalation

Material UX work normally takes up to approximately two or three
render/review/refine cycles. This is guidance, not a quota. End sooner when there
are no Must-fix findings and remaining items are explicitly optional or accepted
deferrals.

For every later iteration:

1. Compare it with at least the immediately previous meaningful iteration.
2. Verify Must-fix resolutions and all `What works / preserve` items.
3. Record regressions; never assume the latest version is automatically better.
4. Backtrack a change when the evidence shows the earlier solution was stronger.

Escalate to the Engineering Manager/Orchestrator instead of looping indefinitely
when normal cycles do not converge, the direction itself appears wrong, a
technical constraint makes an invariant infeasible, or fixing one area repeatedly
breaks another. Follow the Product Owner consultation rules in
[ux-change-brief.md](ux-change-brief.md) when product intent or subjective taste
is involved.

## Privacy and safe-state rules

For learner, application, payment, authentication, or other private states:

- use synthetic or explicitly approved test data;
- exclude real names/emails, payment references, OTPs, tokens, private URLs,
  reusable secrets, and identifying free text;
- inspect the full screenshot, browser chrome, URL, notifications, and background
  tabs before sharing;
- do not place private screenshots in public GitHub comments;
- use an approved private review location when evidence cannot be public;
- provide a public textual index naming the reviewed state, viewport, reviewer,
  date, and private evidence location/access owner without reproducing secrets.

If safe evidence cannot be captured, record the limitation and residual risk.
Never weaken authentication, caching, or security controls to obtain a UX image.

## UX review versus visual regression

Rendered UX review asks: **Is this implementation visually and experientially
good enough for the intended user outcome?** It requires human design judgment.

Visual regression testing asks: **Did an accepted rendering unexpectedly change
later?** Screenshot diffs may support that future task but cannot establish
hierarchy, appropriateness, or quality. V1 does not add a visual-regression suite
or permanent screenshot baseline.
