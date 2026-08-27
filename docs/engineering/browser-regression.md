# Browser regression safety net

Issue #606 establishes a compact Playwright Chromium suite for the accepted
before state recorded by #604. It complements the repository's static validators
by exercising rendered navigation, responsive menu behavior, contextual journeys,
form validation, and safe mocked submission in a real browser.

## Approach and boundary

The suite uses one pinned development dependency, `@playwright/test` 1.62.1,
with Chromium only. It serves the hand-authored site with Python's static HTTP
server by default. This adds no frontend framework, build system, production
dependency, or runtime code. Tests run serially with deterministic 1440x900 and
390x844 viewports. Screenshots and traces are generated only on failure and are
uploaded by CI for seven days rather than committed.

Static and browser responsibilities remain distinct:

- `python scripts/validate_canonical_urls.py` exhaustively checks local links,
  fragments, referenced assets, canonicals, and route conventions;
- the Playwright inventory test loads every route in the #604 CSV and verifies
  all 66 still return 200 with their accepted production self-canonical;
- browser journey tests activate controls and verify rendered destinations,
  state, focus, validation, and representative console/resource health;
- Senior UX rendered review evaluates composition and visual intent; it is not a
  substitute for functional regression;
- production smoke testing verifies the promoted deployment and remains a human-
  controlled release activity under #611.

## Run locally

Install the pinned test dependency and Chromium once:

```powershell
npm ci
npx playwright install chromium
```

Run the local accepted source through the managed static server:

```powershell
python scripts/validate_canonical_urls.py
npm run test:e2e
```

To use an already deployed approved environment, set `REGRESSION_BASE_URL` to its
origin before running the suite. Never point an unreviewed branch at production.
The valid Contact test intercepts both development and production API hostnames,
so it cannot create a real message. Newsletter automation validates the beehiiv
destination/form contract without creating a subscription. External profile
links are checked by exact URL rather than third-party availability.

## CI

`.github/workflows/validate-browser-regression.yml` runs on pull requests and
pushes targeting `dev` or `main`. It installs pinned Node dependencies and
Chromium, runs the canonical/local-link validator, then executes the browser
suite with one worker and no automatic retries, so a flaky result remains visible
as a failed job. Failure screenshots, HTML reports, and traces are temporary
workflow artifacts.

## #604 interaction coverage

| Contract IDs | Automated proof |
|---|---|
| `NAV-01`-`NAV-02` | Desktop logo and all accepted primary destinations load usable rendered pages. |
| `NAV-03`-`NAV-05` | 390x844 menu opens, closes by Escape and outside activation, restores focus, reopens, and navigates. |
| `HOME-01`-`HOME-04` | Current Training, Writing, starting-point, Consulting, Website Services, Weekly, and Systems actions load their accepted destinations. |
| `CON-01` | Homepage discovery reaches Consulting, then the contextual Contact journey without submission. |
| `WEB-01` | Homepage discovery reaches Website Services, then its contextual Contact journey without submission. |
| `LEARN-01` | Training catalogue reaches Python Foundations course detail. |
| `WEEKLY-01`-`WEEKLY-02` | Weekly page loads and exposes the exact beehiiv loader, form ID, and hosted fallback contract; no subscription is created. |
| `WRITE-01` | Writing landing reaches a rendered internal article. |
| `SYS-01`-`SYS-02` | Systems landing reaches AI Workflow Lab and its invoice-review demo. |
| `FOOT-01`, `EXT-01` | Footer navigation works and LinkedIn, Medium, and GitHub URLs remain exact. |
| `CONTACT-01`-`CONTACT-03` | Form renders; empty and malformed values expose accessible errors without a request; valid payload receives a mocked 202 success. |

The representative console/resource test covers Home, Consulting, Website
Services, Training, Weekly, Contact, Writing, and Systems. Development API reads
are mocked in that check so local cross-origin policy does not create a false
site error; local page/script/style/image failures remain visible.

## Known limitations

- `LEARN-02` depends on backend-authoritative course state and authenticated or
  interest-registration context. Existing focused unit/contract tests retain
  that coverage; this public suite verifies the stable detail path only.
- `WEEKLY-02` stops before third-party form submission and email confirmation.
- `CONTACT-03` verifies the exact browser payload and success behavior with a
  mocked 202. It does not send a production enquiry. `CONTACT-04` and backend
  error mapping remain covered by focused source/unit tests; production smoke
  must verify availability without manufacturing a message.
- `WRITE-02`, `WRITE-03`, `SEARCH-01`, and `SUPPORT-01` retain their existing
  focused contract tests. They are outside this deliberately compact rendered
  journey set unless a later change puts those interactions at risk.
- External service availability, authenticated learner/admin state, payment,
  email delivery, and production backend health are not CI dependencies.

No pre-existing functional defect was found by the accepted before-state run.
The known #604 accessibility, third-party best-practice, and mobile performance
findings remain baseline observations; #606 neither hides nor repairs them.

## Intentional behavior changes in #607-#609

When an approved redesign intentionally changes an interaction:

1. identify the affected #604 interaction ID;
2. record its old accepted behavior;
3. record the Product Owner/UX-approved new behavior;
4. update the interaction contract explicitly; and
5. update this suite only after that approval is recorded.

Never delete a regression because new code behaves differently, weaken an
assertion merely to make CI green, or classify an accidental change as intentional
without Product Owner/UX disposition. `HOME-01` is already marked by #604 as a
future review candidate; its current Training destination remains asserted until
an approved later issue records and implements the replacement.
