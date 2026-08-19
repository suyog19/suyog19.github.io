# Software Signal newsletter subscription UX

Control issue: `suyog19/software-signal#23`

## UX change brief

**Applicability:** UX brief required — this change adds a public page, a third-party email form, new discovery paths, and responsive success/error states.

### User and goal

- Affected user: a reader of Suyog's engineering writing who wants a low-friction way to receive the weekly newsletter.
- Goal: understand the editorial promise, enter one email address, and know that confirmation by email is required.

### Existing UX context

- Site direction: `docs/ux/site-ux-direction.md`
- Page-family direction: `docs/ux/pages/home.md` and `docs/ux/pages/writing.md`
- Preserve the editorial typography, near-monochrome palette, bounded widths, flat rules, direct language, and progressively enhanced navigation.

### Strategic altitude

- Reviewed the complete production Home and Writing pages, shared navigation/footer, the beehiiv form, and the live newsletter archive.
- The local change exposes no need for a broader site redesign. Site-wide navigation changes would create unnecessary competition among Training, Writing, Systems, About, and Contact.
- Best in-scope recommendation: a dedicated `/newsletter/` page with the production email-only embed, a contextual embedded form after selected Home writing, and a restrained Writing-page route to the dedicated page.
- Stronger overall recommendation: none before real signup evidence exists.
- Recommendation strength: strongly recommended.

### Desired outcome and hierarchy

- Primary: the reader promise and one email signup action.
- Secondary: cadence, what editions contain, and the double-opt-in next step.
- Intentionally quiet: archive access, privacy link, and beehiiv/provider attribution.

Desktop uses a two-column editorial introduction and form region where space permits. Mobile places the promise, expectation, then form in that order. The form remains the centre of gravity and never becomes a popup or overlay.

### Interaction and state intent

- Default: one email field, clear label/placeholder, and Subscribe action supplied by the production beehiiv embed.
- Submitting: the provider disables/relabels the action while processing.
- Success: the provider state is reinforced by surrounding copy telling the reader to check email and confirm.
- Error: the provider retains the form and communicates the failure without the page hiding the alternative hosted signup route.
- Focus: native controls and links retain visible keyboard focus.

### Design invariants

1. The newsletter promise is understood before the email field asks for action.
2. The embedded form is the only dominant action in its region; archive and privacy links remain secondary.
3. Desktop and mobile keep the same reading order, with no horizontal overflow or clipped provider content.
4. The page states plainly that signup requires email confirmation and does not imply immediate subscription.
5. Home and Writing discovery feel contextual, not like a campaign banner or repeated nag.

### Out of scope / preserve

- No popup, modal, countdown, paid feature, API/backend integration, public launch announcement, or unrelated site redesign.
- Do not change the existing primary site routes or article catalogue hierarchy.

### Tech Lead feasibility

- Reuse the existing header, footer, section, button, typography, and responsive patterns plus a small scoped newsletter component in `css/pages.css`.
- Use beehiiv's production loader and attribution scripts. They expose no secret and keep double opt-in and subscriber handling in beehiiv.
- Keep a hosted subscribe link as a progressive fallback if the third-party script is unavailable.
- No unresolved material trade-off. The provider iframe controls its internal field styling and state presentation; the surrounding layout will absorb that constraint without introducing a second design system.

## Rendered review record

### Gate B — implementation review

- Reviewed the dedicated page, Home signup surface, and Writing callout against the established editorial direction at desktop and the 390 px mobile breakpoint.
- Verified the mobile reading order remains promise, expectations, form, then secondary links, without horizontal overflow.
- Inspected the live provider form at a narrow viewport and exercised native invalid-email feedback without submitting data.
- Must-fix finding: beehiiv's generated iframe did not include an accessible title. Added `js/newsletter.js` to apply `Subscribe to Software Signal Weekly` as soon as the iframe is created.

### Gate C — final UX QA

- Rechecked responsive layout, focusable links and controls, contextual discovery, privacy/fallback routes, and explicit double-opt-in language after the accessibility fix.
- No remaining must-fix UX findings. Provider-owned field styling is an accepted integration constraint and does not disrupt the surrounding hierarchy.

### Gate D — acceptance

- UX acceptance: accepted.
- Recommendation strength: strongly recommended.
- Deviations: none.
- Production evidence: the approved test alias was created as `pending`, received the confirmation message, became `active` after confirmation, and received the welcome message with the expected sender, weekly promise, reply invitation, physical address, unsubscribe link, and beehiiv attribution.
- Operational observation: Gmail placed both test messages in Spam. This does not block the subscription UX, but sender reputation and inbox placement should be monitored separately from this implementation.
