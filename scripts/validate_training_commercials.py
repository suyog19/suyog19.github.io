"""Reject stale or unapproved commercial terms before training content is published."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parents[1]
courses = json.loads((ROOT / "data" / "training-courses.json").read_text(encoding="utf-8"))["courses"]
errors = []

EXPECTED_PRICES = {
    "crs_python_foundations": (400_000, 100_000, 300_000),
    "crs_applied_python": (800_000, 200_000, 600_000),
}
for course in courses:
    if course.get("lifecycleStatus") != "launched":
        continue
    label = course.get("title", course.get("courseId", "Unknown course"))
    actual = (
        course.get("feeAmountPaise"),
        course.get("depositAmountPaise"),
        course.get("remainingAmountPaise"),
    )
    expected = EXPECTED_PRICES.get(course.get("courseId"))
    if expected is None:
        errors.append(f"{label}: launched course has no approved production price")
    elif actual != expected:
        errors.append(f"{label}: expected total/deposit/balance {expected}, found {actual}")
    if not all(isinstance(value, int) and value >= 0 for value in actual):
        errors.append(f"{label}: total, deposit and remaining fee must be non-negative paise integers")
    elif actual[1] + actual[2] != actual[0]:
        errors.append(f"{label}: deposit plus remaining fee must equal total fee")
    if course.get("currency") != "INR":
        errors.append(f"{label}: production currency must be INR")
    if course.get("taxTreatment") != "Inclusive of applicable taxes":
        errors.append(f"{label}: tax treatment must say Inclusive of applicable taxes")
    if course.get("cohortAvailability") == "payment-open" and not course.get("startDate"):
        errors.append(f"{label}: applications/payment cannot open without a published start date")

catalog_by_id = {course.get("courseId"): course for course in courses}
python_catalog = catalog_by_id.get("crs_python_foundations", {})
python_launch_state = {
    "cohortAvailability": "apply",
    "primaryActionLabel": "Apply",
    "primaryActionDestination": "/apply/?courseId=crs_python_foundations",
}
for field, expected in python_launch_state.items():
    if python_catalog.get(field) != expected:
        errors.append(f"Python Foundations public catalog {field} must be {expected!r}, found {python_catalog.get(field)!r}")
for field in ("cohortAvailability", "primaryActionLabel", "primaryActionDestination"):
    if "notify" in str(python_catalog.get(field, "")).lower():
        errors.append(f"Python Foundations public catalog contains stale closed-launch state in {field}")
python_catalog_text = json.dumps(python_catalog, sort_keys=True).lower()
for phrase in ("applications are not open", "applications and payment are not open", "no-payment stage", "payment is closed"):
    if phrase in python_catalog_text:
        errors.append(f"Python Foundations public catalog contains stale launch wording: {phrase}")

applied_catalog = catalog_by_id.get("crs_applied_python", {})
if applied_catalog.get("cohortAvailability") != "notify-me" or applied_catalog.get("primaryActionLabel") != "Get notified when applications open":
    errors.append("Applied Data Analysis public catalog must remain notify-only until its applications are approved open")

policy_files = [
    ROOT / "training" / "policies" / "index.html",
    ROOT / "training" / "policies" / "terms" / "index.html",
    ROOT / "training" / "policies" / "cancellation-refunds" / "index.html",
    ROOT / "training" / "policies" / "privacy" / "index.html",
    ROOT / "training" / "policies" / "conduct-recording" / "index.html",
    ROOT / "training" / "provider" / "index.html",
    ROOT / "privacy" / "index.html",
]
journey_files = [
    ROOT / "training" / "index.html",
    ROOT / "apply" / "index.html",
    ROOT / "my-learning" / "index.html",
    ROOT / "my-learning" / "payment" / "index.html",
    ROOT / "my-learning" / "balance" / "index.html",
    ROOT / "my-learning" / "change" / "index.html",
]
course_detail_files = sorted(
    path for path in (ROOT / "training").glob("*/index.html")
    if "data-course-detail" in path.read_text(encoding="utf-8")
)
published_files = policy_files + journey_files + course_detail_files
published_text = "\n".join(path.read_text(encoding="utf-8") for path in published_files)

temporary_price_patterns = (
    r"(?<![\d,])(?:INR|₹)\s*40(?![\d,])",
    r"(?<![\d,])(?:INR|₹)\s*10(?![\d,])",
    r"(?<![\d,])(?:INR|₹)\s*30(?![\d,])",
)
for pattern in temporary_price_patterns:
    if re.search(pattern, published_text, flags=re.IGNORECASE):
        errors.append(f"published content contains temporary controlled-validation price matching {pattern}")

stale_wording = (
    "applications and payment are not open",
    "applications and payment remain closed",
    "current no-payment stage",
    "while payment is closed",
    "no paid cohort can currently",
    "future paid offer",
)
for phrase in stale_wording:
    if phrase in published_text.lower():
        errors.append(f"published content contains stale no-payment wording: {phrase}")

launched_pages = {
    "crs_python_foundations": ROOT / "training" / "python-foundations-for-data-science" / "index.html",
    "crs_applied_python": ROOT / "training" / "applied-data-analysis-with-python" / "index.html",
}
stale_launch_phrases = (
    "will be finalised before applications open",
    "will be published before applications open",
    "not promised until the policy is published",
)
for course_id, path in launched_pages.items():
    page = path.read_text(encoding="utf-8")
    for phrase in stale_launch_phrases:
        if phrase in page.lower():
            errors.append(f"{path.relative_to(ROOT)} contains stale pre-launch wording: {phrase}")
    if 'href="../policies/"' not in page:
        errors.append(f"{path.relative_to(ROOT)} must link the current training policies")

python_page = launched_pages["crs_python_foundations"].read_text(encoding="utf-8")
for required in (
    'data-cohort-availability="apply"',
    'href="../../apply/?courseId=crs_python_foundations"',
    "Applications open for review",
    "Payment confirmations are not tax invoices",
):
    if required not in python_page:
        errors.append(f"launched Python course page is missing current production wording: {required}")
for forbidden in ("Get notified when applications open", "Applications not open"):
    if forbidden in python_page:
        errors.append(f"launched Python course page contains stale action wording: {forbidden}")

journey_page = (ROOT / "training" / "index.html").read_text(encoding="utf-8")
python_card = journey_page.split('id="course-python-foundations"', 1)[-1].split('id="course-data-analysis"', 1)[0]
for required in (
    'data-course-id="crs_python_foundations"',
    "data-course-status",
    "Checking availability",
    'data-course-action="transactional"',
):
    if required not in python_card:
        errors.append(f"Python Foundations journey card is missing backend-owned availability wiring: {required}")
for forbidden in (
    "Applications open",
    "Launching soon",
    'data-cohort-availability="apply"',
    'data-cohort-availability="notify-me"',
):
    if forbidden in python_card:
        errors.append(f"Python Foundations journey card contains static availability authority: {forbidden}")
course_actions = (ROOT / "js" / "course-actions.js").read_text(encoding="utf-8")
for required in ("/training/course-actions", "updateJourneyCard", "Availability unavailable"):
    if required not in course_actions:
        errors.append(f"journey availability controller is missing backend-owned behavior: {required}")

policy_ids = (
    "software-signal-terms@1.1.0",
    "software-signal-privacy@1.1.0",
    "software-signal-cancellation-refund@1.1.0",
    "software-signal-course-delivery@1.1.0",
    "software-signal-recording-consent@1.1.0",
    "software-signal-conduct-confidentiality@1.1.0",
    "software-signal-support-grievance@1.1.0",
    "software-signal-transfer@1.1.0",
)
policy_hub = policy_files[0].read_text(encoding="utf-8")
for policy_id in policy_ids:
    if policy_id not in policy_hub:
        errors.append(f"policy hub is missing immutable identifier {policy_id}")

effective_at = "2026-07-20T00:00:00+05:30"
for path in policy_files:
    if effective_at not in path.read_text(encoding="utf-8"):
        errors.append(f"{path.relative_to(ROOT)} is missing exact effective instant {effective_at}")

application_model = (ROOT / "js" / "course-application-model.js").read_text(encoding="utf-8")
for mechanism_id in ("software-signal-terms-privacy", "software-signal-recorded-delivery"):
    if f"documentId: '{mechanism_id}', version: '1.1.0'" not in application_model:
        errors.append(f"application acknowledgement mechanism is not aligned: {mechanism_id}@1.1.0")

privacy_page = (ROOT / "privacy" / "index.html").read_text(encoding="utf-8")
for required in (
    "retention baseline is 365 days",
    "retained for at least 365 days",
    "policy maximum is 90 days",
    "currently administered manually",
    "not an automatic or immediate deletion guarantee",
):
    if required not in privacy_page:
        errors.append(f"privacy notice is missing accurate retention qualification: {required}")

refund_page = (ROOT / "training" / "policies" / "cancellation-refunds" / "index.html").read_text(encoding="utf-8")
if len(re.findall(r'<th scope="row">[1-7]\.', refund_page)) != 7:
    errors.append("cancellation/refund policy must contain exactly seven numbered scenarios")
for required in (
    "7–10 business days", "May be deducted", "Not deducted", "rounded down to whole paise",
    "maximum 3", "ACTION_NEEDED", "not a tax invoice", "no balance grace period",
):
    if required not in refund_page:
        errors.append(f"cancellation/refund policy is missing required term: {required}")

for required in ("INR 4,000", "INR 1,000", "INR 3,000", "INR 8,000", "INR 2,000", "INR 6,000"):
    if required not in policy_hub:
        errors.append(f"policy hub is missing approved display price {required}")

if errors:
    raise SystemExit("Training commercial validation failed:\n- " + "\n- ".join(errors))
print(f"Training commercial validation passed for {len(EXPECTED_PRICES)} launched courses and policy version 1.1.0.")
