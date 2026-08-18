# Issue #389 contextual-link audit

## Baseline and UX applicability

The audit uses `dev` commit `bc5210fd57427a464ebc67599e55ed660bf9da40`,
including #385 and #533. At audit start, `dev` and production `main` had different
commit histories because production used a squash merge, but their Git trees were
identical (`5dc482f7a3ce33c078752a484ca710acf0471ceb`). No production content was
missing from the implementation baseline.

This is a **lightweight UX note**. The change adds and replaces links only inside
the established `article-related-list` pattern. It introduces no component,
layout, hierarchy, interaction, or second navigation model. Article reading flow,
series navigation, topic-hub composition, Systems presentation, and Training
decision surfaces remain unchanged.

## Audit method

The review covered all top-level Writing article related-reading blocks, all four
topic hubs, the Systems index and four System detail pages, and the five public
course `Related reading and systems` sections. Relationships were judged by the
reader's likely next question, not by shared keywords.

| Classification | Audit result | Decision |
| --- | --- | --- |
| Already strong | Ordered AI-assisted series navigation; review → evidence → human-gate article paths; business rules → documentation/knowledge debt; topic hubs → selected articles and Systems; every course evidence section | Preserve. Do not duplicate these paths in body copy or create another Training model. |
| Useful but one-directional | AI Workflow Lab demonstrates evidence and executable-context ideas but its related reading was generic; representative hub articles had no route back to the broader theme | Add a direct evidence backlink and four deliberately selected article-to-hub continuations. |
| Missing | Work context → business rules; agent constraints → responsibility; Agile pressure → organizational adoption | Add one continuation for each gap inside existing related reading. |
| Stale or weak | AI Dev Orchestrator linked broad AI-foundations explainers; AI Workflow Lab linked a general builder story and LLM architecture; Agile pressure linked an LLM internals explainer | Replace with direct explanations of multi-agent roles, human review gates, executable context, evidence chains, and enterprise adoption. |
| Intentionally absent | Survey Poll has no direct article that explains its implementation decisions; AI-native Learning Platform already supports selected course evidence; most articles do not need a hub link; no new Writing/Systems-to-Training promotion is justified | Leave unchanged to avoid link noise and to keep #390's Systems-content work separate. |

## Implemented relationship changes

### Cornerstone continuations

- Work context → `Business Rules as Context`: moves from why work context matters
  to the specific rules generated work must preserve.
- Agent constraints → `The Human + AI Responsibility Map`: moves from bounding
  agent action to explicit ownership and accountability.
- Agile pressure → `Enterprise AI Adoption Is a Context Problem`: replaces an
  LLM-internals detour with the standards and delivery-system continuation.

### Representative topic-hub routes

Exactly one cornerstone article provides a broader thematic continuation to each
hub:

- `Coding Assistants Are Not Junior Developers` → AI-Assisted Software Engineering;
- `Business Rules as Context` → Engineering Context and Knowledge;
- `The Human + AI Responsibility Map` → AI Agents and Review;
- `AI Is Not Replacing Agile. It Is Stress-Testing It.` → Agile, Process, and Engineering Leadership.

These appear after feedback and any series navigation. They do not displace ordered
progression, and the remaining article corpus intentionally receives no mechanical
hub links.

### Writing and Systems evidence

- AI Dev Orchestrator now points to its builder story, the multi-agent role model,
  and human review gates instead of broad AI-foundations explainers.
- AI Workflow Lab now points to the related System plus writing on executable
  context and evidence chains.
- `Stronger Evidence Chains for AI-Assisted Engineering Changes` links back to AI
  Workflow Lab as working evidence, making that important explanation/evidence
  relationship bidirectional.
- The existing builder-story ↔ AI Dev Orchestrator relationship remains intact.

## Training review

The five current course evidence sections remain focused and relevant:

- Python Foundations and Applied Data Analysis use the beginner explainer plus the
  learning platform System;
- Practical ML uses the AI/ML and ecosystem explainers;
- Generative AI Applications uses the LLM systems explainer plus AI Workflow Lab;
- Engineering Reliable AI Systems uses human review gates plus AI Dev Orchestrator.

No topic hub is more useful than these specific evidence destinations at the
course decision point. No Training links were added to articles or Systems.

## Maintenance decision

The article publishing workflow remains the only ongoing maintenance mechanism.
Its existing related-article, related-System, backlink, best-next-read, and taxonomy
checks cover the gaps found here. This audit is implementation evidence, not a
second backlink database and not a link-count target.

Manual editorial review confirms that every changed link answers a distinct next
question or connects explanation to implementation evidence. The stopping rule is
met: the remaining possible relationships are weaker, duplicative, or belong to
#390 rather than #389.
