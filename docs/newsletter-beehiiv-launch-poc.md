# Software Signal Newsletter — beehiiv Launch PoC

> Repository placement: this is operational evidence for the website/newsletter integration, so its canonical home is the website repository rather than the Software Signal knowledge-system repository.
>
> Status: Complete. Documentation, signed-in product checks, and approved inbox checks were completed on 2026-08-19. A representative issue, received test send, hosted signup, double opt-in, welcome email, reply routing, reader unsubscribe, diagram previews, authentication headers, and Quick/Full exports were exercised. The test alias completed `pending → active → inactive`.

Editorial source: [Software Signal Newsletter Blueprint](https://github.com/suyog19/digital-garden/blob/main/newsletters/software-signal-weekly/blueprint.md)

## 1. Executive conclusion

**Decision: GO WITH CAVEATS.** The Launch account supports the core publication, editor, email-only signup, external embed, double opt-in, web archive, scheduling, basic analytics, export controls, custom domains, and subscription API entitlement. Desktop and mobile previews meet the intended calm, technical, readable character without custom HTML.

The material caveats are visible beehiiv branding, the unavoidable 14-day Max trial for a new account, Stripe identity verification before an API key can be created, and the need to keep trial-only controls out of the implementation. The initial reply-to is the account inbox; a role-based address should replace it before launch. Both subscriber export variants and the received email artifacts were verified directly.

No paid plan has been purchased, no real audience has been contacted, no production website work has started, and no DNS record has been changed.

## 2. Environment and plan tested

| Item | Current evidence |
| --- | --- |
| Review date | 2026-08-19 |
| Publication | Software Signal Weekly — `software-signal-weekly.beehiiv.com` |
| Active plan | Launch, 0 / 2,500 subscribers, $0/month |
| Trial state | Max trial, day 1 of 14; billing page says the underlying plan is Launch |
| Payment method required | No; billing information and payment dates are blank / N/A |
| Documentation baseline | beehiiv pricing, Help Center, and developer documentation reviewed on 2026-08-19 |

The pricing page currently describes Launch as **$0/month**, with **up to 2,500 subscribers**, **unlimited sends**, **custom domains**, **campaign analytics**, and **API access excluding the Send API**. It also states that no credit card is required. These facts are documented capabilities, not proof of the experience in the publication used for this PoC.

## 3. Evidence matrix

Status meanings:

- **Pass** — verified directly or established by a clear official plan entitlement that does not require experiential judgment.
- **Caveat** — supported, but constrained or still needs a product check.
- **Pending** — direct Launch-product observation is required.

| Requirement | Expected from blueprint | Observed on Launch | Status | Evidence / notes |
| --- | --- | --- | --- | --- |
| Free plan | $0 up to 2,500 active subscribers | Billing page shows Launch, 2,500 subscribers at $0/month; no billing details | Pass | The UI says 0 / 2,500 subscribers. |
| Unlimited sends | Included | Listed for Launch | Pass (documented) | Pricing feature table. |
| Trial isolation | New account may expose Max features | Max trial day 1 / 14; underlying Launch plan is shown separately | Caveat | Private branding explicitly says it is not included in the trial. A/B testing and audio newsletter controls are visible but are paid capabilities and excluded from the recommendation. |
| Publication identity | Title, subtitle, sender name, reply-to | Software Signal Weekly name, description, sender name, shared beehiiv sending address, and account reply-to are active | Pass | A different reply-to would require inbox verification. |
| Required address | Compliant footer without exposing a home address | With no address set, previews show beehiiv's New York business address | Pass | No personal home address was entered or exposed. |
| beehiiv branding | Accepted initially if unobtrusive | Powered by beehiiv is visible in email and welcome-email footers | Caveat | It is low in the footer and does not interrupt the article, but cannot be removed on Launch or Scale. |
| Editor and visual quality | Calm, crisp, technical, editorial, breathable | Representative 464-word issue drafted and previewed on desktop/mobile, email/web | Pass | Clear H1/H2/H3 hierarchy, readable line length, generous whitespace, working emphasis and link treatment. |
| Images/diagrams and links | Supported in issue body | Framework diagram inserted from beehiiv's media library; external link rendered | Pass | The 1491 × 1055 PNG and caption render in the editor, desktop/mobile email previews, and web preview. |
| Hosted email-only signup | Required | Live hosted homepage shows one Email field and Subscribe button on desktop and mobile | Pass | Clean default page, responsive stacked mobile form, no extra required fields. |
| Embedded email-only form | Required | External form created with one email field, success message, and form-level double opt-in | Pass | Generated loader script uses form ID `73d5eecc-14a6-4de7-9654-a6b57f593298`; newsletter-list selector disabled. |
| Success/redirect behavior | Confirmation or redirect | Embedded forms support either an up-to-80-character success message or an external redirect URL | Pass (documented) | Embedded forms do not enter a hosted signup flow. |
| Double opt-in | Preferred | Enabled publication-wide and on the external form; approved alias moved from pending to active after confirmation | Pass | Confirmation email was sent at 15:50:56 IST and recorded delivered at 15:50:58 IST; subscription was recorded at 16:04:47 IST. |
| Welcome email | One message after confirmation | Custom 68-word welcome email arrived eight seconds after activation | Pass | Subject, preview line, body, footer, one-click unsubscribe headers, and reply-to were verified in the approved inbox. |
| Unsubscribe | Easy and compliant | Reader management page presents a clear confirmation step and success state | Pass | Approved alias was unsubscribed and changed from active to inactive in the subscriber table. |
| API subscription creation | Native website form is feasible | Launch API page is accessible and exposes the publication ID, but API-key creation requires Stripe identity verification | Caveat | Entitlement is real; user identity verification is a manual prerequisite. Keep any eventual key server-side with `subscriptions:write`. |
| Scheduling | Saturday-morning send | Scheduler parsed Saturday at 9:00 AM as Aug 22, 2026, GMT+5:30 | Pass | Publication timezone was set to Kolkata. The schedule was cancelled before publishing or sending. |
| Test send and preview | Required | Preview supports Email/Web and Desktop/Mobile; refreshed test email arrived in the approved account inbox | Pass | Received HTML contains the responsive 590px diagram and caption; plain text contains an image URL and caption. Reply-to and SPF/DKIM/DMARC passed. |
| Email/web control | Publish to email, web, or both | Audience step offers Email and web, Email only, and Web only | Pass | Draft remains unpublished. |
| Public archive and issue URLs | Required | Hosted homepage is live; draft preview has a stable `/p/...` URL, breadcrumbs, subscribe CTA, and sharing controls | Pass | Archive has no published issue yet because the PoC draft was intentionally not published. |
| Custom web domain | `newsletter.suyogjoshi.com` feasible | Custom domains are included on Launch | Pass (documented) | beehiiv generates publication-specific records. Do not add them during this PoC without explicit approval. |
| Domain authentication | SPF, DKIM, DMARC documented | Setup generates 12 DNS records; DMARC is required | Caveat | Exact host/value records are publication-specific and remain pending. Verification may take up to 72 hours. |
| Smart Warming | Deliverability readiness | Automatic 4–8 week warming for a new custom sending domain | Pass (documented) | No production DNS or real-audience send is needed to establish this requirement. |
| Bounces and complaints | Managed and measurable | Help Center documents soft/hard bounces, suppression, and available complaint signals | Pass (documented) | Gmail and some providers do not provide feedback-loop complaint data, so visible complaint rates are incomplete. |
| Basic analytics | Sends, delivery, opens, clicks, growth, unsubscribes, post performance | Launch lists campaign analytics and subscriber metrics; 3D analytics is paid | Caveat | Directly inspect a test post and distinguish any trial-only dashboard views. Opens and some clicks can be inflated by privacy/security tooling. |
| Subscriber export | CSV portability | Launch UI exposes Quick, Full, and post exports; Quick and Full CSVs completed and were inspected | Pass | Both files contained the creator subscriber. Full includes acquisition/source, referring URL, device, revenue, referral, delivery, open/click, tier, and name fields. |
| Future cost | First paid tier after Launch threshold | Scale is the first paid tier | Pass (documented) | At 5,000 subscribers, the official selector shows $78/month billed annually ($940/year) or $89 month-to-month. |

## 4. Visual/editor findings

The live draft `PoC: The Review Layer Is Becoming the Work` uses this structure:

1. Opening Note
2. The Big Signal
3. Worth Knowing
4. From the Engineering Desk
5. Worth Your Time
6. Closing CTA

The 464-word draft rendered cleanly in desktop and mobile email previews and in the desktop web preview. Heading hierarchy, paragraph width, whitespace, bold text, and an external link were readable without custom HTML. The web preview added breadcrumbs, a subscribe CTA, share controls, author/date metadata, and estimated reading time. In email, beehiiv branding appears low in the footer alongside the required unsubscribe link and fallback mailing address; it does not interrupt the editorial body.

No trial-only content blocks or styling features were used. The existing Software Signal framework diagram was uploaded successfully to beehiiv's media library as a 1491 × 1055 PNG, inserted between `The Big Signal` and `Worth Knowing`, and captioned `Software Signal Reliable Engineering Framework`. It rendered cleanly at the issue's content width in the editor and was present in desktop/mobile email previews and the web preview.

## 5. Signup and welcome-flow findings

Official documentation establishes the intended mechanics:

- An embedded form can be email-only and is delivered as an iframe plus script.
- It can display a short success message or redirect to a full external URL.
- An embedded form does not enter the hosted beehiiv signup flow.
- Double opt-in can be required for a specific embedded form. Publication-wide double opt-in still takes precedence when enabled.
- An API-created subscriber follows publication-wide double opt-in unless `double_opt_override` is deliberately supplied.
- A pending subscriber cannot be activated programmatically; the reader must use the confirmation link.
- The welcome email follows successful confirmation when double opt-in is enabled.

Publication-wide double opt-in is enabled. The external email-only form also has double opt-in enabled and displays `Success! Now check your email to confirm your subscription.` The approved fresh alias `suyog19+p1@gmail.com` passed beehiiv's human-verification challenge and appeared as `pending`, with acquisition source `website: direct / (none)`. beehiiv recorded the confirmation email as sent and delivered. After the reader used the confirmation link, the alias became `active` and the profile recorded a subscription event.

The reader-facing management link showed the address, active Free plan, referral link, and two clearly separated actions: unsubscribe and report an unrecognized signup. Unsubscribe required a confirmation step stating that the reader would no longer receive the newsletter, returned `You have successfully unsubscribed`, and changed the beehiiv subscriber state to `inactive`.

A custom 68-word welcome email is published with the subject `Welcome to Software Signal Weekly` and a Saturday-cadence preview line. Gmail recorded it at 16:04:55 IST, eight seconds after the beehiiv subscription event. The received message contained the intended body and footer, `Reply-To: Software Signal Weekly <suyog19@gmail.com>`, RFC 8058 one-click unsubscribe headers, and passing SPF, DKIM, and DMARC results on beehiiv's shared sending domain.

A refreshed representative test issue arrived at 16:09:20 IST. Its received HTML contained the framework diagram at responsive full width with the caption `Software Signal Reliable Engineering Framework`; the plain-text alternative contained an image URL and caption. A one-line approved reply-routing check was sent in the same Gmail thread to the configured reply inbox.

## 6. Website integration findings

Two integration paths are feasible without changing `suyogjoshi.com` during this PoC.

### Preferred launch path: beehiiv embed

The generated email-only embed is:

```html
<script async src="https://subscribe-forms.beehiiv.com/v3/loader.js" data-beehiiv-form="73d5eecc-14a6-4de7-9654-a6b57f593298"></script>
```

The attribution script is optional and separate. The form requires double opt-in and shows a concise success message. This minimizes implementation and secret-management work. beehiiv branding cannot be removed on Launch.

### Alternative: native site form backed by the API

Submit the address from the site to a server-side endpoint, which calls beehiiv's create-subscription endpoint with a credential having `subscriptions:write`. The credential must remain in server-side secret storage and must never be shipped to the browser. Preserve source attribution and let publication-wide double opt-in apply. This provides more control over site styling and success states, but adds a backend boundary, abuse protection, error handling, observability, and secret rotation. In the live Launch account, creating an API key first requires Stripe Identity verification, so the API path carries an additional identity-verification dependency.

Prefer the embed for initial launch. It is already configured, supports the required email-only and double-opt-in flow, and avoids both a backend and Stripe Identity verification. Use the API path only if the production site's visual or behavioral requirements outgrow the embed.

## 7. Archive, domain, and deliverability findings

Launch includes web hosting and custom domains. The expected setup for `newsletter.suyogjoshi.com` is technically supported, but the exact DNS records are generated for the publication. beehiiv's current setup documentation says:

- a custom domain can serve as the web domain, redirect domain, or email sending domain;
- manual or Entri-assisted setup is available;
- the current flow generates 12 DNS records;
- beehiiv never requires a nameserver change;
- Cloudflare records must be DNS-only for verification;
- DMARC is required;
- verification may take up to 72 hours; and
- a new custom sending domain enters automatic Smart Warming for 4–8 weeks.

No DNS records were added. The shared beehiiv web and email subdomains are live, and the hosted homepage and draft issue page were inspected. The homepage has a minimal email-only CTA that stacks cleanly on mobile. The draft web issue includes a subscribe CTA, breadcrumbs, share controls, editable slug, meta title and description, search preview, Open Graph/X settings, visibility controls, and an advanced email-capture setting.

beehiiv records delivery, opens, clicks, unsubscribes, bounces, and some spam complaints. Opens rely on a tracking pixel and can be inflated by privacy protection. Automated security tools can also create non-human clicks. Complaint visibility is incomplete because not every mailbox provider supplies feedback-loop data. Hard bounces and complaints can lead to suppression from future sends.

## 8. Analytics and export findings

The Launch interface exposes campaign analytics and subscriber metrics, but not 3D analytics as a Launch entitlement. The new publication has no delivered campaign data, so meaningful rates cannot yet be evaluated. A future published issue's Performance view should be checked for delivered count, open rate, click-to-open rate, soft/hard bounce data, and unsubscribe rate while avoiding trial-only views.

Subscriber data is documented as portable through CSV exports:

- **Quick export:** email, status, and tier.
- **Full export:** the Quick fields plus additional custom fields and statistics.

The live Launch interface exposes Quick, Full, and Posts exports. Quick and Full exports were requested at 15:25 IST on 2026-08-19, completed successfully, and were inspected through their generated download links.

The Quick CSV contained subscriber ID, API subscription ID, email, tags, status, premium flag, and creation timestamp. The Full CSV additionally contained update/unsubscribe timestamps, referral and campaign fields, channel, acquisition source, referring URL, acquisition term/content, device type, revenue, referral count, send/delivery/open/click totals and rates, last-opened/last-clicked timestamps, tier membership, and first/last name. This is sufficient for migration and most consent/source audits, although the publication should define how it records consent provenance beyond beehiiv's acquisition fields.

## 9. Current and future costs

Verified on the official pricing page on 2026-08-19:

- **Launch:** $0/month; up to 2,500 subscribers; unlimited sends; no credit card required.
- **First paid tier:** Scale.
- **Scale at 5,000 subscribers, annual billing:** $78/month, billed as $940/year.
- **Scale at 5,000 subscribers, monthly billing:** $89/month.

These prices were read directly from the official pricing selector with the subscriber setting at 5,000 on 2026-08-19. The displayed annual total is $940 even though 12 × $78 is $936; retain beehiiv's displayed total and recheck before upgrading.

Desired capabilities that force an earlier upgrade:

- Automations, surveys/polls, advanced website analytics, custom HTML, A/B testing, segmented sends, the referral program, and webhooks require Scale or higher.
- Removing beehiiv branding, dynamic content, and the Send API require Max or higher.

None is required for the proposed initial Software Signal launch, subject to the branding and editor-quality assessment.

## 10. Known limitations

- beehiiv branding cannot be removed on Launch or Scale.
- No custom HTML, A/B testing, automations, polls, referral program, advanced analytics, or segmented sends on Launch.
- Embedded forms do not participate in hosted signup flows.
- Test emails use synthetic test-recipient identifiers; the real unsubscribe experience was therefore validated separately with the approved alias's subscriber-management link. Unpublished public links may return 404 outside the draft-link flow.
- Scheduling uses the browser/computer timezone rather than the publication's default display timezone.
- Open and click data can include privacy-tool and security-tool activity.
- Complaint metrics are necessarily incomplete for mailbox providers without feedback loops.
- Custom-domain verification and warming cannot be fully validated without DNS changes and elapsed time; documentation is sufficient for this PoC unless the user separately approves a non-production domain test.

## 11. Actions required before launch

1. Replace the personal account reply-to with a role-based address and complete its ownership-verification link.
2. Do not start Stripe Identity verification unless the API integration path is selected.
3. Review and approve the exact custom-domain DNS records separately; no DNS records were changed during this PoC.

## 12. Recommended implementation approach if Go

1. Start on Launch with one publication and one weekly newsletter.
2. Use the generated email-only embed if its visual assessment passes; otherwise use a native site form with a small server-side subscription endpoint.
3. Enable double opt-in and a single welcome email. Do not use `double_opt_override=off` in production.
4. Keep the API credential server-side with only the required scope.
5. Use `newsletter.suyogjoshi.com` for the hosted archive after reviewing the exact generated DNS records.
6. Use a role-based sender/reply inbox rather than a personal login address where practical.
7. Schedule each Saturday issue explicitly and verify the browser timezone shown in the scheduling modal.
8. Export subscribers periodically and retain consent/source fields where available.
9. Revisit Scale only at the subscriber threshold or when a specifically required paid capability justifies it.

## 13. Open questions

- Is Stripe Identity verification acceptable if a future native API integration is chosen?

## Official evidence reviewed

- [beehiiv pricing](https://www.beehiiv.com/pricing)
- [Create subscription API](https://developers.beehiiv.com/api-reference/subscriptions/create)
- [Creating an embedded subscribe form](https://www.beehiiv.com/support/article/12977090590487-creating-an-embedded-subscribe-form)
- [Double opt-in and Smart Nudge](https://www.beehiiv.com/support/article/13081072798743-How-do-I-set-up-a-double-opt-in-)
- [Setting up a welcome email](https://www.beehiiv.com/support/article/12314772394519-setting-up-your-welcome-email)
- [Custom-domain setup](https://www.beehiiv.com/support/article/14492990172823-How-to-add-and-configure-custom-domains)
- [Understanding domains and Smart Warming](https://www.beehiiv.com/support/article/12999491162391)
- [Previewing and sending test emails](https://www.beehiiv.com/support/article/4413249011607-Sending-test-emails-of-your-post)
- [Scheduling and delivery troubleshooting](https://www.beehiiv.com/support/article/41483954973207-troubleshooting-post-publishing-scheduling-and-delivery-issues)
- [Exporting subscriber data](https://www.beehiiv.com/support/article/12258595483543-exporting-post-content-or-subscriber-data-from-beehiiv)
- [Email footer address behavior](https://www.beehiiv.com/support/article/12293012097175-how-to-update-the-address-and-copyright-text-in-your-email-footer)
- [Sender name](https://www.beehiiv.com/support/article/12293357892503)
- [Reply-to address](https://www.beehiiv.com/support/article/12283814343831-how-to-set-or-change-your-publications-reply-to-address)
- [Delivery events](https://www.beehiiv.com/support/article/13844467358231-What-are-the-different-email-delivery-events-)
