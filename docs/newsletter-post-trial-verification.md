# Software Signal Weekly: post-trial verification

Date: 2026-09-07 (IST). Tracking issue: [SS-25](https://github.com/suyog19/software-signal/issues/25), under [SS-17](https://github.com/suyog19/software-signal/issues/17).

## Scope and result

This is the focused post-Max-trial check of the existing publication on beehiiv Launch. It does not authorize a paid upgrade or a public-launch decision.

**Result: GO WITH CAVEATS on Launch.** The required controls remain available after the Max trial, and the approved fresh test completed signup, confirmation, welcome delivery, and unsubscribe. No required capability was found lost after the trial. The caveats below limit the evidence; they do not require a paid upgrade.

## Evidence basis

- Signed-in beehiiv UI inspected on 2026-09-07 for Software Signal Weekly.
- [Editorial blueprint](https://github.com/suyog19/digital-garden/blob/main/newsletters/software-signal-weekly/blueprint.md) and [saved-template specification](https://github.com/suyog19/digital-garden/blob/main/newsletters/software-signal-weekly/template.md).
- Historical [production configuration](https://github.com/suyog19/suyog19.github.io/blob/83be8c6af304d3c9d4e7876a1076f7e925361585/docs/newsletter-beehiiv-production-configuration.md) and [PoC record](https://github.com/suyog19/suyog19.github.io/blob/512c8dcb5129c00a6c9ff0c399b84b9696872386/docs/newsletter-beehiiv-launch-poc.md), recovered from git history because their former current-branch paths no longer exist. Historical observations are not treated as today's test results.
- Current [privacy operations](privacy-retention-operations.md) govern test-data handling. No subscriber addresses, confirmation tokens, subscriber export contents, or private management links belong in this record.

## Verification matrix

Pass means the stated observation was verified directly. Caveat identifies an accepted constraint or a test not yet completed; it is not a claim of successful end-to-end operation.

| Check | Result | Observation and limit |
| --- | --- | --- |
| Trial isolation and current plan | Pass | The August 19 PoC recorded day 1 of a 14-day Max trial. On September 7 the dashboard shows Launch without a trial indicator; Billing & plan shows Launch, 2,500 subscribers at $0/month, and last/next payments N/A. Paid-feature unlock controls remain visible. |
| Publication identity | Pass | Name and description match the production configuration. English and Kolkata remain selected. Sender is Suyog Joshi from Software Signal; reply-to remains the newsletter role address. |
| Reusable editor/template | Pass | Saved template `0a93f4ae-6b07-4cdd-b38a-5b17bffbd729` opens in the editor with all six sections, Inter 16 px and 1.5 line height. Email and web previews render the structure and footer; mobile preview is available. No template content was edited or saved. |
| Production email-only embed | Pass with caveat | The live `/newsletter/` page loads the established form `73d5eecc-14a6-4de7-9654-a6b57f593298`, one email field, Subscribe control, explicit consent, privacy link, and confirmation guidance. A user-approved fresh alias was accepted and appeared as Pending. The form reset after submission; a persistent success message was not captured. |
| Double opt-in | Pass | Publication-wide double opt-in is enabled. The fresh alias stayed Pending until the confirmation link was followed, then became Active. No administrative activation or opt-in override was used. |
| Confirmation and welcome | Pass | Confirmation was sent at 12:41:00 IST and delivered at 12:41:02, reaching Gmail Inbox. Following its link opened `/newsletter/confirmed/` with the success heading. The welcome email arrived in Gmail Inbox at 12:42 with the approved subject, preview text, Saturday cadence, reply invitation, fallback address, unsubscribe, and beehiiv attribution. |
| Scheduling | Pass | Existing PoC draft opens in Compose and Review. The scheduling dialog offers a specific date/time and the next usual Saturday 09:00 send. The dialog was cancelled without choosing or confirming a send. This verifies availability, not execution of a newly scheduled email. |
| Email/web publishing controls | Pass | Existing PoC Review displays Publish to Email and Web. The September 5 edition is recorded as published to Email and Web. No post was published or scheduled during this verification. |
| Public archive | Pass | The custom-domain archive lists August 22, August 29, and September 5 editions. The September 5 article opens with its title, date, and body. |
| Basic analytics | Pass | September 5 campaign Performance displays sent/delivered counts, opens, clicks, bounces, unsubscribes, and spam reports without an upgrade gate. This is an availability check, not a quiet-launch engagement assessment; opens and clicks are not proof of human readership. |
| Quick/Full subscriber exports | Pass | Export data exposes enabled basic and full subscriber export buttons without an upgrade gate. Exports were not requested or downloaded; file generation and CSV contents were not retested. |
| Branding and footers | Caveat | Email/template previews show copyright, the existing beehiiv fallback address, unsubscribe and Powered by beehiiv. Web previews/archive retain attribution. Removing branding requires Max, as already accepted. |
| No paid upgrade | Pass | No plan, billing, DNS, sender, consent, or publication setting was changed. |
| Test cleanup | Pass | The fresh alias used the received welcome email's unsubscribe link and confirmed Unsubscribe from all communications. Both the reader profile and beehiiv then showed Inactive. The provider recorded Unsubscribed at 12:45:28 IST. The existing test alias was left unchanged; no subscriber was deleted. |

## Test sequence and evidence limits

The previously approved test alias was already Active and was left unchanged. The user explicitly approved a fresh alias, confirmation, and unsubscribe afterward. The fresh alias was submitted through the production embed and appeared as Pending at 12:40 IST. Its confirmation message was sent at 12:41:00 and delivered at 12:41:02. Gmail showed it in Inbox. The confirmation link was followed at approximately 12:41:51; the website displayed its confirmed page and beehiiv subsequently showed Active.

The welcome arrived at 12:42 IST and was inspected in Gmail Inbox. [Beehiiv's troubleshooting guidance](https://www.beehiiv.com/support/article/12314708619159-reasons-your-welcome-emails-may-not-have-sent), checked on the verification date, allows 15–30 minutes for dispatch; the observed delivery was within that window. The reader-facing unsubscribe was completed at 12:45:28 IST, leaving the fresh alias Inactive and preserving the suppression record.

The evidence record contains no raw test addresses, subscriber export, or token-bearing URLs. Export availability was checked without generating files; scheduling availability was checked without executing a send. Inbox placement for one test mailbox is not a guarantee for other readers. The form's persistent success feedback was not captured, although its backend acceptance and confirmation journey were verified. Visible beehiiv branding remains an accepted Launch constraint.

SS-25's Launch-only viability check is complete, subject to review of this record. SS-27 and later child issues have not been started by this verification. Their audience, delivery, feedback, and go/no-go requirements remain separate; three existing published editions do not automatically satisfy those gates.
