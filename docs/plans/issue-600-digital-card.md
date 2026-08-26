# Issue #600 — digital visiting card

## UX change brief

**Applicability:** UX brief required — this is a new public identity surface, user journey, material composition, and responsive interaction.

### User and goal

- **Affected user:** A professional contact who has just met Suyog or received his card URL.
- **Goal:** Understand who Suyog is within a few seconds, save his professional contact natively, and optionally continue to relevant work.

### Existing UX context

- Preserve the calm, credible, editorial character, serif/sans roles, near-monochrome palette, flat borders, native semantics, and progressive enhancement in `docs/ux/site-ux-direction.md`.
- Preserve the About page's specific, composed professional credibility and the Contact page's restraint around personal information.
- The card is a focused page family of its own. It deliberately omits the full global navigation and footer so that it does not become a miniature homepage.

### Strategic altitude

- The whole card, About, Contact, site identity, and current public destinations were reviewed together.
- The focused surface resolves a need that normal navigation cannot: a fast real-world identity-to-contact handoff.
- **Best in-scope recommendation:** one compact identity card followed by progressively quieter continuation and sharing sections.
- **Stronger overall recommendation:** none; adding the card to global navigation would weaken both the card and established navigation hierarchy.
- **Recommendation strength:** strongly recommended.

### Desired outcome and hierarchy

- In the first phone viewport, the visitor sees the SJ mark, name, professional descriptor, concise positioning, and Save Contact.
- **Primary:** identity and Save Contact.
- **Secondary:** LinkedIn, email, and website; then Software Signal.
- **Intentionally quiet:** Writing, Learning, GitHub, QR, readable URL, privacy note, and return-home link.

### Proposed composition

```text
┌────────────────────────────────────┐
│ SJ                    suyogjoshi.com│
│                                    │
│ Suyog Joshi                        │
│ Software Engineer · AI ·           │
│ Software Architecture              │
│ Practical software, data and AI…   │
│                                    │
│ [ Save Contact ]                   │
│ LinkedIn   Email   Website         │
├────────────────────────────────────┤
│ SOFTWARE SIGNAL                    │
│ Brief owned-ecosystem explanation  │
│ Explore · Writing · Learning · Git │
├────────────────────────────────────┤
│ SHARE THIS CARD        [ QR ]      │
│ suyogjoshi.com/card/   Share Card  │
└────────────────────────────────────┘
```

- **Desktop:** a restrained two-column field; the identity card remains dominant and sticky within the viewport while continuation/share sections form the quieter right column.
- **Tablet:** balanced two-column composition until reading width becomes constrained.
- **Mobile:** identity, direct actions, Software Signal, then share/QR in semantic order. The Save Contact action remains visible before secondary destinations.
- **Important relationship:** QR supports sharing but never competes with Save Contact or replaces the readable URL.

### Interaction and states

- The owned `.vcf` link works without JavaScript.
- Share Card invokes the Web Share API when supported. Without it, the same control copies the canonical URL and announces success; if clipboard access is unavailable, the visible URL remains selectable and the status explains the fallback.
- Keyboard focus is visible, touch targets are at least 44px, and all external actions have explicit labels.

### Design invariants

1. Identity and Save Contact are unambiguously dominant in the first 390×844 viewport.
2. The page reads as a premium professional identity card, not an icon grid, feed, résumé, or miniature homepage.
3. Software Signal and ecosystem links are visibly secondary to the contact handoff.
4. The QR is reliably scannable, has a visible quiet zone, and is paired with a readable canonical URL.
5. At 320px through desktop widths, semantic reading order is preserved with no horizontal overflow and no action below a 44px touch target.
6. With JavaScript unavailable, identity, vCard, direct links, QR, and canonical URL remain useful.

### Content and privacy decision

- vCard fields: full name, `Software Engineer · AI · Software Architecture`, organization `Software Signal`, public professional email `contact@suyogjoshi.com`, canonical card/website URLs, and LinkedIn.
- No phone, WhatsApp number, address, private identifier, portrait, recipient data, form, or third-party card service.
- Analytics use fixed event names and fixed placement/destination categories only; no contact value or recipient information is sent.

### Out of scope / preserve

- No wallet pass, NFC provisioning, card variants, lead capture, appointment scheduling, newsletter form, portrait, animation, framework, dependency, or global-navigation redesign.

