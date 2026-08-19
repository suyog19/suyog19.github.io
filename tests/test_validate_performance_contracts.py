from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validate_performance_contracts import FONT_STYLESHEET, RAW_SIZE_BUDGETS, validate  # noqa: E402


class PerformanceContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        for relative in RAW_SIZE_BUDGETS:
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("/* test */", encoding="utf-8")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write(self, relative: str, body: str) -> None:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")

    def test_accepts_scoped_assets_and_deferred_survey(self) -> None:
        self.write("index.html", f'<link rel="stylesheet" href="{FONT_STYLESHEET}">')
        self.write("training/index.html", '<link rel="stylesheet" href="../css/learning.css">')
        self.write(
            "research/ai-teaching-workflows/index.html",
            '<button id="survey-load-button" data-survey-src="https://docs.google.com/forms/example"></button>'
            '<noscript><a>Open the survey directly in Google Forms</a></noscript>'
            '<script src="../../js/research-survey.js"></script>',
        )
        self.assertEqual(validate(self.root), [])

    def test_rejects_learning_css_on_unrelated_page(self) -> None:
        self.write("writing/index.html", '<link rel="stylesheet" href="../css/learning.css">')
        self.assertTrue(any("unrelated route" in error for error in validate(self.root)))

    def test_rejects_eager_research_iframe(self) -> None:
        self.write("research/ai-teaching-workflows/index.html", '<iframe src="https://docs.google.com/forms/example"></iframe>')
        self.assertTrue(any("iframe must not exist" in error for error in validate(self.root)))

    def test_rejects_changed_font_contract(self) -> None:
        self.write("index.html", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400">')
        self.assertTrue(any("Font families or weights" in error for error in validate(self.root)))

    def test_rejects_duplicate_assets_and_script_scope_leaks(self) -> None:
        self.write(
            "writing/index.html",
            '<script src="../js/public-search.js"></script><script src="../js/public-search.js"></script>',
        )
        errors = validate(self.root)
        self.assertTrue(any("duplicate script" in error for error in errors))
        self.assertTrue(any("escaped /search/" in error for error in errors))

    def test_rejects_css_budget_growth(self) -> None:
        path = self.root / "css/pages.css"
        path.write_text("x" * (RAW_SIZE_BUDGETS["css/pages.css"] + 1), encoding="utf-8")
        self.assertTrue(any("exceeds evidence-backed budget" in error for error in validate(self.root)))


class RepositoryPerformanceContractTests(unittest.TestCase):
    def test_repository_contracts(self) -> None:
        self.assertEqual(validate(ROOT), [])


if __name__ == "__main__":
    unittest.main()
