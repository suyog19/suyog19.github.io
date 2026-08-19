# Software Signal newsletter subscription UX

Control issue: `suyog19/software-signal#23`

## Post-confirmation destination — issue #564

**Applicability:** UX brief required — this change repairs the material success state at the end of the double-opt-in task flow.

### Evidence and user impact

After selecting `Confirm Subscription` in the beehiiv double-opt-in email, a Product Owner mobile screenshot on 19 August 2026 shows the reader landing on the generic newsletter home page. The page presents an empty Email field and Subscribe button without acknowledging confirmation. A reader who has just completed the required action cannot tell whether it succeeded or whether the form requires another submission.

beehiiv documents the publication home page as the default post-confirmation destination and provides an `Opt-in Redirect URL` under the double-opt-in email settings. Issue #564 uses that direct setting rather than a paid automation or a second signup flow.

### Approved direction

- Add a dedicated `/newsletter/confirmed/` utility success page on `suyogjoshi.com`.
- Lead with the explicit status `Your subscription is confirmed.`
- State that no further email entry is required and that the next edition arrives Saturday.
- Offer optional paths to previous editions and the site home page.
- Do not render an email field, Subscribe action, survey, recommendation step, or promotional detour.
- Configure beehiiv's double-opt-in redirect to the dedicated production URL only after the page is live.
- Keep double opt-in enabled and use no subscriber address or identifier in the redirect URL.

### Observable invariants

1. Confirmation success is the first and dominant message at 320, 390, and 1440 CSS px.
2. The page explicitly says there is no need to enter the email again and contains no signup form.
3. The Saturday expectation is visible before optional navigation.
4. Archive and Home actions are clearly secondary to the completed status and remain usable by keyboard and touch.
5. The page works without JavaScript, has no horizontal overflow, and is `noindex, follow` as a task-completion utility route.

### Gate A — UX and feasibility acceptance

Senior UX accepts the dedicated, restrained success page as the strongest in-scope correction. It reuses the site's established typography, header, footer, button, spacing, and color system. Team Lead feasibility review confirms that the static route and provider redirect require no backend, personal-data handling, dependency, automation, or embed change. Provider availability must be supported by current beehiiv documentation and an unlocked account control before the redirect is saved.

### Iteration 1 rendered review and Gate B

Reviewed the local feature-branch route on 19 August 2026 in Chrome browser plugin `26.707.72221` at 320×844, 390×844, and 1440×900.

| Surface/state | Viewport | Result |
| --- | ---: | --- |
| `/newsletter/confirmed/`, default | 320×844 | Dominant confirmation status, complete copy, stacked full-width actions, no form, no horizontal overflow; pass |
| `/newsletter/confirmed/`, default | 390×844 | Dominant confirmation status, complete copy, stacked actions, no form, 390/390 document width; pass |
| `/newsletter/confirmed/`, default | 1440×900 | Centered 654px content measure, balanced actions, full header/footer context, no form, 1440px viewport with no page overflow; pass |

Semantic inspection confirms one `h1`, no forms, and two meaningful continuation links: `Read previous editions` and `Return home`. The page remains complete without JavaScript. The focused newsletter contract test also rejects any form, beehiiv embed, or Subscribe action on this route.

Senior UX Gate B findings:

- **Must fix:** none.
- **Should fix:** none.
- **What works / preserve:** immediate confirmation wording, explicit no-repeat instruction, Saturday expectation, restrained optional actions, and generous completion-state whitespace.
- **Result:** UX-ready.
- **Recommendation strength:** strongly recommended.

### Provider/free-tier verification

The signed-in publication settings expose `Opt in redirect URL` directly beneath the enabled `Double opt in email` control, with no upgrade marker or locked state. beehiiv's current double-opt-in documentation describes the publication home page as the default and this field as the standard way to choose another destination; it does not label the redirect as a paid-plan feature. The workspace temporarily displays a Max trial badge, so availability is not inferred from the account badge alone. The implementation uses only this documented double-opt-in setting and explicitly excludes Smart Nudge, automations, surveys, recommendations, and other paid growth features.

The redirect value will be `https://suyogjoshi.com/newsletter/confirmed/`. It contains no email address, subscriber ID, token, or query parameter. Saving remains deferred until the route is promoted and verified on production.

### Gate D — issue #564 UX acceptance

