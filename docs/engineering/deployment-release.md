# Deployment and release context

Production is a no-build GitHub Pages deployment of the repository root.
`.github/workflows/deploy-prod.yml` runs on pushes to `main`, configures Pages,
uploads the root, and deploys it to the `github-pages` environment. The production
domain is `suyogjoshi.com`, configured by `CNAME`.

Development hosting may use Cloudflare Pages, whose explicit `index.html`
redirect behavior differs from GitHub Pages; `docs/canonical-url-policy.md` is the
authoritative URL policy. Do not change hosts, `CNAME`, Pages settings, deployment
workflow, environment protection, GA4 measurement ID, or the human-controlled
`dev` to `main` promotion without Product Owner approval.

External availability monitoring and incident boundaries are documented in
`docs/platform-monitoring.md`. Backend readiness semantics remain owned by
`suyog19/suyogjoshi-platform`. Privacy deletion and retention operations are in
`docs/privacy-retention-operations.md` and require the documented human approvals.

Local serving, when browser verification is useful:

```powershell
python -m http.server 8080
```

or `npx serve .` when Node tooling is available. These are review aids, not a
production build step.
