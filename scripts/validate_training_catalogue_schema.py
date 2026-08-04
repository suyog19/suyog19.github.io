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
        "description": "A live 14-session course that teaches core Python through an example structured-data capstone.",
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
    "courseMode",
    "startDate",
    "endDate",
    "eventStatus",
}
DELIVERY_SECTIONS = {
    "duration", "workload", "language", "sessionExperience", "support",
    "feedback", "recordings", "certificate", "applicationReview", "capstone",
    "planning", "lastReviewedAt",
}
COHORT_FIELDS = {
    "capacity", "minimumSize", "maximumSize", "capacityRemaining",
    "minimumThresholdReached", "registrationWindow", "cohortId", "cohortLabel",
    "startDate", "endDate", "tentativeStartAt", "tentativeEndAt",
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


def validate_delivery_profile(course: dict[str, object], location: str) -> list[str]:
    errors: list[str] = []
    profile = course.get("deliveryProfile")
    if course.get("lifecycleStatus") != "launched":
        return errors
    if not isinstance(profile, dict):
        return [f"{location}: launched course requires a deliveryProfile"]
    missing = sorted(DELIVERY_SECTIONS.difference(profile))
    if missing:
        errors.append(f"{location}: deliveryProfile missing {', '.join(missing)}")

    duration = profile.get("duration")
    if not isinstance(duration, dict) or not isinstance(duration.get("approximateWeeks"), int) or duration.get("approximateWeeks", 0) <= 0:
        errors.append(f"{location}: duration.approximateWeeks must be a positive integer")
    workload = profile.get("workload")
    if not isinstance(workload, dict):
        errors.append(f"{location}: workload must be an object")
    else:
        for field in ("regularSessions", "sessionMinutes", "sessionsPerWeek"):
            if not isinstance(workload.get(field), int) or workload.get(field, 0) <= 0:
                errors.append(f"{location}: workload.{field} must be a positive integer")
        normal = workload.get("normalIndependentHoursPerWeek")
        capstone = workload.get("capstoneIndependentHoursPerWeek")
        if not isinstance(normal, dict) or not all(isinstance(normal.get(key), (int, float)) for key in ("minimum", "maximum")) or normal.get("minimum", 0) > normal.get("maximum", 0):
            errors.append(f"{location}: normal weekly workload requires an ordered minimum and maximum")
        if not isinstance(capstone, dict) or not isinstance(capstone.get("maximum"), (int, float)):
            errors.append(f"{location}: capstone weekly workload requires a maximum")

    recordings = profile.get("recordings")
    if isinstance(recordings, dict) and recordings.get("accessDaysAfterFinalRegularSession") and not recordings.get("regularSessionsPlanned"):
        errors.append(f"{location}: recording access requires regularSessionsPlanned")
    certificate = profile.get("certificate")
    if isinstance(certificate, dict) and not certificate.get("available") and any(
        certificate.get(key) for key in ("attendancePercentageMinimum", "capstoneSubmissionRequired")
    ):
        errors.append(f"{location}: certificate requirements require certificate availability")
    capstone = profile.get("capstone")
    if isinstance(capstone, dict) and capstone.get("cohortVariable") and not capstone.get("variationExplanation"):
        errors.append(f"{location}: cohort-variable capstone requires learner-facing variationExplanation")
    planning = profile.get("planning")
    if not isinstance(planning, dict) or planning.get("certainty") != "currently-planned":
        errors.append(f"{location}: planning assumptions must use certainty 'currently-planned'")

    def find_cohort_fields(value: object, path: str = "deliveryProfile") -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if key in COHORT_FIELDS:
                    errors.append(f"{location}: {path}.{key} duplicates backend-owned cohort state")
                find_cohort_fields(child, f"{path}.{key}")
        elif isinstance(value, list):
            for child in value:
                find_cohort_fields(child, path)

    find_cohort_fields(profile)
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
        source_catalogue = json.loads((ROOT / "data" / "training-courses.json").read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        print(f"Training catalogue validation failed:\n- data/training-courses.json: {exc}", file=sys.stderr)
        return 1
    if source_catalogue.get("schemaVersion") != "3.0.0":
        errors.append("data/training-courses.json: schemaVersion must be 3.0.0")
    source_courses = source_catalogue.get("courses")
    if not isinstance(source_courses, list):
        errors.append("data/training-courses.json: courses must be a list")
        source_courses = []
    for course in source_courses:
        if isinstance(course, dict):
            errors.extend(validate_delivery_profile(course, f"data/training-courses.json course {course.get('courseId', '<unknown>')!r}"))
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
    print("Validated the version 3 course catalogue, launched delivery profiles, stable Course entities, breadcrumbs, provider, and public-data boundary.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
