# Issue 585 — Razorpay support continuity

## UX change brief

**Applicability:** UX brief required — the amount decision, provider handoff, and
success return are material task-flow and status-comprehension changes.

### User and goal

- A visitor who values Software Signal wants to make one voluntary contribution
  without uncertainty about identity, amount, recurrence, provider, or recovery.
- The first decision stays on `/support/`; payment entry and confirmation stay on
  Razorpay; the return page is useful but explicitly non-authoritative.

### Existing context and hierarchy

- Preserve the Support page’s calm editorial hierarchy, equal standing of
  one-time and recurring support, and the #573 hosted-page security boundary.
- Primary: explicit one-time amount selection and one corresponding CTA.
- Secondary: provider/one-time/return guidance and receipt expectation.
- Intentionally quiet: payment-help path and technical confirmation boundary.
- Recommendation: strongly recommended within the hosted Payment Page constraint.
  No broader redesign is needed.

### Responsive and state intent

- Amounts form a compact two-column set within the existing one-time card at all
  representative widths; the action remains full-width on mobile.
- No amount is preselected. The CTA stays inert until a visitor explicitly chooses
  a preset or Custom.
- Selected, hover, and keyboard-focus states remain visually distinct.
- Missing or cross-stage provider configuration disables the entire amount group
  and preserves the fail-closed status.

### Design invariants

1. Before leaving, the visitor can name the payee/purpose, exact preset or Custom,
   one-time cadence, provider, cross-domain transition, and expected return.
2. A visual default never becomes consent: no amount is selected on load and the
   payment CTA remains inert until an explicit choice.
3. Only ₹250, ₹500, and ₹1,000 can become `amount` query values; Custom uses the
   verified base Payment Page and arbitrary values fail closed.
4. Razorpay remains the only payment and success authority; the site creates no
   order, stores no payment data, and treats the return as provider-reported only.
5. Cancel/Back and duplicate activation remain ordinary same-tab navigation with
   no site-side state, while provider-unavailable hosts remain understandable.
6. At mobile and desktop widths, selection, CTA, confidence copy, and help remain
   legible, keyboard reachable, and free of horizontal overflow.

### Tech Lead feasibility

- Reuses native radios, existing button/surface tokens, vanilla JavaScript, and
  the exact stage allow-list from #573.
- Razorpay officially documents query prefill for Customer Decides Amount fields,
  field descriptions, automated receipts, and success redirects.
- Provider settings and receipt/badge outcomes require authenticated dashboard
  evidence and remain human-account controlled; production activation remains a
  separate governed action.

## Provider configuration target

- Identity: `Suyog Joshi`; title: `Support Software Signal`; context:
  `One-time contribution via suyogjoshi.com` and the SJ logo where supported.
- Amount field: `Customer Decides Amount`, labelled `Support amount` and therefore
  prefilled with Razorpay's normalized `support_amount` query key.
- Email help: `Used for the payment receipt.` Phone help: `Required by Razorpay
  for payment processing.` Do not duplicate either field on the site.
- Success action: redirect to `https://suyogjoshi.com/support/thank-you/` in Live
  Mode and the stage-equivalent HTTPS URL in Test Mode where supported.
- Recoverable failures remain in Razorpay’s native retry flow.
- Enable automated Payment Page receipts; inspect receipt merchant/purpose text.
- Check Trusted Business Badge eligibility and enable only if Razorpay offers it.

## Gate status

- Gate A: complete in this document.
- Gate B: rendered at 1440×900 and 390×844 on 2026-08-25. The desktop preset
  state exposed one checked ₹500 radio, CTA `Support with ₹500`, exact allow-listed
  destination ending `/view?support_amount=500`, and 1425/1425px
  document/client widths.
  The mobile initial state exposed no selection, no `href`, `aria-disabled=true`,
  a two-column amount grid, and 375/375px document/client widths. Custom produced
  the unchanged canonical Payment Page URL. Must fix: none after correcting the
  actual hosted-page `support_amount` query contract.
- Gate C: all six invariants rechecked. Desktop/mobile had no horizontal overflow;
  native radios exposed group/name semantics; selected amount and CTA copy agreed;
  reload restored the required unselected state; and the thank-you page exposed
  its noindex, non-authoritative boundary and onward navigation at 390px.
- Gate D: implementation UX accepted with no visual deviation. Authenticated
  Test Mode inspection confirmed automated receipts and the configured success
  redirect to `https://dev.suyogjoshi.com/support/thank-you/`. A provider test-card
  payment confirmed success, inbox receipt delivery, and clear Suyog Joshi / Support
  Software Signal identity without retaining payer or payment identifiers.

## Public provider observation

The existing Test Mode page publicly rendered merchant `Suyog Joshi`. Authenticated
configuration was updated to purpose `Support Software Signal`, context
`One-time contribution via suyogjoshi.com`, voluntary one-time context, contact path,
required Email and Phone fields, a Customer Decides `Support amount`, and its Test
Mode warning. Automated receipts are enabled, the success-only redirect targets the
development thank-you route, and the Trusted Business badge is `Inactive` with no
enable control. The page did not expose custom field help text in the public render.
Current hosted behavior was verified directly: `support_amount=250`,
`support_amount=500`, and `support_amount=1000` populate the normalized `Support
amount` field; the generic `amount` key does not. No payment or customer value was
submitted during this prefill verification. A subsequent synthetic Test Mode payment
verified the successful-payment state, automated receipt delivery, and receipt
identity. Despite saving and publishing the redirect first to the development route
and then to an accessible branch preview, Test Mode stayed on Razorpay's own success
screen and exposed no return control. The durable development redirect is restored;
The site copy and provider evidence disclose this observed hosted-page limitation
rather than treating the redirect setting as proof of navigation. During the later
human-approved production promotion, the separate Live Mode page was configured and
activated with the production thank-you URL, automated receipts, the same identity
and purpose, and verified ₹500 prefill. No real payment was submitted merely to test
the release, so live success navigation remains a post-deployment operational check.
