# Document Ingestion Comparator UI Plan

Frontend issues: #38, #39
Backend parent epic: suyog19/suyogjoshi-platform#339

## Route And Entry Point

- Public route: `/systems/ai-workflow-lab/ingestion-comparator/`.
- Entry point: AI Workflow Lab system page, alongside the existing invoice
  review, process knowledge, and Knowledge Markdown demos.
- Sitemap priority: `0.7`, matching other AI Workflow Lab demos.

## Primary States

- Initial: supported formats, 10 MB limit, parser selection, optional
  AI-generated comparison, privacy and retention notes.
- Uploading: create job, upload to presigned URL, complete upload.
- Processing: poll job status, show parser run statuses and expiry.
- Result ready: parser cards, Markdown preview, raw Markdown, side-by-side
  comparison, copy/open/download controls, LLM comparison when present.
- Partial success: successful parser outputs remain visible while failed/skipped
  parser runs show their specific error or warning.
- Not ready: continue polling while API returns `INGESTION_COMPARATOR_RESULT_NOT_READY`.
- Expired: show `UPLOAD_EXPIRED` or `JOB_EXPIRED` guidance.
- Error: show validation/API/network messages without exposing presigned URLs.

## API Dependencies

- `POST /ai-workflow/ingestion-comparator/jobs`
- `POST /ai-workflow/ingestion-comparator/jobs/{jobId}/complete-upload`
- `GET /ai-workflow/ingestion-comparator/jobs/{jobId}`
- `GET /ai-workflow/ingestion-comparator/jobs/{jobId}/result`

Runtime API base selection follows the site contact form pattern:

- `localhost`, `127.0.0.1`, and `dev.suyogjoshi.com` use
  `https://api-dev.suyogjoshi.com`.
- production hostnames use `https://api.suyogjoshi.com`.
- `?apiBase=...` can override for local QA.

## Public Copy Requirements

- Documents are uploaded to the backend for temporary conversion.
- Supported formats are PDF, DOCX, and HTML.
- Maximum file size is 10 MB.
- Upload URLs expire after 15 minutes.
- Comparator results expire logically after 24 hours.
- Parser Markdown and AI comparison are document-derived and should be treated
  as sensitive.
- LLM comparison must be labeled as AI-generated analysis and advisory.

## Release Notes

The UI is production-facing but depends on backend deployment and CORS behavior
for presigned S3 Markdown fetches. If direct Markdown fetch is blocked, the UI
still provides the short-lived artifact link returned by the backend.