### Tech Lead feasibility and architecture decision

- Reuse `base.css`, `components.css`, `pages.css`, the existing fonts/tokens, GA4 pattern, static directory routing, and minimal vanilla JavaScript. Keep the fully scoped card composition in `card.css` so unrelated routes do not pay its transfer cost and shared `pages.css` remains within its evidence-backed budget.
- Serve a committed UTF-8 vCard and a deterministic local SVG QR. Core behavior requires no runtime generation or external service.
- A small page script owns only allow-listed analytics and native-share enhancement. The static HTML remains the complete fallback.
- Rejected: a hosted business-card service (privacy/ownership/dependency), a QR library shipped to browsers (unnecessary runtime weight), a new design system or framework, and dynamic vCard construction (breaks no-JS primary action).
- Residual platform risk: native contact-import presentation varies by browser/OS and must receive representative physical-device confirmation before production promotion.
- No unresolved feasibility trade-off changes an invariant.

## Gate A disposition

Senior UX direction accepted for implementation: focused identity-first composition, no global navigation, dominant Save Contact, restrained text-labelled actions, progressive depth, and a quiet share region. The proposed composition is strongly recommended and introduces no unresolved Product Owner taste fork beyond the explicit issue direction.

## Gate B — rendered review, iteration 1

**Reviewed:** `/card/` at 1440×900, 390×844, and 320×720 in Chrome; semantic snapshot, computed layout, overflow, image completion, and touch-target geometry.

### Must fix

- On 1440×900, “Pass on one stable link” fragmented into four oversized lines beside the QR. This gave a secondary sharing section disproportionate visual drama and weakened invariants 2 and 3. Tighten the heading and scale while preserving the side-by-side QR relationship.

### Should fix

- None.

### Optional

- A dedicated 1200×630 social preview could be added later if sharing evidence shows the existing summary treatment is insufficient; it is not needed for the card journey.

### What works / preserve

- Identity, positioning, and the full-width Save Contact action are clear within the first 390×844 viewport.
- At 320px the primary action remains visible, all measured actions are at least 44px high, and there is no horizontal overflow.
- The desktop composition reads as one dominant identity card with quieter continuation cards, not a link-in-bio grid.
- Semantic order matches visual reading order; the QR has a named link and informative alternative text.

**Result:** Needs one focused iteration. **Recommendation strength:** Strongly recommended once the Must fix is resolved. **Broader UX recommendation:** None.

## Gates C–D — convergence and UX acceptance

**Iteration 2 reviewed:** `/card/` at 1440×900 and 390×844 after tightening the share heading; iteration-1 320×720 geometry was rechecked through the unchanged narrow-width rules.

- **Must fix resolution:** “One stable link” now occupies two restrained lines beside the QR instead of four oversized lines. The sharing section is visibly secondary and the identity/Save Contact relationship is preserved.
- **Should fix:** none open or deferred.
- **Optional:** a dedicated social-preview image remains optional and does not affect acceptance.
- **What works / preserve:** identity-first hierarchy, full-width Save Contact, sparse labelled direct actions, progressive depth, quiet ecosystem links, stable QR plus readable URL, and the focused shell.
- **Responsive/accessibility evidence:** zero horizontal overflow at 1440, 390, and 320; action heights measured 44–56px; no failed images; semantic snapshot has one H1, ordered H2 regions, named navigations/actions, an announced share status, and informative QR alternative text.
- **Console note:** no page-script warning was observed. Chrome reported extension message-channel noise unrelated to page code during capture.

**UX accepted.** No Must-fix findings or accepted deviations remain. The composition is strongly recommended as premium, credible, restrained, and appropriate for professional networking. Broader UX recommendation: none.

## Platform verification gate

- Automated evidence proves vCard 3.0 field content, public-data boundaries, owned URLs, UTF-8 source, CRLF checkout policy, static no-JavaScript access, Web Share payload, copy fallback, deterministic QR quiet zone, and successful decoding to the exact canonical URL.
- Representative physical Android Chrome and iPhone Safari contact-import mapping, native share-sheet presentation, and camera scanning cannot be established by desktop responsive emulation. Record those two device results before production promotion; any field-mapping or MIME defect is release-blocking.
