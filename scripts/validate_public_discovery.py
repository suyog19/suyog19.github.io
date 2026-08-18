"""Validate the generated Writing feed and public-content search contracts."""

from __future__ import annotations

import json
import subprocess
import sys
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree as ET

import generate_public_discovery as discovery


ROOT = Path(__file__).parents[1]
ORIGIN = "https://suyogjoshi.com"
ALLOWED_TYPES = {"Article", "Topic Hub", "Series", "System", "Demo", "Course"}
PROHIBITED_URL_PARTS = (
    "/admin/",
    "/my-learning/",
    "/apply/",
    "/payment",
    "/balance",
    "/register-interest/",
    "/training/policies/",
    "/training/provider/",
    "/api/",
)


def error(errors: list[str], message: str) -> None:
    errors.append(message)


def canonical_for_url(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "suyogjoshi.com":
        return None
    relative = parsed.path.strip("/")
    path = ROOT / relative / "index.html" if relative else ROOT / "index.html"
    if not path.exists():
        return None
    parser, _ = discovery.parse_page(path.relative_to(ROOT))
    return parser.canonical


def validate_freshness(errors: list[str]) -> None:
    result = subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "generate_public_discovery.py"), "--check"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode:
        error(errors, result.stderr.strip() or "Generated discovery artifacts are stale")


def validate_feed(errors: list[str]) -> None:
    try:
        root = ET.parse(ROOT / "feed.xml").getroot()
    except (ET.ParseError, OSError) as exc:
        error(errors, f"feed.xml is not well formed: {exc}")
        return
    if root.tag != "rss" or root.get("version") != "2.0":
        error(errors, "feed.xml must be RSS 2.0")
        return
    channel = root.find("channel")
    if channel is None:
        error(errors, "feed.xml is missing channel")
        return
    expected_channel = {
        "title": "Suyog Joshi Writing",
        "link": f"{ORIGIN}/writing/",
        "language": "en",
    }
    for field, expected in expected_channel.items():
        if channel.findtext(field) != expected:
            error(errors, f"feed channel {field} must be {expected!r}")
    if not (channel.findtext("description") or "").strip():
        error(errors, "feed channel requires a description")

    expected_articles = discovery.internal_articles() + discovery.external_articles()
    expected_by_url = {str(item["url"]): item for item in expected_articles}
    items = channel.findall("item")
    if len(items) != len(expected_articles):
        error(errors, f"feed has {len(items)} entries; expected {len(expected_articles)}")
    guids: set[str] = set()
    for item in items:
        link = (item.findtext("link") or "").strip()
        guid_element = item.find("guid")
        guid = (guid_element.text or "").strip() if guid_element is not None else ""
        expected = expected_by_url.get(link)
        if expected is None:
            error(errors, f"feed contains unapproved destination: {link}")
            continue
        if guid != link or guid_element is None or guid_element.get("isPermaLink") != "true":
            error(errors, f"feed GUID must be the stable destination URL: {link}")
        if guid in guids:
            error(errors, f"duplicate feed GUID: {guid}")
        guids.add(guid)
        if item.findtext("title") != expected["title"]:
            error(errors, f"feed title mismatch for {link}")
        if item.findtext("description") != expected["summary"]:
            error(errors, f"feed summary mismatch for {link}")
        creator = item.findtext("{http://purl.org/dc/elements/1.1/}creator")
        if creator != discovery.AUTHOR:
            error(errors, f"feed author mismatch for {link}")
        try:
            published = parsedate_to_datetime(item.findtext("pubDate") or "").date().isoformat()
        except (TypeError, ValueError):
            error(errors, f"invalid feed publication date for {link}")
            published = ""
        if published != expected["published"]:
            error(errors, f"feed publication date mismatch for {link}")
        source = item.find("source")
        if expected["external"]:
            if source is None or source.text != expected["source"]:
                error(errors, f"external feed source missing or incorrect for {link}")
        elif source is not None:
            error(errors, f"internal feed item must not claim an external source: {link}")
        if any(part in link for part in PROHIBITED_URL_PARTS):
            error(errors, f"private or transactional URL found in feed: {link}")
    if root.findall(".//lastModified") or root.findall(".//updated"):
        error(errors, "feed must not fabricate modified/updated dates")


def validate_feed_discovery(errors: list[str]) -> None:
    for path in sorted((ROOT / "writing").rglob("index.html")):
        parser = discovery.PageParser()
        source = path.read_text(encoding="utf-8")
        parser.feed(source)
        marker = 'rel="alternate" type="application/rss+xml" title="Suyog Joshi Writing" href="'
        if source.count(marker) != 1:
            error(errors, f"{path.relative_to(ROOT)} must expose exactly one RSS discovery link")
            continue
        href = source.split(marker, 1)[1].split('"', 1)[0]
        if urljoin(parser.canonical, href) != f"{ORIGIN}/feed.xml":
            error(errors, f"{path.relative_to(ROOT)} RSS discovery href resolves incorrectly: {href}")


