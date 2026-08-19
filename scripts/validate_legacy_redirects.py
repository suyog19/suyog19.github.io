"""Validate inventory-derived legacy public-route redirect contracts."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

from public_page_inventory import (
    InventoryError,
    PRODUCTION_ORIGIN,
    PageClassification,
    PublicPage,
    discover_pages,
)


ROOT = Path(__file__).parents[1]
PERMANENT_STATUSES = {"301", "308"}
UNSAFE_RUNTIME_TERMS = ("location.search", "location.hash", "URLSearchParams", "document.referrer")


@dataclass(frozen=True)
class RedirectRule:
    source: str
    destination: str
    status: str
    line: int


class FallbackParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refreshes: list[str] = []
        self.links: list[tuple[str, str]] = []
        self.scripts: list[str] = []
        self._link_href: str | None = None
        self._link_text: list[str] = []
        self._in_script = False
        self._script_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.lower(): value or "" for name, value in attrs}
        if tag == "meta" and values.get("http-equiv", "").casefold() == "refresh":
            self.refreshes.append(values.get("content", ""))
        elif tag == "a" and values.get("href"):
            self._link_href = values["href"]
            self._link_text = []
        elif tag == "script" and not values.get("src"):
            self._in_script = True
            self._script_text = []

    def handle_data(self, data: str) -> None:
        if self._link_href is not None:
            self._link_text.append(data)
        if self._in_script:
            self._script_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._link_href is not None:
            self.links.append((self._link_href, " ".join("".join(self._link_text).split())))
            self._link_href = None
            self._link_text = []
        elif tag == "script" and self._in_script:
            self.scripts.append("".join(self._script_text))
            self._in_script = False
            self._script_text = []


def clean_absolute(base_route: str, value: str) -> str | None:
    absolute = urlsplit(urljoin(PRODUCTION_ORIGIN + base_route, value.strip()))
    if absolute.scheme != "https" or absolute.netloc != "suyogjoshi.com":
        return None
    if absolute.query or absolute.fragment or "index.html" in absolute.path or not absolute.path.endswith("/"):
        return None
    return PRODUCTION_ORIGIN + absolute.path


def parse_refresh(value: str) -> str | None:
    match = re.fullmatch(r"\s*0\s*;\s*url\s*=\s*(['\"]?)(.*?)\1\s*", value, flags=re.IGNORECASE)
    return match.group(2) if match else None


def parse_redirects(root: Path) -> tuple[list[RedirectRule], list[str]]:
    errors: list[str] = []
    rules: list[RedirectRule] = []
    path = root / "_redirects"
    if not path.is_file():
        return [], ["_redirects: missing host-level redirect declarations"]
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        fields = line.split()
        if len(fields) != 3:
            errors.append(f"_redirects:{number}: expected source, destination, and status")
            continue
        source, destination, status = fields
        rules.append(RedirectRule(source, destination, status, number))
    return rules, errors


def validate_fallback(root: Path, page: PublicPage) -> list[str]:
    errors: list[str] = []
    source = (root / page.source).read_text(encoding="utf-8")
    parser = FallbackParser()
    parser.feed(source)
    target = str(page.canonical)

    if len(parser.refreshes) != 1:
        errors.append(f"{page.source.as_posix()}: expected exactly one immediate meta refresh")
    else:
        refresh = parse_refresh(parser.refreshes[0])
        if refresh is None or clean_absolute(page.route, refresh) != target:
            errors.append(f"{page.source.as_posix()}: meta refresh must resolve directly to {target}")

    visible_links = [(href, text) for href, text in parser.links if text]
    resolved_links = [clean_absolute(page.route, href) for href, _ in visible_links]
    if len(visible_links) != 1 or resolved_links != [target]:
        errors.append(f"{page.source.as_posix()}: expected one visible recovery link to {target}")

    scripts = "\n".join(parser.scripts)
    for term in UNSAFE_RUNTIME_TERMS:
        if term in scripts:
            errors.append(f"{page.source.as_posix()}: must not propagate request state via {term}")
    replacements = re.findall(r"location\.replace\(\s*(['\"])(.*?)\1\s*\)", scripts)
    if "location.replace" in scripts and len(replacements) != scripts.count("location.replace"):
        errors.append(f"{page.source.as_posix()}: JavaScript redirect destination must be a static string")
    for _, destination in replacements:
        if clean_absolute(page.route, destination) != target:
            errors.append(f"{page.source.as_posix()}: JavaScript redirect must resolve directly to {target}")
    return errors


def validate_rules(pages: list[PublicPage], rules: list[RedirectRule]) -> list[str]:
    errors: list[str] = []
    legacy = {page.route: page for page in pages if page.classification is PageClassification.LEGACY_NONCANONICAL}
    by_source: dict[str, list[RedirectRule]] = {}
    redirect_source_routes = {rule.source.rstrip("/") + "/" for rule in rules}
    for rule in rules:
        by_source.setdefault(rule.source, []).append(rule)
        source_parts = urlsplit(rule.source)
        destination_parts = urlsplit(rule.destination)
        if source_parts.scheme or source_parts.netloc or source_parts.query or source_parts.fragment:
            errors.append(f"_redirects:{rule.line}: source must be a clean root-relative path")
        if (
            destination_parts.scheme
            or destination_parts.netloc
            or destination_parts.query
            or destination_parts.fragment
            or not destination_parts.path.endswith("/")
        ):
            errors.append(f"_redirects:{rule.line}: destination must be a clean root-relative directory path")
        if rule.status not in PERMANENT_STATUSES:
            errors.append(f"_redirects:{rule.line}: legacy redirect must use 301 or 308")
        if destination_parts.path in redirect_source_routes:
            errors.append(
                f"_redirects:{rule.line}: redirect chain or loop targets declared source {destination_parts.path}"
            )

    for source, matching in by_source.items():
        if len(matching) > 1:
            errors.append(f"_redirects: duplicate or contradictory source {source}")

    expected_sources: set[str] = set()
    legacy_routes = set(legacy)
    for route, page in legacy.items():
        target_path = urlsplit(str(page.canonical)).path
        for source in (route.rstrip("/"), route):
            expected_sources.add(source)
            matching = by_source.get(source, [])
            if len(matching) != 1:
                errors.append(f"_redirects: {source} must have exactly one permanent redirect")
            elif matching[0].destination != target_path:
                errors.append(f"_redirects:{matching[0].line}: {source} must redirect directly to {target_path}")
        if target_path in legacy_routes:
            errors.append(f"{route}: redirect chain or loop targets legacy route {target_path}")

    extras = sorted(set(by_source) - expected_sources)
    if extras:
        errors.append("_redirects: rules without inventory-derived legacy pages: " + ", ".join(extras))
    return errors


def validate_discovery(root: Path, pages: list[PublicPage]) -> list[str]:
    errors: list[str] = []
    legacy = [page for page in pages if page.classification is PageClassification.LEGACY_NONCANONICAL]
    sitemap = (root / "sitemap.xml").read_text(encoding="utf-8")
    feed_sources = "\n".join(path.read_text(encoding="utf-8") for path in root.glob("*feed*.xml"))
    try:
        search_items = json.loads((root / "data" / "search-index.json").read_text(encoding="utf-8")).get("items", [])
    except (OSError, json.JSONDecodeError) as exc:
        return [f"data/search-index.json: cannot validate legacy-route exclusion: {exc}"]
    search_urls = {str(item.get("url", "")) for item in search_items if isinstance(item, dict)}

    legacy_routes = {page.route for page in legacy}
    for page in legacy:
        source_url = PRODUCTION_ORIGIN + page.route
        if source_url in sitemap:
            errors.append(f"sitemap.xml: legacy route must be excluded: {page.route}")
        if source_url in feed_sources:
            errors.append(f"feed discovery: legacy route must be excluded: {page.route}")
        if source_url in search_urls or page.route in search_urls:
            errors.append(f"search discovery: legacy route must be excluded: {page.route}")

    for page in pages:
        if page.route in legacy_routes:
            continue
        parser = FallbackParser()
        parser.feed((root / page.source).read_text(encoding="utf-8"))
        for href, _ in parser.links:
            parsed = urlsplit(urljoin(PRODUCTION_ORIGIN + page.route, href))
            if parsed.netloc in {"", "suyogjoshi.com"} and parsed.path in legacy_routes:
                errors.append(f"{page.source.as_posix()}: controlled link targets legacy route {parsed.path}")
    return errors


def validate(root: Path = ROOT) -> tuple[list[PublicPage], list[str]]:
    root = root.resolve()
    try:
        pages = discover_pages(root)
    except (InventoryError, OSError) as exc:
        return [], [f"public-page inventory failed: {exc}"]
    legacy = [page for page in pages if page.classification is PageClassification.LEGACY_NONCANONICAL]
    errors: list[str] = []
    if not legacy:
        errors.append("public-page inventory found no legacy noncanonical routes")
    for page in legacy:
        errors.extend(validate_fallback(root, page))
    rules, redirect_errors = parse_redirects(root)
    errors.extend(redirect_errors)
    errors.extend(validate_rules(pages, rules))
    errors.extend(validate_discovery(root, pages))
    return legacy, errors


def main() -> int:
    legacy, errors = validate()
    if errors:
        print("Legacy redirect validation failed:", file=sys.stderr)
        for message in errors:
            print(f"- {message}", file=sys.stderr)
        return 1
    print(
        f"Validated {len(legacy)} inventory-derived legacy routes with matching permanent host rules, "
        "safe static fallbacks, direct indexable destinations, and discovery exclusion."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
