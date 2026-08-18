# Issue 533: evergreen Writing topic hubs

## Selection decision

The current Writing taxonomy was reviewed before implementation. Four clusters
have enough depth, coherence, and durable reader value to become standalone
topic hubs.

| Current cluster | Depth and reader value | Decision |
|---|---|---|
| AI Foundations | Three strong introductory articles and a Training bridge, but not yet enough subtopic depth for a materially richer destination. | Keep compact on Writing. |
| AI-Assisted Software Engineering | A nine-part ordered series, several independent essays, and the AI Dev Orchestrator as practical evidence. Readers benefit from thematic routes that are broader than the series sequence. | Promote. |
| Architecture in the AI Era | Two substantial pieces, but not enough existing material for a hub that adds value beyond the compact cluster. | Keep compact on Writing. |
| Engineering Context and Knowledge | Five substantial articles form a coherent path from business rules and documentation to knowledge debt and organizational knowledge flow. AI Workflow Lab provides related practical evidence. | Promote. |
| AI Agents and Review | Eight internal and external pieces cover task allocation, agent constraints, multi-agent coordination, review, failure modes, and orchestration. AI Dev Orchestrator and AI Workflow Lab provide practical evidence. | Promote. |
| Review and Governance | Five substantial pieces, but most of the reader questions overlap the review, risk, and accountability subtopics of AI Agents and Review. A separate hub would create competing, overlapping destinations. | Keep compact; route interested readers to the broader Agents and Review hub. |
| Agile, Process, and Engineering Leadership | Five substantial pieces form a durable leadership path across adoption, Agile pressure, engineering standards, evidence, and career development. | Promote. |
| Systems and Experiments | The existing Systems index already provides the deeper destination and evidence catalogue this cluster would otherwise need. | Keep compact and preserve the Systems bridge. |

The four selected hubs are:

1. `writing/topics/ai-assisted-software-engineering/`
2. `writing/topics/engineering-context-and-knowledge/`
3. `writing/topics/ai-agents-and-review/`
4. `writing/topics/agile-process-and-engineering-leadership/`

This is the smallest set that covers the site's mature bodies of work without
creating thin pages or near-duplicate topic boundaries.

## UX change brief

**Applicability:** UX brief required. The change adds four public discovery
surfaces and a deeper information-architecture layer below the Writing index.

### User and goal

- **Affected user:** a reader who has found one useful essay and wants to
  understand the wider subject without scanning the full catalogue.
- **Goal:** understand what the topic covers, choose a credible starting path,
  then move into deeper articles or practical evidence.

### Existing UX context

- Site direction: `docs/ux/site-ux-direction.md`.
- Writing direction: `docs/ux/pages/writing.md`.
- Preserve the existing Writing overview, Latest Writing stream, reader paths,
  ordered series, compact topic clusters, typography, palette, and flat
  editorial structures.
- The series remains an ordered progression. A topic hub is a thematic map and
  must say so clearly where the two overlap.

### Strategic altitude

- The complete Writing page, AI-Assisted Software Engineering series, Systems
  index, shared public-page patterns, and topic inventory were reviewed.
- The local change does not require a broader redesign. It fills the missing
  layer between compact clusters and individual resources.
- **Best in-scope recommendation:** four restrained, consistently structured
  hubs linked from their existing compact clusters.
- **Stronger overall recommendation:** none. Promoting more clusters now would
  reduce quality and create overlap.
- **Recommendation strength:** strongly recommended.

### Desired outcome and hierarchy

- In the first few seconds, readers understand the topic, why it matters, and
  whether the hub fits their question.
- **Primary:** topic orientation and a short curated starting path.
- **Secondary:** deeper subtopic groups with concise descriptions.
- **Intentionally quiet:** systems evidence, optional adjacent destinations,
  and the route back to the full Writing catalogue.

### Composition and responsive intent

- Desktop uses a bounded editorial hero, a compact orientation grid, a numbered
  starting path, then calm subtopic sections and evidence links.
- Tablet reduces columns without changing semantic or reading order.
- Mobile presents orientation, starting path, deeper exploration, evidence, and
  return navigation in that order.
- External destinations are identified in visible text and accessible names
  before activation.
- No imagery is required: the task is orientation, and typography plus structure
  carries the site's established editorial character more clearly.

### Design invariants

1. The Writing page remains the compact overview; hub links add depth without
   turning clusters into large duplicate previews.
2. Every hub explains the topic before presenting links and makes a useful
   starting path visually distinct from deeper exploration.
3. Series and topic-hub concepts remain visibly and verbally distinct.
4. Internal, external, and Systems destinations are distinguishable before
   activation without relying on colour alone.
5. At desktop, tablet, mobile, narrow mobile, and 200% zoom, the reading order
   remains coherent and the document has no horizontal overflow.

### Open subjective decisions

None. The issue defines the discovery model, and the implementation reuses the
accepted editorial character without introducing a new visual direction.

### Out of scope / preserve

- No changes to Latest Writing, the main series content/order, unrelated reader
  paths, global navigation, homepage promotion, Training presentation, or the
  Systems information architecture.
- No new articles, images, JavaScript, CMS, generator, framework, or search
  service.

### Tech Lead feasibility

- Reuse the existing public header/footer, typography, buttons, link semantics,
  spacing tokens, and series/list patterns through one scoped `.topic-hub-*`
  family in `css/pages.css`.
- Hand-authored HTML is appropriate for four editorially curated pages and keeps
  all links crawlable without JavaScript.
- Each hub will use `CollectionPage` plus an `ItemList` whose items match the
  visible curated resources. Existing Person and WebSite IDs remain stable.
- Canonical depth is `writing/topics/<slug>/`; assets and global navigation use
  `../../../`, while Writing-relative links use `../../`.
- A focused validator/test contract will prevent missing metadata, incorrect
  structured data, unsafe external links, broken hierarchy, and omitted sitemap
  entries.
- No material feasibility trade-off or Product Owner escalation is open.

## Maintenance rule

- When adding an article, consider whether it materially strengthens an existing
  hub. Add it when it becomes a cornerstone, fills a real subtopic gap, or changes
  the best starting path; routine publication does not require hub churn.
- Update a hub when a genuinely important article, System, demo, series, or other
  public resource changes the reader's best route through the subject.
- Promote a compact cluster only when it has multiple substantial pieces, a
  coherent and durable reader question, useful orientation or sequencing, enough
  original explanation for a materially richer page, and a boundary that does
  not materially overlap an existing hub.
- Review stale or overlapping boundaries and merge or retire them rather than
  allowing near-duplicate hubs to accumulate.
- Maintenance remains manual and editorially curated. Automation may validate
  the contract but does not decide taxonomy or placement.
