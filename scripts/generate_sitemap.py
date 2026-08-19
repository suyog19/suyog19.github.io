"""Generate the committed sitemap from the authoritative public-page inventory."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from public_page_inventory import InventoryError, discover_pages, render_sitemap, validate_sitemap


ROOT = Path(__file__).parents[1]
SITEMAP = ROOT / "sitemap.xml"


def run(root: Path = ROOT, check: bool = False) -> int:
    sitemap_path = root / "sitemap.xml"
    try:
        pages = discover_pages(root)
        expected = render_sitemap(pages)
    except (InventoryError, OSError) as exc:
        print(f"Public-page inventory failed: {exc}", file=sys.stderr)
        return 1

    if check:
        try:
            actual = sitemap_path.read_text(encoding="utf-8")
        except OSError as exc:
            print(f"Sitemap check failed: {exc}", file=sys.stderr)
            return 1
        errors = validate_sitemap(actual, pages)
        if actual != expected:
            errors.append("sitemap.xml is stale; run python scripts/generate_sitemap.py")
        if errors:
            print("Sitemap validation failed:", file=sys.stderr)
            for error in errors:
                print(f"- {error}", file=sys.stderr)
            return 1
        indexable_count = expected.count("<url>")
        print(f"Sitemap is current for {indexable_count} public indexable pages.")
        return 0

    with sitemap_path.open("w", encoding="utf-8", newline="\n") as sitemap_file:
        sitemap_file.write(expected)
    print(f"Generated sitemap.xml for {expected.count('<url>')} public indexable pages.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if the committed sitemap is stale or invalid")
    args = parser.parse_args()
    return run(check=args.check)


if __name__ == "__main__":
    raise SystemExit(main())
