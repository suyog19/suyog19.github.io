# Issue 181: My Learning summary

Dependencies are implemented in stacked PRs: learner shell #196, backend summary
platform #449, and communication status platform #448. This change consumes only
`GET /me/learning-summary`, renders backend-owned learner-safe actions, shows the
purpose-limited profile/acknowledgement summary, and keeps delivery failure
separate from application truth.

No raw entity joins, payment controls, materials, recordings, or Gate 2–4 state
are implemented. Merge follows the parent dependency PRs.
