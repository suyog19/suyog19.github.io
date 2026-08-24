# Issue 573 — Razorpay one-time support handoff

## Decision status

Gate A direction is complete; the exact provider artifact and end-to-end evidence
remain pending authenticated Razorpay Test Mode access. No provider URL is approved
until the checks in this document pass.

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

- [ ] Authenticated Test Mode page settings inspected and bounded values recorded.
- [ ] Exact canonical long Payment Page URL verified without query or fragment.
- [ ] Successful synthetic Test Mode transaction visible in the page/payment
      records, with only non-sensitive identifiers/status recorded.
- [ ] Cancel/back, failed payment, retry, repeated CTA activation, and provider
      unavailable paths checked on representative desktop and mobile widths.
- [ ] No secret, payment credential, customer identity, transaction payload, or
      provider signature appears in source, screenshots, logs, or PR evidence.
- [ ] Gate B rendered findings, Gate C disposition, and Gate D UX acceptance are
      appended to `docs/ux/pages/support.md` for the exact implementation revision.

## Official provider basis

Razorpay documents Payment Pages as a dashboard-created, no-code hosted product,
supports a `Customer Decides Amount` price field with bounded minimum/maximum, and
keeps Test and Live Mode entities separate. A Live Mode page must therefore be a
separately created artifact and is deliberately outside this development story's
production authority.
