"""Capture a reproducible public-route and link-integrity production baseline."""

from __future__ import annotations

import argparse
import csv
import json
import re
import ssl
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urldefrag, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET


DEFAULT_ORIGIN = "https://suyogjoshi.com"
USER_AGENT = "suyogjoshi-baseline-capture/1.0 (+https://suyogjoshi.com/)"
SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title_parts: list[str] = []
        self.canonicals: list[str] = []
        self.links: list[str] = []
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.casefold(): value or "" for name, value in attrs}
        if tag == "title":
            self._in_title = True
        elif tag == "link" and "canonical" in values.get("rel", "").casefold().split():
            self.canonicals.append(values.get("href", ""))
        elif tag == "a" and values.get("href"):
            self.links.append(values["href"])

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title_parts.append(data)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())


@dataclass(frozen=True)
class FetchResult:
    requested_url: str
    final_url: str
    status: int
    content_type: str
    body: bytes
    error: str = ""


@dataclass(frozen=True)
class RouteRecord:
    path: str
    status: int
    final_url: str
    title: str
    canonical_url: str
    sitemap_present: bool
    inbound_internal_link_count: int
    inbound_internal_link_examples: str
    fetch_error: str


def normalized_public_url(value: str, base_url: str, origin: str) -> str | None:
    absolute, _ = urldefrag(urljoin(base_url, value))
    parts = urlsplit(absolute)
    origin_parts = urlsplit(origin)
    if parts.scheme not in {"http", "https"} or parts.netloc != origin_parts.netloc:
        return None
    path = parts.path or "/"
    if re.search(r"\.(?:css|js|png|jpe?g|webp|svg|ico|xml|json|txt|pdf|vcf)$", path, re.I):
        return None
    return urlunsplit((origin_parts.scheme, origin_parts.netloc, path, parts.query, ""))


def fetch(url: str, timeout: float) -> FetchResult:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    context = ssl.create_default_context()
    try:
        with urlopen(request, timeout=timeout, context=context) as response:
            return FetchResult(
                url,
                response.geturl(),
                response.status,
                response.headers.get_content_type(),
                response.read(),
            )
    except HTTPError as exc:
        return FetchResult(url, exc.geturl(), exc.code, exc.headers.get_content_type(), exc.read(), str(exc))
    except (URLError, TimeoutError, OSError) as exc:
        return FetchResult(url, url, 0, "", b"", str(exc))


def sitemap_urls(source: bytes) -> list[str]:
    root = ET.fromstring(source)
    namespace = {"sm": SITEMAP_NAMESPACE}
    return sorted(element.text.strip() for element in root.findall("sm:url/sm:loc", namespace) if element.text)


def parse_page(result: FetchResult) -> PageParser:
    parser = PageParser()
    if result.body and result.content_type == "text/html":
        parser.feed(result.body.decode("utf-8", errors="replace"))
    return parser


def capture(origin: str, timeout: float, workers: int) -> tuple[list[RouteRecord], dict]:
    captured_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    sitemap_url = origin.rstrip("/") + "/sitemap.xml"
    sitemap_result = fetch(sitemap_url, timeout)
    if sitemap_result.status != 200:
        raise RuntimeError(f"Unable to load {sitemap_url}: HTTP {sitemap_result.status} {sitemap_result.error}")

    urls = sitemap_urls(sitemap_result.body)
    fetched: dict[str, FetchResult] = {}
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetch, url, timeout): url for url in urls}
        for future in as_completed(futures):
            fetched[futures[future]] = future.result()

    parsed = {url: parse_page(result) for url, result in fetched.items()}
    inbound: dict[str, set[str]] = defaultdict(set)
    discovered_internal: set[str] = set()
    for source_url, page in parsed.items():
        for href in page.links:
            target = normalized_public_url(href, source_url, origin)
            if target:
                discovered_internal.add(target)
                inbound[target].add(urlsplit(source_url).path or "/")

    sitemap_set = set(urls)
    additional_urls = sorted(discovered_internal - sitemap_set)
    additional_results: dict[str, FetchResult] = {}
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetch, url, timeout): url for url in additional_urls}
        for future in as_completed(futures):
            additional_results[futures[future]] = future.result()

    records: list[RouteRecord] = []
    for url in urls:
        result = fetched[url]
        page = parsed[url]
        examples = sorted(inbound.get(url, set()))
        records.append(
            RouteRecord(
                path=urlsplit(url).path or "/",
                status=result.status,
                final_url=result.final_url,
                title=page.title,
                canonical_url=page.canonicals[0] if len(page.canonicals) == 1 else " | ".join(page.canonicals),
                sitemap_present=True,
                inbound_internal_link_count=len(examples),
                inbound_internal_link_examples=" | ".join(examples[:5]),
                fetch_error=result.error,
            )
        )

    broken_sitemap = [record.path for record in records if record.status != 200]
    canonical_mismatches = [
        record.path
        for record in records
        if record.canonical_url != origin.rstrip("/") + record.path
    ]
    broken_discovered = [
        {
            "url": url,
            "status": result.status,
            "sources": sorted(inbound[url]),
            "error": result.error,
        }
        for url, result in sorted(additional_results.items())
        if result.status == 0 or result.status >= 400
    ]
    summary = {
        "schema_version": 1,
        "captured_at_utc": captured_at,
        "origin": origin,
        "sitemap_url": sitemap_url,
        "sitemap_status": sitemap_result.status,
        "sitemap_route_count": len(urls),
        "sitemap_non_200_routes": broken_sitemap,
        "canonical_mismatches": canonical_mismatches,
        "discovered_same_origin_link_count": len(discovered_internal),
        "additional_same_origin_urls_checked": len(additional_results),
        "broken_same_origin_links": broken_discovered,
    }
    return records, summary


def write_outputs(records: list[RouteRecord], summary: dict, csv_path: Path, json_path: Path) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    with csv_path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(asdict(records[0]).keys()), lineterminator="\n")
        writer.writeheader()
        writer.writerows(asdict(record) for record in records)
    json_path.write_text(
        json.dumps(summary, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--origin", default=DEFAULT_ORIGIN)
    parser.add_argument("--csv", type=Path, required=True)
    parser.add_argument("--summary", type=Path, required=True)
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()
    records, summary = capture(args.origin.rstrip("/"), args.timeout, max(1, args.workers))
    write_outputs(records, summary, args.csv, args.summary)
    print(
        f"Captured {len(records)} sitemap routes; "
        f"{len(summary['broken_same_origin_links'])} broken same-origin links found."
    )


if __name__ == "__main__":
    main()
