# Software Signal Weekly — beehiiv Production Configuration

> Repository placement: this is a production operations record for the website/newsletter integration, so its canonical home is the website repository rather than the Software Signal knowledge-system repository.
>
> Status: Publication settings, custom domains, the role-based reply-to, and explicit-consent subscription UX were configured and verified on 2026-08-19. The Product Owner merged website production PR `suyog19/suyog19.github.io#560`; the signup path is live and verified. No real-subscriber invitation or paid-plan capability has been used.

Editorial blueprint: [Software Signal Newsletter Blueprint](https://github.com/suyog19/digital-garden/blob/main/newsletters/software-signal-weekly/blueprint.md)

PoC evidence: [beehiiv Launch PoC](https://github.com/suyog19/software-signal/blob/main/strategy/software-signal-newsletter-beehiiv-poc.md)

Subscriber controls: [Software Signal Weekly Subscriber Handling Policy](newsletter-subscriber-handling-policy.md)

Related privacy runbook: [Privacy retention operations](privacy-retention-operations.md)

## Production configuration

| Area | Final configuration | Evidence / Launch safety |
| --- | --- | --- |
| Publication | **Software Signal Weekly** | Saved in General info and visible on the hosted publication. |
| Description | **The important shifts shaping software engineering—and what they mean for your work.** | Saved in General info; also used for the public page description and Open Graph description. |
| Sender display name | **Suyog Joshi from Software Signal** | Saved in Emails. “Use post's author name” remains off. |
| Reply-to | **newsletter@suyogjoshi.com** | Created as a GoDaddy alias for the monitored `contact@suyogjoshi.com` mailbox. beehiiv's ownership email arrived through the alias, its verification link completed successfully, and Emails now shows the role address as the active Reply-To. |
| Language and timezone | English; Kolkata | The scheduler was previously validated for Saturday at 9:00 AM IST. Each scheduled send must still show the intended IST time before confirmation. |
| Double opt-in | Enabled publication-wide | Directly verified in Emails; the PoC proved the `pending → active` confirmation flow. No production override is allowed. |
| Consent and provenance | Newsletter-specific consent wording precedes the email-only form; beehiiv retains subscriber status, timestamps, acquisition source, referring URL, and available campaign fields | The website does not collect a duplicate subscriber record. Manual activation, unrelated-contact enrollment, and unreviewed imports are prohibited by the subscriber-handling policy. |
| Welcome email | One enabled, published welcome email | Subject: **Welcome to Software Signal Weekly**. Preview: **More clarity, less catch-up—starting this Saturday.** The 68-word body sets the Saturday expectation, explains the format, and invites replies. |
| Footer | **© 2026 Software Signal Weekly**; beehiiv's compliant New York fallback address; preferences, unsubscribe, abuse-reporting, and visible “Powered by beehiiv” controls | Directly reviewed in the published welcome email. No personal home address is exposed. Visible beehiiv branding is an accepted Launch limitation. |
| Reader management | Newsletter auto-login enabled; read-online token expires after 48 hours | Enables preference and unsubscribe access without requiring a new login. Forwarded-email token exposure remains the accepted platform tradeoff. |
| Publication access | Public publication; subscriber approval off; retention flow off | Keeps the hosted archive and signup available without Max/Scale-only retention features. |
| Web/archive | **https://newsletter.suyogjoshi.com/** | The custom web domain is connected and beehiiv reports it as Live. The root domain and `www` remain unchanged; no redirect domain was configured. |
| Social/share defaults | Title: **Home \| Software Signal Weekly**; approved description; `summary_large_image`; canonical hosted URL | The Open Graph image is still beehiiv's generic landscape thumbnail. Replace it only when the reusable visual identity is approved; it is not a launch-platform blocker. |
| Analytics defaults | Automatic UTM tagging enabled; default source/medium/campaign behavior retained; custom subscriber link parameters off | Uses basic defaults and avoids passing subscriber data through custom URL parameters. |
| Branding | Existing publication logo and clean white presentation retained; removable/private branding not enabled | Private branding is explicitly unavailable on the free trial and requires Max. The production configuration does not depend on it. |

## Custom domain and email authentication

The domain roles deliberately isolate newsletter traffic from the existing website and mailbox configuration:

| Role | Final value | Status |
| --- | --- | --- |
| Web/archive | `newsletter.suyogjoshi.com` | Connected; beehiiv reports **Live**. |
| Sending domain | `mail.suyogjoshi.com` | Connected; beehiiv accepted the SPF and DKIM delegation records. |
| Sender address | `software-signal-weekly@mail.suyogjoshi.com` | Default custom-domain sender in beehiiv. |
| Branded links | `elink69f.mail.suyogjoshi.com` | Verified by beehiiv after the authoritative CNAME correction; SSL configuration was in progress at the final check. |
| Redirect domain | None | Intentionally omitted so the existing root and `www` website routing remain untouched. |

Existing production state was checked before any change. `suyogjoshi.com` continues to use GoDaddy nameservers, GitHub Pages A records at the root, GoDaddy mail MX records, and the existing root SPF policy `v=spf1 include:secureserver.net -all`. None of those records was replaced. The existing DMARC policy is `v=DMARC1; p=reject; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`; it uses relaxed alignment and remains unchanged.

The following publication-specific records were added exactly as generated by beehiiv:

| Type | Host | Target / value | Purpose |
| --- | --- | --- | --- |
| TXT | `_beehiiv-authentication-39bf1` | `d1081254158aaeaf5a89753a3d9f691918c431ba` | Domain ownership |
| CNAME | `newsletter` | `cname.beehiiv.com` | Web/archive routing |
| CNAME | `em7024.mail` | `u112883597.wl098.sendgrid.net` | SPF/return-path delegation |
| CNAME | `93e._domainkey.mail` | `93e.domainkey.u112883597.wl098.sendgrid.net` | DKIM delegation |
| CNAME | `93e2._domainkey.mail` | `93e2.domainkey.u112883597.wl098.sendgrid.net` | DKIM delegation |
| CNAME | `bh1234._domainkey.mail` | `bh1234._domainkey.mail.suyogjoshi.com.zn001.beehiivmail.net` | beehiiv DKIM delegation |
| CNAME | `bh1234.mail` | `bh1234.mail.suyogjoshi.com.zn001.beehiivmail.net` | beehiiv sending-domain delegation |
| CNAME | `elink69f.mail` | `branded-link.beehiiv.com` | Branded links |
| CNAME | `112883597.mail` | `sendgrid.net` | Branded links |

beehiiv verified domain ownership, the web CNAME, and all five email-domain CNAMEs. Public DNS resolution independently confirmed the ownership record and the web/email records. The two branded-link records were saved successfully in GoDaddy on 2026-08-19. The initial `elink69f.mail` target was corrected from `sendgrid.net` to `branded-link.beehiiv.com`; authoritative DNS then resolved the corrected CNAME and beehiiv reported the branded-link domain as verified. SSL completion should still be rechecked before the first production send.

### Smart Warming

Smart Warming is enabled automatically for custom domains, but it is **not active yet** for this publication. beehiiv's current rule is that a domain connected below the initial threshold begins warming when the publication reaches 200 subscribers. The publication currently has only the approved test subscriber, so there is no warming start date or progress chart yet.

Once activated, warming is adaptive. A publication sending more than weekly typically takes 6–8 weeks; a weekly publication may take longer. During warming, beehiiv gradually shifts recipients from its shared domain to the custom sending domain. Subject-line A/B testing remains unavailable until warming completes. Launch planning must therefore treat warming as a post-audience-growth constraint, not as a countdown already underway.

References: [beehiiv custom-domain setup](https://www.beehiiv.com/support/article/14492990172823-How-to-add-and-configure-custom-domains), [DMARC setup](https://www.beehiiv.com/support/article/13650078276375-setting-up-dmarc-for-a-custom-domain-how-to-create-a-record-and-authenticate), and [Smart Warming](https://www.beehiiv.com/support/article/14976017431319-Smart-Warming-and-how-it-applies-to-you).

## Website subscription UX and production-form verification

The subscription UX was implemented in [suyog19/suyog19.github.io PR #557](https://github.com/suyog19/suyog19.github.io/pull/557), then its explicit-consent controls were completed in [PR #558](https://github.com/suyog19/suyog19.github.io/pull/558). Both are merged to that repository's `dev` branch, most recently at `2f86f9bfe4b25693df842f298ab7a868136301ca`. They have not been promoted to the production `main` branch.

The implementation adds:

- a dedicated `/newsletter/` page with the production email-only beehiiv form;
- a contextual Home signup surface and a restrained Writing-page callout;
- explicit reader promise, double-opt-in guidance, hosted-form fallback, privacy access, and accessible iframe naming;
- responsive evidence at 1440×900 and 390×844; and
- a prospective Privacy Notice update covering beehiiv processing, newsletter retention, unsubscribe suppression, and deletion requests while preserving the immutable training privacy snapshot.

The approved end-to-end alias completed the production path on 2026-08-19: beehiiv recorded it as `pending`, sent the branded-domain confirmation message, changed it to `active` after confirmation, and delivered the welcome email. The welcome content, sender, reply invitation, physical address, unsubscribe control, and beehiiv attribution rendered as configured.

Both the confirmation and welcome messages landed in Gmail Spam during this test. Subscription behavior is verified, but inbox placement and sender reputation remain an operational risk to monitor before and after the first production send.

The subscriber-handling policy keeps course, contact, training, social, and newsletter sources separate; prohibits purchased, scraped, inferred, and silently enrolled addresses; preserves beehiiv source/status evidence; respects unsubscribe, bounce, complaint, and suppression state; and limits exports to documented portability, backup, migration, or verified privacy purposes.

## Launch-tier safety

The configuration uses the Launch-compatible behavior already proven by the PoC: publication identity, hosted web/archive, double opt-in, one welcome email, basic branding, scheduling/timezone, subscriber self-management, unsubscribe, and basic UTM tagging.

The following visible trial or paid capabilities are deliberately unused:

- private branding / removal of beehiiv badges;
- subscription-retention flows;
- Smart Nudge;
- automations, advanced segmentation, A/B testing, polls, referrals, custom HTML, and advanced analytics;
- Send API and webhook-dependent behavior.

Issue #25 must still repeat the required sanity check after the Max trial expires.

## Role-address verification

The role-based reply route was completed on 2026-08-19 without adding a mailbox or paid plan:

1. GoDaddy created `newsletter@suyogjoshi.com` as the third alias on the existing `contact@suyogjoshi.com` account.
2. beehiiv sent its ownership message to the role address, and it arrived in the monitored primary inbox.
3. The verification link completed successfully.
4. A fresh Emails-settings check showed `newsletter@suyogjoshi.com` as both the saved and active Reply-To; the previous personal address was no longer shown as the active value.
5. Double opt-in remained enabled after the identity change.

This proves alias delivery and provider ownership verification. Replies must still be checked as part of every pre-send smoke test, using only an approved test recipient, because a future mailbox or provider configuration change could break routing.
