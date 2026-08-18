# Issue #392 social-preview audit and UX brief

Status: Gate A direction for implementation.

## User and sharing intent

A person encountering a shared link should understand the destination before opening it: what kind of page it is, its durable title, and whether it belongs to the core editorial site or the scoped Software Signal Learning experience. The preview should feel authored, calm, and specific rather than promotional.

## Inventory decision

| Destination | Current evidence | Treatment |
| --- | --- | --- |
| Home | No social image | Create a core editorial preview. |
| Writing | No social image | Create a core editorial preview. |
| Systems | No social image | Create a core editorial preview. |
| Training | No social image | Create a Software Signal Learning preview. |
| About | No social image | Create a core editorial preview. |
| Four Writing topic hubs | No social images | Create a shared core topic-hub family. |
| AI-Assisted Software Engineering series | Existing `series-cover.png`/WebP artwork, but not a legible 1200×630 title card | Adapt the existing artwork into a 1200×630 preview; preserve the original assets and meaning. |
| Five canonical public course pages | No social images | Create a shared Software Signal Learning course family using durable titles only. |
| AI Teaching Workflows Research | Strong, accurate existing 1729×910 social artwork and metadata | Preserve unchanged; do not claim 1200×630 dimensions. |
| Four current System detail pages | Useful evidence pages, but no existing share artwork and no first-pass need stronger than the Systems index | No custom preview in this pass. Keep honest text metadata. |
| `/search/` | Retrieval utility | No custom preview. |
| Policies, compatibility redirects, private/noindex and operational routes | Utility or protected surfaces | No custom preview. |
| Child demos | Thin supporting evidence beneath parent Systems | No custom preview. |
| Existing Writing articles | Article-owned cover artwork and metadata | Preserve unchanged. |

## Shared visual system

### Core editorial variant

- Warm white and near-black base drawn from the public site.
- Playfair-style serif title with Inter-style sans-serif context and identity.
- Fine rules, quiet grid/registration details, and one restrained muted-red page marker.
- Page-type labels distinguish Site, Writing, Systems, About, Topic Hub, and Series without a new visual identity.
- No stock imagery, AI clichés, glossy product mockups, gradients, or decorative diagrams.

### Software Signal Learning variant

- The same composition, title scale, whitespace, and identity placement as the core variant.
- Teal (`#0f766e` / `#115e59`) replaces the core marker and appears only on Training/course cards.
- Durable course titles and the Software Signal Learning identity only; no application, cohort, schedule, fee, capacity, or availability state.

## Composition contract

All new assets are 1200×630 PNG files. A safe inset of at least 72px protects critical text from common social crops. The composition contains:

1. a small contextual label;
2. a large, short durable title;
3. an optional one-line durable orientation only on major landing pages;
4. a restrained `SJ` and `suyogjoshi.com` or `Software Signal Learning` signature.

Long titles wrap within a bounded title region and reduce through a documented type scale rather than overflowing or becoming tiny. No supporting line duplicates a full hero paragraph.

## Rendered-observable invariants

1. Every title remains legible when the 1200×630 card is viewed at approximately 360×189.
2. Critical text remains inside the 72px safe inset and survives a modest centre crop.
3. Core and Learning cards share the same structure, while teal appears only in Learning previews.
4. Long course and topic titles wrap without collision, clipping, or text below 42px at source size.
5. The adapted series card retains recognisable existing artwork without reducing title contrast.
6. Existing Research and article previews remain byte-for-byte and metadata-compatible.

## Feasibility and implementation decision

Use two restrained generated raster textures as family foundations, then place exact page copy and identity deterministically. This avoids unreliable generated text, keeps all assets consistent, and creates no runtime/build dependency. The generated foundations are visual material only; final PNG composition, sizing, and metadata are committed static artifacts.

Extend the existing image-performance validator narrowly so the approved page set enforces: local crawler-compatible asset, actual/declared 1200×630 dimensions, matching Open Graph and Twitter URLs, meaningful alt metadata, `summary_large_image`, and production-domain absolute URLs. Do not create a second metadata framework.

## Risks and mitigations

- Social platforms may cache earlier metadata: document as expected platform behaviour; repository correctness is verified independently.
- Long titles can dominate small cards: use bounded wrapping and thumbnail review.
- A broad visual sweep could erase useful content-specific artwork: preserve Research, article, and original series assets.
- Course state can change: include no mutable operational or commercial claims.

## Platform verification boundary

Repository metadata and live HTTP responses can be verified deterministically. External LinkedIn/X inspection tools may require authentication and may show cached results; record availability and cache limitations without weakening local metadata checks.
