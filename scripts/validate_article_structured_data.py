"""Validate structured data on public writing articles and series pages."""

from __future__ import annotations

import json
import re
import sys
from datetime import date, datetime
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).parents[1]
WRITING = ROOT / "writing"
PRODUCTION_ORIGIN = "https://suyogjoshi.com"
PERSON_ID = f"{PRODUCTION_ORIGIN}/#person"


class StructuredDataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.canonical = ""
        self.headline_parts: list[str] = []
        self._capture_headline = False
        self._json_ld = False
        self._json_parts: list[str] = []
        self.json_documents: list[object] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.lower(): value or "" for name, value in attrs}
        if tag == "meta":
            key = values.get("name") or values.get("property")
            if key:
                self.meta[key.lower()] = values.get("content", "")
        elif tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonical = values.get("href", "")
        elif tag == "h1" and "article-page-title" in values.get("class", "").split():
            self._capture_headline = True
        elif tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._json_ld = True
            self._json_parts = []

    def handle_data(self, data: str) -> None:
        if self._json_ld:
            self._json_parts.append(data)
        elif self._capture_headline:
            self.headline_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "h1" and self._capture_headline:
            self._capture_headline = False
        elif tag == "script" and self._json_ld:
            self.json_documents.append(json.loads("".join(self._json_parts)))
            self._json_ld = False

    @property
    def headline(self) -> str:
        return " ".join("".join(self.headline_parts).split())


def schema_nodes(document: object) -> list[dict[str, object]]:
    if isinstance(document, dict):
        graph = document.get("@graph")
        if isinstance(graph, list):
            return [node for node in graph if isinstance(node, dict)]
        return [document]
    if isinstance(document, list):
        return [node for node in document if isinstance(node, dict)]
    return []


def validate_article(path: Path) -> list[str]:
    errors: list[str] = []
    parser = StructuredDataParser()
    source = path.read_text(encoding="utf-8")
    try:
        parser.feed(source)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        return [f"{path.relative_to(ROOT)}: malformed structured data: {exc}"]
    nodes = [node for document in parser.json_documents for node in schema_nodes(document)]
    postings = [node for node in nodes if node.get("@type") == "BlogPosting"]
    if len(postings) != 1:
        return [f"{path.relative_to(ROOT)}: expected exactly one BlogPosting, found {len(postings)}"]
    node = postings[0]
    required = ("@context", "@id", "headline", "description", "url", "mainEntityOfPage", "datePublished", "author", "publisher")
    for field in required:
        if not node.get(field):
            errors.append(f"{path.relative_to(ROOT)}: BlogPosting missing {field}")
    if node.get("headline") != parser.headline:
        errors.append(f"{path.relative_to(ROOT)}: headline does not match visible h1")
    if node.get("description") != parser.meta.get("description"):
        errors.append(f"{path.relative_to(ROOT)}: description does not match meta description")
    if node.get("url") != parser.canonical or node.get("@id") != f"{parser.canonical}#article":
        errors.append(f"{path.relative_to(ROOT)}: url or @id does not match canonical")
    if node.get("mainEntityOfPage") != {"@type": "WebPage", "@id": parser.canonical}:
        errors.append(f"{path.relative_to(ROOT)}: mainEntityOfPage does not match canonical")
    for role in ("author", "publisher"):
        entity = node.get(role)
        if not isinstance(entity, dict) or entity.get("@id") != PERSON_ID:
            errors.append(f"{path.relative_to(ROOT)}: {role} must reference {PERSON_ID}")
    try:
        date.fromisoformat(str(node.get("datePublished")))
    except ValueError:
        errors.append(f"{path.relative_to(ROOT)}: datePublished must be ISO YYYY-MM-DD")
    visible_date_match = re.search(r"<strong>Published On:</strong>\s*([^<]+)", source)
    if not visible_date_match:
        errors.append(f"{path.relative_to(ROOT)}: missing visible publication date")
    else:
        try:
            visible_date = datetime.strptime(visible_date_match.group(1).strip(), "%d %b %Y").date().isoformat()
            if visible_date != node.get("datePublished"):
                errors.append(f"{path.relative_to(ROOT)}: datePublished does not match visible publication date")
        except ValueError:
            errors.append(f"{path.relative_to(ROOT)}: visible publication date must use dd MMM yyyy")
    og_image = parser.meta.get("og:image")
    if og_image and node.get("image") != og_image:
        errors.append(f"{path.relative_to(ROOT)}: image does not match og:image")
    if not og_image and "image" in node:
        errors.append(f"{path.relative_to(ROOT)}: image present without an approved og:image")
    return errors


def main() -> int:
    errors: list[str] = []
    article_paths = sorted(path / "index.html" for path in WRITING.iterdir() if path.is_dir() and path.name != "series" and (path / "index.html").exists())
    for path in article_paths:
        errors.extend(validate_article(path))
    for relative in ("writing/series/index.html", "writing/series/ai-assisted-software-engineering/index.html"):
        parser = StructuredDataParser()
        try:
            parser.feed((ROOT / relative).read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{relative}: malformed structured data: {exc}")
            continue
        nodes = [node for document in parser.json_documents for node in schema_nodes(document)]
        if any(node.get("@type") == "BlogPosting" for node in nodes):
            errors.append(f"{relative}: series pages must not use BlogPosting")
        if not any(node.get("@type") == "CollectionPage" for node in nodes):
            errors.append(f"{relative}: missing CollectionPage structured data")
    if errors:
        print("Article structured-data validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Validated BlogPosting structured data for {len(article_paths)} public articles and 2 series pages.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
