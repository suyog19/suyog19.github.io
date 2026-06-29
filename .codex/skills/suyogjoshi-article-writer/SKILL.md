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
4. For publishable pages, complete the Article Placement Workflow before editing article indexes, homepage highlights, series navigation, or related-reading blocks.
5. Draft the article around a practical mental model, not a newsy take.
6. Author publishable pages with layout-aware HTML from the start; do not rely on validation to discover predictable list, table, code-block, image, or mobile overflow issues.
7. Validate the draft against the voice checklist, layout-aware authoring checklist, Article Placement Checklist, and publishing checklist.
8. For publishable pages, manually update required indexes and `sitemap.xml`, then complete local visual QA before handoff.

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
- Choose bullets or numbering intentionally: use bullets for sets and examples; use numbering only when sequence, priority, or count matters.
- Use italics for key distilled claims, not for decoration.
- Avoid generic thought-leadership filler, breathless predictions, and keyword-stuffed SEO phrasing.

## Article Placement Workflow

Use this workflow whenever converting a draft into a publishable page or adding a new article to the site. Publishing is not only page creation; the article must be classified, connected, and discoverable across the hand-authored site.

### 1. Required Publishing Inputs

Before editing site files, confirm or derive:

- Final article title.
- Subtitle or short description.
- Slug.
- Published date.
- Estimated reading time.
- Cover image path, if applicable.
- Publication status: `draft`, `scheduled`, or `published`.

If any input is unknown, make a conservative recommendation and call it out before handoff.

### 2. Content Type

For a normal writing page, use:

```yaml
contentType: article
```

Keep content type separate from topic. Content type describes the format; topic clusters describe reader paths through the writing archive.

### 3. Primary Category

Choose exactly one primary category.

Allowed v1 categories:

```yaml
category: AI Foundations
category: AI-Assisted Software Engineering
category: Engineering Context and Knowledge
category: Systems and Experiments
category: Agile, Process, and Engineering Leadership
```

Use the primary category as the broad editorial shelf. Do not assign multiple primary categories to one article.

### 4. Topic Clusters

Choose one or more topic clusters.

Allowed v1 topic clusters:

```yaml
topicClusters:
  - AI Foundations
  - AI-Assisted Software Engineering
  - Engineering Context and Knowledge
  - AI Agents and Review
  - Systems and Experiments
  - Agile, Process, and Engineering Leadership
```

Use topic clusters for discovery, thematic grouping, and related reading. Add multiple clusters only when the article genuinely belongs in more than one reader path.

### 5. Series Decision

Decide whether the article belongs to an ordered series.

For most articles, leave series metadata empty:

```yaml
series:
seriesOrder:
```

Use series only when:

- The article belongs to a deliberate reading sequence.
- Reading order matters.
- The series has or should have a landing page.

Current approved series:

```yaml
series: ai-assisted-software-engineering
seriesOrder: <number>
```

`Engineering Context and Knowledge` is a topic cluster for now, not a series.

### 6. Editorial Placement

Decide whether the article should be highlighted beyond Latest Writing.

Homepage featured:

```yaml
featured: true | false
```

Use `featured: true` sparingly for strong homepage highlights. If true, update the homepage writing grid manually.

Writing page recommended starting point:

```yaml
recommended: true | false
```

Use `recommended: true` manually when the article is a strong entry point for new visitors. If true, place it in the Recommended Starting Points area of `writing/index.html`.

### 7. Date Display Rules

Article metadata should include dates, but not every listing should display them.

- Homepage: no dates.
- Recommended Starting Points: no dates.
- Topic clusters: no dates.
- Latest Writing: show dates.
- Individual article page: show dates.

### 8. Related Content

Every publishable article must consider related links before handoff.

Related articles:

```yaml
relatedArticles:
  - article-slug-1
  - article-slug-2
```

Add two to four related articles when useful. Prefer links that help the reader continue the same line of thinking. If no related articles fit, explicitly say they were skipped and why.

Related systems:

```yaml
relatedSystems:
  - system-slug-1
```

Use related systems when the article connects to a project, build, experiment, demo, or architecture note. Systems live primarily under Systems; Writing can reference systems, and Systems can reference writing.

Backlinks:

- Check whether older articles should link to the new article.
- Check whether related systems should link to the new article.
- Check whether the new article changes the best next-read path for any existing article.

### 9. Manual Navigation Updates

This repository is a static, hand-authored site with no content generator. Do not assume taxonomy, Latest Writing, topic cluster, series, or related-reading listings update automatically.

For every publishable article, update the applicable hand-authored surfaces:

