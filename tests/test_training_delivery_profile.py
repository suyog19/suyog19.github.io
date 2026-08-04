import copy
import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from validate_training_catalogue_schema import validate_delivery_profile  # noqa: E402


class DeliveryProfileValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        catalogue = json.loads((ROOT / "data" / "training-courses.json").read_text(encoding="utf-8"))
        cls.launched = next(course for course in catalogue["courses"] if course["lifecycleStatus"] == "launched")
        cls.pipeline = next(course for course in catalogue["courses"] if course["lifecycleStatus"] == "pipeline")

    def test_valid_launched_profile(self):
        self.assertEqual(validate_delivery_profile(self.launched, "course"), [])

    def test_incomplete_launched_profile_fails_clearly(self):
        course = copy.deepcopy(self.launched)
        del course["deliveryProfile"]["support"]
        self.assertTrue(any("missing support" in error for error in validate_delivery_profile(course, "course")))

    def test_age_timezone_and_planning_fallback_are_required(self):
        course = copy.deepcopy(self.launched)
        course["minimumAge"] = 17
        course["timezone"] = "UTC"
        course["deliveryProfile"]["planning"]["likelyCadence"] = "Two sessions weekly"
        errors = validate_delivery_profile(course, "course")
        self.assertTrue(any("minimumAge" in error for error in errors))
        self.assertTrue(any("timezone" in error for error in errors))
        self.assertTrue(any("cadence must name IST" in error for error in errors))

    def test_pipeline_course_does_not_require_launch_commitments(self):
        self.assertEqual(validate_delivery_profile(self.pipeline, "course"), [])

    def test_contradictions_and_cohort_duplication_are_rejected(self):
        course = copy.deepcopy(self.launched)
        course["deliveryProfile"]["recordings"]["regularSessionsPlanned"] = False
        course["deliveryProfile"]["capacity"] = 15
        errors = validate_delivery_profile(course, "course")
        self.assertTrue(any("recording access" in error for error in errors))
        self.assertTrue(any("backend-owned cohort state" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
