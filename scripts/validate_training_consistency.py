"""Validate launched-course commitments across catalogue, pages, application, and policies."""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path


ROOT = Path(__file__).parents[1]
POLICY_VERSION = "1.1.0"
LAUNCHED_PAGE = {
    "crs_python_foundations": "training/python-foundations-for-data-science/index.html",
    "crs_applied_python": "training/applied-data-analysis-with-python/index.html",
}
SOURCE_PATHS = (
    *LAUNCHED_PAGE.values(),
    "apply/index.html",
    "privacy/index.html",
    "training/policies/terms/index.html",
    "training/policies/conduct-recording/index.html",
    "training/policies/privacy/index.html",
    "js/course-actions.js",
)
STALE_LAUNCHED_COPY = (
    "criteria are not yet published",
    "criteria are not currently published",
    "criteria are not currently promised",
    "weekly range will be stated",
    "weekly range is not yet confirmed",
    "practice estimates follow the cohort notice",
    "selected work may be reviewed",
    "review availability will be stated",
    "availability follows the future cohort notice",
    "scripts are central",
)
WHATSAPP_COMMITMENTS = (
    "whatsapp group is optional",
    "phone number and profile information",
    "email",
    "no essential announcement or support information is available only through whatsapp",
    "assignments and capstones are not submitted through whatsapp",
)
RECORDING_COMMITMENTS = (
    "regular-session recording is planned",
    "formally confirmed in the cohort offer and recording notice",
    "90 days after the final regular session",
    "optional clinics are not guaranteed to be recorded",
    "do not replace practice or count toward certificate attendance",
    "written summary or replacement walkthrough",
)
CERTIFICATE_COMMITMENTS = (
    "11 of 14",
    "capstone submission",
    "optional clinics and recording views do not count",
    "agreed capstone extension preserves eligibility",
    "no grade or pass mark is required",
    "normally within 10 business days",
)


def load_sources(root: Path = ROOT) -> tuple[dict[str, object], dict[str, str]]:
    catalogue = json.loads((root / "data/training-courses.json").read_text(encoding="utf-8"))
    sources = {path: (root / path).read_text(encoding="utf-8") for path in SOURCE_PATHS}
    return catalogue, sources


def require_all(errors: list[str], location: str, source: str, phrases: tuple[str, ...]) -> None:
    lowered = source.lower()
    for phrase in phrases:
        if phrase.lower() not in lowered:
            errors.append(f"{location}: missing commitment {phrase!r}")


