"""Run the repository's complete offline public SEO validation contract."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).parents[1]
CHECKS = (
    ("generated sitemap", "generate_sitemap.py", "--check"),
    ("canonical URLs and local links", "validate_canonical_urls.py"),
    ("article structured data", "validate_article_structured_data.py"),
    ("site and person identity", "validate_site_identity.py"),
    ("Training catalogue schema", "validate_training_catalogue_schema.py"),
    ("Training discoverability", "validate_training_discoverability.py"),
    ("Training commercial contract", "validate_training_commercials.py"),
    ("Training consistency", "validate_training_consistency.py"),
    ("public discovery, feed, and search", "validate_public_discovery.py"),
    ("image and social-preview integrity", "validate_image_performance.py"),
    ("public route contract", "validate_public_routes.py"),
    ("custom 404 contract", "validate_custom_404.py"),
)


def main() -> int:
    failures: list[tuple[str, int]] = []
    for label, script, *arguments in CHECKS:
        command = [sys.executable, str(ROOT / "scripts" / script), *arguments]
        print(f"\n== {label} ==", flush=True)
        result = subprocess.run(command, cwd=ROOT, check=False)
        if result.returncode:
            failures.append((label, result.returncode))
    if failures:
        print("\nPublic SEO validation failed:", file=sys.stderr)
        for label, returncode in failures:
            print(f"- {label} (exit {returncode})", file=sys.stderr)
        return 1
    print(f"\nPublic SEO validation passed across {len(CHECKS)} focused contracts.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
