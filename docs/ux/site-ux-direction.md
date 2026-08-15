# Site UX direction

Status: draft for Product Owner accuracy and taste review under #504.

## Experience statement

The site is a calm, credible working-knowledge hub. It should feel authored by
an experienced engineer and educator: editorial rather than promotional,
structured rather than decorative, and specific rather than grandiose.

## Shared direction

### Visual character

- **Observed:** The public palette is near-monochrome: white, near-black, muted
  grey, pale surfaces, and fine grey borders.
- **Observed:** Playfair Display carries headlines and editorial emphasis;
  Inter carries navigation, labels, body copy, controls, and metadata.
- **Observed:** Large whitespace, bounded content widths, rules, and flat cards
  create hierarchy. Shadows, gradients, rounded decorative panels, and ambient
  illustration are not part of the core language.
- **Derived principle:** Earn attention through typography, composition, and
  content specificity before adding imagery or ornament.
- **Derived principle:** The visual tone is assured and understated—not cold,
  playful, futuristic, or conventionally SaaS-like.

### Information hierarchy

- **Observed:** Pages open with a small contextual label, a clear serif promise,
  concise supporting copy, and only the actions needed at that point.
- **Observed:** Sections are introduced by descriptive headings and short
  orientation copy. Cards expose enough context to make a choice without
  requiring a click.
- **Derived principle:** Help visitors choose among learning, reading, and
  exploring; do not collapse those distinct intents into one generic funnel.
- **Derived principle:** Prefer progressive disclosure and clear sequencing to
  dense feature inventories.

### Components and interaction

- **Observed:** Buttons are rectangular, high-contrast, and restrained. Text
  links use direct labels and often a small arrow.
- **Observed:** Cards are primarily grouping and navigation devices, with border
  and surface changes rather than ornamental effects.
- **Observed:** JavaScript is minimal and progressive. The mobile menu supports
  keyboard Escape and click-outside behavior; forms keep native semantics and
  add accessible validation.
- **Derived principle:** Motion or interaction must clarify state or navigation;
  it is not a substitute for hierarchy.
- **Derived principle:** Preserve recognizable browser behavior, visible focus,
  meaningful labels, and content access without complex client-side state.

### Responsive behavior

- **Observed:** Desktop compositions use columns selectively; mobile layouts
  reflow into readable stacks without horizontal overflow.
- **Observed:** The header becomes a compact menu at narrow widths, while
  typography, borders, and section rhythm continue to carry the identity.
- **Derived principle:** Mobile is a recomposed reading and decision experience,
  not a uniformly shrunken desktop page.
- **Derived principle:** Preserve reading order and decision order when columns
  collapse. Do not rely on desktop position, hover, or colour alone.

### Content voice

- **Observed:** Copy is practical, precise, and grounded in real engineering and
  learning outcomes.
- **Observed:** Labels such as stages, paths, topics, prerequisites, status, and
  publication source help visitors scan without hype.
- **Derived principle:** Claims should be supportable by visible content,
  experience, or working artifacts. Avoid inflated transformation language.

## Deliberate scoped variation: Software Signal Learning

- **Previously decided:** Approved learning routes may load `css/learning.css`.
  Its teal accent, status markers, disclosures, and learner-action components
  are scoped to the learning experience.
- **Previously decided:** Public learning pages remain editorial; private
  learner pages may be more task-oriented. Status must not rely on colour, and
  one dominant learner action appears in the current-status region.
- **Derived principle:** A scoped product identity may add functional emphasis,
  but it should inherit the site's typography, restraint, accessibility, and
  content-first hierarchy.
- **Previously decided:** Home, Writing, article, About, Contact, and Admin do
  not load the learning stylesheet. The teal identity must not become a casual
  site-wide accent.

## Preserve-first invariants

Future work should preserve these unless the issue explicitly proposes and the
Product Owner approves a departure:

1. Editorial, content-led character with restrained visual decoration.
2. Serif/sans role separation and the existing font families.
3. Near-monochrome public palette; scoped learning colour stays scoped.
4. Clear page promise and content hierarchy before secondary navigation.
5. Generous reading space, bounded line lengths, and flat bordered structures.
6. Responsive reading and decision order with no horizontal overflow.
7. Minimal progressive JavaScript and accessible native semantics.
8. Distinct user intents—learn, read, explore, understand, contact—remain clear.

## Classification and change control

The statements labelled **Derived principle** consolidate repeated accepted
patterns; they do not authorize a visual change. Any future **New
recommendation** must be visibly labelled in its UX brief and presented as a
decision, with the current baseline as the comparison point.

New recommendations in #504: **none**.
