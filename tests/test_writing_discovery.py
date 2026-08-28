import json
import re
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import generate_public_discovery as discovery


class WritingDiscoveryTests(unittest.TestCase):
    def test_chronology_boundary_is_gap_free_and_non_overlapping(self):
        sample = [
            {"workId": "zero", "published": "2026-08-28", "ageDays": 0},
            {"workId": "ninety-nine", "published": "2026-05-21", "ageDays": 99},
            {"workId": "hundred", "published": "2026-05-20", "ageDays": 100},
            {"workId": "hundred-one", "published": "2026-05-19", "ageDays": 101},
        ]
        recent, archive = discovery.chronology_partition(sample)
        self.assertEqual({item["workId"] for item in recent}, {"zero", "ninety-nine", "hundred"})
        self.assertEqual({item["workId"] for item in archive}, {"hundred-one"})
        self.assertFalse({item["workId"] for item in recent} & {item["workId"] for item in archive})

    def test_generated_chronology_covers_every_work_exactly_once(self):
        works = discovery.article_works()
        recent_html = (ROOT / "writing" / "recent" / "index.html").read_text(encoding="utf-8")
        archive_html = (ROOT / "writing" / "archive" / "index.html").read_text(encoding="utf-8")
        recent = set(re.findall(r'class="wp-article-row" data-work-id="([^"]+)"', recent_html))
        archive = set(re.findall(r'class="wp-article-row" data-work-id="([^"]+)"', archive_html))
        self.assertFalse(recent & archive)
        self.assertEqual(recent | archive, {item["workId"] for item in works})

    def test_stable_work_identity_deduplicates_republication(self):
        works = json.loads(discovery.WORKS_PATH.read_text(encoding="utf-8"))["works"]
        business_rules = next(item for item in works if item["id"] == "business-rules-as-context")
        self.assertEqual(len(business_rules["publications"]), 2)
        index = discovery.build_search_index(discovery.article_works())
        results = [item for item in index["items"] if item["id"] == "article:business-rules-as-context"]
        self.assertEqual(len(results), 1)


if __name__ == "__main__":
    unittest.main()
