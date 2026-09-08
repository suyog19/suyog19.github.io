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


def canonical_url(event):
    return f'https://suyogjoshi.com/training/events/{event["slug"]}/'


def date_labels(event):
    start, end = (datetime.fromisoformat(event[key]) for key in ("start", "end"))
    return (f'{start:%A}, {start.day} {start:%B %Y}',
            f'{start:%I:%M}–{end:%I:%M %p} {event["timezone"]}')


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
    canonical = canonical_url(event)
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
        date_label=escape(date_labels(event)[0]),
        time_label=escape(date_labels(event)[1]),
        roles="\n".join(f'<li><h3>{escape(role["name"])}</h3><p>{escape(role["summary"])}</p></li>' for role in event["roles"]),
        tools="\n".join(f'<li>{escape(tool)}</li>' for tool in event["tools"]),
        schema=json.dumps(schema, ensure_ascii=False, indent=2).replace("<", "\\u003c"),
        duration=str(int((end - start).total_seconds() / 60)),
        final_heading="Session completed" if status == "completed" else "Registration closed" if status == "registration-closed" else "Join the session",
    )
    return Template(TEMPLATE.read_text(encoding="utf-8")).substitute(fields)


def replace_slot(html, name, content):
    """Replace exactly one owned region; never rewrite surrounding page content."""
    start, end = f"<!-- EVENT:{name}:START -->", f"<!-- EVENT:{name}:END -->"
    if html.count(start) != 1 or html.count(end) != 1 or html.index(end) < html.index(start):
        raise ValueError(f"Expected one intact event slot: {name}")
    before, rest = html.split(start)
    _, after = rest.split(end)
    return before + start + "\n" + content + "\n" + end + after


def discovery_metadata(event, prefix):
    values = {"status": event["status"], "end": event["end"],
              "closes": event["registration"].get("closes_at") or event["start"]}
    return "\n".join(f'<meta name="event-discovery-{key}" content="{escape(value, quote=True)}">'
                     for key, value in values.items()) + f'\n<script src="{prefix}js/event-discovery.js"></script>'


def render_discovery(event, surface):
    if surface not in {"homepage", "training"}:
        raise ValueError("Unknown event discovery surface")
    if event["status"] == "completed":
        return ""
    start = datetime.fromisoformat(event["start"])
    date, time = (escape(value) for value in date_labels(event))
    slug, title, status = (escape(event[key], quote=True) for key in ("slug", "title", "status"))
    # Keep preview deployments local; canonical metadata still uses the public origin.
    route = urlsplit(canonical_url(event)).path
    location = "homepage_announcement" if surface == "homepage" else "training_featured_event"
    href = escape(f"{route}?utm_source={surface}&utm_medium=website&utm_content={location}", quote=True)
    attributes = (f'class="event-discovery event-discovery--{status} '
                  f'{"event-announcement" if surface == "homepage" else "event-feature"}" '
                  f'data-event-discovery="{surface}" data-discovery-slug="{slug}"')
    if surface == "homepage":
        short_title = escape(event["title"].partition(" — ")[0])
        summary = escape(f'{start.day} {start:%b} · {start:%I:%M %p} {event["timezone"]}')
        return f'''<aside {attributes} aria-label="Free live session">
  <div class="container event-announcement-inner">
    <p><span class="event-discovery-label">Free live session<span class="discovery-closed"> · Registration closed</span></span>
    <strong>{short_title}</strong></p>
    <time datetime="{escape(event['start'], quote=True)}">{summary}</time>
    <a class="event-discovery-link" href="{href}" data-discovery-cta="{location}">View session <span aria-hidden="true">→</span></a>
  </div>
</aside>'''
    cta = "View session &amp; register" if event["registration"]["url"] else "View session"
    return f'''<section {attributes} id="featured-session" aria-labelledby="featured-session-title">
  <div class="container"><div class="event-feature-panel">
    <p class="event-discovery-label"><span class="discovery-upcoming">Upcoming · Free micro-session</span><span class="discovery-closed">Registration closed · Free micro-session</span></p>
    <h2 id="featured-session-title">{title}</h2>
    <p class="event-feature-summary">What they do. The tools they use. What you need to learn.</p>
    <p class="event-feature-facts"><time datetime="{escape(event['start'], quote=True)}">{date}</time><br>{time} · Online</p>
    <p class="event-feature-audience">{escape(event['audience'])} welcome.</p>
    <a class="btn btn-primary btn-learning" href="{href}" data-discovery-cta="{location}"><span class="discovery-upcoming">{cta}</span><span class="discovery-closed">View session</span></a>
  </div></div>
</section>'''


def render_outputs(event, home_html, training_html):
    detail = render(event)  # Validate all shared facts before generating any surface.
    outputs = {ROOT / "training/events" / event["slug"] / "index.html": detail}
    for path, html, surface, prefix in [(ROOT / "index.html", home_html, "homepage", ""),
                                         (ROOT / "training/index.html", training_html, "training", "../")]:
        html = replace_slot(html, "METADATA", discovery_metadata(event, prefix))
        outputs[path] = replace_slot(html, "DISCOVERY", render_discovery(event, surface))
    return outputs


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    event = json.loads(DATA.read_text(encoding="utf-8"))
    outputs = render_outputs(event, (ROOT / "index.html").read_text(encoding="utf-8"),
                             (ROOT / "training/index.html").read_text(encoding="utf-8"))
    for target, rendered in outputs.items():
        if args.check:
            if not target.exists() or target.read_text(encoding="utf-8") != rendered:
                raise SystemExit(f"Event output is stale: {target.relative_to(ROOT)}; run python scripts/generate_training_events.py")
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(rendered, encoding="utf-8", newline="\n")
            print(f"Generated {target.relative_to(ROOT)}")
    if args.check:
        print("Shared event page and discovery surfaces are current.")


if __name__ == "__main__":
    main()
