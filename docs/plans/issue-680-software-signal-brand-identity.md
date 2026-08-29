# Issue 680 — Software Signal brand identity UX brief

## UX change brief

**Applicability:** UX brief required — the change affects the shared visual identity,
responsive header composition, browser-tab recognition, and default public link previews.

### User and goal

- **Affected user:** A visitor arriving anywhere on the public Software Signal website,
  including through a shared link or a browser bookmark.
- **Goal:** Recognize the same Software Signal identity across the website shell, compact
  browser surfaces, and generic social previews while retaining Suyog Joshi's visible
  founder accountability.

### Existing UX context

- Applicable direction: `docs/ux/site-ux-direction.md` and
  `docs/ux/software-signal-target.md`.
- Preserve the established calm editorial character, Petrol Teal emphasis, existing
  header height, navigation order, serif/sans roles, accessible mobile menu, and
  page-specific social artwork.
- Canonical identity comes from `suyog19/software-signal/brand`; the current `SS`
  square is superseded for Software Signal surfaces.

### Strategic altitude

- The homepage, Writing, Newsletter, Website Services, nested article pages, and shared
  header system were reviewed as one cross-site surface.
- The current constructed `SS` square discards the approved signal-and-checkpoint
  meaning and creates a mismatch with the canonical identity.
- **Best in-scope recommendation:** replace the constructed identity through the shared
  shell; use the full founder-attributed lockup where legible and the symbol at narrow
  widths; derive favicon and generic social assets from the same mark.
- **Stronger overall recommendation:** none within this task. Beehiiv alignment and
  Framework-diagram provenance remain separately traced work.
- **Recommendation strength:** strongly recommended.

### Desired outcome

- A visitor sees one coherent identity rather than initials in one place and an approved
  logo elsewhere.
- The brand remains quiet enough that page promises, navigation, and editorial content
  stay dominant.

### Primary hierarchy

- **Primary:** the page's content promise and current navigation context.
- **Secondary:** the Software Signal identity and founder attribution in the shared shell.
- **Intentionally quiet:** favicon/app identity and generic social-card attribution.

### Composition and responsive intent

- **Desktop:** the approved horizontal lockup occupies the existing brand region without
  increasing header height or pushing navigation.
- **Intermediate:** the logo scales within a bounded width while navigation spacing
  remains intact.
- **Mobile:** the approved symbol replaces the full lockup; it remains one home link and
  leaves clear room for the menu control.
- **Social preview:** a warm-white, whitespace-led default card uses the approved logo;
  page-specific covers retain precedence.

### Interaction and state intent

- The complete logo/picture is one home link with an explicit accessible name.
- Hover remains restrained; keyboard focus remains clearly visible.
- The existing mobile-menu interaction and state semantics remain unchanged.

### Media intent

- The logo establishes provenance and recognition, not decoration.
- Use local deterministic SVG/PNG/ICO assets; no third-party asset dependency.
- Preserve exact geometry, colors, text, attribution, transparency, and safe area.

### Design invariants

1. The header remains calm and content-led; the new logo never increases header height
   or competes with the page promise.
2. At desktop and intermediate widths, the founder-attributed lockup is legible without
   crowding or displacing primary navigation.
3. At narrow mobile widths, the symbol and menu control remain distinct, balanced, and
   free of horizontal overflow.
4. The logo behaves as one accessible home link with visible keyboard focus and no
   duplicate screen-reader announcement.
5. Generic link previews identify Software Signal by Suyog Joshi, while existing
   page-specific article, series, topic, course, and section artwork remains unchanged.

### Open subjective decisions

- None. The Product Owner approved the logo, website-aligned variant, and placement
  direction in the source requirements.

### Out of scope / preserve

- Navigation, information architecture, page copy, article-cover design, personal
  avatars, Beehiiv configuration, Framework-diagram branding, analytics, routes,
  hosting, and deployment topology.

### Tech Lead feasibility

- Reuse the shared header generator and existing CSS breakpoints; no new framework,
  dependency, font, or client state is required.
- Use `<picture>` inside the existing home link so the browser selects the full or compact
  local SVG without exposing duplicate accessible content.
- Generate raster icon/social fallbacks deterministically from the canonical SVG sources.
- Add metadata only when a page has no `og:image`; do not rewrite existing social-image
  metadata.
- No unresolved material trade-off remains.

## Gate A result

UX context ready. The brief, invariants, canonical assets, responsive intent, and
technical feasibility are resolved for implementation.
