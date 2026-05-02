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

**Content is hand-authored HTML** — not Markdown, not a CMS. Adding a new article means creating a new subdirectory under `writing/` with an `index.html` file, then linking to it from `writing/index.html` and `index.html`.

**CSS is split into three files** — load order matters:
- [css/base.css](css/base.css): CSS custom properties (color, typography, spacing tokens), reset, global typography
- [css/components.css](css/components.css): Reusable UI patterns (cards, nav, buttons, tags)
- [css/pages.css](css/pages.css): Page-specific layouts and overrides

All three are loaded in every page's `<head>` in that order.

**JS is minimal and progressive** — [js/script.js](js/script.js) handles mobile nav toggle with keyboard support; [js/contact.js](js/contact.js) handles client-side form validation. No framework, no bundler.

**URL structure mirrors directory structure** — each page is an `index.html` inside a named folder, giving clean URLs (`/writing/`, `/about/`, `/contact/`).

## Conventions

- Follow existing semantic HTML structure and heading hierarchy in each page.
- Use existing CSS custom properties from [css/base.css](css/base.css) for colors, fonts, and spacing — don't introduce new hardcoded values.
- Article pages follow the same template: metadata block, article body, related reading section, back-to-writing nav link.
- The contact form at [contact/index.html](contact/index.html) has client-side validation but no backend — form submissions are not currently sent anywhere.
