import copy
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validate_training_consistency import load_sources, validate_consistency  # noqa: E402


class TrainingConsistencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalogue, cls.sources = load_sources()

    def test_repository_sources_are_consistent(self):
        self.assertEqual(validate_consistency(self.catalogue, self.sources), [])

    def test_stale_copy_failure_names_page_and_phrase(self):
        sources = dict(self.sources)
        path = "training/python-foundations-for-data-science/index.html"
        sources[path] += "<p>Certificate criteria are not yet published.</p>"
        errors = validate_consistency(self.catalogue, sources)
        self.assertIn(f"{path}: stale launched-course copy 'criteria are not yet published'", errors)

    def test_catalogue_workload_drift_fails_against_visible_total(self):
        catalogue = copy.deepcopy(self.catalogue)
        course = next(course for course in catalogue["courses"] if course["courseId"] == "crs_python_foundations")
        course["deliveryProfile"]["workload"]["normalIndependentHoursPerWeek"]["maximum"] = 6
        errors = validate_consistency(catalogue, self.sources)
        self.assertTrue(any("catalogue-derived workload" in error and "5–9 hours total" in error for error in errors))

    def test_capstone_article_grammar_regression_is_rejected(self):
        sources = dict(self.sources)
        path = "training/python-foundations-for-data-science/index.html"
        sources[path] = sources[path].replace(
            "Build a Core-Python structured-data analyser",
            "Build an Core-Python structured-data analyser",
        )
        errors = validate_consistency(self.catalogue, sources)
        self.assertIn(
            f"{path}: old capstone term 'build an core-python structured-data analyser'",
            errors,
        )

    def test_pipeline_copy_is_outside_launched_stale_phrase_gate(self):
        sources = dict(self.sources)
        sources["unvalidated-pipeline-fixture"] = "criteria are not yet published"
        self.assertEqual(validate_consistency(self.catalogue, sources), [])


if __name__ == "__main__":
    unittest.main()
