import copy
import json
from pathlib import Path
import unittest

from scripts.generate_training_events import DATA, ROOT, render


class EventTests(unittest.TestCase):
    def setUp(self):
        self.event = json.loads(DATA.read_text(encoding="utf-8"))

    def test_committed_page_and_facts(self):
        html = render(self.event)
        self.assertEqual(html, (ROOT / "training/events" / self.event["slug"] / "index.html").read_text(encoding="utf-8"))
        self.assertEqual(html.count("<h1>"), 1)
        self.assertIn("Saturday, 19 September 2026", html)
        self.assertIn("11:00–11:30 AM IST", html)
        for role in self.event["roles"]:
            self.assertIn(role["name"], html)
        self.assertNotIn("<form", html)
        self.assertNotIn("data-event-cta=", html)
        self.assertIn("Registration opens soon", html)

    def test_lifecycle_actions_and_schema(self):
        self.event["registration"]["url"] = "https://example.com/registration"
        for state, count in [("upcoming", 2), ("registration-closed", 0), ("completed", 0)]:
            with self.subTest(state=state):
                self.event["status"] = state
                html = render(self.event)
                self.assertEqual(html.count("data-event-cta="), count)
                self.assertEqual(html.count('>Register Free</a>'), count)
                if state != "upcoming":
                    self.assertNotIn(self.event["registration"]["url"], html)
                    self.assertNotIn('"offers"', html)
                if state == "completed":
                    self.assertNotIn('"eventStatus"', html)
                self.assertIn('"@type": "VirtualLocation"', html)

    def test_completed_resources_only_when_real(self):
        self.event["status"] = "completed"
        self.assertNotIn("Session resources", render(self.event))
        self.event["resources"] = "https://example.com/resources"
        self.assertIn('href="https://example.com/resources"', render(self.event))
        self.event["status"] = "registration-closed"
        self.assertNotIn("Session resources", render(self.event))

    def test_invalid_state_dates_slug_and_destinations_fail(self):
        for field, value in [("status", "cancelled"), ("slug", "../escape"), ("end", self.event["start"]), ("start", "2026-09-19T11:00:00")]:
            event = copy.deepcopy(self.event)
            event[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                render(event)
        for url in ["javascript:alert(1)", "http://example.com/", "https://user:pass@example.com/"]:
            self.event["registration"]["url"] = url
            with self.subTest(url=url), self.assertRaises(ValueError):
                render(self.event)

    def test_changed_shared_facts_reach_all_page_surfaces(self):
        self.event["title"] = 'A <new> title'
        self.event["start"] = "2026-10-03T11:00:00+05:30"
        self.event["end"] = "2026-10-03T11:30:00+05:30"
        html = render(self.event)
        self.assertIn("Saturday, 3 October 2026", html)
        self.assertNotIn("19 September", html)
        self.assertIn("A &lt;new&gt; title", html)
        self.assertNotIn("A <new> title", html)


if __name__ == "__main__":
    unittest.main()
