# Issue #628 — Consulting breadth UX brief

## Classification and applicability

- Delivery profile: Lean. This is public Consulting content and information architecture with no protected characteristic, API, payment, authentication, private-data, or production-control change.
- UX applicability: UX brief required because the change materially affects prospect comprehension, decision hierarchy, page rhythm, and mobile scanning.
- Scope: the Consulting page only. Existing #625 contact contexts and form behavior are preserved.

## Context and diagnosis

The two launch offers are concrete and easy to compare, but they currently carry too much responsibility for communicating overall Consulting fit. The “Useful when” section covers four broad areas, combining AI adoption with AI-assisted engineering practice, while continued advisory is only inferable from general language.

The strongest in-scope structure is packaged offers first, followed by a concise breadth-and-depth bridge. Problem families first would delay the page’s most concrete buying decisions; adding more offer cards would imply a larger standardized catalog than exists.

## Intended decision sequence

1. Understand the senior advisory/assessment proposition.
2. Compare the two directly packaged launch offers and their accurate prices.
3. Recognize fit across five customer-problem families.
4. Understand the lightest suitable engagement depth: opinion, investigation, or continued guidance.
5. See public evidence, process, confidentiality, and implementation boundaries.
6. If unsure, describe the problem through the existing purpose-specific intake.

## Rendered-observable invariants

1. The two packaged launch offers remain the page’s first and strongest commercial comparison.
2. All five canonical problem families are recognizable in customer-problem language without resembling a broad service catalog.
3. Advisory Session, Assessment / Review, and Advisory Engagement read as increasing engagement depth, not three new directly purchasable products.
4. Continued advisory is explicitly time-bounded and customer-owned for delivery and implementation.
5. The “Describe your problem” route remains the clear path for an unsure prospect and uses only the existing `consulting-help-choose` context.
6. Desktop and mobile preserve calm editorial scanning, semantic order, and zero horizontal overflow.

## Content and hierarchy decisions

- Describe the two current cards as standardized launch offers and useful starting points, not an exhaustive service list.
- Split AI adoption/workflow decisions from AI-assisted engineering practices so the five canonical families are visible.
- Use one compact ordered engagement guide with problem-led prompts (“Need an expert opinion”, “Need something investigated”, “Need continued guidance”).
- Do not publish an Advisory Engagement price or imply direct booking; scope, fit, and involvement must be agreed after intake.
- Keep the existing confidentiality, evidence, process, and final enquiry sections intact.

## Feasibility

The existing static HTML, Consulting stylesheet, design tokens, contact context, and analytics allow-list support the change. No JavaScript, backend, SEO metadata, or form contract change is required. New styles remain route-scoped and stack at the existing 900px breakpoint.

## Review plan

- Render the complete Consulting page at 1440×900 and 390×844, with focused inspection of offers, breadth, engagement depth, and enquiry.
- Check semantic order, link context, scan density, horizontal overflow, and console/resource errors.
- Run focused Consulting contracts, full regression, SEO, performance, and browser validation.
- Obtain Senior UX Gate D and final fresh-context independent review against exact revisions.
