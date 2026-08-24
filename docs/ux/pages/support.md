# Support page UX direction

Issue: [#571](https://github.com/suyog19/suyog19.github.io/issues/571)

Parent epic: [#570](https://github.com/suyog19/suyog19.github.io/issues/570)

Status: implementation-ready direction awaiting Product Owner approval

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
