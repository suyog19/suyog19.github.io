# Issue #576 — Support funnel analytics

Status: event contract approved for implementation

## Measurement boundary

The Support experiment uses the site's existing GA4 property and `gtag` convention.
It does not change the analytics identity, add a provider or dependency, create a
backend contract, or persist funnel state in first-party storage. Events contain
only fixed, allow-listed categorical values. They never contain names, email
addresses, payment or sponsorship identifiers, amounts, URLs, query strings,
referrers, free text, or provider response payloads.

An outbound click is intent, not revenue. A visit to the public Razorpay thank-you
route is not independent proof of a captured payment: the static route can also be
opened directly. Razorpay remains the source of truth for captured and failed
one-time payments.
GitHub Sponsors has no reliable completion source available to this site, so no
recurring-support conversion event or metric is defined.

## Event contract

| Event | Trigger | Properties | Meaning and exclusions |
| --- | --- | --- | --- |
| `support_entry_click` | A visitor follows the shared footer's Support link from a non-Support public page | `entry_location: footer`; `source_section`: one of `home`, `writing`, `systems`, `training`, `newsletter`, `about`, `contact`, `research`, `search`, `other_public` | Support discovery intent. Does not include the source URL or page title. |
| `support_page_view` | `/support/` initializes | `page_type: support` | Explicit Support visit measure alongside GA4's normal page view. No referrer is copied into the event. |
| `support_one_time_intent` | An enabled Razorpay action is clicked after an amount choice | `provider: razorpay`; `cadence: one_time`; `source_page: support` | One-time support handoff intent. The selected amount and destination URL are deliberately excluded. |
| `support_sponsorship_intent` | The native GitHub Sponsors action is clicked | `provider: github_sponsors`; `cadence: recurring`; `source_page: support` | Recurring outbound intent only. This existing event is retained; it never means sponsorship completion. |

No site event is defined for Razorpay success, failure, or cancellation because the
static site does not receive a reliable signed callback and its thank-you route is
publicly addressable. Those outcomes are reviewed only in Razorpay's provider
records. Missing analytics must never block a native link, alter payment state, or
change navigation.

## Minimum experiment metrics

1. **Support visits:** `support_page_view` event count and users.
2. **Discovery:** `support_entry_click` count and click-through rate against the
   corresponding public-page audience, segmented only by `entry_location` and
   coarse `source_section`.
3. **One-time intent:** `support_one_time_intent` count and rate per Support visit.
4. **Verified one-time completions and failures:** captured/failed records from
   Razorpay's own reporting, reviewed separately from GA4 and without copying
   customer or payment identifiers into analytics or repository evidence.
5. **Recurring intent:** `support_sponsorship_intent` count and rate per Support
   visit. There is no GitHub sponsorship completion metric until a reliable,
   privacy-reviewed source of truth exists.

Commercial revenue, training payments, and Support signals remain separate. No
combined revenue or generic `purchase` event is introduced.

## Validation method

- Unit tests execute the scripts with a stubbed `gtag` and assert exact event names
  and property allow-lists.
- Tests prove missing `gtag` does not affect native provider navigation.
- Tests reject sensitive or outcome-inflating fields, raw source paths, and false
  GitHub completion language.
- In dev/review, inspect the GA command queue (or GA4 DebugView when available) and
  exercise footer entry, Support view, one-time intent, recurring intent, and the
  native provider actions without submitting a real payment.
- Razorpay failure/captured outcomes are not synthesized as site analytics events.

## UX applicability

UX brief not required. The change adds no visible content, layout, interaction,
state, or navigation. Existing Support hierarchy, provider equality, native
same-tab behavior, focus treatment, responsive composition, and fail-closed payment
activation remain unchanged.

## Post-launch review plan

Review after at least 30 days, and no earlier than 14 days unless a correctness or
privacy issue appears. Record the date range and event-contract version, then:

1. confirm event volume and property cardinality match this contract;
2. compare Support visits, footer-entry CTR, and one-time/recurring intent rates;
3. compare Razorpay success-return direction with aggregate captured/failed
   provider records, explicitly noting that the datasets are not transaction-linked;
4. report GitHub only as outbound intent;
5. suppress or correct any event that exposes unexpected values or implies an
   unsupported conversion; and
6. decide whether to keep, refine, or remove entry points under a separate issue.

Low traffic is a valid result. Do not broaden tracking, add urgency, or create a
conversion claim merely to produce a stronger-looking experiment.
