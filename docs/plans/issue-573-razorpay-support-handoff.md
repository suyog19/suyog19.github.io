# Issue 573 — Razorpay one-time support handoff

## Decision status

Gate A direction is complete. The verified Test Mode page was published on
2026-08-24 and its canonical public destination is
`https://pages.razorpay.com/pl_TTdbTEtwC4vyYF/view`. Remaining end-to-end evidence
must pass before the change is merged. An earlier page (`pl_TTcwSP5BE6K7WC`) was
found to be a Live Mode page after its bank handoff requested real credentials.
It was immediately deactivated with zero payments and is not permitted by the
frontend allow-list.

## Architecture decision

Use a dedicated Razorpay **Payment Page** in the existing Suyog Joshi Razorpay
account. The page must use Razorpay's `Customer Decides Amount` field and a
support-specific title/description. The static site hands off to the provider in
the same tab and never embeds Checkout, creates an order, receives a callback,
handles payment credentials, or infers success from a click or browser return.

The existing Software Signal Payment Links are rejected for this journey. They
are backend-created, learner/obligation-specific, fixed-amount commercial
transactions. Reusing one would misclassify support, expose the wrong description
and amount, and couple this public route to training state.

A Test Mode Payment Page is permitted only on localhost, `127.0.0.1`, and
`dev.suyogjoshi.com`. Production and unknown hosts remain disabled until #578
records a separately created and verified Live Mode page plus human production
approval. The frontend accepts only an exact `https://pages.razorpay.com/pl_…/view`
destination with no credentials, customer data, amount, query, or fragment.

## Gate A journey and rendered invariants

The approved #571 hierarchy and equal visual status remain unchanged. #573 changes
only the one-time card's availability and recovery copy.

1. Before leaving, the visitor sees that Razorpay opens in the same tab, that they
   choose the amount there, and that Razorpay—not this site—confirms completion.
2. The one-time action is enabled only for an exact stage-appropriate allow-listed
   Payment Page; missing, malformed, cross-stage, or unexpected-host configuration
   retains the existing native unavailable state.
3. The recurring card keeps identical dimensions and button treatment; activation
   of Razorpay must not make it recommended, urgent, or visually dominant.
4. Cancellation, failure, or abandonment has one recovery instruction: return with
   the browser Back control and retry only when Razorpay has not shown completion.
5. The site never shows an on-site success state, stores transaction identifiers,
   accepts an amount, or receives provider query parameters.
6. Desktop and mobile keep the accepted reading/tab order, full-width mobile action,
   focus visibility, and zero horizontal overflow.

## Observable state contract

| State | Support-page action | Visitor guidance | Evidence required |
| --- | --- | --- | --- |
| Valid Test Mode page on development/local host | Same-tab link enabled | Choose amount and complete on Razorpay | Exact public URL, Test Mode page settings, rendered handoff |
| Production or unknown host before launch | Inert and unavailable | Provider path is not available | Host matrix test |
| Missing/malformed/cross-stage URL | Inert and unavailable | Provider path is not available | Unit tests for every rejected shape |
| Provider page opened | Browser leaves `/support/` | Razorpay owns amount and payment method | Navigation URL and provider render |
| Visitor cancels or abandons | Browser Back returns to unchanged page | Retry only if Razorpay did not confirm completion | Browser journey evidence |
| Test payment fails | Razorpay displays failure/retry | No site-side state is changed | Provider test evidence without personal/payment data |
| Test payment succeeds | Razorpay displays completion; dashboard records it | Do not retry after provider confirmation | Redacted Test Mode payment/page record |
| Repeated Support CTA activation | Native same-tab navigation; no site request is created | Provider owns checkout submission safety | Network/DOM evidence and provider test record |

## Provider configuration contract

Create the Test Mode page with:

- title/description that names voluntary support for independent public
  engineering work and does not mention a course, deposit, donation tax status,
  reward, membership, or promised deliverable;
- one `Customer Decides Amount` field in INR, with provider-supported minimum and
  maximum values reviewed before publishing;
- the minimum customer fields Razorpay requires; no custom note, course,
  organisation, sensitive-data, or marketing-consent field;
- Razorpay-owned email/SMS reminders disabled where the page exposes that choice;
- no callback URL, pre-populated customer details, amount query, frontend webhook,
  or automatic redirect that could be mistaken for verified success;
- a provider identifier and Test Mode transaction record that are distinguishable
  from Software Signal training Payment Links.

## Acceptance evidence checklist

- [x] Authenticated Test Mode page settings inspected: customer-decided INR amount,
      provider minimum INR 1, no maximum, no expiry, no redirect, and no custom
      success message.
- [x] Exact canonical long Payment Page URL verified without query or fragment.
- [x] Published provider record verified in Test Mode: page
      `pl_TTdbTEtwC4vyYF`, Active, zero payments before synthetic testing; short
      URL resolves to the exact canonical destination with HTTP 200.
- [x] Successful synthetic Test Mode transaction visible in the page/payment
      records, with only non-sensitive identifiers/status recorded.
- [x] Cancel/back, failed payment, retry, repeated CTA activation, and provider
      unavailable paths checked on representative desktop and mobile widths.
- [x] No secret, payment credential, customer identity, transaction payload, or
      provider signature appears in source, screenshots, logs, or PR evidence.
- [x] Gate B rendered findings, Gate C disposition, and Gate D UX acceptance are
      appended to `docs/ux/pages/support.md` for the exact implementation revision.

## Final journey evidence

Implementation revision `d4ee5ec` was exercised on 2026-08-24 against the
published Test Mode page `pl_TTdbTEtwC4vyYF`:

- the short provider URL resolved with HTTP 200 to the exact canonical long URL;
- the authenticated provider record showed Test Mode, Active, no expiry, and zero
  payments before testing;
- a simulated Netbanking failure displayed Razorpay's failure state, Retry then
  reached the mock-bank success state, and the dedicated page detail listed one
  Failed row and one Captured row; its aggregate advanced to one payment, one
  unit, and INR 10 Test revenue;
- closing Checkout with its native close control returned to the unchanged
  Payment Page without another payment;
- same-tab handoff and browser Back recovery were repeated from the local Support
  page; repeated CTA activation created no site-side order or state;
- 1440×900 and 390×844 renders retained equal card heights, equal mobile control
  dimensions, native semantics, and zero horizontal overflow;
- the deployed branch-preview hostname remained inert because it is not an
  approved development or production host, proving the provider-unavailable path;
- the withdrawn Live page remained absent from the frontend allow-list. Its
  dashboard record was inactive with zero payments.

No customer value, support phone, email, payment identifier, credential, bank
detail, or provider payload is included in this evidence.

The redacted machine-readable provider observation is recorded at
`docs/evidence/issue-573-razorpay-test-mode.json`. It also reconciles the public
page and global-overview counters, which lagged the authoritative dedicated-page
detail during review and must not be used to contradict its Captured/Failed rows.

## Official provider basis

Razorpay documents Payment Pages as a dashboard-created, no-code hosted product,
supports a `Customer Decides Amount` price field with bounded minimum/maximum, and
keeps Test and Live Mode entities separate. A Live Mode page must therefore be a
separately created artifact and is deliberately outside this development story's
production authority.
