"""Validate the public/private search boundary for Software Signal Training."""

from __future__ import annotations

import re
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).parents[1]
ORIGIN = "https://suyogjoshi.com"

INDEXABLE_ROUTES = (
    "/training/",
    "/training/python-foundations-for-data-science/",
    "/training/applied-data-analysis-with-python/",
    "/training/practical-machine-learning-foundations/",
    "/training/generative-ai-application-development/",
    "/training/engineering-reliable-ai-systems/",
    "/training/provider/",
    "/training/policies/",
    "/training/policies/terms/",
    "/training/policies/cancellation-refunds/",
    "/training/policies/conduct-recording/",
)

NOINDEX_ROUTES = (
    "/training/register-interest/",
    "/training/policies/privacy/",
    "/apply/",
    "/my-learning/",
    "/my-learning/balance/",
    "/my-learning/change/",
    "/my-learning/payment/",
    "/admin/",
)

LEGACY_ROUTES = (
    "/training/python-foundations-ai-data/",
    "/training/applied-python-ai-ml/",
)

COURSE_ROUTES = INDEXABLE_ROUTES[1:6]

COURSE_EVIDENCE_LINKS = {
    "/training/python-foundations-for-data-science/": (
        "../../writing/ai-ml-data-science-explained-simply/",
        "../../systems/ai-native-learning-platform/",
    ),
    "/training/applied-data-analysis-with-python/": (
        "../../writing/ai-ml-data-science-explained-simply/",
        "../../systems/ai-native-learning-platform/",
    ),
    "/training/practical-machine-learning-foundations/": (
        "../../writing/ai-ml-data-science-explained-simply/",
        "../../writing/understanding-the-ai-ecosystem/",
    ),
    "/training/generative-ai-application-development/": (
        "../../writing/how-modern-llm-systems-really-work/",
        "../../systems/ai-workflow-lab/",
    ),
    "/training/engineering-reliable-ai-systems/": (
        "../../writing/human-review-gates-ai-assisted-delivery/",
        "../../systems/ai-dev-orchestrator/",
    ),
}


class HeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.description = ""
        self.canonical = ""
        self.robots = ""
        self.og: dict[str, str] = {}
        self.twitter: dict[str, str] = {}
        self.h1_count = 0
        self.links: set[str] = set()
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        if tag == "title":
            self._in_title = True
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "a" and values.get("href"):
            self.links.add(values["href"])
        elif tag == "link" and "canonical" in values.get("rel", "").split():
            self.canonical = values.get("href", "")
        elif tag == "meta":
            name = values.get("name", "").lower()
            prop = values.get("property", "").lower()
            if name == "description":
                self.description = values.get("content", "")
            elif name == "robots":
                self.robots = values.get("content", "").lower()
            elif name.startswith("twitter:"):
                self.twitter[name] = values.get("content", "")
            elif prop.startswith("og:"):
                self.og[prop] = values.get("content", "")

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False


def file_for(route: str) -> Path:
    return ROOT / route.strip("/") / "index.html"


def parse(route: str) -> HeadParser:
    parser = HeadParser()
    parser.feed(file_for(route).read_text(encoding="utf-8"))
    parser.title = " ".join(parser.title.split())
    return parser


def main() -> None:
    errors: list[str] = []
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    sitemap_urls = set(re.findall(r"<loc>([^<]+)</loc>", sitemap))

    for route in INDEXABLE_ROUTES:
        page = parse(route)
        expected_url = ORIGIN + route
        if "noindex" in page.robots:
            errors.append(f"{route}: indexable route declares noindex")
        for field, value in (
            ("title", page.title),
            ("description", page.description),
            ("canonical", page.canonical),
            ("og:title", page.og.get("og:title", "")),
            ("og:description", page.og.get("og:description", "")),
            ("og:type", page.og.get("og:type", "")),
            ("og:url", page.og.get("og:url", "")),
            ("twitter:card", page.twitter.get("twitter:card", "")),
            ("twitter:title", page.twitter.get("twitter:title", "")),
            ("twitter:description", page.twitter.get("twitter:description", "")),
        ):
            if not value:
                errors.append(f"{route}: missing {field}")
        if page.canonical != expected_url or page.og.get("og:url") != expected_url:
            errors.append(f"{route}: canonical and og:url must match {expected_url}")
        if page.h1_count != 1:
            errors.append(f"{route}: expected exactly one H1, found {page.h1_count}")
        if expected_url not in sitemap_urls:
            errors.append(f"{route}: missing from sitemap.xml")

    for route in NOINDEX_ROUTES:
        page = parse(route)
        if "noindex" not in page.robots:
            errors.append(f"{route}: private or duplicate route must declare noindex")
        if ORIGIN + route in sitemap_urls:
            errors.append(f"{route}: noindex route must not appear in sitemap.xml")

    for route in LEGACY_ROUTES:
        page = parse(route)
        if "noindex" not in page.robots:
            errors.append(f"{route}: legacy redirect must declare noindex")
        if ORIGIN + route in sitemap_urls:
            errors.append(f"{route}: legacy redirect must not appear in sitemap.xml")
        if page.canonical == ORIGIN + route:
            errors.append(f"{route}: legacy redirect must canonicalize to its replacement")

    hub_html = file_for("/training/").read_text(encoding="utf-8")
    for route in COURSE_ROUTES:
        relative = route.removeprefix("/training/")
        if f'href="{relative}"' not in hub_html:
            errors.append(f"/training/: missing crawlable course link to {route}")

    for route, expected_links in COURSE_EVIDENCE_LINKS.items():
        html = file_for(route).read_text(encoding="utf-8")
        if "Related reading and systems" not in html:
            errors.append(f"{route}: missing related learning section")
        for expected_link in expected_links:
            if f'href="{expected_link}"' not in html:
                errors.append(f"{route}: missing evidence link to {expected_link}")

    discovery_sources = {
        "/": "training/",
        "/about/": "../training/",
        "/writing/": "../training/python-foundations-for-data-science/",
        "/systems/": "../training/",
    }
    for route, expected_link in discovery_sources.items():
        html = file_for(route).read_text(encoding="utf-8")
        if f'href="{expected_link}"' not in html:
            errors.append(f"{route}: missing contextual Training discovery link")

    if errors:
        raise SystemExit("Training discoverability validation failed:\n- " + "\n- ".join(errors))
    print(
        "Training discoverability validation passed for "
        f"{len(INDEXABLE_ROUTES)} indexable, {len(NOINDEX_ROUTES)} noindex, "
        f"and {len(LEGACY_ROUTES)} legacy routes."
    )


if __name__ == "__main__":
    main()
