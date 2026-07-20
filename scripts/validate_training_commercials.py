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
    if course.get("cohortAvailability") in {"apply", "payment-open"} and not course.get("startDate"):
        errors.append(f"{label}: applications/payment cannot open without a published start date")

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
    ROOT / "apply" / "index.html",
    ROOT / "my-learning" / "index.html",
    ROOT / "my-learning" / "payment" / "index.html",
    ROOT / "my-learning" / "balance" / "index.html",
    ROOT / "my-learning" / "change" / "index.html",
]
published_text = "\n".join(path.read_text(encoding="utf-8") for path in policy_files + journey_files)

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
