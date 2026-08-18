"""Generate the public Writing feed and lightweight search index.

The artifacts are committed so the production site remains a no-build static
site. Run with ``--check`` in validation to detect stale generated output.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from datetime import date, datetime, time, timezone
from email.utils import format_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree as ET


ROOT = Path(__file__).parents[1]
ORIGIN = "https://suyogjoshi.com"
AUTHOR = "Suyog Joshi"
FEED_PATH = ROOT / "feed.xml"
SEARCH_PATH = ROOT / "data" / "search-index.json"

TOPIC_HUB_PATHS = (
    "writing/topics/ai-assisted-software-engineering/index.html",
    "writing/topics/engineering-context-and-knowledge/index.html",
    "writing/topics/ai-agents-and-review/index.html",
    "writing/topics/agile-process-and-engineering-leadership/index.html",
)
SERIES_PATHS = (
    "writing/series/index.html",
    "writing/series/ai-assisted-software-engineering/index.html",
)
SYSTEM_PATHS = (
    "systems/ai-dev-orchestrator/index.html",
    "systems/ai-workflow-lab/index.html",
    "systems/ai-native-learning-platform/index.html",
    "systems/survey-poll-serverless/index.html",
)
DEMO_PATHS = (
    "systems/ai-workflow-lab/invoice-review-demo/index.html",
    "systems/ai-workflow-lab/vendor-onboarding-rag-demo/index.html",
    "systems/ai-workflow-lab/knowledge-markdown-demo/index.html",
    "systems/ai-workflow-lab/ingestion-comparator/index.html",
)


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.title = ""
        self.description = ""
        self.canonical = ""
        self.json_documents: list[object] = []
        self._capture_title = False
        self._capture_json = False
        self._buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if tag == "title":
            self._capture_title = True
            self._buffer = []
        elif tag == "meta" and values.get("name", "").lower() == "description":
            self.description = values.get("content", "").strip()
        elif tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonical = values.get("href", "").strip()
        elif tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._capture_json = True
            self._buffer = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self._capture_title:
            self.title = html.unescape("".join(self._buffer)).strip()
            self._capture_title = False
            self._buffer = []
        elif tag == "script" and self._capture_json:
            raw = "".join(self._buffer).strip()
            if raw:
                self.json_documents.append(json.loads(raw))
            self._capture_json = False
            self._buffer = []

    def handle_data(self, data: str) -> None:
        if self._capture_title or self._capture_json:
            self._buffer.append(data)


class LatestWritingParser(HTMLParser):
    """Read approved external Writing from the existing Latest Writing list."""

    def __init__(self) -> None:
        super().__init__()
        self.items: list[dict[str, str]] = []
        self._item: dict[str, str] | None = None
        self._depth = 0
        self._capture = ""
        self._buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        classes = set(values.get("class", "").split())
        if tag == "li" and "wp-latest-item" in classes and values.get("data-hosting") == "external":
            self._item = {
                "source": values.get("data-source", "").strip(),
                "summary": values.get("data-summary", "").strip(),
                "topic": values.get("data-topic", "").strip(),
            }
            self._depth = 1
            return
        if self._item is None:
            return
        if tag == "li":
            self._depth += 1
        if tag == "a" and "wp-latest-row" in classes:
            self._item["url"] = values.get("href", "").strip()
        elif tag == "time":
            self._item["published"] = values.get("datetime", "").strip()
        elif "wp-latest-title" in classes:
            self._capture = "title"
            self._buffer = []
        elif "wp-latest-meta" in classes:
            self._capture = "meta"
            self._buffer = []

    def handle_endtag(self, tag: str) -> None:
        if self._item is None:
            return
        if tag == "span" and self._capture:
            text = " ".join("".join(self._buffer).split())
            if self._capture == "title":
                self._item["title"] = html.unescape(text)
            elif self._capture == "meta":
                parts = [part.strip() for part in text.split("·") if part.strip()]
                if len(parts) > 1:
                    self._item["topic"] = parts[-1]
            self._capture = ""
            self._buffer = []
        if tag == "li":
            self._depth -= 1
            if self._depth == 0:
                self.items.append(self._item)
                self._item = None

    def handle_data(self, data: str) -> None:
        if self._item is not None and self._capture:
            self._buffer.append(data)


def schema_nodes(document: object) -> list[dict[str, object]]:
    if isinstance(document, dict):
        graph = document.get("@graph")
        if isinstance(graph, list):
            return [node for node in graph if isinstance(node, dict)]
        return [document]
    if isinstance(document, list):
        return [node for node in document if isinstance(node, dict)]
    return []


def parse_page(relative: str | Path) -> tuple[PageParser, list[dict[str, object]]]:
    path = ROOT / relative
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    nodes = [node for document in parser.json_documents for node in schema_nodes(document)]
    return parser, nodes


def clean_page_title(title: str) -> str:
    for suffix in (" | Suyog Joshi", " | Software Signal Learning"):
        if title.endswith(suffix):
            return title[: -len(suffix)]
    return title


def text_from_markup(value: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", value)).split())


def writing_catalogue_topics() -> dict[str, list[str]]:
    """Derive article labels from the existing Writing catalogue links."""
    source = (ROOT / "writing" / "index.html").read_text(encoding="utf-8")
    mapping: dict[str, set[str]] = {}
    pattern = re.compile(
        r'<a\s+href="(?P<href>[^"]+)"\s+class="wp-(?:latest|article)-row"[^>]*>(?P<body>.*?)</a>',
        re.DOTALL,
    )
    for match in pattern.finditer(source):
        href = html.unescape(match.group("href"))
        if href.startswith(("http://", "https://")):
            continue
        url = urljoin(f"{ORIGIN}/writing/", href)
        body = match.group("body")
        labels = [text_from_markup(value) for value in re.findall(r'class="wp-article-row-label"[^>]*>(.*?)</span>', body, re.DOTALL)]
        latest = re.search(r'class="wp-latest-meta"[^>]*>(.*?)</span>\s*<span class="wp-latest-publication"', body, re.DOTALL)
        if latest:
            parts = [part.strip() for part in text_from_markup(latest.group(1)).split("·") if part.strip()]
            if len(parts) > 1:
                labels.append(parts[-1])
        for label in labels:
            if label:
                mapping.setdefault(url, set()).add(label)
    return {url: sorted(labels) for url, labels in mapping.items()}


def internal_articles() -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    catalogue_topics = writing_catalogue_topics()
    for path in sorted((ROOT / "writing").glob("*/index.html")):
        parser, nodes = parse_page(path.relative_to(ROOT))
        posts = [node for node in nodes if node.get("@type") == "BlogPosting"]
        if len(posts) != 1:
            continue
        node = posts[0]
        items.append(
            {
                "title": str(node["headline"]),
                "url": str(node["url"]),
                "summary": str(node["description"]),
                "published": str(node["datePublished"]),
                "topics": catalogue_topics.get(str(node["url"]), ["Writing"]),
                "source": "suyogjoshi.com",
                "external": False,
            }
        )
    return items


def external_articles() -> list[dict[str, object]]:
    parser = LatestWritingParser()
    parser.feed((ROOT / "writing" / "index.html").read_text(encoding="utf-8"))
    required = ("title", "url", "summary", "published", "topic", "source")
    for index, item in enumerate(parser.items, start=1):
        missing = [field for field in required if not item.get(field)]
        if missing:
            raise ValueError(f"External Latest Writing item {index} is missing: {', '.join(missing)}")
        if urlparse(item["url"]).scheme != "https":
            raise ValueError(f"External Writing URL must use HTTPS: {item['url']}")
    return [{**item, "topics": [item["topic"]], "external": True} for item in parser.items]


def page_search_item(relative: str, content_type: str) -> dict[str, object]:
    parser, nodes = parse_page(relative)
    preferred_names = ("headline", "name")
    name = ""
    for node in nodes:
        for field in preferred_names:
            value = node.get(field)
            if isinstance(value, str) and value.strip():
                name = value.strip()
                break
        if name:
            break
    return {
        "id": f"{content_type.lower().replace(' ', '-') }:{parser.canonical}",
        "type": content_type,
        "title": name or clean_page_title(parser.title),
        "summary": parser.description,
        "url": parser.canonical,
        "topics": [],
        "source": "suyogjoshi.com",
        "external": False,
    }


def course_items() -> list[dict[str, object]]:
    catalogue = json.loads((ROOT / "data" / "training-courses.json").read_text(encoding="utf-8"))
    courses = catalogue.get("courses", [])
    items: list[dict[str, object]] = []
    for course in courses:
        detail_path = course.get("detailPath", "")
        if not isinstance(detail_path, str) or not detail_path.startswith("/training/"):
            continue
        lifecycle = course.get("lifecycleStatus")
        if lifecycle == "launched":
            state = "Launched course · check the course page for current availability"
        elif lifecycle == "pipeline":
            state = "Proposed course · register interest"
        else:
            raise ValueError(f"Unsupported public course lifecycle: {lifecycle!r}")
        items.append(
            {
                "id": f"course:{course['courseId']}",
                "type": "Course",
                "title": course["title"],
                "summary": course["shortCapability"],
                "url": urljoin(f"{ORIGIN}/", detail_path.lstrip("/")),
                "topics": [f"Stage {course['stage']}", course["learnerFit"]],
                "source": "Software Signal Learning",
                "external": False,
                "state": state,
            }
        )
    return items


def build_search_index(articles: list[dict[str, object]]) -> dict[str, object]:
    items: list[dict[str, object]] = []
    for article in articles:
        entry = {
            "id": f"article:{article['url']}",
            "type": "Article",
            "title": article["title"],
            "summary": article["summary"],
            "url": article["url"],
            "topics": article["topics"],
            "source": article["source"],
            "external": article["external"],
            "published": article["published"],
        }
        items.append(entry)
    for relative in TOPIC_HUB_PATHS:
        items.append(page_search_item(relative, "Topic Hub"))
    for relative in SERIES_PATHS:
        items.append(page_search_item(relative, "Series"))
    for relative in SYSTEM_PATHS:
        items.append(page_search_item(relative, "System"))
    for relative in DEMO_PATHS:
        items.append(page_search_item(relative, "Demo"))
    items.extend(course_items())
    items.sort(key=lambda item: (str(item["type"]), str(item["title"]).casefold()))
    return {
        "version": 1,
        "scope": ["Article", "Topic Hub", "Series", "System", "Demo", "Course"],
        "privacy": "Public metadata only. Queries stay in the browser and are not stored by this feature.",
        "items": items,
    }


def publication_url(item_url: str) -> str:
    parsed = urlparse(item_url)
    segments = [segment for segment in parsed.path.split("/") if segment]
    if not segments:
        return f"{parsed.scheme}://{parsed.netloc}/"
    return f"{parsed.scheme}://{parsed.netloc}/{segments[0]}/"


def rss_date(value: str) -> str:
    published = date.fromisoformat(value)
    instant = datetime.combine(published, time(hour=9), tzinfo=timezone.utc)
    return format_datetime(instant)


def build_feed(articles: list[dict[str, object]]) -> bytes:
    ET.register_namespace("atom", "http://www.w3.org/2005/Atom")
    ET.register_namespace("dc", "http://purl.org/dc/elements/1.1/")
    rss = ET.Element(
        "rss",
        {"version": "2.0"},
    )
    channel = ET.SubElement(rss, "channel")
    ET.SubElement(channel, "title").text = "Suyog Joshi Writing"
    ET.SubElement(channel, "link").text = f"{ORIGIN}/writing/"
    ET.SubElement(channel, "description").text = "Articles and essays on AI, software architecture, intelligent systems, and engineering practice."
    ET.SubElement(channel, "language").text = "en"
    ET.SubElement(channel, "copyright").text = f"Copyright 2026 {AUTHOR}"
    ET.SubElement(channel, "{http://www.w3.org/2005/Atom}link", {"href": f"{ORIGIN}/feed.xml", "rel": "self", "type": "application/rss+xml"})
    newest = max(str(item["published"]) for item in articles)
    ET.SubElement(channel, "lastBuildDate").text = rss_date(newest)

    for article in sorted(articles, key=lambda item: (str(item["published"]), str(item["title"])), reverse=True):
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = str(article["title"])
        ET.SubElement(item, "link").text = str(article["url"])
        ET.SubElement(item, "guid", {"isPermaLink": "true"}).text = str(article["url"])
        ET.SubElement(item, "description").text = str(article["summary"])
        ET.SubElement(item, "{http://purl.org/dc/elements/1.1/}creator").text = AUTHOR
        ET.SubElement(item, "pubDate").text = rss_date(str(article["published"]))
        for category in article["topics"]:
            ET.SubElement(item, "category").text = str(category)
        if article["external"]:
            ET.SubElement(item, "source", {"url": publication_url(str(article["url"]))}).text = str(article["source"])

    ET.indent(rss, space="  ")
    return ET.tostring(rss, encoding="utf-8", xml_declaration=True) + b"\n"


def generated_artifacts() -> dict[Path, bytes]:
    articles = internal_articles() + external_articles()
    search = build_search_index(articles)
    search_bytes = (json.dumps(search, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    return {FEED_PATH: build_feed(articles), SEARCH_PATH: search_bytes}


def main() -> int:
    argument_parser = argparse.ArgumentParser()
    argument_parser.add_argument("--check", action="store_true", help="fail if committed artifacts are stale")
    args = argument_parser.parse_args()
    artifacts = generated_artifacts()
    stale: list[str] = []
    for path, content in artifacts.items():
        if args.check:
            if not path.exists() or path.read_bytes() != content:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
    if stale:
        print("Public discovery artifacts are stale; run python scripts/generate_public_discovery.py", file=sys.stderr)
        for path in stale:
            print(f"- {path}", file=sys.stderr)
        return 1
    action = "Validated" if args.check else "Generated"
    print(f"{action} feed.xml and data/search-index.json from public source metadata.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
