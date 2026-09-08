import copy
import json
from pathlib import Path
import unittest

from scripts.generate_training_events import DATA, ROOT, render, render_outputs, replace_slot


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
        self.assertEqual(html.count('data-event-cta='), 2)
        self.assertEqual(self.event["registration"]["url"], "https://luma.com/pg34dnol")
        self.assertIn('referrerpolicy="no-referrer"', html)
        self.assertIn('aria-describedby="registration-note-primary"', html)
        self.assertIn("Registration opens on Luma", html)
        self.assertIn("no newsletter signup", html)
        self.assertIn("10:55 AM IST", html)
        self.assertIn('"validThrough": "2026-09-19T10:55:00+05:30"', html)
        self.assertIn('<link rel="canonical" href="https://suyogjoshi.com/training/events/ai-engineering-roles-2026/">', html)

    def test_pending_registration_remains_honest(self):
        self.event["registration"]["url"] = None
        html = render(self.event)
        self.assertNotIn('data-event-cta=', html)
        self.assertNotIn('"offers"', html)
        self.assertIn('Registration opens soon', html)

    def test_lifecycle_actions_and_schema(self):
        self.event["registration"]["url"] = "https://luma.com/example-event"
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

    def test_luma_destination_and_closing_time_boundaries(self):
        for url in ["https://luma.com.evil.example/event", "https://example.com/event",
                    "https://luma.com/event?email=synthetic", "https://luma.com/event#private",
                    "https://luma.com/", "https://luma.com:8443/event"]:
            event = copy.deepcopy(self.event)
            event["registration"]["url"] = url
            with self.subTest(url=url), self.assertRaises(ValueError):
                render(event)
        for closes in [self.event["start"], self.event["end"], "2026-09-19T10:55:00"]:
            event = copy.deepcopy(self.event)
            event["registration"]["closes_at"] = closes
            with self.subTest(closes=closes), self.assertRaises(ValueError):
                render(event)

    def test_changed_shared_facts_reach_all_page_surfaces(self):
        self.event["title"] = 'A <new> title'
        self.event["start"] = "2026-10-03T11:00:00+05:30"
        self.event["end"] = "2026-10-03T11:30:00+05:30"
        self.event["registration"]["closes_at"] = "2026-10-03T10:55:00+05:30"
        html = render(self.event)
        self.assertIn("Saturday, 3 October 2026", html)
        self.assertNotIn("19 September", html)
        self.assertIn("A &lt;new&gt; title", html)
        self.assertNotIn("A <new> title", html)

    def discovery_outputs(self):
        return render_outputs(self.event, (ROOT / "index.html").read_text(encoding="utf-8"),
                              (ROOT / "training/index.html").read_text(encoding="utf-8"))

    def test_discovery_is_current_and_preserves_surrounding_content(self):
        for path, html in self.discovery_outputs().items():
            self.assertEqual(html, path.read_text(encoding="utf-8"))
        html = '<header>Preserve</header><!-- EVENT:TEST:START -->old<!-- EVENT:TEST:END --><main>Keep</main>'
        self.assertEqual(replace_slot(html, 'TEST', 'new'),
                         '<header>Preserve</header><!-- EVENT:TEST:START -->\nnew\n<!-- EVENT:TEST:END --><main>Keep</main>')
        for broken in ['', html + html, html.replace('START', 'MISSING')]:
            with self.assertRaises(ValueError):
                replace_slot(broken, 'TEST', '')

    def test_shared_facts_update_both_discovery_surfaces(self):
        self.event['title'] = 'A <changed> title — subtitle'
        self.event['slug'] = 'changed-event'
        self.event['start'] = '2026-10-03T12:00:00+05:30'
        self.event['end'] = '2026-10-03T12:30:00+05:30'
        self.event['registration']['closes_at'] = '2026-10-03T11:55:00+05:30'
        self.event['audience'] = 'Students and professionals'
        outputs = self.discovery_outputs()
        for path in [ROOT / 'index.html', ROOT / 'training/index.html']:
            with self.subTest(path=path):
                self.assertIn('A &lt;changed&gt; title', outputs[path])
                self.assertIn('/training/events/changed-event/?utm_source=', outputs[path])
                self.assertIn('2026-10-03T12:30:00+05:30', outputs[path])
                self.assertNotIn('ai-engineering-roles-2026', outputs[path])
                self.assertNotIn(self.event['registration']['url'], outputs[path])
        self.assertIn('Students and professionals welcome', outputs[ROOT / 'training/index.html'])

    def test_completed_removes_generated_promotion_and_missing_url_has_no_promise(self):
        self.event['status'] = 'completed'
        for path, html in self.discovery_outputs().items():
            if path.name == 'index.html' and path.parent in [ROOT, ROOT / 'training']:
                self.assertNotIn('data-event-discovery=', html)
                self.assertNotIn('data-discovery-cta=', html)
                self.assertNotIn('id="featured-session-title"', html)
        self.event['status'] = 'upcoming'
        self.event['registration']['url'] = None
        html = self.discovery_outputs()[ROOT / 'training/index.html']
        self.assertNotIn('View session &amp; register', html)
        self.assertIn('View session', html)


if __name__ == "__main__":
    unittest.main()
