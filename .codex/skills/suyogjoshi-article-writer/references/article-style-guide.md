# Article Style Guide

## Corpus Read

This guide is based on the current long-form article corpus:

- `writing/ai-ml-data-science-explained-simply/`
- `writing/understanding-the-ai-ecosystem/`
- `writing/how-modern-llm-systems-really-work/`
- `writing/coding-assistants-are-not-junior-developers/`
- `writing/ai-stress-testing-agile/`
- `writing/how-i-used-two-ais-to-build-a-software-engineering-system/`

System detail pages also inform the publishing pattern because they reuse article classes, but article voice should primarily come from `writing/`.

## Voice

Write like a practitioner explaining a system after working through it, not like a marketer announcing a trend.

Core qualities:

- Practical and explanatory.
- Calmly opinionated.
- Grounded in software engineering, AI systems, and learning.
- Friendly to beginners without flattening the technical truth.
- Skeptical of hype, but optimistic about disciplined use.
- Focused on mental models, context, feedback loops, validation, and human judgment.

Common moves:

- Start with a problem readers already feel: confusion, speed, AI hype, weak context, vague requirements.
- Name the misconception: "AI is not replacing Agile", "coding assistants are not junior developers", "LLMs are not databases".
- Replace the misconception with a better mental model.
- Move from simple example to broader system.
- Explain both capability and limitation.
- End with what the reader should understand or do differently.

## Sentence And Paragraph Rhythm

- Use short paragraphs, often one to three sentences.
- Use occasional single-sentence paragraphs for emphasis.
- Repeat parallel statements when sharpening a point:
  - "Generated does not mean correct."
  - "Generated does not mean secure."
  - "Generated does not mean maintainable."
- Use plain transitions: "This is where...", "The result?", "The key point is this:", "That distinction matters."
- Avoid dense academic prose unless explaining a precise technical concept.

## Topic Patterns

Good SuyogJoshi.com articles usually fit one of these patterns:

- Beginner mental model: explain a confusing AI or software idea with a concrete domain example.
- Systems stack: separate a noisy topic into layers such as model, runtime, application, governance, and infrastructure.
- Practice shift: show how AI changes bottlenecks, roles, quality bars, or delivery workflows.
- Builder reflection: describe how a system was built, what changed across iterations, and what was learned.
- Tool mental model: explain what a tool is good for, what it is not, and how practitioners should use it responsibly.

## Structure Patterns

Use one of these patterns when outlining.

Beginner explainer:

1. Personal or reader-facing confusion.
2. Simple example.
3. Traditional approach.
4. Where traditional logic breaks down.
5. AI/ML/data/system concept.
6. Practical reality check.
7. Final thoughts and next step.

Systems explainer:

1. Surface experience.
2. "It is not just X; it is a stack."
3. Layer-by-layer breakdown.
4. Runtime or operational constraints.
5. Reliability and governance issues.
6. Future direction.
7. Final thoughts.

Practice essay:

1. Observed shift in teams or tools.
2. Counterintuitive claim.
3. What changed in the workflow.
4. New bottlenecks.
5. Roles, metrics, or quality implications.
6. What strong teams do differently.
7. Final thoughts.

Builder reflection:

1. What was built and why.
2. Goal and constraints.
3. Roles, workflow, and architecture.
4. Turning points.
5. What worked and what failed.
6. What the experience taught.
7. What happens next.

## HTML Page Template Notes

Article pages are hand-authored HTML under `writing/<slug>/index.html`.

Use this page skeleton:

```html
<article>
  <div class="article-page-header">
    <div class="container">
      <div class="article-reading-col">
        <a href="../" class="article-back-link">Back to writing</a>
        <p class="eyebrow">Writing</p>
        <h1 class="article-page-title">ARTICLE TITLE</h1>
        <p class="article-page-subtitle">Short human summary.</p>
        <div class="article-page-meta" aria-label="Article metadata">
          <span><strong>Author:</strong> Suyog Joshi</span>
          <span><strong>Published On:</strong> 10 Jun 2026</span>
        </div>
      </div>
    </div>
  </div>

  <div class="article-body-section">
    <div class="container">
      <div class="article-reading-col">
        <div class="article-body">
          <!-- Article content -->
        </div>
      </div>
    </div>
  </div>

  <div class="article-related">
    <div class="container">
      <div class="article-reading-col">
        <h2 class="article-related-title">Continue reading</h2>
        <ul class="article-related-list">
          <!-- Related articles -->
        </ul>
      </div>
    </div>
  </div>
</article>
```

