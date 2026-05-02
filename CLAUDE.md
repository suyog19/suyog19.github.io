# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Content is hand-authored HTML** — not Markdown, not a CMS. The site has two content sections that follow parallel patterns:

- **Writing** — articles live under `writing/<slug>/index.html`. Adding one means creating the file, then linking to it from `writing/index.html` and `index.html`.
- **Systems** — system detail pages live under `systems/<slug>/index.html`. Adding one means creating the file, then linking to it from `systems/index.html`.

**CSS is split into three files** — load order matters:
- [css/base.css](css/base.css): CSS custom properties (color, typography, spacing tokens), reset, global typography
- [css/components.css](css/components.css): Reusable UI patterns (cards, nav, buttons, tags)
- [css/pages.css](css/pages.css): Page-specific layouts — Writing page (`.wp-*`), Systems page (`.sp-*`, `.system-card`), article/system detail pages, and inline diagram components

All three are loaded in every page's `<head>` in that order.

**JS is minimal and progressive** — [js/script.js](js/script.js) handles mobile nav toggle with keyboard support; [js/contact.js](js/contact.js) handles client-side form validation. No framework, no bundler.

**URL structure mirrors directory structure** — each page is an `index.html` inside a named folder, giving clean URLs (`/writing/`, `/systems/`, `/about/`, `/contact/`).

## Conventions

- Use existing CSS custom properties from [css/base.css](css/base.css) for colors, fonts, and spacing. The one hardcoded exception is the accent red `#b91c1c`, which is not a custom property but is used consistently across components.
- `ul { list-style: none }` is applied globally in [css/base.css](css/base.css). To render a bulleted list inside article or system body content, use `.article-body ul` — the scoped override in [css/pages.css](css/pages.css) restores `list-style: disc` there.
- **Article and system detail pages share the same CSS classes** — system detail pages reuse `.article-page-header`, `.article-body-section`, `.article-body`, `.article-reading-col`, `.article-back-link`, `.article-related`, etc. No separate CSS exists for system detail pages.
- Article/system body template: header section (`.article-page-header`) → body section (`.article-body-section`) → related reading (`.article-related`). All wrapped in `.article-reading-col` for max-width centering.
- Two inline diagram components exist in [css/pages.css](css/pages.css) for use inside article bodies: `.flow-sequence` (horizontal step → step layout) and `.process-flow` (vertical labelled list with arrow bullets). Use these instead of images where possible.
- The contact form at [contact/index.html](contact/index.html) has client-side validation but no backend — form submissions are not sent anywhere.
