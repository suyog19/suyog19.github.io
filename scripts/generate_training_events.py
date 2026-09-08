"""Render the shared public event definition; no deployment build is required."""
from __future__ import annotations

import argparse
from datetime import datetime
from html import escape
import json
from pathlib import Path
import re
from string import Template
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data/training-events.json"
TEMPLATE = ROOT / "scripts/templates/training-event.html.tmpl"
STATES = {"upcoming", "registration-closed", "completed"}


def public_url(value):
    if value is None:
        return None
    parsed = urlsplit(value)
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username
            or parsed.password or parsed.hostname.endswith("meet.google.com")):
        raise ValueError("Use an approved public HTTPS destination")
    return value


def render(event):
    if event["status"] not in STATES:
        raise ValueError("Unknown event lifecycle")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", event["slug"]):
        raise ValueError("Invalid event slug")
    start, end = (datetime.fromisoformat(event[key]) for key in ("start", "end"))
    if start.utcoffset() is None or end.utcoffset() is None or end <= start:
        raise ValueError("Event timestamps must be aware and end after start")
    url = public_url(event["registration"]["url"])
    registration = event["registration"]
    provider = registration.get("provider")
    if provider is not None and provider != "Luma":
        raise ValueError("Unsupported registration provider")
    if provider == "Luma" and url:
        destination = urlsplit(url)
        if (destination.netloc != "luma.com" or destination.query or destination.fragment
                or not re.fullmatch(r"/[a-zA-Z0-9-]+", destination.path)):
            raise ValueError("Use a clean public Luma event URL")
    closes = registration.get("closes_at")
    if closes:
        closes = datetime.fromisoformat(closes)
        if closes.utcoffset() is None or closes >= start:
            raise ValueError("Registration must close before the session starts")
    resources = public_url(event["resources"])
    canonical = f'https://suyogjoshi.com/training/events/{event["slug"]}/'
    status = event["status"]
    labels = {"upcoming": "Upcoming", "registration-closed": "Registration closed", "completed": "Completed"}
    messages = {
        "upcoming": "Registration opens soon. The free session details are available below.",
        "registration-closed": "Registration is closed. Session information remains available here.",
        "completed": "This session has ended. Session information remains available here.",
    }

    def action(location):
        if status == "upcoming" and url:
            note_id = f"registration-note-{location}"
            note = ""
            if provider == "Luma":
                note = (f'<p class="event-registration-note" id="{note_id}">'
                        'Registration opens on Luma. Session emails only; no newsletter signup.</p>')
                if closes:
                    note += (f'<p class="event-registration-note">Registration closes '
                             f'<time datetime="{closes.isoformat()}">{closes.day} {closes:%B}, '
                             f'{closes:%I:%M %p} {escape(event["timezone"])}</time>.</p>')
            return (f'<a class="btn btn-primary btn-learning" href="{escape(url, quote=True)}" '
                    'referrerpolicy="no-referrer" '
                    + (f'data-registration-provider="luma" aria-describedby="{note_id}" ' if note else '')
                    + f'data-event-cta="{location}">{escape(registration["label"])}</a>' + note)
        message = f'<p class="event-registration-message">{messages[status]}</p>'
        if status == "completed" and resources:
            message += f'<a class="btn btn-secondary" href="{escape(resources, quote=True)}">Session resources</a>'
        return message

    schema = {
        "@context": "https://schema.org", "@type": "Event", "@id": canonical + "#event",
        "name": event["title"], "description": event["description"], "url": canonical,
        "startDate": event["start"], "endDate": event["end"], "isAccessibleForFree": True,
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "location": {"@type": "VirtualLocation", "url": canonical},
        "organizer": {"@type": "Person", "@id": "https://suyogjoshi.com/#person", "name": event["host"], "url": "https://suyogjoshi.com/about/"},
    }
    if status != "completed":
        schema["eventStatus"] = "https://schema.org/EventScheduled"
    if status == "upcoming" and url:
        schema["offers"] = {"@type": "Offer", "price": 0, "priceCurrency": "INR", "url": url, "availability": "https://schema.org/InStock"}
        if closes:
            schema["offers"]["validThrough"] = closes.isoformat()
    fields = {key: escape(str(event[key]), quote=True) for key in
              ("slug", "title", "description", "format", "start", "end", "audience", "host", "brand", "status")}
    fields.update(
        canonical=canonical, status_label=labels[status], primary_action=action("primary"), final_action=action("final"),
        date_label=f'{start:%A}, {start.day} {start:%B %Y}',
        time_label=f'{start:%I:%M}–{end:%I:%M %p} {escape(event["timezone"])}',
        roles="\n".join(f'<li><h3>{escape(role["name"])}</h3><p>{escape(role["summary"])}</p></li>' for role in event["roles"]),
        tools="\n".join(f'<li>{escape(tool)}</li>' for tool in event["tools"]),
        schema=json.dumps(schema, ensure_ascii=False, indent=2).replace("<", "\\u003c"),
        duration=str(int((end - start).total_seconds() / 60)),
        final_heading="Session completed" if status == "completed" else "Registration closed" if status == "registration-closed" else "Join the session",
    )
    return Template(TEMPLATE.read_text(encoding="utf-8")).substitute(fields)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    event = json.loads(DATA.read_text(encoding="utf-8"))
    rendered = render(event)
    target = ROOT / "training/events" / event["slug"] / "index.html"
    if args.check:
        if not target.exists() or target.read_text(encoding="utf-8") != rendered:
            raise SystemExit("Event page is stale: run python scripts/generate_training_events.py")
        print("Shared event page is current.")
    else:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(rendered, encoding="utf-8", newline="\n")
        print(f"Generated {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
