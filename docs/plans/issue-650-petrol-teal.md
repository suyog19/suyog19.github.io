# Issue 650 — Petrol Teal brand migration

## UX change brief

**Applicability:** UX brief required — this changes the global visual identity across every public page family.

### User and goal

- Affected user: every visitor moving between Software Signal workstreams, detail pages, forms, and utility surfaces.
- Goal: recognize one calm, credible, engineered Software Signal identity without mistaking brand emphasis for urgency or error.

### Existing UX context

- Preserve the editorial, near-monochrome system in `docs/ux/site-ux-direction.md`.
- Preserve serif/sans roles, flat bordered components, spacing, hierarchy, routes, semantics, and progressive interaction.
- Signal Red is historical design provenance; #650 supersedes it without deleting that rationale.

### Strategic altitude

- Whole-site system reviewed: shared tokens, identity assets, global components, Home, Framework, Research, Consulting, Learning, Website Services, Writing, Systems, About, Contact, Newsletter, Support, forms, detail pages, demos, admin/private surfaces, and social previews.
- Best in-scope recommendation: one authoritative Petrol Teal token family, inherited by Learning and used only where the prior brand accent carried identity or interaction hierarchy.
- Stronger overall recommendation: none; typography, composition, and information architecture remain intentionally unchanged.
- Recommendation strength: strongly recommended, following the explicit Product Owner decision in #650.

### Desired outcome and hierarchy

- Petrol Teal communicates brand and action calmly; neutral surfaces remain dominant.
- Primary actions, current navigation, the SS mark, key rules, and selected treatments remain recognizable.
- Semantic error, danger, warning, and success states remain distinct and explicit in text or semantics.

### Responsive and state intent

- Desktop and mobile retain the same reading/action order and density.
- Hover, active, selected, and focus states use the Petrol Teal family where they previously used the brand accent.
- Validation and operational error reds remain semantic red; they are not migrated mechanically.

### Design invariants

1. The first impression remains quietly premium, editorial, and engineered; Petrol Teal never becomes a decorative field applied broadly.
2. The SS mark, primary actions, current navigation, and restrained rules read as one coherent accent across page families.
3. Learning inherits the exact shared Petrol Teal system and does not expose a separate accent identity.
4. Error and danger treatments remain visibly and semantically distinct from ordinary brand emphasis.
5. Desktop and mobile preserve existing hierarchy, spacing, and interaction order with no colour-only state regression.

### Tech Lead feasibility

- Reuse `--color-signal`, add `--color-signal-wash`, and keep `--color-signal-dark` as the single authoritative family in `css/base.css`.
- Replace only audited brand-red literals with tokens; retain documented semantic red literals.
- Synchronize SVG/ICO identity and generated social-preview assets without adding dependencies or changing public URLs.
- No unresolved product or architecture trade-off remains.

## Colour audit classification

- Brand values migrate to Petrol Teal: shared tokens, header/mark/navigation, buttons and links, Framework/Research/Home accents, Learning aliases, selected/action treatments, favicon, and generated social previews.
- Intentional semantic reds remain: invalid fields, form/feedback errors, failed demo states, admin exceptions/deadlines, learner communication warnings, and destructive/error status presentation.
- Neutral, success, warning, and informational palettes remain unchanged.
