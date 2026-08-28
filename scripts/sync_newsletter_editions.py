"""Merge Beehiiv edition metadata into the cumulative last-known-good ledger.

Routine sync is RSS-first. ``--reconcile`` uses the paginated Beehiiv Posts API
when ``BEEHIIV_API_KEY`` is available. Source failure never writes the ledger.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import urllib.request
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET


ROOT = Path(__file__).parents[1]
LEDGER = ROOT / "data" / "newsletter-editions.json"


def clean(value: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value or "")).split())


def iso_date(value: str) -> str:
    value = value.strip()
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        from email.utils import parsedate_to_datetime
        return parsedate_to_datetime(value).date().isoformat()


def valid_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError(f"Newsletter edition URL must be an absolute HTTPS URL: {value!r}")
    return value


def fetch_json(url: str, token: str | None = None) -> dict:
    headers = {"User-Agent": "suyogjoshi.com newsletter discovery sync"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as response:
        return json.load(response)


def rss_editions(url: str, expected_source: str, archive_url: str) -> list[dict[str, str]]:
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "suyogjoshi.com newsletter discovery sync"}), timeout=30) as response:
        root = ET.fromstring(response.read())
    channel = root.find("channel") if root.tag == "rss" else None
    if channel is None:
        raise ValueError("Configured newsletter source is not an RSS channel")
    channel_title = clean(channel.findtext("title") or "")
    channel_link = valid_url(clean(channel.findtext("link") or ""))
    if channel_title.casefold() != expected_source.casefold():
        raise ValueError(f"RSS channel identity mismatch: expected {expected_source!r}, received {channel_title!r}")
    if urlparse(channel_link).hostname != urlparse(archive_url).hostname:
        raise ValueError("RSS channel link does not match the configured newsletter archive host")
    editions = []
    for item in channel.findall("item"):
        guid = clean(item.findtext("guid") or "")
        link = valid_url(clean(item.findtext("link") or ""))
        title = clean(item.findtext("title") or "")
        summary = clean(item.findtext("description") or "")
        published = iso_date(item.findtext("pubDate") or "")
        if not guid or not title or not summary:
            raise ValueError("RSS edition lacks stable identity, title, or summary")
        editions.append({"id": guid, "title": title, "summary": summary, "published": published, "url": link})
    return editions


def api_editions(publication_id: str, token: str) -> list[dict[str, str]]:
    editions: list[dict[str, str]] = []
    page = 1
    while True:
        payload = fetch_json(f"https://api.beehiiv.com/v2/publications/{publication_id}/posts?status=confirmed&limit=100&page={page}", token)
        rows = payload.get("data", [])
        for post in rows:
            if post.get("platform") not in ("web", "both"):
                continue
            editions.append({
                "id": str(post["id"]), "title": clean(post.get("title", "")),
                "summary": clean(post.get("subtitle") or post.get("preview_text") or post.get("title", "")),
                "published": datetime.fromtimestamp(int(post["publish_date"])).date().isoformat(),
                "url": valid_url(str(post["web_url"])),
            })
        total_pages = int(payload.get("total_pages") or payload.get("meta", {}).get("total_pages") or page)
        if page >= total_pages or not rows:
            break
        page += 1
    return editions


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rss-url")
    parser.add_argument("--reconcile", action="store_true")
    args = parser.parse_args()
    ledger = json.loads(LEDGER.read_text(encoding="utf-8"))
    if args.reconcile:
        token = os.environ.get("BEEHIIV_API_KEY")
        if not token:
            raise SystemExit("BEEHIIV_API_KEY is required for Posts API reconciliation")
        incoming = api_editions(ledger["publicationId"], token)
    else:
        rss_url = args.rss_url or os.environ.get("BEEHIIV_RSS_URL") or ledger.get("rssUrl")
        if not rss_url:
            raise SystemExit("Configure BEEHIIV_RSS_URL or data/newsletter-editions.json rssUrl")
        incoming = rss_editions(rss_url, ledger["source"], ledger["archiveUrl"])
    if not incoming:
        raise SystemExit("Newsletter source returned no published editions; last-known-good ledger retained")
    merged = {str(item["id"]): item for item in ledger.get("editions", [])}
    merged.update({str(item["id"]): item for item in incoming})
    ledger["editions"] = sorted(merged.values(), key=lambda item: (item["published"], item["id"]), reverse=True)
    rendered = json.dumps(ledger, ensure_ascii=False, indent=2) + "\n"
    if LEDGER.read_text(encoding="utf-8") != rendered:
        LEDGER.write_text(rendered, encoding="utf-8")
        print(f"Merged {len(incoming)} editions; ledger now retains {len(merged)} editions.")
    else:
        print(f"Newsletter ledger unchanged at {len(merged)} editions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
