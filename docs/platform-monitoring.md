# Platform Monitoring Strategy

## Purpose

The production website and backend are monitored externally using Better Stack. The strategy is deliberately lightweight and separates frontend availability from backend service readiness.

Better Stack is the recurring uptime detector and alerting system. Public platform status is available at `https://status.suyogjoshi.com`, which is CNAME-routed to the Better Stack status page.

## Production monitors

Better Stack monitors six production targets:

| Component | Production target | Purpose |
| --- | --- | --- |
| Frontend | `https://suyogjoshi.com/` | Confirms the public website is externally reachable. |
| Messages backend | `https://api.suyogjoshi.com/health/ready` | Confirms Messages operational readiness. |
| Identity backend | `https://api.suyogjoshi.com/identity/health/ready` | Confirms Identity operational readiness. |
| Feedback backend | `https://api.suyogjoshi.com/feedback/health/ready` | Confirms Feedback operational readiness. |
| AI Workflow backend | `https://api.suyogjoshi.com/ai-workflow/health/ready` | Confirms AI Workflow operational readiness. |
| Training backend | `https://api.suyogjoshi.com/training/health/ready` | Confirms Training operational readiness. |

The monitors use HTTP `GET` and run at the interval configured in Better Stack.

## Frontend responsibility

The frontend monitor exists independently of backend monitoring. Healthy APIs do not prove that the website itself is available: DNS, GitHub Pages/static hosting, deployment, or frontend delivery can fail independently.

The frontend monitor therefore checks the public production URL directly from outside the platform.

The current strategy is availability-oriented rather than a browser-based synthetic test. A successful frontend monitor proves that the monitored public page is reachable; it does not prove that every interactive user journey works end-to-end.

## Backend responsibility

Backend health semantics are owned by `suyog19/suyogjoshi-platform`.

Each backend service exposes:

- a legacy health endpoint retained for backward compatibility;
- a `/health/live` endpoint for shallow liveness;
- a `/health/ready` endpoint for meaningful operational readiness.

Better Stack monitors readiness because a service can be alive while a critical dependency is unavailable. Readiness probes are designed to be cheap, bounded, read-only, and safe for frequent monitoring.

The backend repository's `docs/operations/platform-monitoring.md` is the canonical operational reference for readiness semantics, backend incident diagnosis, and deployment smoke verification.

## Status page

Public service status is exposed at:

`https://status.suyogjoshi.com`

DNS uses CNAME-based routing to the Better Stack status page. Better Stack owns the monitored component state and operational alerts; this frontend repository does not implement a separate status application.

The status surface must not expose secrets, internal AWS identifiers, stack traces, or sensitive diagnostic information.

## Monitoring boundaries

This repository does not implement:

- a client-side health aggregator;
- a static `platform-health.json` snapshot;
- JavaScript that polls backend health for uptime detection;
- a custom status-page application;
- ChatGPT scheduled uptime checks.

Keeping monitoring external avoids coupling availability detection to the same frontend that is being monitored.

## Incident triage

When the frontend monitor reports a failure:

1. Verify `https://suyogjoshi.com/` independently.
2. Check whether backend readiness monitors remain healthy.
3. If the backend is healthy, focus investigation on frontend DNS, hosting, deployment, and static-site delivery.
4. Review the latest frontend deployment and repository changes.
5. After recovery, confirm Better Stack reports the frontend monitor healthy and `https://status.suyogjoshi.com` reflects recovery.

If one of the backend readiness monitors fails while the frontend remains reachable, follow the backend monitoring runbook rather than treating it as a frontend deployment problem.

## Change discipline

If the production domain, hosting model, or critical public entry point changes, update the Better Stack frontend monitor and this document together. Backend readiness definitions and health-route changes belong in the backend repository.
