"""Authoritative classification and sitemap contract for repository HTML pages."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from enum import Enum
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET


PRODUCTION_ORIGIN = "https://suyogjoshi.com"
SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"
PRIVATE_ROUTE_PREFIXES = (
    "/admin/",
    "/apply/",
    "/learn/",
    "/my-learning/",
    "/training/register-interest/",
)
SPECIAL_PUBLIC_NOINDEX_FILES = {"404.html": "/404.html"}
EXCLUDED_TOP_LEVEL_DIRECTORIES = {"node_modules", "playwright-report", "test-results"}


class InventoryError(ValueError):
    """Raised when page metadata contradicts the public publishing contract."""


class PageClassification(str, Enum):
    PUBLIC_INDEXABLE = "public-indexable"
    PUBLIC_NOINDEX = "public-noindex"
    PRIVATE_OPERATIONAL = "private-operational"
    LEGACY_NONCANONICAL = "legacy-noncanonical"


@dataclass(frozen=True)
class PublicPage:
    source: Path
    route: str
    canonical: str | None
    classification: PageClassification
    robots: frozenset[str]
    lastmod: str | None = None


class MetadataParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonicals: list[str] = []
        self.og_urls: list[str] = []
        self.robots: list[str] = []
        self.lastmods: list[str] = []
        self._in_dt = False
        self._dt_parts: list[str] = []
        self._awaiting_lastmod = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.lower(): value or "" for name, value in attrs}
        if tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonicals.append(values.get("href", ""))
        elif tag == "meta" and values.get("property", "").lower() == "og:url":
            self.og_urls.append(values.get("content", ""))
        elif tag == "meta" and values.get("name", "").lower() == "robots":
            self.robots.append(values.get("content", ""))
        elif tag == "dt":
            self._in_dt = True
            self._dt_parts = []
            self._awaiting_lastmod = False
        elif tag == "time" and self._awaiting_lastmod:
            self.lastmods.append(values.get("datetime", ""))
            self._awaiting_lastmod = False

    def handle_data(self, data: str) -> None:
        if self._in_dt:
            self._dt_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "dt" and self._in_dt:
            label = " ".join("".join(self._dt_parts).split()).casefold()
            self._awaiting_lastmod = label == "last updated"
            self._in_dt = False
            self._dt_parts = []
        elif tag == "dl":
            self._awaiting_lastmod = False


def route_for_file(root: Path, path: Path) -> str:
    relative = path.relative_to(root).as_posix()
    if relative == "index.html":
        return "/"
    if path.name != "index.html":
        raise InventoryError(f"{relative}: unsupported standalone HTML route")
    return "/" + relative.removesuffix("index.html")


def expected_canonical(route: str) -> str:
    return PRODUCTION_ORIGIN + route


def parse_metadata(path: Path) -> MetadataParser:
    parser = MetadataParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def robots_tokens(values: list[str]) -> frozenset[str]:
    return frozenset(
        token.strip().casefold()
        for value in values
        for token in value.replace(";", ",").split(",")
        if token.strip()
    )


def validate_canonical_format(source: Path, canonical: str) -> None:
    parts = urlsplit(canonical)
    if parts.scheme != "https" or parts.netloc != "suyogjoshi.com":
        raise InventoryError(f"{source.as_posix()}: canonical must use the production HTTPS origin: {canonical}")
    if parts.query or parts.fragment or "index.html" in parts.path or not parts.path.endswith("/"):
        raise InventoryError(f"{source.as_posix()}: canonical must use clean directory form: {canonical}")


def explicit_lastmod(source: Path, parser: MetadataParser) -> str | None:
    if len(parser.lastmods) > 1:
        raise InventoryError(f"{source.as_posix()}: expected at most one visible Last updated date")
    if not parser.lastmods:
        return None
    value = parser.lastmods[0]
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise InventoryError(
            f"{source.as_posix()}: Last updated time must use an ISO calendar date, found {value!r}"
        ) from exc
    if parsed.isoformat() != value:
        raise InventoryError(f"{source.as_posix()}: Last updated date must be canonical ISO form: {value!r}")
    return value


def classify_page(root: Path, path: Path) -> PublicPage:
    relative = path.relative_to(root)
    parser = parse_metadata(path)
    robots = robots_tokens(parser.robots)

    special_route = SPECIAL_PUBLIC_NOINDEX_FILES.get(relative.as_posix())
    if special_route is not None:
        if "noindex" not in robots:
            raise InventoryError(f"{relative.as_posix()}: special public error page must remain noindex")
        if parser.canonicals:
            raise InventoryError(f"{relative.as_posix()}: special public error page must not declare a canonical")
        return PublicPage(relative, special_route, None, PageClassification.PUBLIC_NOINDEX, robots)

    route = route_for_file(root, path)
    if len(parser.canonicals) != 1:
        raise InventoryError(f"{relative.as_posix()}: expected exactly one canonical URL")
    canonical = parser.canonicals[0]
    validate_canonical_format(relative, canonical)
    expected = expected_canonical(route)
    noindex = "noindex" in robots
    is_private = any(route.startswith(prefix) for prefix in PRIVATE_ROUTE_PREFIXES)

    if parser.og_urls and parser.og_urls != [canonical]:
        raise InventoryError(f"{relative.as_posix()}: og:url must exactly match the canonical URL")
    if not noindex and parser.og_urls != [canonical]:
        raise InventoryError(f"{relative.as_posix()}: indexable page requires one matching og:url")

    if is_private:
        if not {"noindex", "nofollow"}.issubset(robots):
            raise InventoryError(f"{relative.as_posix()}: private/operational route must be noindex, nofollow")
        if canonical != expected:
            raise InventoryError(f"{relative.as_posix()}: private/operational route must remain self-canonical")
        classification = PageClassification.PRIVATE_OPERATIONAL
    elif canonical != expected:
        if not noindex:
            raise InventoryError(f"{relative.as_posix()}: non-self canonical page must be noindex")
        classification = PageClassification.LEGACY_NONCANONICAL
    elif noindex:
        classification = PageClassification.PUBLIC_NOINDEX
    else:
        classification = PageClassification.PUBLIC_INDEXABLE

    lastmod = explicit_lastmod(relative, parser)
    if lastmod and classification is not PageClassification.PUBLIC_INDEXABLE:
        raise InventoryError(f"{relative.as_posix()}: only indexable canonical pages may publish sitemap lastmod")
    return PublicPage(relative, route, canonical, classification, robots, lastmod)


def discover_pages(root: Path) -> list[PublicPage]:
    root = root.resolve()
    source_paths = [
        path for path in sorted(root.rglob("*.html"))
        if path.relative_to(root).parts[0] not in EXCLUDED_TOP_LEVEL_DIRECTORIES
    ]
    pages = [classify_page(root, path) for path in source_paths]
    indexable = [page for page in pages if page.classification is PageClassification.PUBLIC_INDEXABLE]
    canonicals = [page.canonical for page in indexable]
    duplicates = sorted({url for url in canonicals if canonicals.count(url) > 1})
    if duplicates:
        raise InventoryError(f"duplicate indexable canonical URLs: {duplicates}")

    indexable_urls = set(canonicals)
    for page in pages:
        if page.classification is PageClassification.LEGACY_NONCANONICAL and page.canonical not in indexable_urls:
            raise InventoryError(
                f"{page.source.as_posix()}: non-canonical target is not an indexable repository page: {page.canonical}"
            )
    return pages


def render_sitemap(pages: list[PublicPage]) -> str:
    indexable = sorted(
        (page for page in pages if page.classification is PageClassification.PUBLIC_INDEXABLE),
        key=lambda page: str(page.canonical),
    )
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', f'<urlset xmlns="{SITEMAP_NAMESPACE}">']
    for page in indexable:
        lines.extend(("  <url>", f"    <loc>{escape(str(page.canonical), quote=False)}</loc>"))
        if page.lastmod:
            lines.append(f"    <lastmod>{page.lastmod}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def validate_sitemap(source: str, pages: list[PublicPage]) -> list[str]:
    errors: list[str] = []
    try:
        root = ET.fromstring(source)
    except ET.ParseError as exc:
        return [f"sitemap.xml is not well formed: {exc}"]
    namespace = f"{{{SITEMAP_NAMESPACE}}}"
    if root.tag != namespace + "urlset":
        return ["sitemap.xml root must be the sitemap urlset element"]

    actual: list[tuple[str, str | None]] = []
    for position, element in enumerate(root, start=1):
        if element.tag != namespace + "url":
            errors.append(f"sitemap entry {position}: unexpected element {element.tag}")
            continue
        children = list(element)
        unknown = [child.tag for child in children if child.tag not in {namespace + "loc", namespace + "lastmod"}]
        if unknown:
            errors.append(f"sitemap entry {position}: decorative or unsupported metadata: {unknown}")
        locations = [child.text or "" for child in children if child.tag == namespace + "loc"]
        lastmods = [child.text or "" for child in children if child.tag == namespace + "lastmod"]
        if len(locations) != 1 or len(lastmods) > 1:
            errors.append(f"sitemap entry {position}: requires one loc and at most one lastmod")
            continue
        actual.append((locations[0], lastmods[0] if lastmods else None))

    urls = [url for url, _ in actual]
    duplicates = sorted({url for url in urls if urls.count(url) > 1})
    if duplicates:
        errors.append(f"duplicate sitemap URLs: {duplicates}")

    expected = {
        str(page.canonical): page.lastmod
        for page in pages
        if page.classification is PageClassification.PUBLIC_INDEXABLE
    }
    actual_map = dict(actual)
    missing = sorted(set(expected) - set(actual_map))
    extra = sorted(set(actual_map) - set(expected))
    if missing:
        errors.append(f"indexable pages missing from sitemap: {missing}")
    if extra:
        errors.append(f"non-indexable or unknown pages present in sitemap: {extra}")
    for url in sorted(set(expected).intersection(actual_map)):
        if actual_map[url] != expected[url]:
            errors.append(
                f"{url}: sitemap lastmod {actual_map[url]!r} does not match explicit source {expected[url]!r}"
            )
    return errors
