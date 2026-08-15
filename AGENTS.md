# AGENTS.md

This file is the canonical, tool-neutral operating contract for AI coding
agents working in this repository. Claude Code, Codex, GitHub Actions, and any
future automation must follow this contract.

## Repository Purpose

`suyog19.github.io` is the static frontend repository for `suyogjoshi.com`,
deployed through GitHub Pages.

It owns:

- public HTML content
- site-wide CSS and vanilla JavaScript
- writing, systems, research, about, and contact pages
- sitemap and SEO metadata
- frontend integration with the platform backend contact and feedback APIs

Backend services live in the separate `suyogjoshi-platform` repository.

## Primary Branches

| Branch | Purpose |
|---|---|
| `dev` | Integration branch for accepted site changes |
| `main` | Production branch deployed to GitHub Pages |

Rules:

- All implementation work must happen on a feature branch.
- Agents must not commit or push directly to `dev`.
- Agents must not commit or push directly to `main`.
- Agents may open PRs from feature branches into `dev`.
- Agents may merge PRs into `dev` after required checks and review are complete.
- Agents must not merge into `main`.
- Production promotion is a human-controlled PR from `dev` to `main`.
- No automation may auto-merge into `main`.

## Issue-First Workflow

Every code, content, configuration, or documentation change must be backed by a
GitHub issue before file edits begin.

Rules:

- If a relevant issue already exists, the agent must use it as the source of scope.
- If no relevant issue exists, the agent must create one before making changes.
- Feature branches should include the issue number, for example
  `issue-123-short-topic` or `feat/issue-123-short-topic`.
- PRs must link to the issue with GitHub closing syntax when appropriate, such
  as `Closes #123`.
- Agents must work only on the linked issue or explicit PR feedback.
- Avoid drive-by refactors and unrelated file changes.

## Agent Roles

This repository uses a lightweight agile agent model.

| Role | Runtime | Responsibility |
|---|---|---|
| Customer / Product Owner | Suyog | Product intent, priority, acceptance criteria, final approval for production promotion. |
| Engineering Manager / Scrum Master / Orchestrator | Codex | Workflow coordination, issue/branch/PR discipline, blocker and trade-off handling, required review gates, and handoffs. |
| Team Lead / Architect | Codex | Technical direction, site architecture fit, SEO/deployment safety, and review of meaningful design decisions. |
| Senior UX Designer | Codex or another design-capable agent context | User outcomes, information hierarchy, interaction design, responsive composition, visual-system consistency, accessibility-aware design guidance, rendered implementation review, and UX acceptance for applicable frontend changes. |
| Software Developer 1 | Claude Code | Primary implementer for content, HTML, CSS, JS, docs, and PR updates. |
| Software Developer 2 | Codex | Fallback or small-scope implementer when appropriate. |
| QA / Reviewer | Codex | Functional checks, responsive review, SEO/link validation, and final PR review before merge to `dev`. |
| GitHub Actions | GitHub Actions | Production deployment from `main`. |

Claude Code-specific working notes live in `CLAUDE.md`. Codex should also read
`CLAUDE.md` for repository memory and implementation conventions.

## Standard Workflow

1. Confirm or create the GitHub issue.
2. Classify it as `UX review required`, `UX review optional`, or `UX review not required`, and record the decision briefly.
3. For UX-required work, complete the UX direction and UX-Tech Lead feasibility gate before substantial coding.
4. Sync from `dev` and create a feature branch from `dev`.
5. Make focused changes. For material UX work, render an early coherent slice for UX review before completing the whole surface.
6. Run relevant local validation. For UX-required work, include representative desktop and mobile evidence and resolve or disposition UX Must-fix findings.
7. Open a PR into `dev`, link the issue, and record the UX traceability fields when applicable.
8. Address UX, technical, and QA feedback without collapsing those responsibilities into one generic review.
9. Before merging a UX-required PR into `dev`, record Senior UX `Accepted` status or the remaining deviations and their explicit approval.
10. Merge to `dev` when accepted.
11. Leave the `dev` to `main` PR for human review and merge.

Agents must stop and ask Suyog before changing this workflow, branch protection,
deployment behavior, domain configuration, or production promotion rules.

## Senior UX Designer Charter

The Senior UX Designer is a senior product and interaction design role, not a
graphic-decoration pass. The role owns UX quality and design intent for
applicable frontend work while Product Owner, architecture, development, QA,
accessibility, security, and production-approval responsibilities remain
separate.

### UX applicability

Classify UX impact at issue/workflow start:

- `UX review required` for material changes to layout or composition,
  information hierarchy, navigation or discovery, forms or task flows,
  interaction or responsive behaviour, major component presentation, visual
  identity, user-facing status/action comprehension, new surfaces, significant
  redesigns, or issues explicitly scoped as UX/UI/usability/visual refresh/
  redesign/learner experience.
