# Frontend architecture and implementation conventions

## Static-site boundaries

The repository is hand-authored HTML, CSS, and minimal progressive vanilla
JavaScript. It has no build system, package manager, CMS, framework, or bundler.
Do not add dependencies, build tooling, frameworks, analytics products, or font
families without Product Owner approval.

The public sections follow directory URLs:

- writing articles: `writing/<slug>/index.html`;
- article series: `writing/series/<slug>/index.html`;
- systems: `systems/<slug>/index.html`, with demos one directory deeper;
- research: `research/<slug>/index.html` without a section index;
- About and Contact: one-level `index.html` pages.

Content additions must update every applicable section/home index and
`sitemap.xml`. Writing index additions normally update both its featured grid and
the appropriate thematic group. Detail pages wrap header, body, feedback when
applicable, and related navigation in an `<article>`.

## CSS and page patterns

Every page loads `css/base.css`, `css/components.css`, then `css/pages.css`, in
that order. Reuse their custom properties and established page classes. Do not
create a second design system.

- `base.css` owns reset, typography, tokens, and global rules.
- `components.css` owns shared navigation, buttons, tags, and cards.
- `pages.css` owns page-family layouts and inline diagrams.
- Google Fonts are Playfair Display and Inter; retain the existing preconnect and
  loading pattern.
- Article and system detail pages share the `.article-*` body patterns.
- Home system previews use `.project-card`; the Systems index uses `.system-card`.
- The home writing grid uses one featured card and a secondary-card column.
- Use `.flow-sequence` and `.process-flow` for suitable inline diagrams.

The global list reset removes bullets. Article-body lists rely on the scoped
`.article-body ul` restoration. The established accent red is `#b91c1c`; other
colors, typography, spacing, widths, and surfaces come from the existing tokens.

## Relative paths and JavaScript

Asset prefixes must match page depth: none at root, `../` one level deep, `../../`
two levels deep, and `../../../` three levels deep. Check CSS, JavaScript, favicon,
images, and internal links at the page's real directory depth.

`js/script.js` owns the progressive mobile navigation, including Escape and
click-outside behavior. Page-specific demo scripts read pre-authored JSON under
`data/demos/` and do not call external APIs. Preserve native semantics, keyboard
behavior, and useful content without complex client state.

## Feedback widget

Writing article detail pages place the reusable widget after article body/original
source content and before related or series navigation. Use target type `ARTICLE`
and the stable article directory slug. Article-series detail pages use
`ARTICLE_SERIES` and the stable series slug. The `writing/series/index.html`
section index does not receive a widget unless an issue explicitly makes it a
feedback target.

Load `js/feedback-widget.js` at the correct depth. Preserve the anonymous V1
contract: `targetType`, `targetId`, `rating`, optional trimmed `comment`,
`sourcePageUrl`, `anonymousId`, and empty honeypot `website`. Do not send `userId`.
Keep the `window.sjFeedbackAuth.getToken()` bearer-token extension point, hidden
initial comment field, existing CTA/placeholder guidance, 1800-character limit,
and accepted ratings `THUMBS_UP`, `THUMBS_DOWN`, and `NONE`. The widget posts to
`/feedback`, reuses the stable `sj_feedback_anonymous_id` browser-storage key,
expects `201 Created`, and treats other 2xx responses as accepted for resilience.

## Contact form

`js/contact.js` validates required name, a conventional email format, and a
20-5000 character message, while retaining the hidden `website` honeypot. It posts
to `/messages` with `name`, `email`, `message`, `type: contact`, `source:
contact_page`, and empty `website`. Preserve `202` success handling, field-level
`VALIDATION_FAILED` accessibility behavior, and the general fallback.

Both client integrations select `https://api-dev.suyogjoshi.com` for
`dev.suyogjoshi.com`, localhost, and `127.0.0.1`; production hosts use
`https://api.suyogjoshi.com`. Endpoint and payload changes require explicit
Product Owner approval and coordination with the platform repository.

## SEO and public URL rules

Use directory-style URLs, never explicit `index.html`, following
`docs/canonical-url-policy.md`. New pages include description, title, canonical,
Open Graph/Twitter metadata, existing font loading, CSS, favicon, and the existing
GA4 snippet in the established head order. Titles normally use `Page Name | Suyog
Joshi`; `og:type` is `article` for writing/system detail and `website` for indexes.
Aim for a human-readable 140-160 character description.

Only add `og:image` and `twitter:image` when a page-specific 1200x630 social image
exists; then use production URLs and `summary_large_image`. Every public new page
is added to `sitemap.xml` with the existing page-type priority convention.
