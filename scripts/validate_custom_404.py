"""Validate the branded GitHub Pages 404 recovery contract."""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

from public_page_inventory import PageClassification, discover_pages


ROOT = Path(__file__).parents[1]
PAGE = ROOT / "404.html"
REQUIRED_RECOVERY_PATHS = {"/", "/writing/", "/systems/", "/training/", "/about/", "/contact/"}
PRIVATE_PATH_PREFIXES = ("/admin", "/apply", "/learn", "/my-learning")
class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.assets: list[str] = []
        self.robots: str | None = None
        self.canonical = False
        self.h1_count = 0
        self.title_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "a" and values.get("href"):
            self.links.append(str(values["href"]))
        elif tag in {"link", "script"}:
            value = values.get("href") or values.get("src")
            if value:
                self.assets.append(str(value))
            if tag == "link" and values.get("rel") == "canonical":
                self.canonical = True
        elif tag == "meta" and values.get("name") == "robots":
            self.robots = values.get("content")
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "title":
            self.title_count += 1


def main() -> int:
    errors: list[str] = []
    if not PAGE.is_file():
        print("Custom 404 validation failed:\n- missing repository-level 404.html", file=sys.stderr)
        return 1

    source = PAGE.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(source)

    if parser.robots != "noindex, follow":
        errors.append("404.html: robots treatment must be exactly noindex, follow")
    if parser.canonical:
        errors.append("404.html: an error page must not canonicalize to a successful route")
    if parser.h1_count != 1 or parser.title_count != 1:
        errors.append("404.html: expected exactly one title and one h1")
    if "That page could not be found." not in source:
        errors.append("404.html: missing clear page-not-found heading")

    local_links = {urlparse(link).path for link in parser.links if not urlparse(link).netloc}
    missing_paths = sorted(REQUIRED_RECOVERY_PATHS - local_links)
    if missing_paths:
        errors.append("404.html: missing recovery links: " + ", ".join(missing_paths))
    private_links = sorted(path for path in local_links if path.startswith(PRIVATE_PATH_PREFIXES))
    if private_links:
        errors.append("404.html: exposes private routes: " + ", ".join(private_links))
    for path in sorted(local_links):
        target = ROOT / (path.lstrip("/") or "index.html")
        if target.is_dir():
            target /= "index.html"
        if not target.is_file():
            errors.append(f"404.html: recovery link does not resolve to a public file: {path}")

    for asset in parser.assets:
        parsed = urlparse(asset)
        if parsed.netloc or asset.startswith("https://"):
            continue
        if not asset.startswith("/"):
            errors.append(f"404.html: local asset must be root-relative for arbitrary missing routes: {asset}")
            continue
        target = ROOT / parsed.path.lstrip("/")
        if not target.is_file():
            errors.append(f"404.html: local asset does not exist: {parsed.path}")

    unsafe_runtime_terms = ("location.", "location[", "URLSearchParams", "document.referrer")
    for term in unsafe_runtime_terms:
        if term in source:
            errors.append(f"404.html: must not inspect or reflect the missing request via {term}")
    if "send_page_view: false" not in source:
        errors.append("404.html: analytics must disable the automatic unsanitized page view")
    for safe_value in ("page_location: 'https://suyogjoshi.com/404'", "page_path: '/404'", "page_referrer: ''"):
        if safe_value not in source:
            errors.append(f"404.html: missing privacy-safe analytics value {safe_value}")
    if re.search(r"gtag\(['\"]config['\"],\s*['\"]G-PKL56GJ38H['\"]\s*\);", source):
        errors.append("404.html: default GA configuration would expose the missing path")

    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    if "suyogjoshi.com/404" in sitemap:
        errors.append("sitemap.xml: error page must not be listed")
    for feed in ROOT.glob("*.xml"):
        if "feed" in feed.name.lower() and "suyogjoshi.com/404" in feed.read_text(encoding="utf-8"):
            errors.append(f"{feed.name}: error page must not be listed")

    legacy_routes = {
        page.route
        for page in discover_pages(ROOT)
        if page.classification is PageClassification.LEGACY_NONCANONICAL
    }
    for source_path in local_links:
        normalized = source_path.rstrip("/") + "/"
        if normalized in legacy_routes:
            errors.append(f"404.html: legacy route {source_path} must not be presented as recovery content")

    if errors:
        print("Custom 404 validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Validated custom 404 recovery links, privacy-safe analytics, noindex treatment, root-relative assets, sitemap exclusion, and the boundary from inventory-derived legacy routes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