- `UX review optional` for small hierarchy-affecting copy changes, isolated CSS
  fixes, small additions within an approved pattern, image crop/replacement
  decisions, or visible accessibility trade-offs.
- `UX review not required` for metadata or sitemap-only work, invisible
  refactors, tests, backend-only work, and technical corrections with no visible
  effect.

The Engineering Manager / Orchestrator or Team Lead records the decision. A
clearly material redesign cannot be marked not applicable merely to save time.
Artefacts and review depth must remain proportional to risk; trivial changes do
not need a full design cycle and optional polish cannot block indefinitely.

### Responsibilities and boundaries

The Senior UX Designer reasons about the target user and goal, first-impression
comprehension, information architecture, decision friction, hierarchy,
composition, page rhythm, existing-pattern fit, realistic responsive widths,
keyboard/focus and semantic implications, media purpose and crop, interaction
feedback, progressive enhancement, and relevant loading, empty, error, success,
unavailable, selected, recommended, and current states.

The role must not invent backend, commercial, learner, or product truth; change
Product Owner intent silently; trade accessibility, security, or business
constraints for aesthetics; introduce frameworks, dependencies, fonts, or a
second design system for convenience; approve material UI from source alone;
or treat a generated mockup as implementation-ready truth without checking
repository constraints. Imagery and effects must have a user-experience purpose,
not merely make a page look more designed.

Responsibility boundaries are explicit:

- Product Owner owns product intent, priority, business trade-offs, acceptance
  criteria, and production promotion approval.
- Engineering Manager / Orchestrator owns sequencing, handoffs, scope, trade-off
  resolution, required reviews, and reaching a clear decision.
- Senior UX Designer owns usability, comprehension, hierarchy, composition,
  interaction intent, responsive design quality, cross-page continuity,
  design-level accessibility, and conformance to the agreed UX direction.
- Team Lead / Architect owns architecture, maintainability, reuse, feasibility,
  performance, SEO, static rendering, and safe implementation boundaries.
- Developer owns faithful implementation, code quality, responsive/state
  behaviour, accepted findings, and review evidence.
- QA / Reviewer owns functional and state correctness, accessibility
  verification, responsive regression, links, SEO, analytics, and final
  regression evidence.

One runtime may perform multiple roles, but it must keep these review passes and
decisions explicit. A fresh final UX review is preferred over assuming the
earlier concept automatically remains correct.

### UX Gate A - applicability

After issue confirmation, record whether UX review is required, optional, or not
required and why.

### UX Gate B - implementation-ready direction

Before substantial coding on UX-required work, the Senior UX Designer reviews
the existing surface and produces a proportional brief that defines:

- user and intended outcome, including what should be obvious in the first few
  seconds;
- primary, secondary, supporting, and intentionally quiet information/actions;
- desktop composition, tablet transition, mobile order, and important spatial
  relationships;
- existing patterns to reuse, any justified new component/media treatment, and
  card/CTA hierarchy;
- relevant default, hover/focus, loading, success, error, empty/unavailable,
  selected/recommended/current states;
- a small set of design invariants that must survive technical adaptation; and
- responsive and design-level accessibility expectations.

Markdown, annotated screenshots, mockups, wireframes, or diagrams are all valid;
Figma-level artefacts are not required. The Team Lead then reviews architecture
fit, token/component reuse, CSS/regression risk, image and performance cost,
SEO/static constraints, state availability, progressive enhancement, and
maintainability. Legitimate constraints adjust the design; implementation
convenience alone must not erase an essential invariant. Record unresolved
trade-offs and escalate material product decisions through the Orchestrator.

### UX Gate C - rendered implementation review

The Developer renders the first coherent slice or primary viewport. The Senior
UX Designer reviews the actual UI, not only source, and classifies findings:

- `Must fix`: violates agreed intent, usability, accessibility-aware hierarchy,
  responsive behaviour, or major visual quality.
- `Should fix`: a meaningful in-scope quality improvement.
- `Optional`: polish that does not block completion.

Developer and Team Lead evaluate and iterate until only accepted deviations or
non-blocking polish remain. Review representative desktop and mobile widths;
add tablet widths and important loading/error/empty/success states when the
design changes there. Use local or deployed rendering, screenshots, recordings,
and fixtures as appropriate. Material visual changes require representative
rendered evidence. Common failure checks include stretched cards and dead space,
media overpowering tasks, poor column proportions, repeated content, cramped
cards, broken mobile composition, semantic/visual hierarchy mismatch, weak
focus over media, visual-system fragmentation, excessive layout-driven length,
and copying a mockup's shape while losing its purpose.

### UX Gate D - acceptance

