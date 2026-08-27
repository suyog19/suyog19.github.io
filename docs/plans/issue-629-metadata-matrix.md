# Issue 629 metadata naming matrix

## Classification

- Change type: public metadata and structured-data consistency.
- User impact: browser tabs, search results, link previews, and assistive descriptions of social-preview images.
- UX applicability: UX brief not required under `docs/ux/engineering-process.md` because no visible page layout, interaction, or content changes are introduced.
- Process note: the `engineering-process` executable was unavailable, so the checked-in frontend profile, resolved policy, and repository operating documents were applied directly.

## Naming matrix

| Page family | Title model | Schema relationship |
| --- | --- | --- |
| Home | Software Signal by Suyog Joshi + page promise | `WebSite` published by stable `Person` |
| Consulting | Subject + Software Signal by Suyog Joshi | `Service` provided by stable `Person`, part of `WebSite` |
| Learning | Professional Learning + Software Signal by Suyog Joshi | Existing `CollectionPage`, `Service`, `Brand`, and `Person` graph |
| Website Services | Subject + Software Signal by Suyog Joshi | `Service` provided by stable `Person`, part of `WebSite` |
| Framework, Research, Writing, Systems | Descriptive subject + Software Signal by Suyog Joshi | Page/collection is part of `WebSite` and created by stable `Person` |
| Newsletter | Software Signal Weekly + Suyog Joshi | Existing page authored by stable `Person` |
| About | Suyog Joshi first | Existing `ProfilePage` with stable `Person` |
| Detail pages | Specific content title + Suyog Joshi | Existing article/system author and publisher relationships; no brand-heavy rewrite |

Titles are capped at 70 characters in the identity validator. Existing useful descriptions, canonical routes, article titles, and detail-page intent remain unchanged.
