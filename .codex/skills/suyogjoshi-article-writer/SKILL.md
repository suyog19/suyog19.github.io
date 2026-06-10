---
name: suyogjoshi-article-writer
description: Write, adapt, or publish long-form articles for suyogjoshi.com in Suyog Joshi's existing voice and static-site conventions. Use when drafting new writing pages, adapting Medium posts, planning article outlines, improving article copy, creating SEO metadata, or converting an approved draft into hand-authored HTML under the writing section.
---

# SuyogJoshi Article Writer

## Core Workflow

1. Read the task and identify the article mode:
   - Draft-only: produce an outline or prose draft without editing site files.
   - Adaptation: preserve the source idea while making it fit SuyogJoshi.com.
   - Publishable page: create or update hand-authored HTML in the repo.
2. Load `references/article-style-guide.md` before writing or editing article content.
3. If creating or changing repo files, follow `AGENTS.md` and `CLAUDE.md` first:
   - Use a GitHub issue before edits.
   - Work from `dev` on a feature branch.
   - Keep the scope tied to the issue.
4. Draft the article around a practical mental model, not a newsy take.
5. Validate the draft against the voice checklist and publishing checklist.
6. For publishable pages, update required indexes and `sitemap.xml`, then run a local render check when practical.

## Article Shape

Use this default structure unless the source material calls for a tighter shape:

1. Open with a familiar confusion, practical situation, or recent shift.
2. State the core claim plainly.
3. Build a mental model using a concrete example, layered stack, contrast, or workflow.
4. Explain what changes in real work.
5. Add grounded limitations or a reality check.
6. Close by connecting the idea to judgment, systems discipline, learning, or the next article.

Prefer section headings that name the idea directly:

- `The New Bottleneck Is No Longer Coding`
- `The Most Important Mental Model`
- `What Coding Assistants Actually Do`
- `A Practical Reality Check`
- `Final Thoughts`

## Writing Rules

- Write for engineers, learners, builders, and technical decision makers who want clarity without hype.
- Prefer plain, direct sentences. Let complexity come from the idea, not the language.
- Use first person when the article is experiential. Use second person sparingly to orient the reader.
- Explain AI and software systems as layered systems, feedback loops, trade-offs, and operational constraints.
- Make contrastive claims when useful: "generated does not mean verified", "models are not the whole product", "the effort has moved".
- Use lists for concrete criteria, responsibilities, workflows, risks, or examples.
- Use italics for key distilled claims, not for decoration.
- Avoid generic thought-leadership filler, breathless predictions, and keyword-stuffed SEO phrasing.

## Publishing Rules

For a new article page:

- Create `writing/<slug>/index.html`.
- Use existing article detail classes and the standard CSS order: `base.css`, `components.css`, `pages.css`.
- Use correct relative paths for two-level pages: `../../css/...`, `../../js/script.js`, `../../favicon.svg`.
- Include SEO metadata, canonical URL, Open Graph/Twitter tags, favicon links, and GA4.
- Use `og:type` of `article`.
- Show article metadata in the page header: `Author: Suyog Joshi` and `Published On: dd MMM yyyy` using the current publication date.
- Add the article to `writing/index.html` in the featured grid or relevant thematic group.
- Add or promote it on root `index.html` only when requested or clearly in scope.
- Add the production URL to `sitemap.xml` with priority `0.8`.
- Preserve `aria-current="page"` in navigation.
- Add `.article-original-note` when adapting a Medium or external post.

## References

- Read `references/article-style-guide.md` for corpus-derived voice notes, article inventory, HTML template guidance, and final QA checks.
