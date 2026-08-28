# Writing publishing and discovery workflow

The normalized ledger in `data/writing-works.json` is the authoritative public
record of logical Article Works. Internal article pages continue to own their
headline, summary, publication date, and canonical URL. The ledger owns stable
Work identity, publication representations, Topic ids, preferred destination,
RSS identity, and curation references.

Do not maintain Latest, Recent, Archive, Search, Topic membership, or RSS by
editing their generated HTML/XML/JSON. Use the ingestion command:

```powershell
python scripts/ingest_article.py --internal-path writing/<slug>/index.html --topic <topic-id>
```

For an external-only Article, provide its live HTTPS URL and metadata. To add an
external republication to an existing logical Work, also pass its stable id:

```powershell
python scripts/ingest_article.py --external-url <url> --work-id <existing-id> `
  --title <title> --summary <summary> --published YYYY-MM-DD `
  --publication <publication> --topic <topic-id>
```

An external publication task is incomplete until ingestion and generation pass.
The command rejects unknown Topics and future-public records, merges a new
representation into one Work, regenerates all static discovery surfaces, and
validates the result. A Work may deliberately have no Topic.

Reader Paths and Topic previews in `data/writing-curation.json` are deliberate,
occasional editorial curation. Routine publication must not change them.

Software Signal Weekly uses `scripts/sync_newsletter_editions.py`. Routine sync
merges Beehiiv RSS metadata into the cumulative last-known-good ledger; missing
RSS entries never delete known editions. Posts API reconciliation is available
with `--reconcile` and `BEEHIIV_API_KEY`. Without API read access, a clean rebuild
can recover only RSS-visible history, so the committed cumulative ledger remains
the durable fallback. The scheduled workflow opens a PR into `dev` and never
bypasses human-controlled production promotion.

That daily workflow also runs `scripts/refresh_writing_chronology.py`, advancing
the catalogue's `asOf` date and moving a Work from Recent to Archive after day
100 without a hand-edited list. Newsletter ingestion is skipped when no RSS URL
is configured, while chronology refresh remains operational.
