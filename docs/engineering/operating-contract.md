# Repository operating contract

This document adds repository-specific mechanics to the canonical policy inherited
from `suyog19/software-engineering-process`. Canonical controls and obligations are
not repeated here.

## Repository and branch model

`suyog19.github.io` is the static frontend for `suyogjoshi.com`. The separate
`suyogjoshi-platform` repository owns backend services.

- `dev` is the integration branch for accepted frontend changes.
- `main` is the production branch deployed by GitHub Pages.
- Create issue-numbered feature branches from an up-to-date `dev`.
- Do not commit or push directly to `dev` or `main`.
- Open implementation pull requests into `dev` and link the issue with closing
  syntax when appropriate.
- Agents may merge an accepted PR into `dev` only after required checks, evidence,
  and reviews are complete.
- Production promotion is a human-controlled PR from `dev` to `main`. Agents and
  automation must not merge or auto-merge into `main`.

Every code, content, configuration, or documentation change starts with a GitHub
issue. Work only within the linked issue or explicit PR feedback; leave unrelated
cleanup for a separate issue. PRs record summary, scope, validation, visual/browser
notes when applicable, risks, and rollback information.

Stop and ask the Product Owner before changing this branch model, branch protection,
deployment behavior, domain configuration, production promotion, backend API
contracts, analytics identity, published URLs, dependencies/frameworks, or handling
secrets and private user data.

## Repository roles and handoffs

- Suyog, as Product Owner, owns product intent, priority, acceptance criteria,
  business and taste decisions, and final production-promotion approval.
- The Engineering Manager / Orchestrator owns issue and branch discipline,
  classification, sequencing, handoffs, scope, trade-off resolution, evidence, and
  required review gates.
- The Team Lead / Architect owns architecture fit, maintainability, reuse,
  performance, SEO, static-rendering safety, and feasibility boundaries.
- The Senior UX Designer owns comprehension, hierarchy, composition, interaction
  intent, responsive quality, cross-page continuity, design accessibility, rendered
  review, and UX acceptance. Load `docs/ux/engineering-process.md` for the local
  charter and Gates A-D.
- Developers own faithful implementation, code quality, progressive behavior, and
  resolution of accepted findings.
- Functional QA and non-functional QA own behavioral/state correctness,
  accessibility, responsive regression, links, SEO, analytics, security, privacy,
  reliability, and operational checks appropriate to the resolved obligations.
- GitHub Actions provides objective validation and deploys production only from
  `main`; it does not own product or production approval.

One runtime may perform several delivery roles, but it must keep the handoffs and
review perspectives explicit. The canonical fresh-context independent-review rule
still applies.

## Local completion checks

In addition to the Effective Obligation Set, confirm as applicable that nested pages
resolve assets correctly, navigation uses `aria-current="page"`, SEO and sitemap
requirements are met, GA4 remains present on new pages, contact and feedback
contracts are preserved, and user-visible work is checked responsively. Record any
skipped check and residual risk in the PR.
