from __future__ import annotations

import sys
import tempfile
import unittest
from contextlib import redirect_stderr
from io import StringIO
from pathlib import Path


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from generate_sitemap import run as run_generator  # noqa: E402
from public_page_inventory import (  # noqa: E402
    EXCLUDED_TOP_LEVEL_DIRECTORIES,
    InventoryError,
    PageClassification,
    discover_pages,
    render_sitemap,
    validate_sitemap,
)


def html(canonical: str | None, robots: str | None = None, lastmod: str | None = None) -> str:
    canonical_markup = f'<link rel="canonical" href="{canonical}">' if canonical else ""
    og_markup = f'<meta property="og:url" content="{canonical}">' if canonical else ""
    robots_markup = f'<meta name="robots" content="{robots}">' if robots else ""
    updated = (
        f'<dl><div><dt>Last updated</dt><dd><time datetime="{lastmod}">{lastmod}</time></dd></div></dl>'
        if lastmod is not None
        else ""
    )
    return f"<!doctype html><html><head>{canonical_markup}{og_markup}{robots_markup}</head><body>{updated}</body></html>"


class PublicPageInventoryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write_page(
        self,
        route: str,
        *,
        robots: str | None = None,
        canonical: str | None = None,
        lastmod: str | None = None,
    ) -> Path:
        if route == "/404.html":
            path = self.root / "404.html"
            canonical = None
        else:
            path = self.root / route.strip("/") / "index.html" if route != "/" else self.root / "index.html"
            canonical = canonical or "https://suyogjoshi.com" + route
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(html(canonical, robots, lastmod), encoding="utf-8")
        return path

    def sitemap_with(self, *urls: str) -> str:
        body = "".join(f"<url><loc>{url}</loc></url>" for url in urls)
        return f'<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>'

    def test_current_public_page_families_are_derived_without_a_route_registry(self) -> None:
        routes = (
            "/",
            "/about/",
            "/contact/",
            "/privacy/",
            "/search/",
            "/writing/",
            "/writing/an-article/",
            "/writing/series/a-series/",
            "/writing/topics/a-topic/",
            "/systems/",
            "/systems/a-system/",
            "/systems/a-system/a-demo/",
            "/training/",
            "/training/a-course/",
            "/training/provider/",
            "/training/policies/",
            "/research/a-study/",
        )
        for route in routes:
            self.write_page(route)
        pages = discover_pages(self.root)
        self.assertEqual({page.route for page in pages}, set(routes))
        self.assertTrue(all(page.classification is PageClassification.PUBLIC_INDEXABLE for page in pages))

    def test_new_indexable_page_makes_committed_sitemap_stale(self) -> None:
        self.write_page("/")
        (self.root / "sitemap.xml").write_text(render_sitemap(discover_pages(self.root)), encoding="utf-8")
        self.write_page("/writing/new-page/")
        with redirect_stderr(StringIO()):
            self.assertEqual(run_generator(self.root, check=True), 1)

    def test_noindex_page_in_sitemap_is_rejected(self) -> None:
        self.write_page("/")
        self.write_page("/preview/", robots="noindex, follow")
        pages = discover_pages(self.root)
        errors = validate_sitemap(
            self.sitemap_with("https://suyogjoshi.com/", "https://suyogjoshi.com/preview/"), pages
        )
        self.assertTrue(any("non-indexable" in error for error in errors))

    def test_private_operational_page_cannot_enter_sitemap(self) -> None:
        self.write_page("/")
        self.write_page("/admin/", robots="noindex, nofollow")
        pages = discover_pages(self.root)
        errors = validate_sitemap(
            self.sitemap_with("https://suyogjoshi.com/", "https://suyogjoshi.com/admin/"), pages
        )
        self.assertTrue(any("non-indexable" in error for error in errors))

    def test_private_operational_page_cannot_become_indexable(self) -> None:
        self.write_page("/my-learning/")
        with self.assertRaisesRegex(InventoryError, "private/operational route must be noindex"):
            discover_pages(self.root)

    def test_sitemap_entry_without_a_canonical_page_is_rejected(self) -> None:
        self.write_page("/")
        errors = validate_sitemap(
            self.sitemap_with("https://suyogjoshi.com/", "https://suyogjoshi.com/missing/"),
            discover_pages(self.root),
        )
        self.assertTrue(any("unknown pages" in error for error in errors))

    def test_duplicate_sitemap_urls_are_rejected(self) -> None:
        self.write_page("/")
        errors = validate_sitemap(
            self.sitemap_with("https://suyogjoshi.com/", "https://suyogjoshi.com/"),
            discover_pages(self.root),
        )
        self.assertTrue(any("duplicate sitemap URLs" in error for error in errors))

    def test_noncanonical_alias_must_target_an_indexable_page(self) -> None:
        self.write_page(
            "/legacy/",
            robots="noindex",
            canonical="https://suyogjoshi.com/replacement/",
        )
        with self.assertRaisesRegex(InventoryError, "target is not an indexable repository page"):
            discover_pages(self.root)

    def test_explicit_visible_lastmod_is_emitted(self) -> None:
        self.write_page("/privacy/", lastmod="2026-07-20")
        sitemap = render_sitemap(discover_pages(self.root))
        self.assertIn("<lastmod>2026-07-20</lastmod>", sitemap)

    def test_malformed_explicit_lastmod_is_rejected(self) -> None:
        self.write_page("/privacy/", lastmod="20 July 2026")
        with self.assertRaisesRegex(InventoryError, "ISO calendar date"):
            discover_pages(self.root)

    def test_sitemap_lastmod_must_match_the_explicit_visible_source(self) -> None:
        self.write_page("/privacy/", lastmod="2026-07-20")
        sitemap = render_sitemap(discover_pages(self.root)).replace("2026-07-20", "2026-07-21")
        errors = validate_sitemap(sitemap, discover_pages(self.root))
        self.assertTrue(any("does not match explicit source" in error for error in errors))

    def test_decorative_sitemap_metadata_is_rejected(self) -> None:
        self.write_page("/")
        sitemap = self.sitemap_with("https://suyogjoshi.com/").replace(
            "</url>", "<priority>1.0</priority></url>"
        )
        errors = validate_sitemap(sitemap, discover_pages(self.root))
        self.assertTrue(any("unsupported metadata" in error for error in errors))


class RepositoryInventoryIntegrationTests(unittest.TestCase):
    def test_repository_inventory_covers_all_html_and_expected_boundaries(self) -> None:
        pages = discover_pages(ROOT)
        repository_html = [
            path for path in ROOT.rglob("*.html")
            if path.relative_to(ROOT).parts[0] not in EXCLUDED_TOP_LEVEL_DIRECTORIES
        ]
        self.assertEqual(len(pages), len(repository_html))
        by_route = {page.route: page.classification for page in pages}
        for route in (
            "/search/",
            "/writing/series/",
            "/writing/topics/ai-agents-and-review/",
            "/systems/ai-workflow-lab/invoice-review-demo/",
            "/training/",
            "/research/ai-teaching-workflows/",
        ):
            self.assertIs(by_route[route], PageClassification.PUBLIC_INDEXABLE)
        self.assertIs(by_route["/admin/"], PageClassification.PRIVATE_OPERATIONAL)
        self.assertIs(by_route["/training/policies/privacy/"], PageClassification.LEGACY_NONCANONICAL)
        self.assertIs(by_route["/404.html"], PageClassification.PUBLIC_NOINDEX)


if __name__ == "__main__":
    unittest.main()
