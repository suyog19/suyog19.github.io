from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validate_legacy_redirects import validate  # noqa: E402


def indexable_html(route: str) -> str:
    canonical = "https://suyogjoshi.com" + route
    return (
        "<!doctype html><html><head>"
        f'<link rel="canonical" href="{canonical}">'
        f'<meta property="og:url" content="{canonical}">'
        "</head><body></body></html>"
    )


def legacy_html(
    *,
    canonical: str = "https://suyogjoshi.com/new/",
    refresh: str = "../new/",
    link: str = "../new/",
    script: str = "",
) -> str:
    script_markup = f"<script>{script}</script>" if script else ""
    return (
        "<!doctype html><html><head>"
        '<meta name="robots" content="noindex, follow">'
        f'<meta http-equiv="refresh" content="0; url={refresh}">'
        f'<link rel="canonical" href="{canonical}">'
        f"{script_markup}</head><body><p>Moved to <a href=\"{link}\">the new page</a>.</p></body></html>"
    )


class LegacyRedirectFixtureTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "new").mkdir()
        (self.root / "new" / "index.html").write_text(indexable_html("/new/"), encoding="utf-8")
        (self.root / "old").mkdir()
        (self.root / "old" / "index.html").write_text(legacy_html(), encoding="utf-8")
        (self.root / "_redirects").write_text("/old /new/ 301\n/old/ /new/ 301\n", encoding="utf-8")
        (self.root / "sitemap.xml").write_text(
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            "<url><loc>https://suyogjoshi.com/new/</loc></url></urlset>",
            encoding="utf-8",
        )
        (self.root / "feed.xml").write_text("<rss/>", encoding="utf-8")
        (self.root / "data").mkdir()
        (self.root / "data" / "search-index.json").write_text(json.dumps({"items": []}), encoding="utf-8")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def errors(self) -> list[str]:
        return validate(self.root)[1]

    def test_complete_inventory_derived_contract_passes(self) -> None:
        legacy, errors = validate(self.root)
        self.assertEqual([page.route for page in legacy], ["/old/"])
        self.assertEqual(errors, [])

    def test_missing_or_mismatched_fallback_mechanisms_fail(self) -> None:
        (self.root / "old" / "index.html").write_text(
            legacy_html(refresh="../wrong/", link="../elsewhere/"), encoding="utf-8"
        )
        errors = self.errors()
        self.assertTrue(any("meta refresh" in error for error in errors))
        self.assertTrue(any("visible recovery link" in error for error in errors))

    def test_unsafe_request_state_forwarding_fails(self) -> None:
        (self.root / "old" / "index.html").write_text(
            legacy_html(script="location.replace('../new/' + location.search + location.hash)"),
            encoding="utf-8",
        )
        errors = self.errors()
        self.assertTrue(any("location.search" in error for error in errors))
        self.assertTrue(any("location.hash" in error for error in errors))
        self.assertTrue(any("static string" in error for error in errors))

    def test_missing_slash_variant_fails(self) -> None:
        (self.root / "_redirects").write_text("/old/ /new/ 301\n", encoding="utf-8")
        self.assertTrue(any("/old must have exactly one" in error for error in self.errors()))

    def test_duplicate_and_nonpermanent_rules_fail(self) -> None:
        (self.root / "_redirects").write_text(
            "/old /new/ 302\n/old /new/ 301\n/old/ /new/ 301\n", encoding="utf-8"
        )
        errors = self.errors()
        self.assertTrue(any("301 or 308" in error for error in errors))
        self.assertTrue(any("duplicate or contradictory" in error for error in errors))

    def test_uninventoried_redirect_rule_fails(self) -> None:
        with (self.root / "_redirects").open("a", encoding="utf-8") as redirects:
            redirects.write("/typo /new/ 301\n")
        self.assertTrue(any("without inventory-derived legacy pages" in error for error in self.errors()))

    def test_redirect_to_wrong_or_legacy_destination_fails(self) -> None:
        (self.root / "_redirects").write_text("/old /old/ 301\n/old/ /old/ 301\n", encoding="utf-8")
        errors = self.errors()
        self.assertTrue(any("must redirect directly" in error for error in errors))
        self.assertTrue(any("chain or loop" in error for error in errors))

    def test_discovery_artifacts_cannot_contain_legacy_route(self) -> None:
        (self.root / "sitemap.xml").write_text(
            "<loc>https://suyogjoshi.com/old/</loc>", encoding="utf-8"
        )
        (self.root / "feed.xml").write_text(
            "<link>https://suyogjoshi.com/old/</link>", encoding="utf-8"
        )
        (self.root / "data" / "search-index.json").write_text(
            json.dumps({"items": [{"url": "https://suyogjoshi.com/old/"}]}), encoding="utf-8"
        )
        errors = self.errors()
        self.assertTrue(any("sitemap.xml" in error for error in errors))
        self.assertTrue(any("feed discovery" in error for error in errors))
        self.assertTrue(any("search discovery" in error for error in errors))

    def test_controlled_html_link_to_legacy_route_fails(self) -> None:
        (self.root / "new" / "index.html").write_text(
            indexable_html("/new/").replace("</body>", '<a href="../old/">Old page</a></body>'),
            encoding="utf-8",
        )
        self.assertTrue(any("controlled link targets legacy route" in error for error in self.errors()))


class RepositoryLegacyRedirectIntegrationTests(unittest.TestCase):
    def test_repository_has_three_complete_legacy_redirect_contracts(self) -> None:
        legacy, errors = validate(ROOT)
        self.assertEqual(errors, [])
        self.assertEqual(
            {page.route for page in legacy},
            {
                "/training/applied-python-ai-ml/",
                "/training/policies/privacy/",
                "/training/python-foundations-ai-data/",
            },
        )


if __name__ == "__main__":
    unittest.main()
