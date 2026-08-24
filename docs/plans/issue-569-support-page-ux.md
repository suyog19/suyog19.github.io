# Issue #569 — Support page UX brief

## Applicability

**UX brief required.** `/support/` is a new public decision surface involving money, trust, external payment providers, responsive hierarchy, and a new user intent.

## Senior UX Designer recommendation

The page should feel like a quiet extension of the existing working-knowledge site, not a donation campaign or commerce page. The strongest in-scope design is a concise editorial introduction followed by two equally legible support choices: one-time support through Razorpay and recurring support through GitHub Sponsors. The page should then explain what support helps sustain and offer non-financial ways to help.

The payment mechanism should not become the visual identity of the page. Provider branding remains subordinate to the user's decision.

## User and goal

Affected user: a reader, learner, engineer, or open-source visitor who has already received value from Suyog's public work and wants an optional way to support it.

Goal: understand what support means, choose one-time or recurring support with confidence, know which provider will handle payment, or choose a useful non-financial action instead.

## Existing UX context

- Site direction: `docs/ux/site-ux-direction.md`
- Engineering UX process: `docs/ux/engineering-process.md`
- Preserve the editorial typography, near-monochrome palette, generous whitespace, bounded measures, flat borders, direct language, progressive enhancement, and accessible native behavior.
- Do not load the Software Signal Learning stylesheet; support is a site-level intent, not a learning-state surface.

## Strategic altitude

This page should become the canonical support destination, but issue #569 does **not** decide where links to it appear elsewhere. Site-wide placement is a separate conversion/discovery decision after the page is proven.

A custom support payment backend is not the preferred first implementation. Razorpay's hosted Payment Page can keep payment capture, customer payment details, test/live separation, and checkout UI with the payment provider while the website remains a static explanation and routing surface.

Best in-scope recommendation: use a hosted Razorpay Payment Page configured with a customer-decides-amount field for one-time support, and a direct GitHub Sponsors link for recurring support. This avoids exposing secrets, adding a new public API contract, or duplicating checkout behavior.

Recommendation strength: **strongly recommended**.

## Desired hierarchy

1. **Context first** — `Support the work` and one short explanation of the independent public engineering work being supported.
2. **Primary decision** — two support choices presented at the same visual level:
   - `Support once` — Razorpay, one-time payment.
   - `Support regularly` — GitHub Sponsors, recurring sponsorship.
3. **What support enables** — concrete categories such as research/experiments, open engineering resources, practical learning material, Software Signal Weekly, and public writing.
4. **Other ways to help** — subscribe, share useful work, use/star repositories, recommend the work, and give feedback.
5. **Quiet trust note** — payment is optional; payment processing happens with the named provider; public material is not presented as paywalled because a visitor does not sponsor.

## Layout and composition

### Desktop

- Reuse the established site hero rhythm rather than inventing a campaign banner.
- Place the two support choices in a balanced two-column bordered region.
- Keep provider notes and external-navigation text inside each choice, immediately adjacent to its action.
- Follow with a calmer explanatory section; do not repeat the payment CTAs lower on the page.

### Mobile

Reading and decision order remains:

`context → one-time support → recurring support → what support enables → other ways to help`

The two choices stack. Buttons become comfortably touchable and do not rely on side-by-side comparison. No horizontal overflow or provider-owned embedded checkout should be introduced into the page.

## Interaction and state intent

### One-time / Razorpay

- The website action opens the hosted Razorpay Payment Page in a new tab/window with clear external-provider wording before activation.
- The Razorpay page owns amount entry and checkout. No amount should be silently preselected by the website.
- Prefer Razorpay's `Customer Decides Amount` field with an explicit minimum/maximum configured in the provider dashboard.
- Configure a post-payment success message or redirect back to a dedicated site destination only if the provider setup supports it cleanly; do not fake payment confirmation in website JavaScript.

### Recurring / GitHub Sponsors

- Link directly to `https://github.com/sponsors/suyog19`.
- Label the action as recurring/monthly before the visitor leaves the site.
- GitHub owns sponsor tiers, authentication, payment, and cancellation state.

### Failure / unavailable provider

- The site remains useful if either external provider is unavailable.
- Do not intercept provider errors or claim payment success locally.
- Non-financial support paths remain available without JavaScript.

## Design invariants

1. The reason to support is understood before a payment action appears.
2. One-time and recurring support are distinguishable without making one look morally or visually superior.
3. Support remains visibly optional; no urgency, guilt, scarcity, progress meter, or paywall language appears.
4. Provider names and the fact that the visitor is leaving the site are clear before activation.
5. Mobile preserves context-before-action and a natural single-column decision order.
6. The page works without custom JavaScript; payment details and secrets never enter the static site.
7. Copy uses `support`, not charitable `donation` claims, and makes no unsupported promise that a particular amount purchases a specific outcome.

## Pattern reuse / Team Lead feasibility

Implement with existing site primitives and page patterns rather than adding a new design system:

- site header/footer and mobile navigation;
- the existing `.hero` family for the introduction;
- the existing two-column bordered card pattern used by `.home-course-grid` / `.home-course-card` for the two primary choices;
- existing `.about` / `.about-inner` explanatory composition for `What your support enables`;
- existing restrained card/link patterns for non-financial help;
- existing `.btn`, `.btn-primary`, and `.btn-secondary` controls.

The first implementation should require **no new framework, dependency, font, backend endpoint, payment secret, or checkout JavaScript**. If the reused patterns produce a material visual mismatch in rendered review, add the smallest scoped rule to `css/pages.css` rather than copying a second component system.

## Razorpay provider setup required for end-to-end completion

The Product Owner must create or identify a Razorpay **Payment Page** in test mode because the repository has no authorized Razorpay connector and payment-provider credentials must not be exposed to the frontend implementation context.

Recommended provider settings:

- purpose/title: support for Suyog's independent engineering work;
- amount type: `Customer Decides Amount`;
- currency: INR;
- sensible minimum and maximum amounts chosen by Product Owner;
- minimal customer-data collection permitted by the account/provider flow;
- no expiry unless intentionally desired;
- clear success message; optional redirect only after the destination exists;
- test-mode page first; create a separate live-mode page only after acceptance.

The feature branch must not invent or hard-code a Razorpay URL. Once the test URL is supplied, the implementation can wire it, render the page, and complete the test-mode journey.

## Gate A — UX and feasibility

- UX context reviewed: site direction, UX process, current public page patterns, and the existing Razorpay provider boundary.
- Material subjective decision: this is a support page, not a fundraising campaign; payment choices remain restrained peers.
- Strongest implementation choice: hosted Razorpay Payment Page + GitHub Sponsors, with no new website payment backend.
- Observable invariants: recorded above.
- Team Lead feasibility: static implementation is compatible with the current HTML/CSS/vanilla-JS architecture and avoids a new public API contract.
- Unresolved dependency: test-mode Razorpay Payment Page URL from the Product Owner/provider dashboard.

**Gate A status: ready except for the external Razorpay test-page identifier needed to complete the payment path.**
