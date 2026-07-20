"""Reject obvious seeded commercial values before training content is published."""
import json
from pathlib import Path

courses = json.loads((Path(__file__).parents[1] / "data" / "training-courses.json").read_text(encoding="utf-8"))["courses"]
errors = []
for course in courses:
    if course.get("lifecycleStatus") != "launched":
        continue
    label = course.get("title", course.get("courseId", "Unknown course"))
    fee = course.get("feeAmountPaise")
    deposit = course.get("depositAmountPaise")
    remaining = course.get("remainingAmountPaise")
    if not isinstance(fee, int) or fee < 10000:
        errors.append(f"{label}: fee must be at least INR 100 and expressed in paise")
    if not all(isinstance(value, int) and value >= 0 for value in (deposit, remaining)):
        errors.append(f"{label}: deposit and remaining fee must be non-negative paise integers")
    elif isinstance(fee, int) and deposit + remaining != fee:
        errors.append(f"{label}: deposit plus remaining fee must equal total fee")
    if not course.get("taxTreatment"):
        errors.append(f"{label}: tax treatment must be explicit")
    if course.get("cohortAvailability") in {"apply", "payment-open"} and not course.get("startDate"):
        errors.append(f"{label}: applications/payment cannot open without a published start date")

if errors:
    raise SystemExit("Training commercial validation failed:\n- " + "\n- ".join(errors))
print(f"Training commercial validation passed for {sum(c.get('lifecycleStatus') == 'launched' for c in courses)} launched courses.")
