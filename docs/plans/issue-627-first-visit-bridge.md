# Issue #627 — First-visit bridge UX brief

## Classification and applicability

- Delivery profile: Lean. This is a public homepage content and hierarchy refinement with no protected characteristics, transactional behavior, API contract, private data, or production-control change.
- UX applicability: UX brief required because the opening hierarchy and first-impression comprehension are material to the public editorial experience.
- Scope: the homepage opening and its transition into the existing “Why Software Signal exists” section.

## Context and diagnosis

The motto is memorable and the existing opening establishes the reliable-engineering territory, but a first-time professional must infer the intended audience and the practical ways to engage. The adjacent focus note then introduces several dense concepts before those basics are explicit.

The best in-scope solution is to refine the existing hero lede into a concise two-sentence bridge. Adding another panel or section would increase opening density; removing the focus note or deeper terminology would flatten the distinctive thesis.

## Intended opening narrative

1. Founder and platform identity.
2. Memorable promise: “Move fast. Engineer reliably.”
3. Plain-English bridge: audience, present problem, practical architecture, and desired outcome.
4. Direct routes into the Framework, practical help, and Research.
5. A short boundary statement that deepens into the engineering thesis.
6. The existing tension section explains why the problem matters.

## Rendered-observable invariants

1. “Move fast. Engineer reliably.” remains the dominant opening message at desktop and mobile widths.
2. Before leaving the opening, a first-time visitor can identify software professionals and teams, increasing AI participation in engineering work, reliability/accountability risk, and Framework/Research/Consulting/Learning as the practical architecture.
3. The focus note remains visibly secondary and preserves the non-tool-catalogue, engineering-investigation distinction.
4. Existing opening actions, Framework/Research structure, founder relationship, analytics attributes, and page order remain intact.
5. The bridge stays readable without horizontal overflow or pushing all useful navigation out of a normal 390×844 opening experience.

## Content decision

Use two plain sentences in the established hero lede position. Name AI directly because it is clearer to a first-time visitor than “machines” alone, while retaining the broader machine-autonomy language in the deeper thesis. Name the Framework, Research, Consulting, and Learning as connected parts of one practical body of work; do not recast Software Signal as a consultancy.

## Feasibility

The existing semantic paragraph and responsive hero layout support the change without new CSS or JavaScript. The change preserves progressive rendering, link behavior, SEO metadata, analytics, and the established editorial system.

## Review plan

- Render the homepage at 1440×900 and 390×844.
- Inspect opening hierarchy, wrapping, first-viewport content, semantic order, console/resource errors, and horizontal overflow.
- Run a fresh-context comprehension review using the five questions in issue #627.
- Run homepage contract, full regression, SEO, accessibility-oriented browser, and repository validation suites.

