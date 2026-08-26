# Issue #593 — Consulting discovery and enquiry

Status: Gate A accepted for implementation

## UX change brief

**Applicability:** UX brief required — this is a new public discovery surface and
adds a deliberate route into the existing Contact journey.

### User and goal

- **Affected visitor:** an individual, founder, technical decision-maker, or
  small engineering/product team facing an important software, AI, architecture,
  workflow, reliability, or engineering-effectiveness question.
- **Goal:** understand whether one of two focused offers fits, see credible evidence
  of the judgment behind it, and make a low-friction enquiry without first learning
  consulting terminology.
- **First-five-seconds outcome:** “I can get a focused senior-engineering second
  opinion or an evidence-driven review of whether my repository is ready for
  effective AI-assisted development.”

### Existing UX context

- Preserve `docs/ux/site-ux-direction.md`: calm, editorial, specific, flat,
  near-monochrome, typography-led, and progressively structured.
- Preserve `docs/ux/pages/contact.md`: the form remains low-friction, accessible,
  and limited to the current name, email, and message contract.
- Use the Support page only as a composition precedent for a new public intent;
  Consulting remains explicitly commercial and visually/content-wise distinct
  from voluntary Support.
- Use existing Home, About, Writing, and Systems claims and public artifacts as
  credibility evidence. No testimonials, client claims, logos, case studies, or
  outcomes are introduced.

### Strategic altitude

- **Whole-page and cross-site system reviewed:** Home, Contact, About, Support,
  Writing, Systems, global header/footer, and current analytics conventions.
- **Best in-scope recommendation:** one problem-led editorial page, two peer offers,
  evidence close to the choice, a short engagement sequence and boundary note,
  then one clear enquiry region. Add one contextual Home entry point and preserve
  the primary navigation.
- **Stronger overall recommendation:** the same for this validation slice. Direct
  booking, payment, primary-navigation promotion, and a broader service catalogue
  require demand evidence and later Product Owner decisions.
- **Recommendation strength:** strongly recommended.

### Hierarchy and composition

- **Primary:** the practical problem and the two offer choices.
- **Secondary:** representative fit, verifiable credibility, engagement sequence,
  pricing, and expected deliverables.
- **Intentionally quiet:** confidentiality, implementation boundary, limitations,
  and the “not sure” route; these remain readable but do not compete with the offers.
- **Desktop:** bounded editorial hero; two equal offer panels; alternating split and
  full-width sections; a single closing action region.
- **Tablet:** offer panels stack before either becomes cramped.
- **Mobile:** problem, offers, proof, process, boundaries, and enquiry remain in
  that reading/action order; CTAs become full width and no metadata row squeezes.

### Interaction and states

- Offer and “help me choose” CTAs use native links to `/contact/` with one of three
  fixed, non-sensitive `topic` identifiers.
- Contact shows an accessible contextual note and a starter prompt that the visitor
  may edit. The visitor still describes the actual problem in free text.
- Analytics accepts only fixed event names and enumerated offer/source values. It
  never reads or sends name, email, company, message text, repository identifiers,
  query strings, or referrer URLs.
- With JavaScript unavailable, the Consulting page and links remain complete; the
  Contact form remains usable without prefilled context.

### Design invariants

1. The opening viewport communicates experienced, focused engineering help before
   price or process detail, without reading like an agency or high-pressure funnel.
2. The two offers are peers with visibly distinct questions, scope, deliverables,
   and prices; neither is mistaken for generic hourly work or implementation.
3. Verifiable experience and public engineering evidence appear close enough to
   the offer decision that visitors do not need to hunt through the site.
4. Desktop and mobile preserve the sequence problem → two offers → proof → process
   and boundaries → enquiry, with one dominant final action and no horizontal
   overflow.
5. Contact preserves only a fixed offer identifier, keeps the form as the centre of
   gravity, and never places confidential problem text in the URL or analytics.
6. Consulting remains clearly commercial and separate from voluntary Support,
   while retaining the site's calm editorial visual language.

### Open subjective decisions

None. The implementation does not change primary navigation, site personality,
visual identity, or relative prominence of the existing Training/Writing/Systems
routes. Primary-navigation inclusion remains deferred for Product Owner decision
after validation evidence.

### Out of scope / preserve

- No scheduling, checkout, payment, CRM, accounts, uploads, complex qualification,
  backend/API change, new dependency, framework, font, analytics identity, domain,
  deployment, or production promotion.
- Exactly two launch offers; no advisory engagement or services catalogue.
- No detailed legal terms, proprietary maturity model, invented framework, or
  unsupported social proof.

## Tech Lead feasibility review

**Decision:** feasible within the existing hand-authored HTML, scoped CSS, and
progressive vanilla JavaScript architecture; no material trade-off is open.

