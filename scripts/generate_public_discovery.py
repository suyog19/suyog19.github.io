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
WORKS_PATH = ROOT / "data" / "writing-works.json"
CURATION_PATH = ROOT / "data" / "writing-curation.json"
NEWSLETTER_PATH = ROOT / "data" / "newsletter-editions.json"

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


class ExternalWritingParser(HTMLParser):
    """Read approved external Writing from durable catalogue-link metadata."""

    def __init__(self) -> None:
        super().__init__()
        self.items: list[dict[str, str]] = []
        self._href = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if tag == "a" and values.get("href", "").startswith("https://medium.com/"):
            self._href = values["href"].strip()
        if "data-discovery-title" in values:
            self.items.append(
                {
                    "title": values.get("data-discovery-title", "").strip(),
                    "url": values.get("href", self._href).strip(),
                    "summary": values.get("data-discovery-summary", "").strip(),
                    "published": values.get("data-discovery-published", "").strip(),
                    "topic": values.get("data-discovery-topic", "").strip(),
                    "source": values.get("data-discovery-source", "").strip(),
                }
            )

    def handle_endtag(self, tag: str) -> None:
        if tag == "a":
            self._href = ""


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


def article_works() -> list[dict[str, object]]:
    """Resolve eligible logical Works without consulting display markup."""
    catalogue = json.loads(WORKS_PATH.read_text(encoding="utf-8"))
    curation = json.loads(CURATION_PATH.read_text(encoding="utf-8"))
    as_of = date.fromisoformat(catalogue["asOf"])
    topic_names = {topic["id"]: topic["title"] for topic in curation["topics"]}
    seen_ids: set[str] = set()
    seen_publications: set[str] = set()
    resolved: list[dict[str, object]] = []
    for work in catalogue["works"]:
        work_id = str(work["id"])
        if work_id in seen_ids:
            raise ValueError(f"Duplicate Article Work id: {work_id}")
        seen_ids.add(work_id)
        publications = []
        for publication in work["publications"]:
            publication_id = str(publication["id"])
            if publication_id in seen_publications:
                raise ValueError(f"Publication belongs to more than one Work: {publication_id}")
            seen_publications.add(publication_id)
            published = date.fromisoformat(str(publication["published"]))
            if publication.get("status") == "public" and published > as_of:
                raise ValueError(f"Public publication is future-dated: {publication_id}")
            if publication.get("status") == "public" and published <= as_of:
                if urlparse(str(publication["url"])).scheme != "https":
                    raise ValueError(f"Article publication URL must use HTTPS: {publication_id}")
                publications.append(publication)
        if not publications:
            continue
        effective = max(publications, key=lambda item: (str(item["published"]), str(item["id"])))
        preferred = next((item for item in publications if item["id"] == work.get("preferredPublicationId")), effective)
        if work.get("internalPath"):
            _, nodes = parse_page(str(work["internalPath"]))
            posts = [node for node in nodes if node.get("@type") == "BlogPosting"]
            if len(posts) != 1:
                raise ValueError(f"Internal Work must resolve one BlogPosting: {work_id}")
            title = str(posts[0]["headline"])
            summary = str(posts[0]["description"])
        else:
            metadata = work.get("externalMetadata") or {}
            title, summary = str(metadata.get("title", "")), str(metadata.get("summary", ""))
        if not title or not summary:
            raise ValueError(f"Work lacks discovery metadata: {work_id}")
        unknown_topics = set(work.get("topicIds", [])) - set(topic_names)
        if unknown_topics:
            raise ValueError(f"Work {work_id} uses unknown Topics: {sorted(unknown_topics)}")
        resolved.append({
            "workId": work_id,
            "title": title,
            "summary": summary,
            "url": preferred["url"],
            "published": effective["published"],
            "topics": [topic_names[item] for item in work.get("topicIds", [])],
            "topicIds": list(work.get("topicIds", [])),
            "source": preferred["source"],
            "external": bool(preferred["external"]),
            "feedGuid": work["feedGuid"],
            "cover": work.get("cover"),
            "coverWidth": work.get("coverWidth"),
            "coverHeight": work.get("coverHeight"),
            "publications": publications,
            "ageDays": (as_of - date.fromisoformat(str(effective["published"]))).days,
        })
    return resolved


