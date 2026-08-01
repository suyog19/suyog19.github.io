"""Validate the public Software Signal course catalogue JSON-LD contract."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from validate_article_structured_data import StructuredDataParser, schema_nodes


ROOT = Path(__file__).parents[1]
PERSON_ID = "https://suyogjoshi.com/#person"
TRAINING_ID = "https://suyogjoshi.com/training/#collection"
COURSE_LIST_ID = "https://suyogjoshi.com/training/#course-list"

COURSES = (
    {
        "slug": "python-foundations-for-data-science",
        "stage": 1,
        "name": "Python Foundations for Data Science",
        "description": "A live 14-session course that teaches core Python through a personal data analyser.",
    },
    {
        "slug": "applied-data-analysis-with-python",
        "stage": 2,
        "name": "Applied Data Analysis with Python",
        "description": "A live 14-session course in reproducible data investigation with NumPy, pandas, and matplotlib.",
    },
    {
        "slug": "practical-machine-learning-foundations",
        "stage": 3,
        "name": "Practical Machine Learning Foundations",
        "description": "A planned course in prediction framing, classical models, honest evaluation, leakage prevention, interpretation and error analysis.",
    },
    {
        "slug": "generative-ai-application-development",
        "stage": 4,
        "name": "Generative AI Application Development",
        "description": "A planned course in model APIs, structured outputs, retrieval, grounding, bounded tools, evaluation, security, cost and reliability.",
    },
    {
        "slug": "engineering-reliable-ai-systems",
        "stage": 5,
        "name": "Engineering Reliable AI Systems",
        "description": "A planned course in AI-system boundaries, architecture, evaluation, security, oversight, observability, rollout, recovery, governance and evidence.",
    },
)

PRIVATE_SCHEMA_TERMS = (
    "/apply/",
    "/my-learning/",
    "/training/register-interest/",
    "courseId=",
    "paymentLink",
    "learnerId",
    "cohortId",
)
UNCONFIRMED_COMMERCIAL_FIELDS = {
    "offers",
    "hasCourseInstance",
    "courseInstance",
    "startDate",
    "endDate",
    "eventStatus",
}


def course_url(slug: str) -> str:
    return f"https://suyogjoshi.com/training/{slug}/"


def course_id(slug: str) -> str:
    return course_url(slug) + "#course"


def load_documents(relative: str) -> tuple[list[object], list[dict[str, object]]]:
    source = (ROOT / relative).read_text(encoding="utf-8")
    parser = StructuredDataParser()
    parser.feed(source)
    documents = parser.json_documents
    nodes = [node for document in documents for node in schema_nodes(document)]
    return documents, nodes


def node_by_id(nodes: list[dict[str, object]], entity_id: str) -> dict[str, object] | None:
    return next((node for node in nodes if node.get("@id") == entity_id), None)


def reference_id(value: object) -> str | None:
    return value.get("@id") if isinstance(value, dict) else None


def validate_public_boundary(documents: list[object], location: str) -> list[str]:
    errors: list[str] = []
    serialized = json.dumps(documents, ensure_ascii=False)
    for term in PRIVATE_SCHEMA_TERMS:
        if term in serialized:
            errors.append(f"{location}: public schema exposes private or transactional term {term!r}")

    def walk(value: object) -> None:
        if isinstance(value, dict):
            exposed = sorted(UNCONFIRMED_COMMERCIAL_FIELDS.intersection(value))
            if exposed:
                errors.append(
                    f"{location}: schema publishes unconfirmed commercial fields: {', '.join(exposed)}"
                )
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(documents)
    return errors


def validate_course(
    course: dict[str, object] | None,
    expected: dict[str, object],
    location: str,
    *,
    compact_provider: bool,
) -> list[str]:
    if course is None:
        return [f"{location}: missing Course {course_id(str(expected['slug']))}"]
    errors: list[str] = []
    fields = {
        "@type": "Course",
        "@id": course_id(str(expected["slug"])),
        "name": expected["name"],
        "description": expected["description"],
        "url": course_url(str(expected["slug"])),
        "courseMode": "Online",
    }
    for field, wanted in fields.items():
        if course.get(field) != wanted:
            errors.append(f"{location}: Course {field} must be {wanted!r}")
    provider = course.get("provider")
    if reference_id(provider) != PERSON_ID:
        errors.append(f"{location}: Course provider must reference {PERSON_ID}")
    elif not compact_provider and isinstance(provider, dict):
        if provider.get("@type") != "Person":
            errors.append(f"{location}: detailed Course provider must be a Person")
        if provider.get("name") != "Suyog Joshi" or provider.get("url") != "https://suyogjoshi.com/about/":
            errors.append(f"{location}: detailed Course provider contradicts the stable Person")
    return errors


def main() -> int:
    errors: list[str] = []
    try:
        hub_documents, hub_nodes = load_documents("training/index.html")
    except json.JSONDecodeError as exc:
        print(f"Training catalogue validation failed:\n- training/index.html: invalid JSON-LD: {exc}", file=sys.stderr)
        return 1

    errors.extend(validate_public_boundary(hub_documents, "training/index.html"))
    catalogue = node_by_id(hub_nodes, COURSE_LIST_ID)
    if catalogue is None or catalogue.get("@type") != "ItemList":
        errors.append(f"training/index.html: missing ItemList {COURSE_LIST_ID}")
    else:
        if catalogue.get("itemListOrder") != "https://schema.org/ItemListOrderAscending":
            errors.append("training/index.html: catalogue must declare ascending order")
        if catalogue.get("numberOfItems") != len(COURSES):
            errors.append(f"training/index.html: catalogue numberOfItems must be {len(COURSES)}")
        if reference_id(catalogue.get("isPartOf")) != TRAINING_ID:
            errors.append(f"training/index.html: catalogue must be part of {TRAINING_ID}")

        elements = catalogue.get("itemListElement")
        if not isinstance(elements, list):
            errors.append("training/index.html: catalogue itemListElement must be a list")
            elements = []
        positions = [element.get("position") for element in elements if isinstance(element, dict)]
        if positions != list(range(1, len(COURSES) + 1)):
            errors.append(
                "training/index.html: catalogue positions must be unique and ordered 1 through 5"
            )
        if len(elements) != len(COURSES):
            errors.append(f"training/index.html: catalogue must contain exactly {len(COURSES)} courses")
        for expected, element in zip(COURSES, elements):
            item = element.get("item") if isinstance(element, dict) else None
            errors.extend(
                validate_course(
                    item if isinstance(item, dict) else None,
                    expected,
                    "training/index.html",
                    compact_provider=True,
                )
            )

    collection = node_by_id(hub_nodes, TRAINING_ID)
    if collection is None or reference_id(collection.get("mainEntity")) != COURSE_LIST_ID:
        errors.append(f"training/index.html: CollectionPage mainEntity must reference {COURSE_LIST_ID}")

    for expected in COURSES:
        slug = str(expected["slug"])
        relative = f"training/{slug}/index.html"
        try:
            documents, nodes = load_documents(relative)
        except json.JSONDecodeError as exc:
            errors.append(f"{relative}: invalid JSON-LD: {exc}")
            continue
        errors.extend(validate_public_boundary(documents, relative))
        courses = [node for node in nodes if node.get("@type") == "Course"]
        breadcrumbs = [node for node in nodes if node.get("@type") == "BreadcrumbList"]
        if len(courses) != 1:
            errors.append(f"{relative}: expected exactly one Course, found {len(courses)}")
        errors.extend(
            validate_course(courses[0] if len(courses) == 1 else None, expected, relative, compact_provider=False)
        )
        if len(breadcrumbs) != 1:
            errors.append(f"{relative}: expected exactly one BreadcrumbList, found {len(breadcrumbs)}")
            continue
        elements = breadcrumbs[0].get("itemListElement")
        if not isinstance(elements, list) or len(elements) != 3:
            errors.append(f"{relative}: breadcrumb must contain journey, stage, and course items")
            continue
        positions = [item.get("position") for item in elements if isinstance(item, dict)]
        names = [item.get("name") for item in elements if isinstance(item, dict)]
        expected_names = ["Learning journey", f"Stage {expected['stage']}", expected["name"]]
        if positions != [1, 2, 3] or names != expected_names:
            errors.append(f"{relative}: breadcrumb positions or names do not match the visible journey")
        if elements[0].get("item") != "https://suyogjoshi.com/training/":
            errors.append(f"{relative}: breadcrumb must start at the canonical Training hub")

    if errors:
        print("Training catalogue validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Validated the ordered 5-course catalogue, stable Course entities, breadcrumbs, provider, and public-data boundary.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
