# Support page UX direction

Issue: [#571](https://github.com/suyog19/suyog19.github.io/issues/571)

Parent epic: [#570](https://github.com/suyog19/suyog19.github.io/issues/570)

Status: approved implementation reference; `/support/` implementation accepted under #572

## UX change brief

**Applicability:** UX brief required — `/support/` will be a new public journey,
material information-architecture addition, and handoff point to financial
providers.

### User and goal

- **Affected visitor:** a reader, learner, peer, or practitioner who values
  Suyog's public engineering writing, systems, or educational work and wants to
  help it continue.
- **Visitor intent:** understand what support means, decide whether and how to
  help, and continue to the appropriate external provider without mistaking the
  page for a purchase, charity appeal, or access gate.
- **First-five-seconds outcome:** “This is an optional way to support Suyog's
  independent public engineering work. I can help once, help regularly, or help
  without paying.”

The target visitor is already positively disposed toward the work. The page does
not need to manufacture urgency or persuade an unfamiliar visitor through a
fundraising narrative.

### Existing UX context

- Applicable site direction: `docs/ux/site-ux-direction.md`, especially the
  editorial character, progressive hierarchy, restrained components, and mobile
  recomposition principles.
- Related page-family direction: `docs/ux/pages/about.md` for personal credibility
  without self-promotion and `docs/ux/pages/contact.md` for trust-led task clarity.
- Preserve the current serif/sans roles, near-monochrome palette, bounded content
  widths, flat bordered groupings, direct labels, visible focus, and generous
  whitespace.
- Support is a new intent, but it must read as part of the same authored knowledge
  site. It does not inherit the teal Software Signal Learning identity and does
  not introduce a fundraising visual system.

### Strategic altitude

- **Whole-page and cross-site system reviewed:** Home, About, Contact, the shared
  header/footer and button/card conventions, and the Support epic's intended
  funnel.
- **Broader inconsistency exposed:** none requiring resolution in #571. Initial
  discovery belongs to later issue #575. The primary navigation remains unchanged.
- **Best in-scope recommendation:** a calm, typography-led page that explains the
  work and its effect before presenting two equally weighted financial choices,
  followed by credible non-financial options and a quiet trust note.
- **Stronger overall recommendation:** the same. There is no evidence that
  illustration, supporter benefits, tiers, progress meters, testimonials, or a
  campaign treatment would improve this first version.
- **Recommendation strength:** strongly recommended.

## Recommended implementation direction

### Information hierarchy and section order

1. **Orientation — Support independent engineering work**
   - Eyebrow: `Support the work`
   - H1: `Help independent engineering work continue`
   - Intro intent: identify the public writing, practical systems, and learning
     resources being supported; state immediately that support is optional.
   - No financial CTA appears in the hero. A short in-page text link such as
     `See ways to support` may move to the choices section, but it must not compete
     with the explanation.

2. **Why support / what it enables**
   - Heading: `What your support helps make possible`
   - Use three concise outcomes, not promises tied to a payment amount:
     - time to research and write practical engineering guidance;
     - maintenance and development of public systems, examples, and learning
       resources;
     - room to explore useful topics without turning every piece of work into a
       commercial product.
   - Make clear that the work remains editorially independent and that public
     material does not become paid-only because someone does or does not support.

3. **Financial choices**
   - Heading: `Choose how you would like to support`
   - Orientation copy: both choices leave the site for the named provider; the
     visitor chooses the amount and completes payment there.
   - Present the two options as peer cards with equal dimensions, heading level,
     descriptive depth, button treatment, and order-independent emphasis:
     - **One-time support** — for a single contribution through Razorpay.
       Primary label: `Support once with Razorpay`.
     - **Recurring support** — for ongoing support through GitHub Sponsors.
       Primary label: `Support regularly on GitHub`.
   - Neither option is marked `recommended`, `most popular`, or visually promoted.
     Provider logos, payment badges, suggested amounts, and tier comparisons are
     unnecessary for the initial page.

4. **Non-financial support**
   - Heading: `Other ways to help`
   - Lead with genuine usefulness, not an apology for not paying.
   - Recommended actions:
     - share a useful article or system with someone who needs it;
     - send specific feedback, corrections, or a practical question;
     - cite or link to relevant work when it informs a discussion or project.
   - Use direct text links where destinations exist. Do not render this section as
     a diminished third payment card or hide it behind a disclosure.

5. **Trust and boundary note**
   - Heading: `Before you continue`
   - Keep this short, readable, and adjacent to the financial choices on desktop
     while preserving the main reading sequence on mobile.
   - Required intent:
     - support is voluntary and does not purchase consulting, training, influence,
       priority support, access, or a promised deliverable;
     - public work is not gated behind support;
     - payment details and the transaction are handled on the selected provider's
       site, subject to that provider's terms and privacy practices;
     - visitors who want training or consulting should use those separate routes,
       not a support payment.
   - Avoid tax-deductibility, refund, fee, currency, receipt, recurring-cancellation,
     or provider-processing claims until the relevant payment stories verify the
     exact operational truth. Those stories must add any legally or operationally
     required wording before launch.

### Production copy boundaries

Copy should sound grateful but composed. Address what the work is and what support
enables; do not narrate personal financial need or pressure the visitor to prove
appreciation.

Use language such as:

- `If this work has been useful, you can help make more of it possible.`
- `Support is entirely optional. The public writing, systems, and learning
  resources remain available whether or not you contribute.`
- `You will complete your contribution on Razorpay or GitHub, not on this site.`

Avoid language such as:

- `Donate now`, `fund me`, `keep me going`, or `every little bit helps`;
- artificial urgency, countdowns, scarcity, guilt, social proof, or progress bars;
- `buy me a coffee` metaphors that trivialise the engineering-work context;
- claims that a specific contribution funds a specific output unless that
  accounting can be proved;
- `membership`, `subscriber benefits`, `exclusive access`, or language implying a
  commercial exchange.

The implementation story may polish sentences for rhythm and length, but it must
preserve these meanings and CTA labels unless the Product Owner approves a change.

## Composition and responsive intent

### Desktop (approximately 1024 CSS px and wider)

- Open with a bounded editorial hero. Keep the H1 and intro in a readable measure;
  do not fill the width with a campaign banner or oversized illustration.
- Follow with a two-part enabling section: concise orientation copy and a simple
  three-item outcome list or flat grouping. Text remains the visual anchor.
- Place the two financial cards in a two-column peer grid. Their top edges, content
  rhythm, and actions align without stretching either card with artificial copy.
- Put non-financial support in its own full-width section after the financial
  choice, with enough visual weight to be read as a legitimate path.
- Place the trust note after the choice group or in a restrained adjacent column
  only if DOM order still reads explanation → choices → trust. It must not resemble
  legal fine print or interrupt comprehension before the choices are understood.

### Intermediate/tablet (approximately 640–1023 CSS px)

- Keep the financial options side by side only while each retains a comfortable
  heading, explanation, and full CTA label without cramped wrapping.
- Stack the cards at equal width before content becomes compressed; do not shrink
  type or abbreviate CTA labels to preserve columns.
- Reduce section gaps proportionally while retaining clear separation among why,
  financial choices, other ways, and trust.

### Mobile (below approximately 640 CSS px)

- Preserve one reading and decision order: orientation → what support enables →
  one-time choice → recurring choice → other ways → trust note.
- Stack the equal-status financial cards. Their DOM order may follow the issue's
  one-time/recurring sequence, but visual treatment remains equal so order does not
  imply endorsement.
- Make provider actions comfortably touchable and full-width within their cards.
  Long labels wrap cleanly rather than truncating.
- Keep paragraphs and lists within readable line lengths, with no horizontal
  scrolling, sticky contribution prompt, floating CTA, or repeated bottom action.

### Imagery decision

No imagery is recommended. Typography, whitespace, rules, and concise content can
establish trust and hierarchy more faithfully than a portrait, illustration,
provider-logo wall, or generic “creator support” image. Reconsider imagery only if
rendered review demonstrates a specific comprehension problem that an image can
solve; decoration or perceived emptiness is not sufficient evidence.

## Components and implementation boundaries

- Reuse the global header, footer, `.container`, page-title/intro typography,
  section heading patterns, `.btn`, `.btn-primary`/`.btn-secondary`, tokens, and
  flat bordered grouping language from the existing stylesheets.
- A minimal Support-specific peer-choice grid/card pattern may be added to
  `css/pages.css`. It should compose existing tokens and button rules rather than
  become a generic payment or fundraising component library.
- Both financial CTAs should use the same established high-contrast button class.
  Non-financial actions should normally use text-link treatment so their different
  mechanism is clear without suggesting they are unimportant.
- Use semantic headings, paragraphs, lists, and ordinary external links. No
  JavaScript is needed for the core page or provider handoff.
- External-provider links must identify the provider in visible text. If they open
  a new tab, communicate that behavior accessibly; the preferred default is normal
  same-tab navigation to preserve predictable browser behavior.
- #571 does not authorize provider URLs, analytics attributes, new navigation,
  backend calls, payment embeds, amount selectors, modal flows, or transaction
  state. Those belong to #572–#577 with their own verification.

## Interaction, accessibility, and state intent

- **Default:** all three support paths are visible without interaction. Financial
  cards explain their cadence and provider before asking for action.
- **Hover:** use only the existing button/link affordance. Do not lift, animate, or
  recolor an entire card in a way that implies card-level activation.
- **Keyboard focus:** every actionable element retains the established visible
  focus treatment with sufficient contrast and no clipping. The visual order and
  tab order match the DOM reading order.
- **Touch:** buttons have the established touch-friendly target size and adequate
  separation. Do not make a whole card a nested or ambiguous tap target.
- **Visited links:** remain recognisable as links; provider identity is not conveyed
  by colour or logo alone.
- **Provider unavailable or URL unverified:** fail closed by withholding or
  disabling that provider action with plain availability guidance; never guess,
  redirect to another payment route, or leave a deceptive placeholder link.
- **Provider return, success, cancellation, or error:** no on-site state is designed
  in #571 because the confirmed provider flows are not yet known. #573 and #574
  must document observable behavior and recovery before launch rather than infer a
  successful payment from an outbound click.
- **Reduced motion / JavaScript unavailable:** the full page and every available
  support route remain understandable and usable without motion or JavaScript.
- **Semantics:** one H1; sequential H2 sections; peer options use equal-level
  headings; no ARIA tabs, radio buttons, or `role="button"` links are needed.

## Design invariants

1. Within the first viewport at representative desktop and mobile widths, visitors
   understand that the page supports independent public engineering work and that
   participation is optional; no payment action outranks that explanation.
2. Visitors encounter what support helps enable before the one-time and recurring
   actions, and the page never implies that public work is gated behind payment.
3. One-time and recurring support have equal rendered status: neither receives a
   recommendation badge, stronger control, larger surface, or more persuasive copy.
4. Non-financial support reads as a useful path with concrete actions, not as a
   consolation line beneath the payment choices.
5. At desktop, tablet, and mobile widths, the page retains the site's calm editorial
   language through typography, whitespace, and flat structures without fundraising
   imagery, urgency, or a second design system.
6. Before leaving the site, visitors can distinguish voluntary support from
   training or consulting and understand that the selected provider handles the
   transaction under its own terms and privacy practices.

## Out of scope / preserve

- Do not add Support to primary navigation. Issue #575 may propose footer or
  contextual discovery, with explicit Product Owner approval for any primary-nav
  change.
- Do not redesign Home, About, Contact, Writing, Systems, Training, or the global
  header/footer in this story.
- Do not merge commercial training/consulting CTAs, purchases, service enquiries,
  or learner payment flows into this support journey.
- Do not introduce rewards, tiers, supporter recognition, accounts, donor records,
  custom billing, or gated content.
- Do not implement, publish, instrument, or launch `/support/` in #571.

## Team Lead / Architect feasibility review

**Decision:** feasible within the existing static-site architecture; no material
technical trade-off remains open.

- The proposed page can be hand-authored at `support/index.html` using existing
  global HTML, CSS, navigation, footer, typography, button, container, and responsive
  patterns.
- The only potentially new presentation is a small peer-choice grid/card rule in
  `css/pages.css`; it needs no dependency, framework, component abstraction, image,
  or JavaScript state.
- Ordinary HTTPS links provide progressive provider handoff. Exact Razorpay and
  GitHub Sponsors destinations must be allow-listed and verified by #573/#574;
  this brief deliberately does not bless an unverified URL.
- The future route will require the repository's standard canonical, metadata,
  sitemap, GA4, asset-depth, responsive, accessibility, and public-route checks in
  #572. Provider handoff, privacy/trust wording, failure behavior, and analytics
  require the Protected reviews assigned to later epic stories.
- Keeping transaction state outside this static page avoids false success claims,
  sensitive-data handling, retry ambiguity, and a second checkout system.
- Same-tab external navigation, semantic markup, content-complete no-JavaScript
  behavior, and an early single-column breakpoint are compatible with existing
  accessibility and maintainability constraints.

### Alternatives rejected

- **Payment-first hero:** fails the required comprehension sequence and makes the
  page resemble a checkout or fundraising campaign.
- **One-time option visually dominant:** contradicts equal-status intent and
  nudges cadence without a user-centred reason.
- **Provider embeds or amount selectors:** add third-party state, accessibility,
  reliability, and trust complexity without improving initial choice.
- **Three equal cards including non-financial support:** falsely makes sharing or
  feedback look like a third transaction method and weakens its distinct value.
- **Portrait or custom illustration:** adds personality or decoration but no
  necessary decision information; it also risks making the appeal person-first.
- **Primary-navigation placement:** expands site-wide hierarchy beyond #571 and is
  explicitly reserved for Product Owner decision.

## Gate A disposition

- **Senior UX direction:** ready for Product Owner review; strongly recommended.
- **Team Lead feasibility:** accepted as written.
- **Material subjective decisions:** the recommended typography-led direction,
  equal financial choices, and separate non-financial section are resolved by this
  brief. No alternate visual concept is recommended.
- **Product Owner approval required:** approve this document as the implementation
  reference for #572–#577, including the CTA labels and the decision not to add
  Support to primary navigation.
- **Implementation hold:** substantial `/support/` implementation must not begin
  until the Product Owner records approval or specific requested changes on #571.

## Issue #572 rendered implementation review

### Evidence index — iteration 1

- Reviewed implementation commit: `8b7fb45354894ffb3fd56be957dc224ae966e06d`.
- Capture date: 24 August 2026.
- Capture method: browser plugin `26.707.72221` against
  `http://localhost:8080/support/`, explicit viewport overrides, full-page and
  focused screenshots, semantic DOM snapshot, computed geometry, keyboard focus,
  console/resource checks, and horizontal-overflow checks.
- Routine screenshots are held in the temporary review workspace at
  `C:\Users\ADMIN\AppData\Local\Temp\issue-572-rendered-evidence` and are not
  committed. The branch-preview URL is recorded on the implementation PR after
  deployment.

| Page/state | Viewport | Result |
| --- | ---: | --- |
| `/support/`, default | 1440×900 | Complete editorial flow; equal 516×380px financial cards; pass |
| `/support/`, default | 1024×900 | Two comfortable equal-width financial cards; pass |
| `/support/`, default | 768×900 | Financial choices recompose to equal full-width stacked cards; pass |
| `/support/`, default | 390×844 | Approved reading order, full-width disabled actions, no overflow; pass |
| `/support/`, narrow default | 320×844 | CTA labels wrap without clipping; equal cards and 305/305px document width; pass |
| `/support/`, keyboard focus | 390×844 | First Tab exposes the global 2px focus outline with 3px offset; pass |

The 1440px render reported a 1425px document width in a 1425px client area; the
390px and 320px renders reported 375/375px and 305/305px respectively. At 320px,
both full labels wrap into 207×62px disabled controls rather than truncate. The
semantic snapshot contains one H1, sequential H2 regions, equal-level financial
H3s, native disabled buttons with availability descriptions, and ordinary links
for non-financial and commercial routes. No console warnings or errors were
reported.

Screenshot integrity:

- `572-i1-support-1440x900-default.png` — SHA-256
  `587c6816d96e068d3806848f4be955756ab9216125853dcc4031de6a438af04b`
- `572-i1-support-390x844-default.png` — SHA-256
  `9160f8473ec6601d09b644f96a940b97daa4b1d14ae63efe40bc916dfe3b78c0`

Collaborator-accessible copies are attached to the rendered-evidence comment on
[PR #582](https://github.com/suyog19/suyog19.github.io/pull/582#issuecomment-5395758618).

### Evidence refinement — iteration 2

Fresh independent review identified that the Support rules pushed the shared
`pages.css` beyond its raw-size budget. Commit `dc70d23` moved the byte-identical
composition into a route-scoped `support.css`, added a 6,000-byte budget and a
test rejecting use outside `/support/`, and reduced `pages.css` to 148,547 bytes.
Rendered rechecks at 1440×900 and 390×844 preserved the iteration-1 geometry
exactly: equal 516×380.39px desktop cards, equal 350×383.58px mobile cards, and
document widths matching their 1440px and 390px client widths.

### Gate B — Senior UX rendered review

- **Must fix:** none.
- **Should fix:** none.
- **Optional:** none required for this implementation scope.
- **What works / preserve:** the opening viewport explains independent work and
  optionality before financial action; the outcome sequence makes support's
  purpose concrete; the two provider choices have identical visual status; the
  non-financial section retains real weight and direct actions; the trust boundary
  is readable rather than fine print; and the page remains recognisably part of
  the existing editorial site without imagery or a second design language.
- **Result:** UX-ready.
- **Recommendation strength:** strongly recommended.
- **Broader UX recommendation:** none. Discovery and provider activation remain
  correctly assigned to #573–#575.

### Gate C — convergence

No Must-fix or Should-fix finding required another visual iteration. Rechecks at
320px, 390px, 768px, 1024px, and 1440px preserved all six approved invariants.
The native disabled provider controls and adjacent availability descriptions are
an intentional fail-closed implementation while #573 and #574 verify exact
destinations; they do not imply transaction success or expose placeholder links.

### Gate D — UX acceptance

- **Result:** UX accepted for merge to `dev`.
- **Accepted deviations:** none.
- **Deferrals:** activate the Razorpay and GitHub Sponsors actions only through
  #573 and #574 after their Protected provider-path assurance. Add deliberate
  Support discovery only through #575.
- **Rendered-review limitation:** provider return, success, cancellation, and error
  states do not exist in #572 and therefore were not fabricated or reviewed.

## Issue #573 Razorpay activation review

### Evidence and iteration

- Reviewed implementation commits: `73fc6ee` (first activated render) and
  `3c920fe` (converged render).
- Capture date: 24 August 2026.
- Capture method: local nested `/support/` route in Chrome 152 with exact CDP
  viewport emulation, semantic DOM inspection, computed geometry, horizontal-
  overflow checks, same-tab navigation, browser-Back recovery, and repeated CTA
  activation.
- The canonical Test Mode destination resolves to
  `https://pages.razorpay.com/pl_TTdbTEtwC4vyYF/view`; the rendered action has no
  `aria-disabled` state on development/local hosts and remains closed by the host
  matrix on production and unknown hosts.
- The initially reviewed provider page (`pl_TTcwSP5BE6K7WC`) was subsequently
  proven to be a Live Mode artifact when it initiated a real-bank login. It was
  deactivated immediately with zero payments, removed from source, and replaced
  by the independently mode-verified Test page above. No real credentials or
  payment were submitted.

The first activated mobile render exposed a Must-fix inequality: the longer
Razorpay recovery guidance and native anchor/button line-height difference made
the one-time card taller than the recurring card. The converged implementation
normalises both controls and shortens the guidance without losing same-tab,
provider-confirmation, Back, or retry meaning. It also replaces stale copy that
said neither option was activated with stage-neutral verification wording.

| Page/state | Viewport | Converged result |
| --- | ---: | --- |
| `/support/`, activated | 1440×900 | Equal 516×385.02px cards and 48px controls; no overflow |
| `/support/`, activated | 768×900 | Equal 319.13px stacked cards and 48px controls; no overflow |
| `/support/`, activated | 640×900 | Equal 313.69px stacked cards and 48px controls; no overflow |
| `/support/`, activated | 390×844 | Equal 350×388.20px cards and 48px controls; no overflow |
| `/support/`, activated | 360×900 | Equal 320×388.20px cards and 48px controls; no overflow |
| `/support/`, activated | 340×900 | Equal 300×433.77px cards and 66.38px wrapped controls; no overflow |
| `/support/`, activated | 320×900 | Equal 280×433.77px cards and 66.38px wrapped controls; no overflow |

Representative captures are held in the temporary review workspace at
`C:\Users\ADMIN\AppData\Local\Temp\issue-573-rendered-evidence-final`:

- `573-support-1440-choices.png` — SHA-256
  `85a2cc335b24d9a849732b86e1b5bfa4acb42cf6ba6d625d99c5439d4ae247ae`
- `573-support-390-choices.png` — SHA-256
  `bd9c104fc7d35d472cfc5c3aaf4dd6933db7e17255c83b2aff4e9a9f7ede61f4`

### Gate B — Senior UX rendered review

- **Must fix:** equalise one-time and recurring card/control geometry after the
  Razorpay recovery text is activated; remove stale all-options-unavailable copy.
- **Should fix:** none.
- **What works / preserve:** provider choice remains below the voluntary-support
  explanation; Razorpay and GitHub keep identical CTA treatment; the provider
  identity, amount ownership, confirmation boundary, and recovery path are clear;
  no urgency, recommendation, embed, or on-site success treatment was introduced.

### Gate C — convergence

Both Must-fix findings are resolved in `3c920fe`. Exact computed geometry at seven
representative widths preserves equal status, full-width mobile actions, clean
wrapping, and zero horizontal overflow. Same-tab navigation reached the exact
canonical provider URL twice, and Back returned to the unchanged local support
page both times.

### Gate D — UX acceptance

- **Result:** UX accepted for the #573 Razorpay activation.
- **Accepted deviations:** none.
- **Deferrals:** synthetic Razorpay success and failure states remain functional-
  assurance evidence and must not be inferred from the outbound handoff render.
- **Recommendation strength:** strongly recommended within the approved #571
  direction.

### Final Test Mode journey revalidation

- **Implementation reviewed:** `d4ee5ec` with canonical Test Mode page
  `pl_TTdbTEtwC4vyYF`.
- **Desktop:** at 1440×900, both provider cards measured 516×385.02px and both
  controls remained 48px high; document width equalled client width.
- **Mobile:** at 390×844, both cards measured 335×388.20px and both controls
  measured 277×48px; document width equalled client width.
- **Interaction:** the enabled native link exposed the exact canonical URL,
  navigated in the same tab, and browser Back restored the unchanged Support page.
  A second activation repeated the same provider navigation without creating
  site-side payment state.
- **Provider states:** an Incognito Test Mode journey displayed simulated failure,
  retry/success, and Checkout-close recovery. The authenticated dedicated-page
  detail then listed one Failed row and one Captured row and showed one Test
  payment, one unit, and INR 10 Test revenue. The redacted machine-readable record
  is `docs/evidence/issue-573-razorpay-test-mode.json`; it excludes customer and
  payment identifiers.
- **Unavailable state:** the deployed feature-preview hostname remained inert
  because it is outside the exact host allow-list; production also remains closed.
- **Gate D result:** UX acceptance remains valid after correcting the provider
  page. The destination changed, but the accepted hierarchy, copy, layout,
  semantics, responsive behavior, and recovery model did not.
