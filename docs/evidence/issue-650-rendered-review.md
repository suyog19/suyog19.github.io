# Issue 650 rendered review

## Evidence index

- Iteration: 1 (converged)
- Target: working tree before implementation commit
- Capture method: controlled Chrome render against `http://127.0.0.1:8080/`
- Viewports: 1440×900 and 390×844
- Direction: `docs/ux/site-ux-direction.md`, `docs/ux/software-signal-target.md`, and `docs/plans/issue-650-petrol-teal.md`

Reviewed Home, Framework, Research, Consulting, Learning, Website Services,
Writing, Systems, About, Newsletter, Support, Contact validation, Digital Card,
one article detail, and one System detail. Representative screenshots were
captured in-session for Home, Framework, Learning, and Contact error states;
routine binaries were not committed.

## Senior UX rendered review

### Must fix

- None.

### Should fix

- None.

### Optional

- Existing Learning subnavigation retains its deliberate horizontally scrollable
  narrow-screen treatment. It is not introduced by this migration and remains
  usable with visible labels.

### What works / preserve

- Petrol Teal is calm and technical without making the site feel product-led;
  the white, black, grey, typography, spacing, and rules remain dominant.
- Home's accented headline, SS mark, primary CTA, and quiet vertical rules now
  feel related without oversaturating the first viewport.
- Framework's pale wash reads as a restrained explanatory surface; branch labels
  and key rules remain clear at desktop and mobile sizes.
- Learning resolves `--learning-accent` to the same `#1f5a5a` and its soft role to
  `#f1f6f5`; no separate Learning identity remains.
- Contact invalid fields retain explicit messages, `aria-invalid`, and semantic
  red (`rgb(185, 28, 28)`), clearly distinct from the teal Send action.
- Keyboard focus renders as a 3px Petrol Teal outline; selected/current meaning
  remains represented by labels, borders, or ARIA state rather than colour alone.
- All audited page families and representative details had no document-level
  horizontal overflow at 1440px; Home and Learning also passed at 390px.

### Result

UX-ready for formal Gate D acceptance.

**Recommendation strength:** Strongly recommended.

**Broader UX recommendation:** None.

**Known evidence note:** Chrome emitted extension message-channel errors on a few
local navigations; they were not site-attributed. The Playwright regression suite
separately passed all 13 scenarios with no site asset/request failures.