- Add `consulting/index.html` with the established metadata/head/header/footer
  structure and a route-scoped `css/consulting.css` to avoid expanding shared page
  CSS unnecessarily.
- Extend Contact's existing allow-listed topic handling without altering `/messages`,
  its payload, validation, honeypot, host selection, or success/error contract.
- Add a small `js/consulting-analytics.js` allow-list for page/CTA signals and use
  fixed Consulting topic metadata for enquiry start/submission in `contact.js`.
- Add focused Node structural/behavioral tests, regenerate the sitemap, then run
  the repository's full Standard validation set and rendered review matrix.
- Existing tokens, buttons, flat cards, border rhythms, semantic headings, native
  links, visible focus, and responsive stack patterns preserve all invariants.

## Gate A disposition

- **Senior UX direction:** accepted for implementation; strongly recommended.
- **Tech Lead feasibility:** accepted as written.
- **Material subjective decisions:** none unresolved.
- **Product Owner escalation:** not required because primary navigation and the
  established site hierarchy/personality remain unchanged.

## Rendered UX review

### Evidence index — iterations 1 and 2

- Capture date: 26 August 2026.
- Capture method: local feature-branch render in Chrome with explicit viewport
  emulation, full-page/viewport screenshots, semantic DOM inspection, computed
  geometry, keyboard focus, mobile navigation, horizontal-overflow checks, and
  console/resource review.
- Temporary evidence location:
  `C:\Users\ADMIN\AppData\Local\Temp\issue-593-rendered-evidence`.

| Page/state | Viewport | Result |
| --- | ---: | --- |
| `/consulting/`, complete page | 1440×900 | Editorial sequence and equal 516×981.05px offer cards; pass after iteration-2 correction |
| `/consulting/`, default/offers | 390×844 | Clear opening and stacked peer offers; 335px document content, no overflow |
| `/consulting/`, narrow default | 360×900 | 305px hero content and clean wrapping; no squeeze or overflow |
| `/consulting/`, tablet | 768×900 | Offers stack at 713px and process becomes two columns; no overflow |
| `/consulting/`, 200%-zoom layout equivalent | 720×900 | Single-column offers and 499px bounded heading; no overflow |
| `/consulting/`, keyboard/menu | 390×844 | 2px focus outline with 3px offset; expanded menu state is semantic and overflow-free |
| `/contact/?topic=consulting-advisory` | 390×844 | Safe context note, editable starter prompt, form-first order, and no overflow |

Representative screenshot integrity:

- `593-i2-consulting-1440x900-default.png` — SHA-256
  `c18493933176b0aed8e43db333f55de4debaba0f69dfb122121c678ce1093b9b`
- `593-i2-consulting-390x844-viewport.png` — SHA-256
  `80dc0fa662c1d2256bb3deb9034c81f6c693a2162b887516ca38905df0fbc566`
- `593-i2-consulting-360x900-viewport.png` — SHA-256
  `4e7399979bed4ddb4ab8a71e9eeb491c1bbc983ff04c7ab93d44274a0391be4f`
- `593-i2-contact-390x844-advisory.png` — SHA-256
  `27fe5b1f10c228560c223dc6d1787bda59d2c21f5bfad290df1fae35b9ce3bcd`

### Gate B — Senior UX rendered review

- **Must fix (iteration 1):** the ordered engagement sequence rendered native
  `1.` markers alongside the intended `01` labels, creating duplicate step
  numbering and visual noise. Add an explicit list-style reset while preserving
  ordered semantics.
- **Should fix:** none.
- **Optional:** none required for this validation slice.
- **What works / preserve:** the opening is problem-led rather than price-led; both
  offers have equal desktop geometry and clearly different questions/deliverables;
  proof is adjacent to the decision; page rhythm becomes quieter after the offers;
  boundaries remain readable without becoming legalistic; and the final enquiry
  action is dominant without sales-funnel urgency.

### Gate C — convergence

Iteration 2 removes the duplicate native markers. Desktop and mobile re-rendering
preserves the successful hierarchy and all six invariants. The new page, Home,
Contact, About, a representative Writing detail, a representative System detail,
Training, and Support all retain document width equal to client width at 390px.
Lazy images outside the viewport remained intentionally unloaded during the
cross-page pass; static image/link validators cover their sources. Browser logs
contained only a Chrome-extension message-channel warning, with no page-script,
resource, or application console failure.

### Gate D — UX acceptance

- **Result:** UX accepted for issue #593 and ready for technical/functional/
  accessibility/regression assurance.
- **Accepted deviations:** none.
- **Recommendation strength:** strongly recommended within the approved lean
  validation scope.
- **Broader UX recommendation:** none. Primary-navigation promotion, direct
  booking, and a wider consulting model remain evidence-dependent future decisions.
