from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from capture_production_baseline import PageParser, normalized_public_url, sitemap_urls


class CaptureProductionBaselineTests(unittest.TestCase):
    def test_parses_sitemap_urls(self):
        source = b'''<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://suyogjoshi.com/</loc></url><url><loc>https://suyogjoshi.com/about/</loc></url></urlset>'''
        self.assertEqual(sitemap_urls(source), ["https://suyogjoshi.com/", "https://suyogjoshi.com/about/"])

    def test_extracts_page_contract(self):
        parser = PageParser()
        parser.feed('''<title> About | Suyog Joshi </title><link rel="canonical" href="https://suyogjoshi.com/about/"><a href="/contact/#form">Contact</a>''')
        self.assertEqual(parser.title, "About | Suyog Joshi")
        self.assertEqual(parser.canonicals, ["https://suyogjoshi.com/about/"])
        self.assertEqual(parser.links, ["/contact/#form"])

    def test_normalizes_same_origin_page_links_only(self):
        origin = "https://suyogjoshi.com"
        base_url = "https://suyogjoshi.com/writing/example/"
        self.assertEqual(normalized_public_url("/contact/#form", base_url, origin), "https://suyogjoshi.com/contact/")
        self.assertEqual(normalized_public_url("../", base_url, origin), "https://suyogjoshi.com/writing/")
        self.assertIsNone(normalized_public_url("https://medium.com/example", base_url, origin))
        self.assertIsNone(normalized_public_url("/css/base.css", base_url, origin))


if __name__ == "__main__":
    unittest.main()
