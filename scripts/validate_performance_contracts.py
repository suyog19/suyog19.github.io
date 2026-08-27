"""Validate deterministic asset-loading contracts established by issue #395."""

from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).parents[1]
FONT_STYLESHEET = (
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700"
    "&family=Inter:wght@400;500;600&display=swap"
)
LEARNING_ROOTS = {"apply", "learn", "my-learning", "privacy", "training"}
SUPPORT_ROOTS = {"support"}
CARD_ROOTS = {"card"}
RAW_SIZE_BUDGETS = {
    # Issue #607 deliberately expands the shared token/shell foundation. These
    # reviewed ceilings retain less than 9% headroom over the accepted files.
    "css/base.css": 3600,
    "css/components.css": 14500,
    # Issue #608 adds the semantic flagship homepage and canonical Framework map.
    "css/pages.css": 175000,
    "css/learning.css": 54000,
    "css/support.css": 6000,
    "css/card.css": 8000,
}


class AssetParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.stylesheets: list[str] = []
        self.scripts: list[str] = []
        self.iframes: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name: value or "" for name, value in attrs}
        if tag == "link" and "stylesheet" in values.get("rel", "").lower().split():
            self.stylesheets.append(values.get("href", ""))
        elif tag == "script" and values.get("src"):
            self.scripts.append(values["src"])
        elif tag == "iframe":
            self.iframes.append(values)


def parse(path: Path) -> AssetParser:
    parser = AssetParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def route_root(path: Path, root: Path) -> str:
    relative = path.relative_to(root)
    return relative.parts[0] if len(relative.parts) > 1 else ""


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    research_page = root / "research" / "ai-teaching-workflows" / "index.html"

    for path in sorted(root.rglob("*.html")):
        page = parse(path)
        relative = path.relative_to(root).as_posix()
        for kind, assets in (("stylesheet", page.stylesheets), ("script", page.scripts)):
            duplicates = sorted({asset for asset in assets if assets.count(asset) > 1})
            if duplicates:
                errors.append(f"{relative}: duplicate {kind} references: {duplicates}")

        learning = [href for href in page.stylesheets if urlparse(href).path.endswith("/css/learning.css")]
        if learning and route_root(path, root) not in LEARNING_ROOTS:
            errors.append(f"{relative}: unrelated route loads css/learning.css")

        support = [href for href in page.stylesheets if urlparse(href).path.endswith("/css/support.css")]
        if support and route_root(path, root) not in SUPPORT_ROOTS:
            errors.append(f"{relative}: unrelated route loads css/support.css")

        card = [href for href in page.stylesheets if urlparse(href).path.endswith("/css/card.css")]
        if card and route_root(path, root) not in CARD_ROOTS:
            errors.append(f"{relative}: page-specific card stylesheet escaped /card/")

        font_links = [href for href in page.stylesheets if urlparse(href).netloc == "fonts.googleapis.com"]
        if font_links and font_links != [FONT_STYLESHEET]:
            errors.append(f"{relative}: Google Font families or weights differ from the approved contract")

        search_scripts = [src for src in page.scripts if urlparse(src).path.endswith("/js/public-search.js")]
        if search_scripts and relative != "search/index.html":
            errors.append(f"{relative}: page-specific public search script escaped /search/")

        research_scripts = [src for src in page.scripts if urlparse(src).path.endswith("/js/research-survey.js")]
        if research_scripts and path != research_page:
            errors.append(f"{relative}: page-specific research survey script escaped its page")

    if research_page.exists():
        source = research_page.read_text(encoding="utf-8")
        page = parse(research_page)
        if page.iframes:
            errors.append("research survey: iframe must not exist before an explicit user action")
        if source.count("data-survey-src=") != 1 or source.count('id="survey-load-button"') != 1:
            errors.append("research survey: requires one user-initiated embed source and load control")
        if "<noscript>" not in source or "Open the survey directly in Google Forms" not in source:
            errors.append("research survey: requires a no-JavaScript direct-form fallback")
        if source.count("js/research-survey.js") != 1:
            errors.append("research survey: page-specific loader must be included exactly once")

    for relative, budget in RAW_SIZE_BUDGETS.items():
        path = root / relative
        if not path.exists():
            errors.append(f"{relative}: required shared stylesheet is missing")
        elif path.stat().st_size > budget:
            errors.append(f"{relative}: {path.stat().st_size} raw bytes exceeds evidence-backed budget {budget}")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        print("Performance contract validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Validated shared CSS budgets, font weights, stylesheet/script scope, and deferred survey loading.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