def validate_search(errors: list[str]) -> None:
    try:
        payload = json.loads((ROOT / "data" / "search-index.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        error(errors, f"search index is invalid JSON: {exc}")
        return
    if payload.get("version") != 1 or set(payload.get("scope", [])) != ALLOWED_TYPES:
        error(errors, "search index version or declared scope is invalid")
    privacy = payload.get("privacy", "")
    if "browser" not in privacy or "not stored" not in privacy:
        error(errors, "search index must state its local privacy boundary")
    items = payload.get("items")
    if not isinstance(items, list):
        error(errors, "search index items must be a list")
        return
    expected_counts = {"Article": 34, "Topic Hub": 4, "Series": 2, "System": 4, "Demo": 4, "Course": 5}
    actual_counts = {content_type: sum(item.get("type") == content_type for item in items) for content_type in ALLOWED_TYPES}
    if actual_counts != expected_counts:
        error(errors, f"search index type coverage mismatch: {actual_counts}")
    ids: set[str] = set()
    approved_external = {str(item["url"]) for item in discovery.external_articles()}
    catalogue = json.loads((ROOT / "data" / "training-courses.json").read_text(encoding="utf-8"))["courses"]
    course_state = {
        course["courseId"]: ("Launched course" if course["lifecycleStatus"] == "launched" else "Proposed course")
        for course in catalogue
    }
    for item in items:
        item_id = item.get("id")
        content_type = item.get("type")
        title = item.get("title")
        summary = item.get("summary")
        url = item.get("url", "")
        if not all(isinstance(value, str) and value.strip() for value in (item_id, content_type, title, summary, url)):
            error(errors, f"search item lacks useful required metadata: {item!r}")
            continue
        if item_id in ids:
            error(errors, f"duplicate search ID: {item_id}")
        ids.add(item_id)
        if content_type not in ALLOWED_TYPES:
            error(errors, f"unsupported search content type: {content_type}")
        if any(part in url for part in PROHIBITED_URL_PARTS):
            error(errors, f"private or transactional URL found in search index: {url}")
        if item.get("external"):
            if content_type != "Article" or url not in approved_external or item.get("source") in (None, "", "suyogjoshi.com"):
                error(errors, f"external search result is not an approved Writing item: {url}")
        else:
            canonical = canonical_for_url(url)
            if canonical != url:
                error(errors, f"internal search URL is not a resolving canonical destination: {url}")
        if content_type == "Course":
            course_id = str(item_id).removeprefix("course:")
            expected_prefix = course_state.get(course_id)
            if not expected_prefix or not str(item.get("state", "")).startswith(expected_prefix):
                error(errors, f"course result state is not truthful for {item_id}")

    search_source = (ROOT / "search" / "index.html").read_text(encoding="utf-8")
    parser, nodes = discovery.parse_page("search/index.html")
    if parser.canonical != f"{ORIGIN}/search/" or search_source.count("<h1") != 1:
        error(errors, "search page must have one H1 and the production canonical")
    web_pages = [node for node in nodes if node.get("@type") == "WebPage"]
    if len(web_pages) != 1:
        error(errors, "search page must expose exactly one conservative WebPage schema")
    else:
        node = web_pages[0]
        if node.get("url") != parser.canonical or node.get("@id") != f"{parser.canonical}#page":
            error(errors, "search WebPage schema must match the canonical URL")
        if node.get("description") != parser.description:
            error(errors, "search WebPage description must match visible metadata")
        if node.get("isPartOf") != {"@id": f"{ORIGIN}/#website"} or node.get("creator") != {"@id": f"{ORIGIN}/#person"}:
            error(errors, "search WebPage must reference the canonical WebSite and Person")
    if "https://suyogjoshi.com/search/" not in (ROOT / "sitemap.xml").read_text(encoding="utf-8"):
        error(errors, "search page is missing from sitemap.xml")
    if "URLSearchParams" in (ROOT / "js" / "public-search.js").read_text(encoding="utf-8"):
        error(errors, "search must not create crawlable query-parameter state")


def main() -> int:
    errors: list[str] = []
    validate_freshness(errors)
    validate_feed(errors)
    validate_feed_discovery(errors)
    validate_search(errors)
    if errors:
        print("Public discovery validation failed:", file=sys.stderr)
        for message in errors:
            print(f"- {message}", file=sys.stderr)
        return 1
    print("Validated 34 Writing feed entries and 53 public search destinations across 6 approved content types.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
