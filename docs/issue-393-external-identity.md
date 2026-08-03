# External identity and authoritative profile linkage

Issue: #393  
Canonical public identity: `https://suyogjoshi.com/#person`

## Approved profiles

The visible profile links and the Person `sameAs` values use the same bounded set:

- LinkedIn: `https://www.linkedin.com/in/suyog-joshi`
- GitHub: `https://github.com/suyog19`
- Medium: `https://medium.com/@suyog19`

The About page is the canonical human-readable profile. It identifies Suyog as a software engineer, systems thinker, writer, and technical educator focused on practical software, data, and AI systems. External biographies may be shorter, but must not materially contradict that positioning.

`rel="me"` is limited to the explicit verified-profile links on the About and Training provider pages. Ordinary footer links use normal external-link relationships because repeating identity claims on every page adds no value.

## Controlled-profile backlink audit

Audit performed 3 August 2026.

| Surface | Canonical-site backlink | Positioning status | Action |
|---|---|---|---|
| GitHub profile | Verified: profile website is `https://suyogjoshi.com/`; LinkedIn and Medium are listed as social accounts | Updated to the approved About-page role summary | Recheck when the canonical identity changes. |
| Medium profile | Verified: short bio includes `suyogjoshi.com` | Updated from the older “22+ years, exploring AI/ML” copy to the approved role summary | Medium has no separate website field in the current profile editor; retain the domain in the bounded short bio. |
| LinkedIn profile | Verified: the public profile exposes “Visit my website” for `https://suyogjoshi.com` | Current senior engineering, banking/payments, architecture and applied-AI headline is consistent with the site's broader, conservative biography | No profile edit required. Recheck after material role changes. |

Profile-platform rendering and authentication can change. The repository validator therefore checks links controlled by this site; external backlinks are manually reviewed rather than scraped in CI.

## Site-surface audit

- Home, Writing, and Systems already expose the same LinkedIn, Medium, and GitHub destinations in their footers with `target="_blank"` and `rel="noopener noreferrer"`.
- About now presents the three verified profiles as primary identity evidence with `rel="me noopener noreferrer"`, matching `Person.sameAs`.
- The Training provider page now links to the canonical About profile and the same verified professional evidence.
- No additional directory or social profiles were accepted.

## Medium and canonical-source policy

- Every page on suyogjoshi.com keeps a self-referencing canonical URL.
- When an article was originally published on Medium and later adapted here, the site includes an `.article-original-note` after the article body.
- The note states that Medium was the original publication and links to the exact Medium article using safe external-link attributes.
- New writing published first on suyogjoshi.com remains canonical here. A later Medium syndication should use Medium's canonical-link/import controls to point back to the site article and should not be described here as the original.
- Publication history is disclosed for readers; it does not change the site's canonical ownership metadata.

## Public repository connections

Only repositories that are public and directly correspond to a published System page receive reciprocal links:

| System page | Public repository |
|---|---|
| `/systems/ai-dev-orchestrator/` | `https://github.com/suyog19/ai-dev-orchestrator` |
| `/systems/survey-poll-serverless/` | `https://github.com/suyog19/survey-poll-app` |

Private repositories and loosely related experiments are intentionally excluded. Each matching System page links to its repository, and each repository homepage field links back to its canonical System page.

## Training provider identity

Software Signal remains a training offering/brand provided by Suyog Joshi, not a separate legal company. The provider page links to the canonical About profile and the same three approved professional profiles. Course structured data continues to reference `https://suyogjoshi.com/#person`.

## Privacy boundary

The public identity graph excludes private email, phone, home address, birth date, learner data, application data, cohort data, and payment data. No directory profiles or unverified accounts are added for link volume.
