# Issue 605 delivery record

The implementation-ready target is
[`docs/ux/software-signal-target.md`](../ux/software-signal-target.md).

## Traceability

- Parent epic: #603
- Dependency: #604, merged via PR #612
- UX applicability: full UX brief required
- Change classification: Standard; architecture, information architecture,
  public contract, and user journey
- Current scope: direction and approval only; no rendered redesign

## Gate status

- Gate A UX context: complete with all Product Owner dispositions recorded
- Senior UX strategic review: complete and approved, with no Must-fix or
  Should-fix findings
- Tech Lead/architecture feasibility: accepted in target document; exact-revision
  architecture evidence pending final commit
- Product Owner approval: brand relationship, revised navigation, homepage
  hierarchy, colour direction, and `/framework/` + `/research/` routes approved;
  five-movement scaffold withdrawn as canonical public architecture
- Canonical strategy consistency: reviewed against
  `software-signal/strategy/software-signal-reliable-engineering-framework.md`,
  `core-thesis.md`, `principles.md`, `vision.md`, `audience.md`, and `taxonomy.md`.
  The five movements are a new lifecycle interpretation, not a faithful
  presentation of the eight-branch Framework.
- Approved Framework direction: present the canonical North Star, eight branches,
  cross-cutting Security, Methods of Investigation, and evidence-feedback loop;
  retain the five movements only as an optional future application pathway
- Approval provenance: Product Owner Suyog Joshi, 2026-08-27,
  https://github.com/suyog19/suyog19.github.io/issues/605#issuecomment-5433352779
- Gates B-D: not applicable until rendered implementation in #607-#609

## Completion boundary

Do not merge or close #605 until:

1. validation and exact-revision architecture/QA/review evidence pass;
2. the PR into `dev` is green and accepted.