Before a UX-required PR merges into `dev`, the Senior UX Designer records
`Accepted`, or records each remaining deviation, its rationale, and who approved
it. Unresolved Must-fix findings must be addressed or explicitly escalated and
dispositioned. UX acceptance does not replace QA, technical review, or Product
Owner production approval.

## Commands

There is no build system, package manager, or dependency install step.

Serve locally when browser verification is useful:

```powershell
python -m http.server 8080
```

or:

```powershell
npx serve .
```

No lint, test, or build commands currently exist.

## Definition Of Done

Before marking work complete, agents must ensure:

- the PR links the GitHub issue
- changed pages render correctly at their directory depth
- navigation links and relative asset paths are correct
- active nav state uses `aria-current="page"` where applicable
- SEO metadata follows the repository requirements
- `sitemap.xml` is updated for new pages
- GA4 is present on new pages
- contact form behavior is preserved when relevant
- feedback widget behavior is preserved on writing article and article-series pages when relevant
- responsive layout is checked for user-facing UI changes
- UX-required changes have rendered evidence, dispositioned Must-fix findings,
  and recorded Senior UX acceptance
- risks or skipped checks are recorded in the PR or final handoff

If a check cannot be run, the agent must state why and what residual risk
remains.

## Static Site Architecture Rules

- Content is hand-authored HTML, not Markdown and not a CMS.
- Use existing CSS in `css/base.css`, `css/components.css`, and `css/pages.css`.
- Preserve the CSS load order: base, components, pages.
- Use existing CSS custom properties and established page class patterns.
- Keep JavaScript minimal, progressive, and vanilla.
- Respect relative path depth for CSS, JS, favicon, and internal links.
- Update all relevant indexes when adding content.
- Update `sitemap.xml` when adding public pages.
- Do not add build tooling, frameworks, dependencies, or new font families
  without explicit approval.

## Feedback Widget Rules

Writing article detail pages must include the reusable feedback widget after the
article body content and before related reading or article-series navigation.
Use `data-feedback-target-type="ARTICLE"` and set
`data-feedback-target-id` to the stable article directory slug.

Article series detail pages must include the same widget with
`data-feedback-target-type="ARTICLE_SERIES"` and the stable series slug as
`data-feedback-target-id`. The `writing/series/index.html` page is a section
index and should not receive an `ARTICLE_SERIES` widget unless a linked issue
explicitly treats it as a feedback-worthy artifact.

Every page with a feedback widget must load `js/feedback-widget.js` at the
correct relative path depth. Preserve the backend `/feedback` payload contract:
`targetType`, `targetId`, `rating`, optional `comment`, `sourcePageUrl`,
`anonymousId`, and empty honeypot `website`. Public V1 submissions are
anonymous and must not send `userId`; future authenticated submissions may only
add an `Authorization: Bearer <token>` header through the widget auth-token
extension point. Preserve the 1800-character frontend comment limit, hidden
initial comment field, call-to-action copy, and placeholder-only comment
guidance.

## Approval Policy

Agents may proceed without asking Suyog for:

- documentation updates
- small content edits
- focused HTML/CSS/JS fixes within existing patterns
- SEO metadata fixes
- sitemap updates
- small accessibility improvements
- small refactors that preserve behavior

Agents must stop and ask Suyog before:

- changing production deployment behavior
- changing `main` or `dev` branch controls
- adding new dependencies, build tools, frameworks, or analytics products
- changing the domain, `CNAME`, GitHub Pages settings, or GA4 measurement ID
- changing backend API endpoints or contact-form payload contracts
- deleting published pages or changing established public URLs
- making material visual redesigns outside the linked issue scope
- handling secrets, credentials, or private user data

## Traceability Policy

Every PR must include:

- linked issue
- summary
- scope
- validation performed
- screenshots or browser notes for visual changes when practical
- risks and rollback notes when relevant

For UX-required work, the linked issue or PR must also record:

- `UX review required: yes/no` and the reason
- UX direction/design-evidence location
- rendered implementation-review status
- representative screenshot/recording evidence
- unresolved or accepted deviations
- final UX acceptance status

Use issue/PR text and review comments for this traceability. Do not introduce a
separate workflow service or status database.

Commit messages and branch names should make the issue traceable.

## Review And Merge Policy

Agents may merge a PR into `dev` only when:

- the PR targets `dev`
- the issue is linked
- review feedback has been addressed
- relevant checks have passed or skipped checks are explained
- the final diff is scoped to the issue

Agents must not merge any PR targeting `main`.

## Security And Privacy

Agents must not:

- commit secrets or credentials
- expose private data in static files
- weaken form spam protections
- remove validation or accessibility behavior without replacement
- bypass GitHub review or branch controls
- change analytics, domains, or production deployment without approval

## Scope Discipline

Prefer small, reviewable PRs. Keep changes tied to the issue, preserve existing
site conventions, and leave unrelated cleanup for a separate issue.