def internal_articles() -> list[dict[str, object]]:
    return [work for work in article_works() if not work["external"]]


def external_articles() -> list[dict[str, object]]:
    return [work for work in article_works() if work["external"]]


def chronology_partition(articles: list[dict[str, object]]) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    ordered = sorted(articles, key=lambda item: (str(item["published"]), str(item["workId"])), reverse=True)
    return ([item for item in ordered if int(item["ageDays"]) <= 100], [item for item in ordered if int(item["ageDays"]) > 100])


def newsletter_items() -> list[dict[str, object]]:
    payload = json.loads(NEWSLETTER_PATH.read_text(encoding="utf-8"))
    items = []
    for edition in payload.get("editions", []):
        items.append({
            "id": f"newsletter:{edition['id']}", "type": "Newsletter",
            "title": edition["title"], "summary": edition["summary"],
            "url": edition["url"], "topics": [], "source": payload["source"],
            "external": True, "published": edition["published"],
        })
    return items


def structured_paths(root: str, schema_type: str) -> list[str]:
    """Discover eligible public pages from their existing structured metadata."""
    paths: list[str] = []
    for path in sorted((ROOT / root).rglob("index.html")):
        _, nodes = parse_page(path.relative_to(ROOT))
        if any(node.get("@type") == schema_type for node in nodes):
            paths.append(path.relative_to(ROOT).as_posix())
    return paths


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
            "id": f"article:{article['workId']}",
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
    for relative in structured_paths("writing/topics", "CollectionPage"):
        items.append(page_search_item(relative, "Topic Hub"))
    for relative in structured_paths("writing/series", "CollectionPage"):
        items.append(page_search_item(relative, "Series"))
    for relative in structured_paths("systems", "TechArticle"):
        items.append(page_search_item(relative, "System"))
    for schema_type in ("CreativeWork", "WebApplication"):
        for relative in structured_paths("systems", schema_type):
            items.append(page_search_item(relative, "Demo"))
    items.extend(course_items())
    items.extend(newsletter_items())
    items.sort(key=lambda item: (str(item["type"]), str(item["title"]).casefold()))
    return {
        "version": 1,
        "scope": ["Article", "Topic Hub", "Series", "System", "Demo", "Course", "Newsletter"],
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
        guid = str(article["feedGuid"])
        ET.SubElement(item, "guid", {"isPermaLink": "true" if guid == str(article["url"]) else "false"}).text = guid
        ET.SubElement(item, "description").text = str(article["summary"])
        ET.SubElement(item, "{http://purl.org/dc/elements/1.1/}creator").text = AUTHOR
        ET.SubElement(item, "pubDate").text = rss_date(str(article["published"]))
        for category in article["topics"]:
            ET.SubElement(item, "category").text = str(category)
        if article["external"]:
            ET.SubElement(item, "source", {"url": publication_url(str(article["url"]))}).text = str(article["source"])

    ET.indent(rss, space="  ")
    return ET.tostring(rss, encoding="utf-8", xml_declaration=True) + b"\n"


def display_date(value: str) -> str:
    return date.fromisoformat(value).strftime("%d %b %Y")


def article_href(article: dict[str, object], prefix: str = "") -> str:
    if article["external"]:
        return str(article["url"])
    return prefix + urlparse(str(article["url"])).path.removeprefix("/writing/")


def article_link(article: dict[str, object], css_class: str, prefix: str = "") -> str:
    external = article["external"]
    attrs = ' target="_blank" rel="noopener noreferrer"' if external else ""
    label = f' aria-label="{html.escape(str(article["title"]))} — {html.escape(str(article["source"]))} (opens in a new tab)"' if external else ""
    source = f" · {html.escape(str(article['source']))} · External" if external else ""
    topic = html.escape(str((article.get("topics") or ["Unclustered"])[0]))
    return (
        f'<a href="{html.escape(article_href(article, prefix), quote=True)}" class="{css_class}" data-work-id="{html.escape(str(article["workId"]))}"{attrs}{label}>'
        f'<span class="wp-article-row-title">{html.escape(str(article["title"]))}</span>'
        f'<span class="wp-article-row-label"><time datetime="{article["published"]}">{display_date(str(article["published"]))}</time> · {topic}{source}</span></a>'
    )


def render_landing_core(articles: list[dict[str, object]]) -> str:
    ordered = sorted(articles, key=lambda item: (str(item["published"]), str(item["workId"])), reverse=True)
    by_id = {str(item["workId"]): item for item in articles}
    curation = json.loads(CURATION_PATH.read_text(encoding="utf-8"))
    newsletters = sorted(newsletter_items(), key=lambda item: (str(item["published"]), str(item["id"])), reverse=True)[:2]
    latest_rows = []
    for article in ordered[:6]:
        cover = article.get("cover")
        image = f'<img src="{html.escape(str(cover))}" alt="" class="wp-latest-cover" width="{article.get("coverWidth") or 1200}" height="{article.get("coverHeight") or 630}" loading="lazy" decoding="async">' if cover else ""
        attrs = ' target="_blank" rel="noopener noreferrer"' if article["external"] else ""
        label = f' aria-label="{html.escape(str(article["title"]))} — {html.escape(str(article["source"]))} (opens in a new tab)"' if article["external"] else ""
        publication = ("Published on Medium" if article["source"] == "Medium" else f'Published in {html.escape(str(article["source"]))}') + " ↗" if article["external"] else "Read on suyogjoshi.com"
        latest_rows.append(
            f'<li class="wp-latest-item" data-work-id="{article["workId"]}" data-hosting="{"external" if article["external"] else "internal"}">'
            f'<a href="{html.escape(article_href(article), quote=True)}" class="wp-latest-row"{attrs}{label}>{image}<span class="wp-latest-content"><span class="wp-latest-title">{html.escape(str(article["title"]))}</span>'
            f'<span class="wp-latest-meta"><time datetime="{article["published"]}">{display_date(str(article["published"]))}</time></span>'
            f'<span class="wp-latest-publication">{publication}</span></span></a></li>'
        )
    newsletter_rows = "".join(
        f'<li class="wp-article-item"><a class="wp-article-row" href="{html.escape(str(item["url"]), quote=True)}" target="_blank" rel="noopener noreferrer" aria-label="{html.escape(str(item["title"]))} — Software Signal Weekly (opens in a new tab)"><span class="wp-article-row-title">{html.escape(str(item["title"]))}</span><span class="wp-article-row-label"><time datetime="{item["published"]}">{display_date(str(item["published"]))}</time> · Software Signal Weekly · External</span></a></li>'
        for item in newsletters
    ) or '<li class="wp-article-item"><p class="wp-theme-desc">The first published editions will appear here automatically. Browse Beehiiv for the current archive.</p></li>'
    path_cards = []
    for path in curation["readerPaths"]:
        steps = [by_id[item] for item in path["workIds"]]
        links = "".join(f'<li>{article_link(item, "wp-article-row")}</li>' for item in steps)
        path_cards.append(f'<article class="wp-path-card"><p class="wp-theme-kicker">Reader path · {len(steps)} steps</p><h2 class="wp-path-title">{html.escape(path["title"])}</h2><p class="wp-path-desc">{html.escape(path["description"])}</p><ol class="wp-theme-articles">{links}</ol></article>')
    topic_cards = []
    for topic in curation["topics"]:
        preview = [by_id[item] for item in topic["previewWorkIds"]]
        links = "".join(f'<li class="wp-article-item">{article_link(item, "wp-article-row")}</li>' for item in preview)
        topic_cards.append(f'<article class="wp-theme" id="topic-{topic["id"]}"><div class="wp-theme-header"><p class="wp-theme-kicker">Topic cluster</p><h2 class="wp-theme-title">{html.escape(topic["title"])}</h2><p class="wp-theme-desc">{html.escape(topic["description"])}</p></div><ul class="wp-theme-articles">{links}</ul><a href="topics/{topic["id"]}/" class="wp-theme-explore">Explore the complete topic <span aria-hidden="true">→</span></a></article>')
    return f'''<!-- Latest Writing -->
    <section class="wp-latest" aria-labelledby="latest-writing-title"><div class="container"><div class="section-header"><h2 class="section-title" id="latest-writing-title">Latest Writing</h2><p class="section-subtitle">The six newest Article Works, whether published here or with an external publication.</p></div><ul class="wp-latest-list">{"".join(latest_rows)}</ul><p><a class="wp-theme-explore" href="recent/">View all recent writing <span aria-hidden="true">→</span></a></p></div></section>
    <section class="wp-section" aria-labelledby="weekly-editions-title"><div class="container"><div class="section-header"><p class="wp-theme-kicker">Distinct editorial stream</p><h2 class="section-title" id="weekly-editions-title">Software Signal Weekly</h2><p class="section-subtitle">The newest newsletter editions, hosted and archived by Beehiiv.</p></div><ul class="wp-theme-articles">{newsletter_rows}</ul><a class="wp-theme-explore" href="https://newsletter.suyogjoshi.com/archive">Browse all newsletter editions <span aria-hidden="true">↗</span></a></div></section>
    <!-- Choose Your Path -->
    <section class="wp-paths" aria-labelledby="paths-title"><div class="container"><div class="section-header"><h2 class="section-title" id="paths-title">Choose Your Path</h2><p class="section-subtitle">Small, stable journeys for readers who want a useful place to start.</p></div><div class="wp-path-grid">{"".join(path_cards)}</div></div></section>
    <!-- Thematic Sections -->
    <section class="wp-themes" aria-labelledby="topics-title"><div class="container"><div class="section-header"><h2 class="section-title" id="topics-title">Topic Clusters</h2><p class="section-subtitle">Curated previews here; complete generated membership on every Topic page.</p></div><div class="wp-themes-list">{"".join(topic_cards)}</div><aside class="series-card"><p class="wp-theme-kicker">Ordered series</p><h2 class="series-card-title">AI-Assisted Software Engineering</h2><p class="series-card-desc">A practical ordered guide from context and codebases through review, agents, and orchestration.</p><a href="series/ai-assisted-software-engineering/" class="wp-theme-explore">Follow the series <span aria-hidden="true">→</span></a></aside><p class="wp-theme-desc">Prefer guided practice? Start with <a href="../training/python-foundations-for-data-science/">Python Foundations for Data Science</a> from Software Signal Learning.</p><span id="cluster-systems-experiments" aria-hidden="true"></span><span id="cluster-review-governance" aria-hidden="true"></span><span id="path-ai-foundations" aria-hidden="true"></span><span id="path-engineering-leadership" aria-hidden="true"></span><span id="cluster-architecture-ai-era" aria-hidden="true"></span><span id="path-context-knowledge" aria-hidden="true"></span><span id="cluster-ai-agents-review" aria-hidden="true"></span>'''


def render_writing_index(articles: list[dict[str, object]]) -> bytes:
    source = (ROOT / "writing" / "index.html").read_text(encoding="utf-8")
    core = render_landing_core(articles)
    rendered, count = re.subn(r'\s*<!-- Latest Writing -->[\s\S]*?\s*(?=<div class="wp-systems-callout">)', "\n\n    " + core + "\n\n        ", source, count=1)
    if count != 1:
        raise ValueError("Writing landing generation markers are missing")
    return rendered.encode("utf-8")


def collection_shell(title: str, description: str, canonical: str, eyebrow: str, body: str) -> bytes:
    shell = (ROOT / "writing" / "index.html").read_text(encoding="utf-8")
    head = shell.split("  <main>", 1)[0].replace("../", "../../")
    footer = shell.split("  </main>", 1)[1].replace("../", "../../")
    head = re.sub(r"<title>.*?</title>", f"<title>{html.escape(title)} | Suyog Joshi</title>", head, count=1)
    head = re.sub(r'<meta name="description" content="[^"]*"', f'<meta name="description" content="{html.escape(description, quote=True)}"', head, count=1)
    head = re.sub(r'<link rel="canonical" href="[^"]+"', f'<link rel="canonical" href="{canonical}"', head, count=1)
    head = re.sub(r'<meta property="og:title" content="[^"]*"', f'<meta property="og:title" content="{html.escape(title, quote=True)} | Suyog Joshi"', head, count=1)
    head = re.sub(r'<meta property="og:description" content="[^"]*"', f'<meta property="og:description" content="{html.escape(description, quote=True)}"', head, count=1)
    head = re.sub(r'<meta property="og:url" content="[^"]*"', f'<meta property="og:url" content="{canonical}"', head, count=1)
    head = re.sub(r'\s*<meta property="og:image(?::(?:width|height|alt))?"[^>]*>', "", head)
    head = re.sub(r'\s*<meta name="twitter:image(?::alt)?"[^>]*>', "", head)
    head = re.sub(r'<meta name="twitter:card" content="[^"]*"', '<meta name="twitter:card" content="summary"', head, count=1)
    head = re.sub(r'<meta name="twitter:title" content="[^"]*"', f'<meta name="twitter:title" content="{html.escape(title, quote=True)} | Suyog Joshi"', head, count=1)
    head = re.sub(r'<meta name="twitter:description" content="[^"]*"', f'<meta name="twitter:description" content="{html.escape(description, quote=True)}"', head, count=1)
    head = re.sub(r'"@id": "[^"]+#collection"', f'"@id": "{canonical}#collection"', head, count=1)
    head = re.sub(r'"url": "https://suyogjoshi.com/writing/"', f'"url": "{canonical}"', head, count=1)
    head = re.sub(r'"name": "Software Signal Writing"', f'"name": {json.dumps(title)}', head, count=1)
    head = re.sub(r'"description": "Articles and essays on AI, software architecture, intelligent systems, engineering practice, and real-world technology decisions\."', f'"description": {json.dumps(description)}', head, count=1)
    main = f'''  <main><section class="wp-hero"><div class="container"><a class="topic-hub-back" href="../../writing/">Back to Writing</a><p class="eyebrow">{html.escape(eyebrow)}</p><h1 class="wp-hero-heading">{html.escape(title)}</h1><p class="wp-hero-sub">{html.escape(description)}</p><nav class="wp-utility-links" aria-label="Writing browse utilities"><a href="../../search/">Search all public content</a><a href="../../feed.xml">Follow via RSS</a></nav></div></section>{body}  </main>'''
    return (head + main + footer).encode("utf-8")


def render_chronology_page(name: str, articles: list[dict[str, object]], has_archive: bool) -> bytes:
    rows = "".join(f'<li class="wp-article-item">{article_link(item, "wp-article-row", "../")}</li>' for item in articles)
    navigation = '<a class="wp-theme-explore" href="../archive/">Browse older articles →</a>' if name == "Recent Writing" and has_archive else '<a class="wp-theme-explore" href="../recent/">Back to recent writing →</a>' if name == "Article Archive" else ""
    body = f'<section class="wp-themes"><div class="container"><ul class="wp-theme-articles chronology-list">{rows}</ul>{navigation}</div></section>'
    slug = "recent" if name == "Recent Writing" else "archive"
    description = "Every public Article Work from the last 100 days, in reverse chronological order." if slug == "recent" else "Every public Article Work older than 100 days, in reverse chronological order."
    return collection_shell(name, description, f"{ORIGIN}/writing/{slug}/", "Writing chronology", body)


def render_topic_page(topic: dict[str, object], articles: list[dict[str, object]]) -> bytes:
    members = [item for item in articles if topic["id"] in item.get("topicIds", [])]
    members.sort(key=lambda item: (str(item["published"]), str(item["workId"])), reverse=True)
    rows = "".join(f'<li class="wp-article-item">{article_link(item, "wp-article-row", "../../")}</li>' for item in members)
    body = f'<section class="wp-themes"><div class="container"><p class="wp-theme-kicker">{len(members)} Article Works</p><ul class="wp-theme-articles">{rows}</ul></div></section>'
    rendered = collection_shell(str(topic["title"]), str(topic["description"]), f'{ORIGIN}/writing/topics/{topic["id"]}/', "Complete Topic", body).replace(b'../../css/', b'../../../css/').replace(b'../../js/', b'../../../js/').replace(b'../../favicon', b'../../../favicon').replace(b'../../assets/', b'../../../assets/').replace(b'href="../../writing/"', b'href="../../../writing/"').replace(b'href="../../search/"', b'href="../../../search/"').replace(b'href="../../feed.xml"', b'href="../../../feed.xml"')
    item_list = {
        "@context": "https://schema.org", "@type": "ItemList",
        "name": f"All {topic['title']} Article Works", "numberOfItems": len(members),
        "itemListOrder": "https://schema.org/ItemListOrderDescending",
        "itemListElement": [
            {"@type": "ListItem", "position": index, "url": item["url"], "name": item["title"]}
            for index, item in enumerate(members, start=1)
        ],
    }
    decoded = rendered.decode("utf-8")
    topic_image = f"{ORIGIN}/assets/social-previews/topic-{topic['id']}.png"
    topic_alt = f"{topic['title']} topic hub."
    decoded = decoded.replace(
        '<meta name="twitter:card" content="summary" />',
        f'<meta property="og:image" content="{topic_image}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />\n  <meta property="og:image:alt" content="{html.escape(topic_alt, quote=True)}" />\n  <meta name="twitter:card" content="summary_large_image" />\n  <meta name="twitter:image" content="{topic_image}" />\n  <meta name="twitter:image:alt" content="{html.escape(topic_alt, quote=True)}" />',
        1,
    )
    decoded, count = re.subn(
        r'("creator": \{ "@id": "https://suyogjoshi.com/#person" \})\n  \}',
        lambda match: match.group(1) + ",\n    \"mainEntity\": " + json.dumps(item_list, ensure_ascii=False, indent=2) + "\n  }",
        decoded,
        count=1,
    )
    if count != 1:
        raise ValueError(f"Topic CollectionPage schema marker missing: {topic['id']}")
    rendered = decoded.encode("utf-8")
    for route in (b'', b'consulting/', b'training/', b'website-services/', b'about/', b'newsletter/', b'framework/', b'research/', b'systems/', b'contact/', b'support/', b'privacy/'):
        rendered = rendered.replace(b'href="../../' + route + b'"', b'href="../../../' + route + b'"')
    return rendered


def generated_artifacts() -> dict[Path, bytes]:
    articles = internal_articles() + external_articles()
    search = build_search_index(articles)
    search_bytes = (json.dumps(search, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    recent, archive = chronology_partition(articles)
    artifacts = {
        FEED_PATH: build_feed(articles), SEARCH_PATH: search_bytes,
        ROOT / "writing" / "index.html": render_writing_index(articles),
        ROOT / "writing" / "recent" / "index.html": render_chronology_page("Recent Writing", recent, bool(archive)),
        ROOT / "writing" / "archive" / "index.html": render_chronology_page("Article Archive", archive, bool(archive)),
    }
    curation = json.loads(CURATION_PATH.read_text(encoding="utf-8"))
    for topic in curation["topics"]:
        artifacts[ROOT / "writing" / "topics" / topic["id"] / "index.html"] = render_topic_page(topic, articles)
    return artifacts


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
    print(f"{action} normalized Writing, chronology, Topic, feed, and Search artifacts.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
