# Software Signal Weekly — Subscriber Handling Policy

> Status: Launch control approved for the initial email-only, double-opt-in subscription flow. This is an operating policy, not jurisdiction-specific legal advice.

Editorial blueprint: [Software Signal Weekly Blueprint](https://github.com/suyog19/digital-garden/blob/main/newsletters/software-signal-weekly/blueprint.md)

Production configuration: [beehiiv Production Configuration](https://github.com/suyog19/software-signal/blob/main/strategy/software-signal-newsletter-beehiiv-production-configuration.md)

Related privacy runbook: [Privacy retention operations](privacy-retention-operations.md)

## Purpose and scope

This policy governs how Software Signal collects, confirms, uses, exports, suppresses, and deletes newsletter subscriber information. It applies to website and beehiiv signup surfaces, any future approved import, and manual subscriber operations.

It does not authorize audience acquisition, a public launch, a paid list, a new integration, or reuse of data collected for another purpose.

## Consent baseline

A person becomes a newsletter subscriber only when both conditions are true:

1. they knowingly submit their email through an approved Software Signal Weekly signup surface, or a future import has a documented newsletter-specific consent basis; and
2. they complete beehiiv's confirmation email while double opt-in is enabled.

Reader-facing wording must identify Software Signal Weekly, state the Saturday cadence, explain that confirmation is required, link the Privacy Notice, and make unsubscribe availability clear before the form action.

No one may bypass double opt-in, mark a pending address active manually to avoid confirmation, or treat silence, an existing relationship, or a general contact permission as newsletter consent.

## Minimum data and purpose

The initial form asks only for an email address. Do not add a name, employer, job title, phone number, interests, course history, or demographic field without a separate approved need and privacy review.

beehiiv may create provider-owned operational metadata needed to run the service, including:

- subscriber and API identifiers;
- pending, active, inactive, bounced, complained, or suppressed status;
- creation, confirmation, update, and unsubscribe timestamps;
- signup/acquisition source, referring URL, and available UTM fields;
- delivery, open, and click events; and
- tier or list membership required by the publication.

Use this information only for newsletter delivery, consent and suppression evidence, portability, operational troubleshooting, aggregate performance review, and carefully bounded reader analysis described in the Privacy Notice.

## Prohibited enrollment

Do not add or silently enroll:

- purchased, rented, scraped, inferred, or third-party lists;
- course applicants, learners, training attendees, or wait-list contacts;
- contact-form senders, support correspondents, or survey respondents;
- social followers, LinkedIn newsletter subscribers, or event attendees; or
- personal and professional contacts merely because their address is known.

Each source remains separate. A course application, contact message, training relationship, follow, or prior conversation is not consent to receive Software Signal Weekly.

## Import gate

Imports are disabled as a normal acquisition path. Before any future import, record and approve:

- the source and accountable owner;
- the exact newsletter consent statement shown;
- when and how each address consented;
- the intended publication and expected cadence at consent time;
- the fields being imported and why each is necessary;
- how withdrawals, complaints, bounces, and prior suppressions were excluded; and
- whether recipients must reconfirm through double opt-in.

If the consent basis is incomplete, ambiguous, stale, or unrelated to Software Signal Weekly, do not import. Do not override beehiiv suppression records during an import.

## Provenance and audit evidence

beehiiv is the operational source of truth for subscriber status. Preserve the provider's subscriber identifier, status history, creation/confirmation/unsubscribe timestamps, acquisition source, referring URL, and available campaign fields when they exist.

For a manual operation, record only:

- date and operator;
- bounded action type;
- beehiiv subscriber identifier or a non-sensitive case reference;
- consent/source evidence reviewed;
- outcome; and
- exception or escalation reference.

Do not copy raw addresses, message bodies, engagement histories, or export contents into GitHub issues, repository files, screenshots, or general operational logs.

## Unsubscribe, bounce, and complaint handling

- Every sent newsletter must retain beehiiv's visible unsubscribe control and compliant footer.
- An unsubscribe must stop newsletter delivery through beehiiv immediately; do not resubscribe the address manually.
- Preserve the minimum suppression record needed to honour an unsubscribe or complaint.
- Respect beehiiv's hard-bounce, complaint, and suppression behavior. Do not route around it through another list, sender, or tool.
- Investigate an unexpected delivery only with the minimum subscriber information needed and do not weaken suppression controls to retry it.

## Access, correction, and deletion

Privacy requests use `contact@suyogjoshi.com` and the verification process in the website privacy runbook. A verified requester may ask for access, correction, unsubscribe, or eligible deletion.

Unsubscribe and deletion are distinct: unsubscribe stops delivery and may retain a suppression record; eligible deletion removes subscriber information through beehiiv's owning controls except for the minimum evidence that must be retained to honour suppression or another documented legal, security, or dispute requirement. Explain what remains and why. Do not promise automatic or immediate deletion.

## Portability and backup exports

Subscriber export is allowed only for portability, migration readiness, an approved backup, or a verified privacy request. Use Quick export when email/status is sufficient; use Full export only when source, consent, or operational fields are necessary.

For each export:

1. record purpose, owner, date, export type, and approved storage location without recording raw subscriber data;
2. store it only in an access-controlled, encrypted location approved for subscriber data;
3. never commit it to Git, attach it to a public issue, place it in a shared general-purpose folder, or send it through an unapproved channel;
4. verify that the file is readable and includes the fields required for the stated purpose;
5. keep only the latest verified portability backup and one immediately previous verified copy unless a migration or incident requires a documented exception; and
6. securely remove superseded downloads and temporary local copies.

Review export need quarterly and before a platform migration. A quarterly review does not require creating a fresh file when the existing verified backup is current and no material list change justifies another copy.

## Roles and operating checklist

The publication owner is accountable for consent wording, imports, exports, suppression, and deletion decisions. beehiiv performs form capture, confirmation, delivery, unsubscribe, suppression, and subscriber storage. The website must remain a minimal client with no newsletter API key or duplicate subscriber database.

Before inviting any real subscriber:

- [ ] Production signup surfaces show the approved consent wording and Privacy Notice link.
- [ ] The form collects email only.
- [ ] Double opt-in is enabled and an end-to-end test reaches `active` only after confirmation.
- [ ] Sender display name and a monitored, verified reply-to address are configured.
- [ ] beehiiv's unsubscribe, footer, and suppression controls remain present.
- [ ] No unrelated contact source is queued for enrollment or import.
- [ ] Acquisition/source fields remain available for audit and later export.
- [ ] The privacy request route and beehiiv deletion operation are known to the operator.

## Legal-review boundary

This policy uses conservative plain-language consent and data-minimisation practices. It does not conclude that these controls satisfy every jurisdiction. Obtain qualified legal review before materially expanding collection, using paid or third-party lead acquisition, importing an external list, adding profiling or sensitive fields, changing engagement tracking, or targeting a jurisdiction with additional consent, cookie, retention, or data-transfer requirements.

No unresolved legal question authorizes broader collection or enrollment. When uncertain, stop the proposed change and keep the current email-only, double-opt-in flow.
