# Issue #395 survey embed UX brief

**Applicability:** UX brief required. The survey remains the same task, but its
third-party embed changes from automatic loading to an explicit user action.

## User and goal

- Affected user: an educator considering the AI Teaching Workflows survey.
- Goal: understand the research purpose and start the survey without an
  unexpected multi-megabyte third-party load.

## Existing UX context and strategic altitude

- Preserve `docs/ux/site-ux-direction.md`: calm editorial hierarchy, restrained
  flat components, native controls, visible focus, and progressive enhancement.
- Whole-page review found the survey remains the primary action; no broader page
  redesign is required.
- Best in-scope and strongest overall recommendation are the same: disclose the
  Google Forms boundary and let the visitor load the embed deliberately.
- Recommendation strength: strongly recommended. Production and branch-preview
  comparison showed the current lazy iframe adds about 4.58 MB and 89 requests
  during initial rendering.

## Desired outcome and hierarchy

- Primary: the clear `Load survey form` action in the existing survey section.
- Secondary: the privacy explanation and direct Google Forms fallback.
- Intentionally quiet: technical performance detail; users need only understand
  that loading the embed contacts Google and downloads additional resources.

Desktop and mobile use the same reading order: research context, privacy boundary,
load action, direct fallback. The gate reuses the current flat surface, typography,
spacing, and button patterns rather than introducing a new visual system.

## Interaction intent

- Default: no iframe or Google Forms request; the disclosure and enabled button
  are visible.
- Loading: button becomes inert and a visible assistive live status announces loading.
- Loaded: the gate is replaced by the existing titled iframe and the visible live
  status confirms completion.
- JavaScript unavailable: a `<noscript>` direct link plus the always-visible
  fallback keeps the survey reachable.
- Failure: the direct link remains available even if the iframe cannot load.

## Design invariants

1. The survey remains the section's unmistakable primary task.
2. The Google boundary is clear without making the page feel alarmist or technical.
3. Keyboard and touch users receive the same visible action and focus treatment.
4. Mobile order remains context → privacy → action → fallback, with no overflow.
5. Core research content and a working survey route remain available without the embed.

## Tech Lead feasibility

The implementation uses static HTML, existing tokens/button styles, and one small
page-specific vanilla script. It creates the titled iframe only after the native
button is activated, preserves the external fallback, adds no dependency or build
step, and does not change analytics identity or event contracts. No unresolved
material trade-off or Product Owner taste decision remains.

## Gate D outcome

**UX accepted — 19 August 2026.** The repository owner explicitly authorized the
reviewed implementation to proceed. Final desktop and mobile review confirmed the
brief's hierarchy, disclosure, fallback, responsive layout, visible focus, and
keyboard activation requirements. Focus moves into the newly loaded survey iframe
so hiding the activation gate does not strand keyboard users.
