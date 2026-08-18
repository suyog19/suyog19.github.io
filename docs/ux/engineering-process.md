# Repository UX engineering process

This document preserves the frontend repository's UX mechanics and supplements
the canonical frontend profile. `docs/ux/README.md`, `site-ux-direction.md`, page
family documents, `ux-change-brief.md`, and `rendered-review.md` remain the
authoritative detailed UX context.

## Applicability

At issue start, the Engineering Manager / Orchestrator or Team Lead records actual
user impact as one of:

- **UX brief required** for material layout/composition, hierarchy, navigation,
  discovery, form/task flow, interaction, responsive behavior, major component
  presentation, visual identity, user-facing status/action comprehension, new
  surfaces, or substantial redesigns;
- **Lightweight UX note** for a small hierarchy-affecting copy change, isolated
  CSS fix, small addition inside an accepted pattern, meaningful image/crop choice,
  or visible accessibility trade-off;
- **UX brief not required** for metadata/sitemap-only work, invisible refactors,
  tests, backend-only work, and technical corrections without visible effect.

Raise the level if implementation reveals greater UX risk. A material redesign
cannot be marked not applicable for convenience.

## Senior UX Designer charter

Senior UX reviews the target user's goal, first-impression comprehension,
information architecture, decision friction, hierarchy, composition, page rhythm,
pattern fit, realistic responsive widths, semantics/focus, media purpose and crop,
progressive enhancement, feedback, and relevant loading, empty, unavailable,
selected, recommended, current, error, and success states.

Before accepting a brief and again before UX acceptance, inspect the complete page,
its page family, and the cross-site visual/content system. Distinguish the best
in-scope implementation from the strongest overall UX recommendation, state
whether the in-scope result is strongly recommended or merely acceptable under
constraints, and surface broader work separately without silently expanding scope.

Senior UX must not invent product truth, silently change Product Owner intent,
trade accessibility/security/business constraints for aesthetics, introduce a
second design system, approve material UI from source alone, or treat a generated
mockup as implementation truth. Imagery and effects need a user-experience purpose.

## Gates A-D

### Gate A — UX context ready

Before substantial UX-brief-required implementation, record applicable site/page
direction, a completed compact brief, two to six rendered-observable invariants,
resolved material subjective decisions, and Team Lead feasibility findings.

### Gate B — first rendered review

Render an early coherent slice and capture representative evidence selected by the
brief. Senior UX reviews the actual interface using `rendered-review.md`, recording
Must fix, Should fix, Optional, and important What works / preserve findings.

### Gate C — UX convergence

Resolve or explicitly escalate every Must fix, address or consciously defer accepted
Should fix findings, re-check invariants, and re-render representative desktop and
mobile states after material changes. Normal work expects a bounded two or three
review/refine cycles, often fewer. Product Owner consultation is reserved for
remaining intent or taste decisions described in `ux-change-brief.md`.

### Gate D — UX acceptance

Before a UX-brief-required PR merges into `dev`, Senior UX records `UX accepted` or
the exact accepted deviation, rationale, and approver. UX acceptance is separate
from technical, functional, accessibility, security, QA, and production approval.

For UX-brief-required work, the issue or PR records applicability and reason, brief
and invariant location, rendered evidence and iteration, representative captures,
unresolved Must fixes or deviations, and final UX acceptance. Update the baseline
only when a change intentionally establishes a reusable pattern.