- **Result:** UX accepted for merge to `dev`.
- **Accepted delivery sequence:** publish the static destination first; then set and verify the provider redirect. This prevents confirmation links from being sent to a route that is not yet live.
- **Invitation gate:** quiet-launch invitations remain paused until one safe end-to-end confirmation proves the production redirect and final destination.
- **Recommendation strength:** strongly recommended.

## Narrow-mobile correction — issue #561

**Applicability:** UX brief required — the production provider form fails the accepted responsive form/task-flow invariant at a real mobile width.

### Evidence and user impact

A Product Owner mobile screenshot on 19 August 2026 shows the beehiiv form's horizontal, fixed-width treatment compressing its only email input beside the Subscribe button until the visible placeholder reads `Enter you`. Live production inspection confirms that the complete placeholder is `Enter your email`, so the clipped text is a rendered layout defect rather than intended copy.

The field has no separate visible label. The clipping therefore removes the reader's clearest visual cue about what information is required and makes the primary action look unfinished immediately before the quiet launch.

### Approved direction

- Replace the cramped Slim single-row treatment with a Launch-compatible Regular inline form whose field and button stack vertically.
- Show a visible `Email address` label and retain the `Enter your email` placeholder.
- Hide the provider title and subtitle because the surrounding page already supplies the newsletter identity, promise, consent, cadence, confirmation, privacy, and unsubscribe context.
- Preserve the high-contrast Subscribe button, double opt-in, provider success/error behavior, accessible iframe title, and hosted fallback.
- Do not attempt to style the cross-origin iframe from site CSS.

This direction follows beehiiv's current embedded-form guidance, which specifically recommends Regular over Slim for mobile-heavy audiences because Regular stacks fields and adapts better at small widths.

The references to a Slim source form and an available visible label record the initial screenshot-based hypotheses. Provider inspection in iteration 2 superseded both: the source form was Regular with horizontal/fixed-width styling, and beehiiv disables the label control for this single-field form.

### Observable invariants

1. At 320, 360, and 390 CSS px, `Email address`, the complete placeholder, and `Subscribe` are readable without clipping or horizontal overflow.
2. The field and button form one clear vertical action sequence with touch-friendly sizing and visible focus.
3. Surrounding consent, confirmation, unsubscribe, and Privacy Notice wording remains before the form action.
4. Provider invalid, submitting, success, and human-verification states remain contained and understandable at narrow widths.
5. Desktop retains a compact, balanced form without repeating the surrounding newsletter title or description.

### Senior UX Gate B finding

- **Must fix:** the production Slim layout materially clips the only visible email instruction at the supplied mobile width and fails invariant 3 of the original brief.
- **Should fix:** remove duplicated provider title/subtitle and use a visible email label while moving to a vertical Regular layout.
- **What works / preserve:** surrounding promise-to-consent-to-action order, restrained editorial treatment, high-contrast action, double opt-in explanation, privacy route, and accessible iframe title.
- **Result:** needs another iteration; quiet-launch invitations remain paused.
- **Recommendation strength:** strongly recommended and blocking for `suyog19/software-signal#27`.

### Iteration 2 — provider correction and Gate C

Reviewed 19 August 2026 against the live provider form ID `73d5eecc-14a6-4de7-9654-a6b57f593298`.

The existing form was already a Regular inline form, but its internal form direction was horizontal, its form width was fixed at 400px, and its background used fit-content width with 80px padding. The production correction:

- keeps the documented Regular inline layout;
- hides the duplicated provider title and subtitle;
- changes the form direction to vertical;
- changes both the background and form widths to fill the available iframe width;
- reduces background padding from 80px to 24px;
- sets a 12px field/button gap; and
- uses a 48px field/button height setting.

Double opt-in remains enabled. The success message remains `Success! Now check your email to confirm your subscription.` The embed ID and website script are unchanged, so no code or production-branch promotion is required for the provider configuration to take effect.

beehiiv disables the visible-label toggle for a single-field form. This is an accepted provider constraint: the input retains the semantic email type and accessible name, while the corrected full-width layout keeps the complete `Enter your email` placeholder visible. Adding a visually disconnected label outside the cross-origin iframe would not programmatically label the control and is not recommended.

### Rendered evidence — issue #561 iteration 2

- Capture method: live production inspection plus a temporary local width fixture containing the production provider iframe at exact CSS widths; Chrome browser plugin `26.707.72221`.
- Compared with: the Product Owner's production mobile screenshot showing the clipped `Enter you` state.
- The temporary fixture is intentionally not committed and contains no submitted address.

