# CLAUDE.md

This file provides repository memory for Claude Code and Codex when working in
this repository.

## Shared Agent Contract

Read `AGENTS.md` first.

`AGENTS.md` is the source of truth for repository-wide agent workflow, branch
rules, issue-first development, PR traceability, approval policy, and merge
authority.

This file contains implementation notes for the static site itself. Claude Code
is the primary implementer for most HTML, CSS, JS, and docs changes. Codex may
coordinate, review, QA, and implement small or fallback changes, but both tools
must follow `AGENTS.md`.

Important workflow reminders:

- Do not make changes without a corresponding GitHub issue.
- If no issue exists, create one before editing files.
- Do not commit or push directly to `main` or `dev`.
- Create feature branches from `dev`.
- Open PRs into `dev` and link the issue.
- Agents may merge accepted PRs into `dev`.
- PRs from `dev` to `main` must be merged by a human.

## Project Overview

Personal editorial site for Suyog Joshi (suyogjoshi.com), deployed on GitHub Pages. Covers AI/ML education, software systems, and engineering practice. No build system — pure static HTML, CSS, and vanilla JS.

## Development

No build tools, package manager, or dependencies. To develop locally, open HTML files directly in a browser or serve them with any static file server:

```powershell
# Python
python -m http.server 8080

# Node (if available)
npx serve .
```

No lint, test, or build commands exist.

## Architecture

**Content is hand-authored HTML** — not Markdown, not a CMS. The site has three content sections that follow parallel patterns:

- **Writing** — articles live under `writing/<slug>/index.html`. Adding one means creating the file, then linking to it from `writing/index.html` and `index.html`.
- **Systems** — system detail pages live under `systems/<slug>/index.html`. Adding one means creating the file, then linking to it from `systems/index.html`. Some systems contain nested **demo pages** at `systems/<slug>/<demo>/index.html` (three levels deep); see the demo section below.
- **Research** — standalone landing pages at `research/<slug>/index.html`. There is no `research/index.html` index; each page is self-contained. Adding one only requires creating the file and adding it to `sitemap.xml`.
- **About** — a single page at `about/index.html` with its own CSS class prefix `.ap-*` in [css/pages.css](css/pages.css). No subdirectories.

**CSS is split into three files** — load order matters:
- [css/base.css](css/base.css): CSS custom properties (color, typography, spacing tokens), reset, global typography
- [css/components.css](css/components.css): Reusable UI patterns (cards, nav, buttons, tags)
- [css/pages.css](css/pages.css): Page-specific layouts — Home page (`.hero`, `.pillars`, `.writing`, `.systems`, `.project-card`, `.section-header`, etc.), Writing page (`.wp-*`), Systems page (`.sp-*`, `.system-card`), About page (`.ap-*`), article/system detail pages, and inline diagram components

All three are loaded in every page's `<head>` in that order.

**Fonts** are loaded from Google Fonts via `<link rel="preconnect">` hints in each page's `<head>`. Two families: Playfair Display (weights 400, 600, 700) and Inter (weights 300, 400, 500, 600). Do not add new font families without updating every page's `<head>`.

**JS is minimal and progressive** — [js/script.js](js/script.js) handles mobile nav toggle with keyboard support (Escape closes nav, click-outside closes nav); [js/contact.js](js/contact.js) handles client-side form validation and POSTs to the backend API. Demo pages load their own dedicated scripts ([js/invoice-review-demo.js](js/invoice-review-demo.js), [js/vendor-onboarding-rag-demo.js](js/vendor-onboarding-rag-demo.js)) that fetch pre-authored JSON from [data/demos/](data/demos/) and drive the interactive UI entirely client-side with no external API calls. No framework, no bundler.

**URL structure mirrors directory structure** — each page is an `index.html` inside a named folder, giving clean URLs (`/writing/`, `/systems/`, `/about/`, `/contact/`).

**Relative paths change with directory depth** — CSS, JS, and favicon links use different prefixes depending on where the page lives:
- Root (`index.html`): `css/base.css`, `js/script.js`, `favicon.svg`
- One level deep (`writing/index.html`, `about/index.html`): `../css/base.css`, `../js/script.js`
- Two levels deep (`writing/<slug>/index.html`, `systems/<slug>/index.html`, `research/<slug>/index.html`): `../../css/base.css`, `../../js/script.js`
- Three levels deep (`systems/<slug>/<demo>/index.html`): `../../../css/base.css`, `../../../js/script.js`

