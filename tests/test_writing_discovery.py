import json
import re
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path


ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import generate_public_discovery as discovery
import sync_newsletter_editions as newsletter


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

    def test_newsletter_rss_rejects_the_wrong_publication_identity(self):
        xml = b'''<rss><channel><title>Someone Else</title><link>https://newsletter.suyogjoshi.com/</link></channel></rss>'''

        class Response:
            def __enter__(self): return self
            def __exit__(self, *_): return False
            def read(self): return xml

        with patch.object(newsletter.urllib.request, "urlopen", return_value=Response()):
            with self.assertRaisesRegex(ValueError, "identity mismatch"):
                newsletter.rss_editions(
                    "https://rss.example/feed.xml",
                    "Software Signal Weekly",
                    "https://newsletter.suyogjoshi.com/archive",
                )

    def test_newsletter_merge_retains_editions_absent_from_later_rss(self):
        older = {"id": "older", "title": "Older", "summary": "Known", "published": "2026-08-01", "url": "https://newsletter.suyogjoshi.com/p/older"}
        newer = {"id": "newer", "title": "Newer", "summary": "Incoming", "published": "2026-08-22", "url": "https://newsletter.suyogjoshi.com/p/newer"}
        merged = newsletter.merge_editions([older], [newer])
        self.assertEqual([item["id"] for item in merged], ["newer", "older"])

    def test_newsletter_ledger_writer_normalizes_line_endings(self):
        payload = {"version": 1, "editions": []}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "ledger.json"
            path.write_bytes(b'{\r\n  "version": 1,\r\n  "editions": []\r\n}\r\n')
            self.assertTrue(newsletter.write_ledger(path, payload))
            self.assertNotIn(b"\r\n", path.read_bytes())
            self.assertFalse(newsletter.write_ledger(path, payload))


if __name__ == "__main__":
    unittest.main()
