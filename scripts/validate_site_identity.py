"""Validate the public Suyog Joshi identity and provider entity graph."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from validate_article_structured_data import StructuredDataParser, schema_nodes

ROOT = Path(__file__).parents[1]
PERSON_ID = "https://suyogjoshi.com/#person"
WEBSITE_ID = "https://suyogjoshi.com/#website"
PROFILE_ID = "https://suyogjoshi.com/about/#profile"
WRITING_ID = "https://suyogjoshi.com/writing/#collection"
SYSTEMS_ID = "https://suyogjoshi.com/systems/#collection"
TRAINING_ID = "https://suyogjoshi.com/training/#collection"
SERVICE_ID = "https://suyogjoshi.com/training/#service"
BRAND_ID = "https://suyogjoshi.com/training/#brand"
PUBLIC_PROFILES = {
    "https://www.linkedin.com/in/suyog-joshi",
    "https://medium.com/@suyog19",
    "https://github.com/suyog19",
}


def load_nodes(relative: str) -> tuple[str, list[dict[str, object]]]:
    source = (ROOT / relative).read_text(encoding="utf-8")
    parser = StructuredDataParser()
    parser.feed(source)
    nodes = [node for document in parser.json_documents for node in schema_nodes(document)]
    return source, nodes


def node_by_id(nodes: list[dict[str, object]], entity_id: str) -> dict[str, object] | None:
    return next((node for node in nodes if node.get("@id") == entity_id), None)


def reference_id(value: object) -> str | None:
    return value.get("@id") if isinstance(value, dict) else None


def reference_ids(value: object) -> set[str]:
    values = value if isinstance(value, list) else [value]
    return {entity_id for item in values if (entity_id := reference_id(item))}


def validate_person(person: dict[str, object] | None, location: str) -> list[str]:
    errors: list[str] = []
    if person is None:
        return [f"{location}: missing Person {PERSON_ID}"]
    expected = {
        "@type": "Person",
        "name": "Suyog Joshi",
        "url": "https://suyogjoshi.com/about/",
        "jobTitle": "Software Engineer",
    }
    for field, value in expected.items():
        if person.get(field) != value:
            errors.append(f"{location}: Person {field} must be {value!r}")
    if reference_id(person.get("mainEntityOfPage")) != PROFILE_ID:
        errors.append(f"{location}: Person mainEntityOfPage must reference {PROFILE_ID}")
    if set(person.get("sameAs", [])) != PUBLIC_PROFILES:
        errors.append(f"{location}: Person sameAs must contain only the three verified public profiles")
    if not isinstance(person.get("knowsAbout"), list) or not person["knowsAbout"]:
        errors.append(f"{location}: Person knowsAbout must be a concise non-empty list")
    if reference_ids(person.get("subjectOf")) != {WRITING_ID, SYSTEMS_ID, TRAINING_ID}:
        errors.append(f"{location}: Person subjectOf must connect Writing, Systems, and Training")
    private_fields = {"email", "telephone", "address", "birthDate"}
    exposed = sorted(private_fields.intersection(person))
    if exposed:
        errors.append(f"{location}: Person exposes unnecessary private fields: {', '.join(exposed)}")
    return errors


def main() -> int:
    errors: list[str] = []
    _, home_nodes = load_nodes("index.html")
    website = node_by_id(home_nodes, WEBSITE_ID)
    errors.extend(validate_person(node_by_id(home_nodes, PERSON_ID), "index.html"))
    if website is None or website.get("@type") != "WebSite":
        errors.append(f"index.html: missing WebSite {WEBSITE_ID}")
    else:
        if website.get("url") != "https://suyogjoshi.com/":
            errors.append("index.html: WebSite URL must match the homepage canonical")
        if reference_id(website.get("publisher")) != PERSON_ID:
            errors.append("index.html: WebSite publisher must reference the stable Person")
        if reference_ids(website.get("hasPart")) != {WRITING_ID, SYSTEMS_ID, TRAINING_ID}:
            errors.append("index.html: WebSite must connect Writing, Systems, and Training")

    _, about_nodes = load_nodes("about/index.html")
    errors.extend(validate_person(node_by_id(about_nodes, PERSON_ID), "about/index.html"))
    profile = node_by_id(about_nodes, PROFILE_ID)
    if profile is None or profile.get("@type") != "ProfilePage":
        errors.append(f"about/index.html: missing ProfilePage {PROFILE_ID}")
    elif reference_id(profile.get("mainEntity")) != PERSON_ID or reference_id(profile.get("isPartOf")) != WEBSITE_ID:
        errors.append("about/index.html: ProfilePage must connect the stable Person and WebSite")

    for relative, collection_id in (("writing/index.html", WRITING_ID), ("systems/index.html", SYSTEMS_ID)):
        _, nodes = load_nodes(relative)
        collection = node_by_id(nodes, collection_id)
        if collection is None or collection.get("@type") != "CollectionPage":
            errors.append(f"{relative}: missing CollectionPage {collection_id}")
        elif reference_id(collection.get("creator")) != PERSON_ID or reference_id(collection.get("isPartOf")) != WEBSITE_ID:
            errors.append(f"{relative}: CollectionPage must connect the stable Person and WebSite")

    _, training_nodes = load_nodes("training/index.html")
    training = node_by_id(training_nodes, TRAINING_ID)
    service = node_by_id(training_nodes, SERVICE_ID)
    brand = node_by_id(training_nodes, BRAND_ID)
    if training is None or training.get("@type") != "CollectionPage":
        errors.append(f"training/index.html: missing CollectionPage {TRAINING_ID}")
    elif reference_id(training.get("mainEntity")) != SERVICE_ID or reference_id(training.get("isPartOf")) != WEBSITE_ID:
        errors.append("training/index.html: CollectionPage must connect the training Service and WebSite")
    if service is None or service.get("@type") != "Service":
        errors.append(f"training/index.html: missing training Service {SERVICE_ID}")
    elif reference_id(service.get("provider")) != PERSON_ID or reference_id(service.get("brand")) != BRAND_ID:
        errors.append("training/index.html: Service must connect the stable Person provider and Software Signal brand")
    if brand is None or brand.get("@type") != "Brand" or brand.get("name") != "Software Signal":
        errors.append(f"training/index.html: missing Software Signal Brand {BRAND_ID}")
    if any(node.get("@type") == "Organization" and "Software Signal" in str(node.get("name", "")) for node in training_nodes):
        errors.append("training/index.html: Software Signal must not be represented as an Organization")

    course_count = 0
    for path in sorted((ROOT / "training").glob("*/index.html")):
        relative = path.relative_to(ROOT).as_posix()
        try:
            _, nodes = load_nodes(relative)
        except json.JSONDecodeError as exc:
            errors.append(f"{relative}: malformed structured data: {exc}")
            continue
        if any(node.get("@type") == "Organization" and "Software Signal" in str(node.get("name", "")) for node in nodes):
            errors.append(f"{relative}: Software Signal must not be represented as an Organization")
        for course in (node for node in nodes if node.get("@type") == "Course"):
            course_count += 1
            provider = course.get("provider")
            if not isinstance(provider, dict) or provider.get("@type") != "Person" or provider.get("@id") != PERSON_ID:
                errors.append(f"{relative}: Course provider must reference {PERSON_ID}")
            elif provider.get("name") != "Suyog Joshi" or provider.get("url") != "https://suyogjoshi.com/about/":
                errors.append(f"{relative}: Course provider identity contradicts the public Person")
    if course_count != 5:
        errors.append(f"expected 5 public Course schemas, found {course_count}")

    article_count = 0
    for path in sorted((ROOT / "writing").glob("*/index.html")):
        if path.parent.name == "series":
            continue
        relative = path.relative_to(ROOT).as_posix()
        _, nodes = load_nodes(relative)
        for article in (node for node in nodes if node.get("@type") == "BlogPosting"):
            article_count += 1
            if reference_id(article.get("author")) != PERSON_ID:
                errors.append(f"{relative}: BlogPosting author must reference {PERSON_ID}")
    if article_count != 28:
        errors.append(f"expected 28 public BlogPosting schemas, found {article_count}")

    provider_source = (ROOT / "training/provider/index.html").read_text(encoding="utf-8")
    for disclosure in (
        "Software Signal is a training offering provided by Suyog Joshi.",
        "Suyog Joshi, trading as Software Signal",
    ):
        if disclosure not in provider_source:
            errors.append(f"training/provider/index.html: missing approved provider disclosure: {disclosure}")

    if errors:
        print("Site identity validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Validated the Person/WebSite/ProfilePage graph, 3 public collections, {article_count} articles, and {course_count} courses.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
