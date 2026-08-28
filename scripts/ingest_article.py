"""Ingest one internal or external Article publication into the Work ledger.

This is the supported zero-list-maintenance publishing entry point. It updates
stable discovery state and regenerates every derived public surface.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).parent))
import generate_public_discovery as discovery


ROOT = Path(__file__).parents[1]


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest an Article publication and regenerate discovery")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--internal-path", help="Article index.html relative to the repository root")
    source.add_argument("--external-url")
    parser.add_argument("--work-id", help="Stable Work id; required to add a representation to an existing Work")
    parser.add_argument("--title")
    parser.add_argument("--summary")
    parser.add_argument("--published")
    parser.add_argument("--publication")
    parser.add_argument("--topic", action="append", default=[])
    args = parser.parse_args()

    catalogue = json.loads(discovery.WORKS_PATH.read_text(encoding="utf-8"))
    curation = json.loads(discovery.CURATION_PATH.read_text(encoding="utf-8"))
    valid_topics = {item["id"] for item in curation["topics"]}
    unknown = set(args.topic) - valid_topics
    if unknown:
        raise SystemExit(f"Unknown Topic ids: {sorted(unknown)}")

    if args.internal_path:
        relative = Path(args.internal_path).as_posix()
        page, nodes = discovery.parse_page(relative)
        posts = [node for node in nodes if node.get("@type") == "BlogPosting"]
        if len(posts) != 1:
            raise SystemExit("Internal article must contain exactly one BlogPosting")
        post = posts[0]
        work_id = args.work_id or Path(relative).parent.name
        title, summary, published = str(post["headline"]), str(post["description"]), str(post["datePublished"])
        url, publication, external = page.canonical, "suyogjoshi.com", False
        external_metadata = None
        internal_path = relative
    else:
        required = {"title": args.title, "summary": args.summary, "published": args.published, "publication": args.publication}
        missing = [name for name, value in required.items() if not value]
        if missing:
            raise SystemExit(f"External ingestion requires: {', '.join(missing)}")
        work_id = args.work_id or slug(str(args.title))
        title, summary, published = str(args.title), str(args.summary), str(args.published)
        url, publication, external = str(args.external_url), str(args.publication), True
        external_metadata = {"title": title, "summary": summary}
        internal_path = None
    if urlparse(url).scheme != "https":
        raise SystemExit("Publication URL must use HTTPS")
    if date.fromisoformat(published) > date.fromisoformat(catalogue["asOf"]):
        raise SystemExit("A public publication cannot be future-dated relative to catalogue asOf")

    work = next((item for item in catalogue["works"] if item["id"] == work_id), None)
    if work is None:
        publication_id = f"{'external' if external else 'local'}:{slug(urlparse(url).path)}"
        work = {
            "id": work_id, "internalPath": internal_path, "externalMetadata": external_metadata,
            "topicIds": sorted(set(args.topic)), "feedGuid": url,
            "preferredPublicationId": publication_id, "cover": None, "publications": [],
        }
        catalogue["works"].append(work)
    else:
        publication_id = f"{'external' if external else 'local'}:{slug(urlparse(url).path)}"
        if internal_path:
            work["internalPath"] = internal_path
            work["externalMetadata"] = None
        work["topicIds"] = sorted(set(work.get("topicIds", [])) | set(args.topic))
    representation = {"id": publication_id, "url": url, "published": published, "source": publication, "external": external, "status": "public"}
    existing = next((item for item in work["publications"] if item["id"] == publication_id), None)
    if existing:
        existing.update(representation)
    else:
        work["publications"].append(representation)
    if (published, publication_id) >= max((item["published"], item["id"]) for item in work["publications"]):
        work["preferredPublicationId"] = publication_id
    catalogue["works"].sort(key=lambda item: item["id"])
    original = discovery.WORKS_PATH.read_text(encoding="utf-8")
    discovery.WORKS_PATH.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    try:
        subprocess.run([sys.executable, "scripts/generate_public_discovery.py"], cwd=ROOT, check=True)
        subprocess.run([sys.executable, "scripts/generate_sitemap.py"], cwd=ROOT, check=True)
        subprocess.run([sys.executable, "scripts/validate_public_discovery.py"], cwd=ROOT, check=True)
    except BaseException:
        discovery.WORKS_PATH.write_text(original, encoding="utf-8")
        subprocess.run([sys.executable, "scripts/generate_public_discovery.py"], cwd=ROOT, check=True)
        subprocess.run([sys.executable, "scripts/generate_sitemap.py"], cwd=ROOT, check=True)
        raise
    print(f"Ingested {publication_id} into Article Work {work_id}; all discovery surfaces regenerated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
