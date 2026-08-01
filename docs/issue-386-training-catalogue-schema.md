# Issue #386: Training catalogue schema decision

## Public catalogue model

`/training/` publishes one ascending `ItemList` with five `ListItem` entries matching the visible learning journey. Each entry contains a `Course` with the same stable `@id`, canonical URL, name, description, and Suyog Joshi provider reference used by its detail page.

The stable course identifier is the canonical course URL plus `#course`.

## Availability and privacy boundary

- The two launched courses are described as live 14-session courses.
- The three pipeline courses are explicitly described as planned courses.
- No `Offer`, price, dates, `CourseInstance`, `courseMode`, application URL, registration-interest URL, learner ID, cohort ID, or payment link is published in JSON-LD.
- Online delivery remains visible in the page content. Schema.org defines `courseMode` for a `CourseInstance`, so it is omitted until a confirmed delivery instance can be modelled accurately.
- Visible commercial information remains in page content, but structured data does not imply that a course can be purchased immediately.

## Validation

Run `python scripts/validate_training_catalogue_schema.py`.

The check validates JSON syntax, catalogue completeness and order, unique positions, stable IDs, canonical URLs, names, descriptions, provider references, course-page breadcrumbs, and the private-data boundary. It also prevents instance-only or unconfirmed commercial fields such as `courseMode` from being added without a confirmed `CourseInstance`. It runs automatically for relevant Training changes targeting or pushed to `dev` and `main`.
