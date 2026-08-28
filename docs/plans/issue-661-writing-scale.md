# Issue 661 — Writing discovery at scale

## Product and architecture brief

This epic is user-visible and changes information architecture, discovery,
publishing operations, and derived public data. The child issues #662–#671 are
the authoritative architecture decisions.

The primary reader jobs are to find the newest work, browse by age or Topic,
follow a curated learning sequence, search the complete known corpus, and reach
the newsletter without needing to understand where an Article was hosted.
The maintainer job is to publish once and regenerate every discovery surface
without editing multiple lists.

The source of truth is a normalized Work ledger. A Work owns one or more
Publication representations, a stable identity, and Topic membership. Its
effective public date is the latest eligible Publication date. Derived HTML,
RSS, Search, and sitemap files are generated and validated. Curated Topic
previews and Reader Paths are intentionally separate editorial data.

Invariants:

- Latest contains exactly six Works.
- Recent is inclusive age 0–100; Archive is age 101+, with no gap or overlap.
- A republication changes one Work's preferred representation and date; it does
  not create a second feed or Search identity.
- Public pages make no live Medium or Beehiiv data calls.
- Search is local and bounded to 30 rendered results.
- Newsletter metadata is cumulative and last-known-good on source failure.
- Production promotion remains human-controlled.

## UX gates

Gate A confirmed the existing editorial design system, one-H1 page hierarchy,
source-neutral reader model, and static-first feasibility. Gate B retained the
approved routes and used progressive disclosure: six visual Latest rows,
dedicated Recent and Archive pages, four Reader Paths, four Topic previews, and
a distinct newsletter block. Gate C implementation preserved the public shell,
focus behavior, semantic lists, honest external-link labels, and legacy fragment
anchors. Gate D rendered review covered desktop, 390 px mobile, and a 720 px
viewport representing 200% zoom; generated pages had no horizontal overflow,
missing images, or site-attributed console failures. Keyboard navigation and
the mobile menu remained operable.

## Operational handoff

`scripts/ingest_article.py` is the publishing entry point.
`scripts/refresh_writing_chronology.py` advances the date partition daily.
`scripts/sync_newsletter_editions.py` performs RSS-first cumulative ingestion
and optional paginated API reconciliation. Full commands and failure semantics
are documented in `docs/engineering/writing-publishing.md`.
