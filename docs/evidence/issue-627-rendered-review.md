# Issue #627 rendered UX review

## Target and method

- Page: homepage opening at `/`
- Branch: `feat/issue-627-first-visit-bridge`
- Method: local static server with browser-controlled Chromium
- Viewports: 1440×900 and 390×844
- Direction: `docs/ux/site-ux-direction.md`
- Brief: `docs/plans/issue-627-first-visit-bridge.md`

## Iteration 1

The first two-sentence bridge answered the required questions, preserved the motto and all routes, and had no horizontal overflow. On mobile, however, the 294px-high paragraph was visually dense and pushed the Research route below the first viewport.

### Must fix

- None.

### Should fix

- Tighten the bridge without losing audience, present context, practical architecture, or reliability outcome.

### What works / preserve

- The existing hero structure remains sufficient; no new panel or section is needed.
- The founder relationship and “practical body of work” language prevent generic consultancy positioning.
- The focus note provides a strong transition from plain language into the differentiated thesis.

## Iteration 2

The refined bridge reduces repetition and keeps the three existing opening routes visible within the 390×844 viewport. It names the audience, increasing AI participation, the four practical surfaces, and the engineering qualities being protected.

| Viewport | Bridge height | Opening height | Last opening route | Horizontal overflow |
|---|---:|---:|---:|---:|
| 1440×900 | 141px | 821px | 753px | 0px |
| 390×844 | 206px | 1027px | 799px | 0px |

Semantic inspection confirms the intended order: founder/platform identity, motto, proposition, primary actions, Research route, and the secondary focus note. The page produced no site console warnings or errors; observed log entries belonged only to the browser-control extension.

### Must fix

- None.

### Should fix

- None.

### Optional

- None within issue scope.

### What works / preserve

- The motto remains the dominant visual statement.
- The shorter bridge reads as orientation, not a competing manifesto.
- Framework, Research, Consulting, and Learning are presented as parts of one practical body of work.
- The existing tension section still performs the deeper “why” work without repetition.

## Gate D result

UX-ready, subject to the required fresh-context comprehension review and final independent review. Recommendation strength: strongly recommended. No broader redesign or deferred finding is required for issue #627.

