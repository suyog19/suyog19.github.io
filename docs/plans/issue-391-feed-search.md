# Issue #391 — Writing feed and public-content search

Status: Gate A accepted for implementation

Baseline revision: `37b97f3ef0da1fe70b521862c437abe587f7c76b`

Issue: [#391](https://github.com/suyog19/suyog19.github.io/issues/391)

## UX change brief

**Applicability:** UX brief required. The dedicated search page introduces a
new public discovery journey, interactive states, and a restrained entry point
from Writing. The feed link is a lightweight addition inside that same
discovery context.

### User, goal, and context

- A repeat reader wants notifications when new Writing appears.
- A visitor remembers a title fragment or subject but not whether it was an
  article, hub, System, demo, or course.
- Writing remains the primary editorial browse surface; Systems remains an
  evidence catalogue; Training remains a readiness and pathway experience.

At the baseline, Writing rendered as a calm editorial catalogue with Latest
Writing, reader paths, series, and topic clusters. At 1440×900 and 390×844 it
had one clear H1, eight latest entries, a readable section sequence, the
existing mobile menu, and no document-level horizontal overflow. There was no
feed or retrieval utility.

### Recommendation

Create one durable `/search/` utility page and add one quiet “Search public
content” route plus one “Subscribe to Writing” route near the Writing hero.
Do not add search to the global header. This is strongly recommended within
scope: it gives retrieval a stable home without competing with curated browse
paths or creating another application shell.

No stronger overall recommendation is needed. A global search control or a
combined content catalogue would add prominence and duplication without
evidence of demand.

### Journey and states

1. The search page first explains the narrow retrieval purpose and names the
   public surfaces covered.
2. A native labelled search field accepts title, topic, summary, type, and
   publication terms.
3. Empty state offers orientation rather than an empty results region.
4. Matching results appear as a calm typed list with title, summary, source or
   course state, and destination.
5. No-result and malformed/whitespace-only states route readers back to
   Writing, Systems, and Training.
6. Without JavaScript, the form is absent and the page remains useful through
   explanatory browse links.

### Design invariants

1. Curated Writing, Systems, and Training browsing remains visually primary;
   search reads as a utility, not a new catalogue or global navigation mode.
2. The query field is the centre of gravity on the search page, followed by a
   single scannable result list with explicit type labels.
3. External articles and truthful course states are visible in text, never
   inferred from colour or destination alone.
4. Empty, loading, error, and no-result states always offer a clear next step
   and never leave a blank interface.
5. Keyboard focus, semantic result order, and mobile reading order remain
   clear with no horizontal page overflow.
6. With JavaScript unavailable, the page still explains the utility and links
   to all three curated discovery surfaces.

### Resolved decisions and preservation

- Route: `/search/`, because it is a durable public utility and the clearest
  canonical name for retrieval intent.
- Entry point: Writing hero utility links, not the global header.
- Visual language: existing serif/sans roles, near-monochrome palette, rules,
  flat surfaces, and native controls.
- Preserve Latest Writing, reader paths, series, topic clusters, Systems cards,
  and Training pathway ordering unchanged.
- No new imagery, tracking, personalization, query URLs, or saved query state.

### Feasibility and risks

The existing static HTML/CSS/vanilla-JavaScript architecture supports a small
progressive page. The committed index can load with `fetch`, while the base
page contains no results and remains useful without JavaScript. Native form,
link, heading, list, and status semantics cover the interaction without a
component framework.

Main risks are an oversized index, stale generated artifacts, ambiguous
ranking, exposing a private route, or presenting runtime Training availability
as static truth. Generation and validation therefore use bounded public source
types, deterministic title/topic/summary scoring, a checked-in generated
artifact, and catalogue lifecycle wording rather than live cohort claims.

## Architecture decision

### Decision

Add one standard-library Python generator that derives two committed artifacts:

- `feed.xml`, an RSS 2.0 Writing stream;
- `data/search-index.json`, a compact public discovery index.

The generator reads existing canonical HTML/JSON-LD and the existing public
Training catalogue. External Writing metadata is anchored in its durable topic-
cluster catalogue link, independent of temporary Latest Writing placement; the
link carries only fields that cannot be derived safely offline. The generator
discovers hubs, series, Systems, and demos by their structured page types rather
than a parallel route list. It supports `--check`, so CI
fails when source metadata changes without regenerated artifacts.

The search runtime is a small page-specific vanilla-JavaScript module. It
fetches only the committed local index, normalizes the visitor's query in
memory, and uses transparent deterministic weighting: title matches first,
then topics/type/source, then summary. It never transmits or stores queries.

### Feed policy

- Include all internally hosted `BlogPosting` pages and every approved external
  entry in the durable Writing topic catalogue.
- Internal items use their production canonical URL and `datePublished`.
- External items use their approved Medium destination, visible catalogue date,
  explicit source, and stable URL as GUID. No local canonical is invented.
- Publish title, link, stable GUID, description, author, UTC publication date,
  and category/source metadata. Do not emit modified dates.

### Search inclusion policy

- Article: internal BlogPosting pages plus approved external catalogue entries.
- Topic Hub and Series: eligible CollectionPage routes under their public roots.
- System: TechArticle routes under Systems.
- Demo: CreativeWork and WebApplication child routes under Systems.
- Course: the five canonical course routes from the existing public Training
  catalogue; compatibility aliases and transactional routes are excluded.

The index intentionally excludes admin, learner, apply, payment, interest,
policy/legal, provider, About, Contact, redirects, API data, and article bodies.

### Alternatives rejected

- Hosted or backend search: unnecessary, privacy-invasive, and outside the
  static-site boundary.
- Full-body indexing: materially larger and not needed for initial retrieval.
- Hand-authored second registry: too easy to drift from public content.
- Runtime crawling: unavailable on static hosting and unreliable in browsers.
- Global-header search: disproportionate to the supporting retrieval role.

### Consequences and maintenance

Publishing or changing Writing, topic hubs, series, Systems, demos, or the
public course catalogue requires running:

```powershell
python scripts/generate_public_discovery.py
python scripts/validate_public_discovery.py
```

External Writing is added to its topic cluster with its real destination, date,
topic, publication, and concise discovery summary; it may also appear in the
finite Latest Writing stream. Validation rejects any external Latest item that
lacks durable catalogue metadata. CI invokes generation in check mode, validates
RSS/XML, route coverage, and search privacy/integrity, and exercises representative
queries. This extends the
current validation family and remains compatible with later #387 consolidation.

Residual risk: metadata quality depends on concise public descriptions staying
current. The generated-source check prevents silent artifact drift but cannot
judge editorial wording by itself.

## Gate B rendered evidence

- Reviewed the first coherent search slice locally at 1440×900 and 390×844,
  then checked 360×800, 720×900 (the reflow-equivalent width for a 1440px
  layout at 200%), and 768×900.
- The search page retained one H1 and no document-level horizontal overflow at
  every width. The form and browse cards stack at mobile width; the query input
  and action use the full reading width rather than squeezing into one row.
- Empty, one-result, multi-result, external-article, course-state, no-result,
  and clear states were exercised. “context supply chain” returned the exact
  article; “serverless” returned the Survey/Poll System; “ML” included the
  truthful proposed Machine Learning course; an unknown query preserved the
  three browse recovery routes.
- External results visibly expose Article, publication, and External labels and
  use safe new-tab semantics. Course results expose static lifecycle wording
  without claiming live cohort availability.
- Keyboard traversal shows the established two-pixel focus outline. At mobile
  width, Enter opens the navigation, Escape closes it, `aria-expanded` changes
  correctly, and focus returns to the toggle.
- Writing at 390×844 preserves the existing hero and eight-entry Latest Writing
  stream. The two utility links sit quietly after the hero copy and before
  Latest Writing; they do not enter the global header.
- The static HTML keeps the search form hidden and the curated Writing,
  Systems, and Training links available without JavaScript. The enabled page
  announces loading, ready, empty, result-count, no-result, and fetch-error
  recovery copy through one polite status region.
- Console inspection showed only Chrome-extension message-channel noise already
  observed on unrelated pages; no site-script or resource failure was found.

Gate B result: no Must-fix or Should-fix finding. Preserve the restrained
utility prominence, single result list, explicit source/type/state labels,
mobile stacking, and no-query-URL behavior for Gate D.
