# Contact page UX direction

- **Observed:** Contact is a focused, low-friction form with clear expectations,
  a small number of fields, and an alternative way to connect.
- **Previously decided:** Name is required, email is validated, message length is
  20–5000 characters, and the hidden honeypot and backend payload contract must
  be preserved.
- **Observed:** Validation uses field-level messages and accessible state; result
  feedback is communicated without navigating away.
- **Derived principle:** Trust, clarity, and recovery matter more than decorative
  persuasion on this page.

## Invariants

1. Labels, requirements, and submission outcome are unambiguous.
2. Errors identify the field and how to recover.
3. Keyboard, focus, and assistive-technology behavior are preserved.
4. Spam protection and API behavior remain intact.
5. The page does not request unnecessary personal information.