- `writing/index.html` Latest Writing listing by publication date.
- `writing/index.html` Recommended Starting Points when `recommended: true`.
- `writing/index.html` topic cluster section or sections based on `topicClusters`.
- Series landing page and article-level series navigation when `series` and `seriesOrder` are present.
- Article-level related reading using `relatedArticles` where useful.
- Related system links using `relatedSystems` where useful.
- Backlinks from older related articles or systems when they materially improve navigation.
- Root `index.html` writing grid only when requested, clearly in scope, or `featured: true`.
- `sitemap.xml` for every new public article page.

### 10. Suggested Metadata Shape

Use this as the target metadata shape, even if the current static HTML implementation stores some of it manually in page content or index sections:

```yaml
title:
subtitle:
slug:
contentType: article
publishedDate:
updatedDate:
status: draft | scheduled | published
readingTime:
category:
topicClusters:
series:
seriesOrder:
featured: false
recommended: false
relatedArticles: []
relatedSystems: []
coverImage:
```

Fields may be optional in implementation, but the publishing workflow must consider each field.

## Publishing Rules

For a new article page:

- Create `writing/<slug>/index.html`.
- Use existing article detail classes and the standard CSS order: `base.css`, `components.css`, `pages.css`.
- Use correct relative paths for two-level pages: `../../css/...`, `../../js/script.js`, `../../favicon.svg`.
- Include SEO metadata, canonical URL, Open Graph/Twitter tags, favicon links, and GA4.
- Use `og:type` of `article`.
- Show article metadata in the page header: `Author: Suyog Joshi` and `Published On: dd MMM yyyy` using the current publication date.
- Complete the Article Placement Workflow before updating indexes, homepage highlights, series links, or related reading.
- Add the article to `writing/index.html` under the correct taxonomy-aware sections:
  - Recommended Starting Points only when `recommended: true`.
  - Topic cluster section or sections based on `topicClusters`.
  - Series sections only when the article belongs to an ordered series.
  - Latest Writing by publication date.
- Add or promote it on root `index.html` only when requested, clearly in scope, or `featured: true`.
- Add or update series navigation when `series` and `seriesOrder` are present.
- Add related reading links using `relatedArticles` where useful.
- Add related systems links using `relatedSystems` where useful.
- Consider backlinks from older related articles and related system pages.
- Add the production URL to `sitemap.xml` with priority `0.8`.
- Preserve `aria-current="page"` in navigation.
- Add `.article-original-note` when adapting a Medium or external post.
- Preserve supplied images as-is unless the user explicitly asks for edits, crops, annotations, or regeneration.
- Before handoff, visually check desktop, tablet, and mobile viewports. Confirm article header, cover image, lists, tables, code blocks, meaningful in-article images, related reading, and mobile navigation render correctly.
- Confirm body text, lists, tables, code blocks, and images align to the article reading column unless a deliberate full-width treatment is already established.
- Confirm mobile pages have no document-level horizontal overflow. Code blocks and tables may scroll within their own containers, but must not widen the page.
- If the in-app Browser is unavailable, use a local browser or headless screenshot fallback. If visual QA cannot be completed, do not present the page as ready; state the skipped check and residual risk.

## Article Placement Checklist

Before marking a publishable article as ready:

- [ ] Article title, subtitle, slug, date, status, and reading time are set.
- [ ] Primary category is selected from the allowed v1 categories.
- [ ] Topic cluster or clusters are selected from the allowed v1 topic clusters.
- [ ] Series decision is made.
- [ ] Series order is set if applicable.
- [ ] Homepage featured decision is made.
- [ ] Recommended Starting Point decision is made.
- [ ] Two to four related articles are selected or explicitly skipped.
- [ ] Related systems are selected or explicitly skipped.
- [ ] `writing/index.html` Latest Writing listing is manually updated.
- [ ] `writing/index.html` topic cluster listing is manually updated.
- [ ] `writing/index.html` Recommended Starting Points is manually updated if applicable.
- [ ] Series page and article-level series navigation are manually updated if applicable.
- [ ] Article-level related reading is verified.
- [ ] Useful backlinks from older content are added where applicable.
- [ ] Related systems links are added where applicable.
- [ ] `index.html` homepage writing grid is updated if `featured: true`.
- [ ] `sitemap.xml` is updated.
- [ ] Desktop, tablet, and mobile visual QA is complete or explicitly called out as skipped.

## References

- Read `references/article-style-guide.md` for corpus-derived voice notes, article inventory, HTML template guidance, and final QA checks.