| Surface/state | Width | Result |
| --- | ---: | --- |
| Provider form/default | 320 CSS px | 270px stacked field/button; complete placeholder; 320/320 document width; pass |
| Provider form/default | 360 CSS px | 310px stacked field/button; complete placeholder; 360/360 document width; pass |
| Provider form/default | 390 CSS px | 340px stacked field/button; complete placeholder; 390/390 document width; pass |
| Production `/newsletter/` default | current desktop review viewport | 333px stacked field/button in a 383px iframe; 206px iframe height inside a 240px container; pass |
| Provider form/invalid email | 320 CSS px | native validation retains focus on the email input with no submission or overflow; pass |

Geometry in every exact-width fixture used 25px side insets, a 72px rendered field, a 12px rendered gap, and a 72px rendered button. The provider reports no internal horizontal overflow. The outer page code and reading order are unchanged from the accepted #23 evidence.

Submitting, success, and human-verification logic were not retransmitted during this layout-only correction to avoid creating another subscriber event. Double opt-in and the configured success message were inspected directly; the previously approved production end-to-end evidence remains applicable because the form ID and settings behavior are unchanged.

### Gate D — issue #561 UX acceptance

- **Must-fix resolution:** resolved. The field and action now stack and the complete email instruction remains visible at 320, 360, and 390 CSS px.
- **Should-fix resolution:** duplicated provider title/subtitle removed; visible-label recommendation accepted as a provider-constrained deviation because the single email field disables that control.
- **What works / preserve:** outer promise, consent, privacy, confirmation, archive fallback, button contrast, double opt-in, and iframe title are unchanged.
- **Result:** UX accepted. Product Owner confirmation on the original mobile device gates resuming issue #27 invitations, not this correction's merge to `dev`.
- **Recommendation strength:** strongly recommended.

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

### Evidence index — iteration 2

- Reviewed implementation commit: `5e1fb51d195ce59ee036f96f99718a2a0d3f9483` (the subsequent evidence-only commit does not change rendered code).
- Capture date: 19 August 2026.
- Capture method: in-app Browser plugin `26.707.72221` against `python -m http.server 8080`, browser zoom unchanged, explicit viewport override, viewport and focused screenshots, semantic DOM snapshots, and DOM-backed overflow/resource checks.
- Compared with: iteration 1 at `9a8da6e0ad51dc632b66275adb67faca3b858efa`, where the missing generated-iframe title and incomplete privacy disclosure were identified.

| Page/state | Viewport | Evidence |
|---|---:|---|
| `/newsletter/`, default viewport | 1440×900 | `23-i2-newsletter-1440x900-default.jpg` |
| `/newsletter/`, default full-page flow | 1440×900 | `23-i2-newsletter-1440x900-full.jpg` |
| `/newsletter/`, default viewport | 390×844 | `23-i2-newsletter-390x844-default.jpg` |
| `/newsletter/`, form-focused | 390×844 | `23-i2-newsletter-390x844-form.jpg` |
| Home, contextual signup | 1440×900 | `23-i2-home-1440x900-context.jpg` |
| Writing, contextual callout | 390×844 | `23-i2-writing-390x844-context.jpg` (`SHA-256 37CB97C6C343E3255C4E7ADADE913A3628507A3FDCB71DC670F286A782B39840`) |

The routine screenshot set is held in the implementer's temporary review workspace at `C:\Users\ADMIN\AppData\Local\Temp\ss23-rendered-evidence` and is intentionally not committed. It contains no submitted address. The live double-opt-in evidence used the explicitly approved test alias and remains private in beehiiv and Gmail; no private screenshot is attached publicly.

At 1440×900 and 390×844, `/newsletter/` reported document widths no greater than the viewport (`1425/1440` and `375/390`) and the generated iframe exposed the title `Subscribe to Software Signal Weekly`. Semantic inspection confirmed heading order, newsletter-detail list, form region, email textbox, Subscribe button, Privacy Notice link, archive link, mobile navigation control, and contextual Home/Writing routes. The provider iframe loaded in each final capture with no visible resource-failure state. Console capture was not available in this browser surface; the full automated suite and live provider flow are the compensating evidence.

Provider-state evidence: an invalid address exercised native error feedback without transmission; the approved alias then rendered the production human-verification step, entered beehiiv as `pending`, received a branded-domain confirmation email, became `active` after confirmation, and received the complete welcome email. Both test messages landed in Gmail Spam, which is recorded as an operational deliverability risk rather than a subscription-UX defect.

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
