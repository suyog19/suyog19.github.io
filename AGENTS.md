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
- frontend integration with the platform backend contact API

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
| Scrum Master / Orchestrator | Codex | Workflow coordination, issue/branch/PR discipline, blocker handling, and handoffs. |
| Team Lead / Architect | Codex | Technical direction, site architecture fit, SEO/deployment safety, and review of meaningful design decisions. |
| Software Developer 1 | Claude Code | Primary implementer for content, HTML, CSS, JS, docs, and PR updates. |
| Software Developer 2 | Codex | Fallback or small-scope implementer when appropriate. |
| QA / Reviewer | Codex | Functional checks, responsive review, SEO/link validation, and final PR review before merge to `dev`. |
| GitHub Actions | GitHub Actions | Production deployment from `main`. |

Claude Code-specific working notes live in `CLAUDE.md`. Codex should also read
`CLAUDE.md` for repository memory and implementation conventions.

## Standard Workflow

1. Confirm or create the GitHub issue.
2. Sync from `dev`.
3. Create a feature branch from `dev`.
4. Make focused changes for the issue.
5. Run relevant local validation.
6. Open a PR into `dev` and link the issue.
7. Address review feedback.
8. Merge to `dev` when accepted.
9. Leave the `dev` to `main` PR for human review and merge.

Agents must stop and ask Suyog before changing this workflow, branch protection,
deployment behavior, domain configuration, or production promotion rules.

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
- responsive layout is checked for user-facing UI changes
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