For adapted external posts, place this after `.article-body` and before closing `.article-reading-col`:

```html
<div class="article-original-note">
  <p>This article was originally published on Medium and is being adapted here as part of my long-term knowledge hub.</p>
  <a href="SOURCE_URL" target="_blank" rel="noopener noreferrer">Read original on Medium</a>
</div>
```

## SEO And Metadata

For article pages:

- Title format: `Article Title | Suyog Joshi`.
- Description: aim for 140 to 160 characters, human-readable, no keyword stuffing.
- Visible page metadata: show `Author: Suyog Joshi` and `Published On: dd MMM yyyy` in the article header. Use the current publication date, for example `10 Jun 2026`.
- Canonical URL: `https://suyogjoshi.com/writing/<slug>/`.
- `og:type`: `article`.
- `twitter:card`: `summary`, unless a real page-specific 1200x630 image exists.
- Include GA4 measurement ID `G-PKL56GJ38H`.
- Do not add new social image tags unless the asset exists and is appropriate.

## Visuals And Diagrams

- Reuse existing images when adapting an article with assets.
- Preserve supplied images as-is unless the user explicitly asks for edits, crops, overlays, annotations, or regeneration.
- Use meaningful `alt` text that explains the diagram or image.
- Prefer existing inline diagram classes for simple process explanations:
  - `.flow-sequence`
  - `.process-flow`
- Do not add new dependencies, frameworks, fonts, or build tooling.

## Layout-Aware Authoring

Prevent predictable rendering issues while writing the page, before validation.

- Keep article body elements aligned to the same reading column unless the existing site pattern clearly uses a different treatment.
- Do not rely on browser-default rendering for unusual elements. If adding lists, tables, code blocks, figures, or diagrams, confirm the existing article CSS supports them; add scoped article styling when needed.
- Use bullets for unordered sets, examples, criteria, and parallel ideas.
- Use numbered lists only when sequence, priority, or the number of steps is meaningful.
- Keep list style consistent within a section. Do not switch between bullets and numbering for the same kind of idea.
- Ensure bullets and numbered markers align cleanly with the article reading column and do not drift awkwardly left or right of paragraph text.
- Use tables only when a comparison or mapping is clearer than prose. Keep column labels short and table content concise.
- Ensure tables fit the reading column on desktop and either fit or scroll inside their own container on mobile without creating page-level horizontal overflow.
- Keep code examples short enough for the reading column when possible. Style article `pre` and `code` blocks so long lines scroll inside the code block instead of widening the page.
- Check long headings, long URLs, long inline code, and long file paths for mobile wrapping.
- Treat image placement as part of the prose rhythm: cover image, first in-article image, image-heavy sections, and related reading should all have intentional spacing.
- Do not use inline one-off layout styles when a scoped article CSS rule would make the pattern safer for future articles.

## Final QA

Before handing off a publishable article:

- Confirm issue, branch, and scope are correct.
- Check relative paths for the article depth.
- Check nav active state.
- Check article links and related reading links.
- Check `writing/index.html`, root `index.html` if promoted, and `sitemap.xml`.
- Check that GA4 and favicon links are present.
- Serve locally and complete visual QA before handoff.
- Check at least mobile narrow, tablet/medium, and desktop viewports. Use about 390px, 768-820px, and 1280-1440px as the default viewport set; add about 360px when content includes tables, code blocks, diagrams, or long headings.
- Inspect by element type, not just by page position: article header, cover image, first body content, lists, tables, code blocks, all distinct image patterns, related reading, and mobile navigation.
- Confirm there is no document-level horizontal overflow on mobile.
- Confirm tables and code blocks are readable and contained on mobile.
- Capture screenshots or record precise browser notes for the PR/final handoff.
- If the in-app Browser is unavailable, use a local browser or headless screenshot fallback.
- If visual QA cannot be completed, do not hand off the article as ready. State what could not be checked and the residual risk.
