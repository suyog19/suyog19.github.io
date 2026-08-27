# Issue 607 shared brand and visual foundation

## Traceability and scope

- Parent epic: #603
- Approved direction: #605 and `docs/ux/software-signal-target.md`
- Preserved interaction baseline: #604
- Regression safety net: #606
- UX applicability: full UX brief required because navigation, visual identity,
  responsive behaviour, and shared composition materially change.

This issue changes the public shared shell and introduces concise `/framework/`
and `/research/` shell surfaces so the approved navigation is truthful. It does
not restructure the homepage or migrate page-family content assigned to #608 and
#609. Private learner and administration shells retain their task-specific
navigation.

## Gate A UX change brief

### User and goal

Visitors should immediately understand that this remains Suyog Joshi's site and
that Software Signal is his first-class professional body of work. They should
be able to choose a professional destination without decoding the site's
internal architecture.

### Desired hierarchy

1. **Primary:** Software Signal as the professional platform, visibly founded by
   Suyog Joshi; the current page and one next action remain easy to identify.
2. **Secondary:** Consulting, Learning, Website Services, Writing, About, and a
   restrained Subscribe action.
3. **Intentionally quiet:** utility destinations, social profiles, Framework and
   Research discovery in the footer and Software Signal surfaces.

Desktop uses one calm horizontal shell. Mobile preserves the brand relationship
in the closed header, then presents a deliberate full-width vertical menu with
the same semantic order. No navigation meaning depends on colour alone.

### Flexible page-opening foundation

Four lightweight semantic patterns are available without prescribing identical
markup: `opening--brand`, `opening--service`, `opening--editorial`, and
`opening--index`. They share type, measure, spacing, rule, and action primitives;
their grid, density, and content order may differ. Existing page-family openings
are not mechanically converted in #607.

### Design invariants

1. At desktop and 390px, both “Software Signal” and “Suyog Joshi” are visible in
   the closed shared header without an anonymous-corporate impression.
2. The seven approved destinations remain calm, keyboard operable, and usable;
   mobile open/close/focus behaviour is at least as strong as #604.
3. Signal Red identifies brand and selected/action hierarchy while neutral space,
   typography, and rules still carry most of the composition.
4. Representative page families remain visibly distinct; the foundation enables
   multiple openings rather than imposing one universal hero.
5. Every #604 route and critical CTA remains functional unless an approved,
   documented navigation-contract change says otherwise.
6. Footer discovery is concise and exposes Software Signal, Framework, Research,
   services, subscription/contact, evidence, and founder identity without becoming
   a sitemap dump.

### Intentional #604 interaction change

`NAV-02` changes from `Training | Writing | Systems | About | Contact` to the
Product Owner-approved `Software Signal | Consulting | Learning | Website Services
| Writing | About | Subscribe`. The underlying `/training/`, `/writing/`, `/about/`,
and service routes remain; Systems and Contact move to concise footer discovery.
`NAV-01` and `NAV-03`–`NAV-05` are preserved. The #606 assertion is updated only
for this approved `NAV-02` disposition.

### Tech Lead feasibility

The change fits the existing hand-authored HTML, three-layer CSS, and progressive
vanilla-JavaScript architecture. Existing tokens, header/footer classes, and menu
state are evolved in place; no framework, build step, runtime dependency, font,
client router, or second design system is introduced. A mechanical shared-shell
migration preserves depth-correct relative links and route-specific
`aria-current`. Responsive collapse moves to a width that keeps the seven-item
desktop navigation composed. Residual risk is broad HTML touch surface, controlled
by exhaustive link/canonical validation, all-route browser checks, and rendered
representative review.

### Open decisions and deferrals

No Product Owner decision remains for #607. Exact homepage hierarchy, substantive
Framework/Research content, and broad page-family composition remain with #608
and #609.

## Shared asset budget disposition

The accepted foundation measures 3,322 raw bytes in `base.css` and 13,708 raw
bytes in `components.css`. The deterministic ceilings are narrowly reset to 3,600
and 14,500 bytes, retaining less than 9% review headroom. This makes the intended
shared-shell cost explicit while preserving the existing scoped-asset checks and
all larger page-family budgets.
