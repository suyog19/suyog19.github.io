"""Validate canonical URL consistency and local links for the static site."""

from __future__ import annotations

import json
import posixpath
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


ROOT = Path(__file__).parents[1]
PRODUCTION_ORIGIN = "https://suyogjoshi.com"
PRIVATE_ROUTE_PREFIXES = (
    "/admin/",
    "/apply/",
    "/learn/",
    "/my-learning/",
    "/training/register-interest/",
)


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonical: list[str] = []
        self.og_urls: list[str] = []
        self.robots: list[str] = []
        self.references: list[tuple[str, str]] = []
        self.ids: set[str] = set()
        self._json_ld = False
        self._json_parts: list[str] = []
        self.json_documents: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.lower(): value or "" for name, value in attrs}
        element_id = values.get("id")
        if element_id:
            self.ids.add(element_id)
        if tag == "a" and values.get("name"):
            self.ids.add(values["name"])

        if tag == "link" and "canonical" in values.get("rel", "").lower().split():
            self.canonical.append(values.get("href", ""))
        if tag == "meta" and values.get("property", "").lower() == "og:url":
            self.og_urls.append(values.get("content", ""))
        if tag == "meta" and values.get("name", "").lower() == "robots":
            self.robots.append(values.get("content", ""))

        reference_attribute = {
            "a": "href",
            "link": "href",
            "script": "src",
            "img": "src",
            "source": "src",
            "iframe": "src",
            "form": "action",
        }.get(tag)
        if reference_attribute and values.get(reference_attribute):
            self.references.append((tag, values[reference_attribute]))

        if tag == "script" and values.get("type", "").lower() == "application/ld+json":
            self._json_ld = True
            self._json_parts = []

    def handle_data(self, data: str) -> None:
        if self._json_ld:
            self._json_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._json_ld:
            self.json_documents.append("".join(self._json_parts))
            self._json_ld = False
            self._json_parts = []


def route_for_file(path: Path) -> str:
    relative = path.relative_to(ROOT).as_posix()
    if relative == "index.html":
        return "/"
    return "/" + relative.removesuffix("index.html")


def local_target(path: str) -> Path | None:
    clean_path = unquote(path)
    if "\\" in clean_path or not clean_path.startswith("/"):
        return None
    candidate = ROOT.joinpath(*[part for part in clean_path.split("/") if part])
    if clean_path.endswith("/") or clean_path == "/":
        return candidate / "index.html"
    if candidate.is_dir():
        return candidate / "index.html"
    if candidate.exists():
        return candidate
    directory_index = candidate / "index.html"
    return directory_index if directory_index.exists() else candidate


def structured_urls(value: object) -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if key in {"url", "@id", "item"} and isinstance(child, str):
                found.append(child)
            found.extend(structured_urls(child))
    elif isinstance(value, list):
        for child in value:
            found.extend(structured_urls(child))
    return found


def parse_page(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def main() -> None:
    errors: list[str] = []
    pages = sorted(ROOT.rglob("index.html"))
    parsed_pages = {path: parse_page(path) for path in pages}

    for page, parsed in parsed_pages.items():
        relative = page.relative_to(ROOT).as_posix()
        route = route_for_file(page)
        expected_page_url = PRODUCTION_ORIGIN + route

        if len(parsed.canonical) != 1:
            errors.append(f"{relative}: expected exactly one canonical URL")
            continue
        canonical = parsed.canonical[0]
        canonical_parts = urlsplit(canonical)
        if canonical_parts.scheme != "https" or canonical_parts.netloc != "suyogjoshi.com":
            errors.append(f"{relative}: canonical must use the production HTTPS origin: {canonical}")
        if "index.html" in canonical_parts.path or not canonical_parts.path.endswith("/"):
            errors.append(f"{relative}: canonical must use directory form: {canonical}")
        if canonical_parts.query or canonical_parts.fragment:
            errors.append(f"{relative}: canonical must not contain a query or fragment: {canonical}")
        robots = ",".join(parsed.robots).lower()
        if parsed.og_urls and parsed.og_urls != [canonical]:
            errors.append(f"{relative}: og:url must exactly match the canonical URL")
        if "noindex" not in robots and parsed.og_urls != [canonical]:
            errors.append(f"{relative}: indexable page must declare an og:url matching canonical")
        if canonical != expected_page_url and "noindex" not in robots:
            errors.append(
                f"{relative}: non-self canonical requires noindex (canonical is {canonical})"
            )
        if any(route.startswith(prefix) for prefix in PRIVATE_ROUTE_PREFIXES):
            if "noindex" not in robots or "nofollow" not in robots:
                errors.append(f"{relative}: private route must remain noindex, nofollow")

        for document in parsed.json_documents:
            try:
                structured = json.loads(document)
            except json.JSONDecodeError as error:
                errors.append(f"{relative}: invalid JSON-LD: {error}")
                continue
            for structured_url in structured_urls(structured):
                parts = urlsplit(structured_url)
                if parts.netloc == "suyogjoshi.com" and (
                    "index.html" in parts.path or not parts.path.endswith("/")
                ):
                    errors.append(
                        f"{relative}: structured-data URL is not directory-style: {structured_url}"
                    )

        base_url = expected_page_url
        for tag, reference in parsed.references:
            if "index.html" in urlsplit(reference).path:
                errors.append(f"{relative}: {tag} link contains index.html: {reference}")
                continue
            parts = urlsplit(reference)
            if parts.scheme in {"mailto", "tel", "data", "javascript"}:
                continue
            if parts.scheme and parts.scheme not in {"http", "https"}:
                continue
            if parts.netloc and parts.netloc not in {"suyogjoshi.com", "www.suyogjoshi.com"}:
                continue

            resolved = urlsplit(urljoin(base_url, reference))
            target_path = posixpath.normpath(resolved.path)
            if resolved.path.endswith("/") and not target_path.endswith("/"):
                target_path += "/"
            target = local_target(target_path)
            if target is None or not target.is_file():
                errors.append(f"{relative}: broken local {tag} URL: {reference}")
                continue
            if resolved.fragment and target.suffix.lower() == ".html":
                target_parser = parsed_pages.get(target) or parse_page(target)
                if resolved.fragment not in target_parser.ids:
                    errors.append(
                        f"{relative}: missing fragment #{resolved.fragment} in {target.relative_to(ROOT).as_posix()}"
                    )

    sitemap_path = ROOT / "sitemap.xml"
    sitemap = sitemap_path.read_text(encoding="utf-8")
    import re

    sitemap_urls = re.findall(r"<loc>([^<]+)</loc>", sitemap)
    for url in sitemap_urls:
        parts = urlsplit(url)
        if parts.scheme != "https" or parts.netloc != "suyogjoshi.com":
            errors.append(f"sitemap.xml: non-production URL: {url}")
            continue
        if "index.html" in parts.path or not parts.path.endswith("/"):
            errors.append(f"sitemap.xml: URL is not directory-style: {url}")
        target = local_target(parts.path)
        if target is None or target not in parsed_pages:
            errors.append(f"sitemap.xml: URL has no matching page: {url}")
            continue
        if parsed_pages[target].canonical != [url]:
            errors.append(f"sitemap.xml: URL does not match page canonical: {url}")

    if errors:
        raise SystemExit("Canonical/link validation failed:\n- " + "\n- ".join(errors))
    print(
        f"Canonical/link validation passed for {len(pages)} pages and "
        f"{len(sitemap_urls)} sitemap URLs."
    )


if __name__ == "__main__":
    main()
