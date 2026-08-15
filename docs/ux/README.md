# Frontend UX direction

Status: draft for Product Owner accuracy and taste review under #504.

These documents describe the experience that already exists. They are a
preservation baseline for future work, not a redesign brief or a frozen set of
pixel specifications.

## How to use this baseline

1. Read [site-ux-direction.md](site-ux-direction.md) for the shared visual and
   interaction language.
2. Read the relevant file in [pages/](pages/) for the page-family hierarchy,
   behavior, and invariants.
3. In a UX change brief, identify what the change preserves and call out any
   intentional departure. Do not treat an undocumented variation as permission
   to restyle the site.
4. Resolve conflicts in this order: explicit Product Owner direction for the
   current issue, accepted issue-specific direction, this baseline, then the
   currently rendered implementation.

For a user-visible change, classify its UX impact and prepare the smallest
appropriate intent artifact using
[ux-change-brief.md](ux-change-brief.md). The brief supplements the linked issue
and does not replace its acceptance criteria.

Material work is evaluated from the browser evidence and bounded iteration loop
in [rendered-review.md](rendered-review.md), not from source code or acceptance
criteria alone.

## Evidence labels

- **Observed** — present in the rendered dev site or current implementation.
- **Previously decided** — recorded in an accepted project document or issue.
- **Derived principle** — a conservative rule inferred from repeated accepted
  patterns. It requires Product Owner confirmation in #504.
- **New recommendation** — a proposed change to the direction. None are part of
  this baseline.

## Page-family references

- [Home](pages/home.md)
- [Training](pages/training.md)
- [Writing](pages/writing.md)
- [Systems](pages/systems.md)
- [About](pages/about.md)
- [Contact](pages/contact.md)
- [Article detail](pages/article-detail.md)
- [System detail](pages/system-detail.md)
- [Course detail](pages/course-detail.md)

## Review scope

The baseline was checked against the current dev render at desktop (about
1440px wide) and mobile (about 390px wide), the shared CSS and JavaScript, and
accepted implementation notes. Representative detail checks include a writing
article, a system, a launched course, and a pipeline course.

Product Owner review should answer two questions before this becomes canonical:

1. Does this accurately describe the site you intend to preserve?
2. Are any derived principles inconsistent with your taste or intended future
   direction?

There are no new visual recommendations to approve in #504.
