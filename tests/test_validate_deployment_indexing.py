from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validate_deployment_indexing import (  # noqa: E402
    Response,
    robots_tokens,
    validate_non_production,
    validate_production,
)


class DeploymentIndexingTests(unittest.TestCase):
    def test_cloudflare_header_rules_cover_stable_and_preview_hosts(self) -> None:
        rules = (ROOT / "_headers").read_text(encoding="utf-8")
        self.assertIn("https://dev.suyogjoshi.com/*", rules)
        self.assertIn("https://suyogjoshi-dev.pages.dev/*", rules)
        self.assertIn("https://:preview.suyogjoshi-dev.pages.dev/*", rules)
        self.assertEqual(rules.count("X-Robots-Tag: noindex, nofollow"), 3)

    def test_non_production_accepts_complete_robots_header(self) -> None:
        response = Response(200, "https://dev.suyogjoshi.com/writing/", "NOINDEX, nofollow")
        self.assertEqual(validate_non_production("https://dev.suyogjoshi.com", "/writing/", response), [])

    def test_non_production_accepts_access_restriction(self) -> None:
        response = Response(403, "https://dev.suyogjoshi.com/training/", None)
        self.assertEqual(validate_non_production("https://dev.suyogjoshi.com", "/training/", response), [])

    def test_non_production_rejects_partial_header(self) -> None:
        response = Response(200, "https://dev.suyogjoshi.com/", "noindex")
        errors = validate_non_production("https://dev.suyogjoshi.com", "/", response)
        self.assertTrue(any("noindex, nofollow" in error for error in errors))

    def test_non_production_rejects_cross_host_redirect(self) -> None:
        response = Response(200, "https://suyogjoshi.com/", "noindex, nofollow")
        errors = validate_non_production("https://dev.suyogjoshi.com", "/", response)
        self.assertTrue(any("different host" in error for error in errors))

    def test_production_accepts_success_without_header(self) -> None:
        response = Response(200, "https://suyogjoshi.com/systems/", None)
        self.assertEqual(validate_production("https://suyogjoshi.com", "/systems/", response), [])

    def test_production_rejects_any_x_robots_tag(self) -> None:
        response = Response(200, "https://suyogjoshi.com/", "noindex, nofollow")
        errors = validate_production("https://suyogjoshi.com", "/", response)
        self.assertTrue(any("must not emit" in error for error in errors))

    def test_robots_tokens_are_case_insensitive_and_trimmed(self) -> None:
        self.assertEqual(robots_tokens(" NOINDEX,  nofollow "), {"noindex", "nofollow"})


if __name__ == "__main__":
    unittest.main()