**Home page is structured into named sections** — each maps to a CSS class on the `<section>` element: `.hero` (headline + CTAs), `.pillars` (three `.pillar-card` items), `.writing` (featured articles), `.systems` (project previews), `.about` (snapshot), `.contact` (CTA block). The `.eyebrow` class styles small topic labels above headings; `.section-header` / `.section-title` / `.section-subtitle` is the standard section intro pattern; `.section-cta` wraps the "View all" button below a section grid.

**Featured writing grid uses two card variants** — `.writing-grid` contains one `.article-card.article-card--featured` (the large lead card) and one `.article-cards-secondary` column (two `.article-card.article-card--small` stacked). When promoting an article to the home page, use this structure.

**Home systems previews use `.project-card`, not `.system-card`** — `index.html` uses `.project-card` / `.project-title` / `.project-desc` / `.project-meta` for the three home-page system previews. `systems/index.html` uses `.system-card` / `.system-title` / `.system-desc` / `.system-context` / `.system-meta` (linkable `<a>` elements). Do not mix these class names across pages.

**Writing index has two update points** — when adding a new article, update `writing/index.html` in two places: the `.writing-grid` featured section at the top, and the appropriate thematic group inside `.wp-themes`. Also update the homepage `index.html` featured grid if promoting to the front page.

**Detail pages wrap content in `<article>`** — both writing and system detail pages wrap the page header, body, and related reading blocks inside `<article>` (as a direct child of `<main>`).

**Article feedback widget** — every writing article detail page includes a reusable feedback widget after the article body (and any original-source note) and before related reading or series navigation. Use `data-feedback-target-type="ARTICLE"` and `data-feedback-target-id="<article-slug>"`, where the stable target id is the article directory slug. Article series detail pages use `data-feedback-target-type="ARTICLE_SERIES"` and the series slug as `data-feedback-target-id`. Include `js/feedback-widget.js` at the correct relative depth along with `js/script.js`. V1 feedback is anonymous: the widget sends `anonymousId`, never sends `userId`, preserves the future `window.sjFeedbackAuth.getToken()` bearer-token extension point, keeps the comment field hidden until the reader chooses thumbs up, thumbs down, or leave a note, and enforces the 1800-character frontend comment limit. `writing/series/index.html` is a section index and does not receive an `ARTICLE_SERIES` widget unless it becomes a feedback-worthy artifact.

## Conventions

