"""Validate the public Suyog Joshi identity and provider entity graph."""

from __future__ import annotations

import json
import re
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
RESEARCH_ID = "https://suyogjoshi.com/research/#collection"
FRAMEWORK_ID = "https://suyogjoshi.com/framework/#webpage"
CONSULTING_PAGE_ID = "https://suyogjoshi.com/consulting/#webpage"
CONSULTING_SERVICE_ID = "https://suyogjoshi.com/consulting/#service"
WEBSITE_SERVICES_PAGE_ID = "https://suyogjoshi.com/website-services/#webpage"
WEBSITE_SERVICE_ID = "https://suyogjoshi.com/website-services/#service"
NEWSLETTER_ID = "https://suyogjoshi.com/newsletter/#webpage"
SERVICE_ID = "https://suyogjoshi.com/training/#service"
BRAND_ID = "https://suyogjoshi.com/training/#brand"
COURSE_LIST_ID = "https://suyogjoshi.com/training/#course-list"
PUBLIC_PROFILES = {
    "https://www.linkedin.com/in/suyog-joshi",
    "https://medium.com/@suyog19",
    "https://github.com/suyog19",
}
PUBLIC_SYSTEM_REPOSITORIES = {
    "systems/ai-dev-orchestrator/index.html": "https://github.com/suyog19/ai-dev-orchestrator",
    "systems/survey-poll-serverless/index.html": "https://github.com/suyog19/survey-poll-app",
}
FAMILY_TITLES = {
    "consulting/index.html": "Software Engineering Consulting | Software Signal by Suyog Joshi",
    "training/index.html": "Professional Learning | Software Signal by Suyog Joshi",
    "website-services/index.html": "Website Services | Software Signal by Suyog Joshi",
    "framework/index.html": "Reliable Engineering Framework | Software Signal by Suyog Joshi",
    "research/index.html": "Engineering Research | Software Signal by Suyog Joshi",
    "newsletter/index.html": "Software Signal Weekly | Suyog Joshi",
    "writing/index.html": "Software Engineering Writing | Software Signal by Suyog Joshi",
    "systems/index.html": "Engineering Systems | Software Signal by Suyog Joshi",
    "about/index.html": "About | Suyog Joshi",
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
    if "subjectOf" in person:
        errors.append(f"{location}: Person subjectOf must not substitute for creator or provider relationships")
    private_fields = {"email", "telephone", "address", "birthDate"}
    exposed = sorted(private_fields.intersection(person))
    if exposed:
        errors.append(f"{location}: Person exposes unnecessary private fields: {', '.join(exposed)}")
    return errors


def main() -> int:
    errors: list[str] = []
    for relative, title in FAMILY_TITLES.items():
        source = (ROOT / relative).read_text(encoding="utf-8")
        escaped_title = re.escape(title)
        patterns = (
            rf"<title>\s*{escaped_title}\s*</title>",
            rf"<meta\s+property=\"og:title\"\s+content=\"{escaped_title}\"\s*/?>",
            rf"<meta\s+name=\"twitter:title\"\s+content=\"{escaped_title}\"\s*/?>",
        )
        if any(re.search(pattern, source, re.MULTILINE) is None for pattern in patterns):
            errors.append(f"{relative}: metadata titles must use the approved family identity: {title}")
        if len(title) > 70:
            errors.append(f"{relative}: approved title exceeds the 70-character usability guardrail")
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
        expected_parts = {
            FRAMEWORK_ID,
            RESEARCH_ID,
            CONSULTING_PAGE_ID,
            TRAINING_ID,
            WEBSITE_SERVICES_PAGE_ID,
            WRITING_ID,
            SYSTEMS_ID,
            NEWSLETTER_ID,
        }
        website_parts = website.get("hasPart")
        valid_part_list = (
            isinstance(website_parts, list)
            and len(website_parts) == len(expected_parts)
            and all(isinstance(item, dict) and set(item) == {"@id"} for item in website_parts)
        )
        if not valid_part_list or reference_ids(website_parts) != expected_parts:
            errors.append("index.html: WebSite must connect every first-class Software Signal surface")

    about_source, about_nodes = load_nodes("about/index.html")
    errors.extend(validate_person(node_by_id(about_nodes, PERSON_ID), "about/index.html"))
    profile = node_by_id(about_nodes, PROFILE_ID)
    if profile is None or profile.get("@type") != "ProfilePage":
        errors.append(f"about/index.html: missing ProfilePage {PROFILE_ID}")
    elif reference_id(profile.get("mainEntity")) != PERSON_ID or reference_id(profile.get("isPartOf")) != WEBSITE_ID:
        errors.append("about/index.html: ProfilePage must connect the stable Person and WebSite")
    for public_profile in PUBLIC_PROFILES:
        expected_link = f'href="{public_profile}" target="_blank" rel="me noopener noreferrer"'
        if expected_link not in about_source:
            errors.append(f"about/index.html: missing visible verified-profile link for {public_profile}")

    for relative, collection_id in (("writing/index.html", WRITING_ID), ("systems/index.html", SYSTEMS_ID)):
        _, nodes = load_nodes(relative)
        collection = node_by_id(nodes, collection_id)
        if collection is None or collection.get("@type") != "CollectionPage":
            errors.append(f"{relative}: missing CollectionPage {collection_id}")
        elif reference_id(collection.get("creator")) != PERSON_ID or reference_id(collection.get("isPartOf")) != WEBSITE_ID:
            errors.append(f"{relative}: CollectionPage must connect the stable Person and WebSite")

    _, research_nodes = load_nodes("research/index.html")
    research = node_by_id(research_nodes, RESEARCH_ID)
    if research is None or research.get("@type") != "CollectionPage":
        errors.append(f"research/index.html: missing CollectionPage {RESEARCH_ID}")
    elif reference_id(research.get("creator")) != PERSON_ID or reference_id(research.get("isPartOf")) != WEBSITE_ID:
        errors.append("research/index.html: CollectionPage must connect the stable Person and WebSite")

    for relative, page_id, person_property in (
        ("framework/index.html", FRAMEWORK_ID, "creator"),
        ("newsletter/index.html", NEWSLETTER_ID, "author"),
    ):
        _, nodes = load_nodes(relative)
        page_node = node_by_id(nodes, page_id)
        if page_node is None or page_node.get("@type") != "WebPage":
            errors.append(f"{relative}: missing WebPage {page_id}")
        elif reference_id(page_node.get("isPartOf")) != WEBSITE_ID or reference_id(page_node.get(person_property)) != PERSON_ID:
            errors.append(f"{relative}: WebPage must connect the stable Person and WebSite")

    for relative, page_id, service_id in (
        ("consulting/index.html", CONSULTING_PAGE_ID, CONSULTING_SERVICE_ID),
        ("website-services/index.html", WEBSITE_SERVICES_PAGE_ID, WEBSITE_SERVICE_ID),
    ):
        _, nodes = load_nodes(relative)
        page_node = node_by_id(nodes, page_id)
        service_node = node_by_id(nodes, service_id)
        if page_node is None or page_node.get("@type") != "WebPage":
            errors.append(f"{relative}: missing WebPage {page_id}")
        elif reference_id(page_node.get("isPartOf")) != WEBSITE_ID or reference_id(page_node.get("mainEntity")) != service_id:
            errors.append(f"{relative}: WebPage must connect the WebSite and its main Service")
        if service_node is None or service_node.get("@type") != "Service":
            errors.append(f"{relative}: missing Service {service_id}")
        elif reference_id(service_node.get("provider")) != PERSON_ID or reference_id(service_node.get("mainEntityOfPage")) != page_id:
            errors.append(f"{relative}: Service must connect the stable Person and its WebPage")

    _, training_nodes = load_nodes("training/index.html")
    training = node_by_id(training_nodes, TRAINING_ID)
    service = node_by_id(training_nodes, SERVICE_ID)
    brand = node_by_id(training_nodes, BRAND_ID)
    if training is None or training.get("@type") != "CollectionPage":
        errors.append(f"training/index.html: missing CollectionPage {TRAINING_ID}")
    elif reference_id(training.get("mainEntity")) != COURSE_LIST_ID or reference_id(training.get("isPartOf")) != WEBSITE_ID:
        errors.append("training/index.html: CollectionPage must connect the course catalogue and WebSite")
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
    if 'href="../../about/">Suyog Joshi</a>' not in provider_source:
        errors.append("training/provider/index.html: provider must link to the canonical About profile")
    for public_profile in PUBLIC_PROFILES:
        expected_link = f'href="{public_profile}" target="_blank" rel="me noopener noreferrer"'
        if expected_link not in provider_source:
            errors.append(f"training/provider/index.html: missing verified provider profile {public_profile}")

    for relative, repository in PUBLIC_SYSTEM_REPOSITORIES.items():
        system_source = (ROOT / relative).read_text(encoding="utf-8")
        expected_link = f'href="{repository}" target="_blank" rel="noopener noreferrer"'
        if expected_link not in system_source:
            errors.append(f"{relative}: missing safe public-repository link to {repository}")

    if errors:
        print("Site identity validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Validated the revised Software Signal discovery graph, metadata family matrix, Person/WebSite/ProfilePage graph, 4 public collections, 3 services, {article_count} articles, and {course_count} courses.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
