# Software Signal course-hub handoff

Status: frontend handoff contract for #229; no course hub is implemented here.

## Eligibility and link contract

My Learning may show `Open your course area` only when a current learner-safe response explicitly reports active enrolment and course-hub eligibility. The destination must be a local protected route of the form `/my-learning/<bounded-reference>/`; a guessed, stale, unauthorised or unavailable route returns to My Learning with a plain explanation. My Learning never links directly to Teams, OneDrive, GitHub, recordings or another provider.

The bounded reference must match `^[A-Za-z0-9_-]{1,128}$`. A current refresh removes the link immediately when eligibility is revoked. Protected hub responses and pages use `no-store` and `noindex, nofollow`.

## Interim states

- Activation pending: no payment or course-area action; state that no further payment is required.
- Active, no availability date: explain that joining details and the course area will appear in My Learning and be announced by email.
- Active, approved date: show that backend-provided date in the learner timezone.
- Access expectation changed: keep enrolment active as the primary truth and show the supplied learner-safe update.
- Joining email failed: show a secondary delivery notice; do not replace active/access truth.
- Not active: never show a course-area or provider action.

Support uses the `learning-course-access` context and warns learners not to make another payment or paste private access/payment links. A manual-delivery announcement appears only when supplied through an authorised learner-safe contract and operationally approved.

## Future hub visual contract

The future #178 route reuses `css/learning.css`, the Software Signal Learning identifier, compact learner header, status marker/card, details disclosure, support grouping and Back to My Learning pattern. Sessions, resources, announcements and provider links remain #178 scope.