def validate_consistency(catalogue: dict[str, object], sources: dict[str, str]) -> list[str]:
    errors: list[str] = []
    courses = catalogue.get("courses")
    if not isinstance(courses, list):
        return ["data/training-courses.json: courses must be a list"]

    launched = [course for course in courses if isinstance(course, dict) and course.get("lifecycleStatus") == "launched"]
    if set(course.get("courseId") for course in launched) != set(LAUNCHED_PAGE):
        errors.append("data/training-courses.json: launched course set does not match the validated page set")

    for course in launched:
        course_id = str(course["courseId"])
        location = LAUNCHED_PAGE[course_id]
        page = sources[location]
        lowered = page.lower()
        profile = course.get("deliveryProfile")
        if not isinstance(profile, dict):
            errors.append(f"{location}: launched course has no delivery profile")
            continue

        if course.get("minimumAge") != 18 or "applicants must be 18 or older" not in lowered:
            errors.append(f"{location}: minimumAge 18 must be visible before application")
        if course.get("timezone") != "Asia/Kolkata" or "india standard time (ist)" not in lowered:
            errors.append(f"{location}: Asia/Kolkata must be presented as India Standard Time (IST)")

        workload = profile.get("workload", {})
        try:
            live_hours = workload["sessionsPerWeek"] * workload["sessionMinutes"] / 60
            normal = workload["normalIndependentHoursPerWeek"]
            capstone = workload["capstoneIndependentHoursPerWeek"]
            normal_min = math.ceil(live_hours + normal["minimum"])
            normal_max = math.ceil(live_hours + normal["maximum"])
            capstone_max = math.ceil(live_hours + capstone["maximum"])
        except (KeyError, TypeError):
            errors.append(f"{location}: workload values cannot produce learner-facing totals")
        else:
            for phrase in (f"{normal_min}–{normal_max} hours total", f"up to about {capstone_max} hours total"):
                if phrase not in lowered:
                    errors.append(f"{location}: catalogue-derived workload must include {phrase!r}")

        planning = profile.get("planning", {})
        if "ist" not in str(planning.get("likelyCadence", "")).lower():
            errors.append(f"{location}: planning cadence must name IST")
        cohort_display = str(planning.get("cohortSizeDisplay", ""))
        if cohort_display != "10–15 learners" or cohort_display.lower() not in lowered:
            errors.append(f"{location}: planned cohort fallback must be '10–15 learners'")

        for stale in STALE_LAUNCHED_COPY:
            if stale in lowered:
                errors.append(f"{location}: stale launched-course copy {stale!r}")
        if page.count("Time commitment and learner responsibility"):
            errors.append(f"{location}: duplicate lower time-commitment section remains")

        require_all(errors, location, page, WHATSAPP_COMMITMENTS)
        require_all(errors, location, page, RECORDING_COMMITMENTS)
        require_all(errors, location, page, CERTIFICATE_COMMITMENTS)

        certificate = profile.get("certificate", {})
        expected_live_sessions = math.ceil(
            workload.get("regularSessions", 0) * certificate.get("attendancePercentageMinimum", 0) / 100
        )
        if expected_live_sessions != 11:
            errors.append(f"{location}: catalogue certificate threshold must resolve to 11 of 14 sessions")
        recordings = profile.get("recordings", {})
        if recordings.get("accessDaysAfterFinalRegularSession") != 90:
            errors.append(f"{location}: catalogue recording access must remain 90 days")

    python_page = sources[LAUNCHED_PAGE["crs_python_foundations"]]
    python_course = next(course for course in launched if course["courseId"] == "crs_python_foundations")
    capstone = python_course["deliveryProfile"]["capstone"]["exampleTitle"]
    if capstone != "Core-Python structured-data analyser":
        errors.append("data/training-courses.json: Python capstone title is not canonical")
    if len(re.findall(re.escape(capstone), python_page, re.IGNORECASE)) < 6:
        errors.append("training/python-foundations-for-data-science/index.html: canonical capstone term is missing from one or more surfaces")
    for old_term in (
        "example structured-data analyser",
        "personal data analyser",
        "build an core-python structured-data analyser",
    ):
        if old_term in python_page.lower():
            errors.append(f"training/python-foundations-for-data-science/index.html: old capstone term {old_term!r}")

    application = sources["apply/index.html"]
    require_all(errors, "apply/index.html", application, (
        "Applicants must be 18 or older",
        "5–6 total hours",
        "India Standard Time (IST)",
        "normally review applications within five business days",
        "No payment is collected with an application",
        "90 days after the final regular session",
        "11 of 14 regular live sessions",
        "Core-Python structured-data analyser",
    ))
    if 'id="application-adult"' not in application:
        errors.append("apply/index.html: adult-confirmation control is missing")

    terms = sources["training/policies/terms/index.html"]
    conduct = sources["training/policies/conduct-recording/index.html"]
    privacy = sources["privacy/index.html"]
    require_all(errors, "training/policies/terms/index.html", terms, CERTIFICATE_COMMITMENTS)
    require_all(errors, "training/policies/conduct-recording/index.html", conduct, RECORDING_COMMITMENTS)
    require_all(errors, "privacy/index.html", privacy, WHATSAPP_COMMITMENTS)

    policy_surfaces = (
        "apply/index.html",
        "privacy/index.html",
        "training/policies/terms/index.html",
        "training/policies/conduct-recording/index.html",
        "training/policies/privacy/index.html",
    )
    for location in policy_surfaces:
        if POLICY_VERSION not in sources[location]:
            errors.append(f"{location}: policy version {POLICY_VERSION} is missing")

    runtime = sources["js/course-actions.js"]
    for token in ("minimumSize", "capacity", "data-cohort-size", "size.textContent"):
        if token not in runtime:
            errors.append(f"js/course-actions.js: runtime cohort override is missing {token!r}")
    return errors


def main() -> int:
    try:
        catalogue, sources = load_sources()
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Training consistency validation failed:\n- {exc}", file=sys.stderr)
        return 1
    errors = validate_consistency(catalogue, sources)
    if errors:
        print("Training consistency validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Validated launched-course workload, age, timezone, cohort, support, recording, certificate, capstone, application, policy, and runtime consistency.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
