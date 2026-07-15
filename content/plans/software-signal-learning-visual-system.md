# Software Signal Learning visual system

Status: implemented for epic #222. Owner: #224.

## Boundary

`css/learning.css` is loaded only by approved learning routes. Every selector is rooted in `.software-signal-learning`, `.training-page`, or another explicit learning wrapper. It adds no global tokens or generic component changes.

## Identity and components

- Identifier: `Software Signal Learning`.
- Accent: `#0f766e`; strong accent: `#115e59`; soft surface: `#f0fdfa`.
- `.learning-eyebrow`: common page identifier.
- `.btn-learning`: dominant learner action.
- `.learning-status-card` and `.learning-status-marker`: current truth and next action.
- `.learning-details`: native disclosure for secondary references, policy and financial detail.
- `.learning-deadline`: visible deadline or expected-update line.
- `.learning-support-guidance`: reason-specific recovery guidance.

Public pages remain editorial. Private pages use the same identity with a more task-oriented status card. Status never relies on colour. Focus uses a 3px teal outline. At narrow widths actions stack and long learner email text wraps.

## Usage rules

One primary `.btn-learning` is allowed in the current-status region. Critical deadlines, payment warnings and next actions stay outside disclosures. References, historical amounts, policy versions and communication detail belong inside `View details`. No internal gate or release terminology may be learner visible.

## Regression boundary

Home, Writing, article, About, Contact and Admin do not load `learning.css`; their typography, header, buttons and spacing therefore remain outside this layer.