- Use existing CSS custom properties from [css/base.css](css/base.css) for colors, fonts, and spacing. The complete set: `--color-bg` (#fff), `--color-text` (#111), `--color-text-muted` (#6b7280), `--color-border` (#e5e7eb), `--color-surface` (#f8fafc), `--font-serif` (Playfair Display stack), `--font-sans` (Inter stack), `--max-width` (1120px), `--container-px` (2rem), `--section-py` (6rem). The one hardcoded exception is the accent red `#b91c1c`, which is not a custom property but is used consistently across components (arrows, error states, interactive accents).
- Mark the active page in the nav with `aria-current="page"` on the `.nav-link` anchor. The animated underline active state in [css/components.css](css/components.css) targets `.nav-link[aria-current="page"]`.
- `ul { list-style: none }` is applied globally in [css/base.css](css/base.css). To render a bulleted list inside article or system body content, use `.article-body ul` — the scoped override in [css/pages.css](css/pages.css) restores `list-style: disc` there.
- **Article and system detail pages share the same CSS classes** — system detail pages reuse `.article-page-header`, `.article-body-section`, `.article-body`, `.article-reading-col`, `.article-back-link`, `.article-related`, etc. No separate CSS exists for system detail pages.
- Article/system body template: header section (`.article-page-header`) → body section (`.article-body-section`) → related reading (`.article-related`). All wrapped in `.article-reading-col` for max-width centering.
- Two inline diagram components exist in [css/pages.css](css/pages.css) for use inside article bodies: `.flow-sequence` (horizontal step → step layout) and `.process-flow` (vertical labelled list with arrow bullets). Use these instead of images where possible.
- For articles cross-posted from Medium (or elsewhere), add a `.article-original-note` div after `.article-body` (inside `.article-reading-col`) crediting the original source with a link.
- The contact form at [contact/index.html](contact/index.html) validates client-side then POSTs to the backend API. Validation rules: name required, email must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, message 20–5000 chars. The form has a hidden honeypot field (`#website`) to detect spam bots.

## SEO Requirements

Every new page must include the following in `<head>`. The exact ordering within `<head>` is: `<meta charset>` → `<meta viewport>` → `<meta description>` → `<title>` → canonical + OG/Twitter → Google Fonts preconnect → CSS → favicon → GA4. The SEO block below goes between `<title>` and the Google Fonts `<link rel="preconnect">`:

```html
<link rel="canonical" href="https://suyogjoshi.com/PATH/" />
<meta property="og:title" content="PAGE TITLE" />
<meta property="og:description" content="DESCRIPTION" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://suyogjoshi.com/PATH/" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="PAGE TITLE" />
<meta name="twitter:description" content="DESCRIPTION" />
```

**Title format:** `Page Name | Suyog Joshi` — for the home page use the full brand title (`Suyog Joshi | AI Systems, Software Architecture & Real-World Engineering`).

**`og:type` rule:** use `article` for writing and system detail pages; use `website` for all section/index pages (home, writing index, systems index, about, contact).

**Description length:** aim for 140–160 characters. Write for a human reader, not keyword density.

**`og:image` / `twitter:image`:** omit these tags unless a page-specific 1200×630 social image asset exists in the page's directory (e.g., `research/ai-teaching-workflows/ai-assisted-teaching-workflows-research.png`). When an image exists, use both `og:image` and `twitter:image` with the full production URL and upgrade `twitter:card` to `summary_large_image`. Do not point them at the favicon.

**Google Analytics — include on every new page:** add the GA4 snippet just before `</head>`, after the favicon links. Measurement ID is `G-PKL56GJ38H`. Use the correct relative path to the favicon as a guide for depth — the snippet itself has no paths so it's the same regardless of directory depth:

```html
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-PKL56GJ38H"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-PKL56GJ38H');
  </script>
```

**Sitemap — update on every new page:** add the new URL to [sitemap.xml](sitemap.xml) in the same commit as the new page. Priority values by page type: `1.0` home, `0.9` section index pages, `0.8` writing detail pages and research pages, `0.7` system detail pages and demo pages, `0.5` contact/about. Use production URLs only (`https://suyogjoshi.com/...`).

## Contact Form Backend

[js/contact.js](js/contact.js) selects the API base URL at runtime based on hostname:
- `dev.suyogjoshi.com`, `localhost`, or `127.0.0.1` → `https://api-dev.suyogjoshi.com`
- All other hosts → `https://api.suyogjoshi.com`

POST to `/messages` with JSON body:
```json
{ "name": "...", "email": "...", "message": "...", "type": "contact", "source": "contact_page", "website": "" }
```

Expected responses: `202` → success message shown; `400` with `VALIDATION_FAILED` → field-level errors displayed via `aria-invalid` + `aria-describedby`; any other error → fallback message shown.

## Feedback Widget Backend

[js/feedback-widget.js](js/feedback-widget.js) selects the feedback API base URL with the same dev/prod hostname convention as the contact form and posts to `/feedback`. Successful feedback submissions return `201 Created`; the widget also treats other 2xx success statuses as accepted for resilience.

Widget instances are declarative:

```html
<section
  class="feedback-widget"
  data-feedback-widget
  data-feedback-target-type="ARTICLE"
  data-feedback-target-id="stable-article-slug"
  data-feedback-source-label="Article"
  aria-label="Article feedback"
></section>
```

Payload fields are `targetType`, `targetId`, `rating`, optional trimmed `comment`, `sourcePageUrl`, `anonymousId`, and honeypot `website: ""`. Supported V1 article ratings are `THUMBS_UP`, `THUMBS_DOWN`, and `NONE`. Anonymous submissions generate and reuse `sj_feedback_anonymous_id` in browser local storage. Do not send `userId` from the frontend; authenticated feedback should later be added only by providing `Authorization: Bearer <token>` through `window.sjFeedbackAuth.getToken()`.

## Deployment

Branch workflow:

- `dev` is the integration branch for accepted site changes.
- `main` is the production branch.
- Feature branches must be created from `dev`.
- PRs should target `dev` first.
- Only a human should merge the promotion PR from `dev` to `main`.

Push to `main` triggers [.github/workflows/deploy-prod.yml](.github/workflows/deploy-prod.yml), which uploads the repo root (no build step) to GitHub Pages. The live domain is `suyogjoshi.com` (set via [CNAME](CNAME)). There is no staging CI — changes go straight to production on merge.
