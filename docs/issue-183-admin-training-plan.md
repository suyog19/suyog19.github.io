# Issue 183: existing admin training extension

The existing hidden `/admin/` OTP/session shell remains the only admin surface.
This change adds a compact Training tab for the two seeded courses and contract-
supported cohort fields, publication, editing, and open/close commands. Messages
and Feedback markup, API contracts, and behavior remain unchanged.

The approved contract has no decision-date or cadence fields; they are not
invented in the browser. The focused backend follow-up for the omitted admin
cohort list is platform PR #450. Application review remains website #184.
