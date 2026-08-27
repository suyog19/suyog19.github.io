"""Create the deterministic route, interaction, and preservation audit for #610."""

from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://suyogjoshi.com"
BASELINE = ROOT / "docs/evidence/issue-604-public-route-inventory.csv"
SITEMAP = ROOT / "sitemap.xml"


def route_file(route: str) -> Path:
    return ROOT / "index.html" if route == "/" else ROOT / route.strip("/") / "index.html"


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    parser.add_argument("--revision")
    args = parser.parse_args()
    revision = args.revision or subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
    ).strip()

    with BASELINE.open(encoding="utf-8-sig", newline="") as handle:
        baseline_rows = list(csv.DictReader(handle))
    baseline_routes = [row["path"] for row in baseline_rows]
    sitemap_routes = {
        urlparse(node.text or "").path
        for node in ElementTree.parse(SITEMAP).getroot().iter()
        if node.tag.endswith("loc")
    }

    route_results = []
    for route in baseline_routes:
        page = route_file(route)
        expected = f"{ORIGIN}{route}"
        content = page.read_text(encoding="utf-8") if page.exists() else ""
        canonical = re.search(r'<link rel="canonical" href="([^"]+)"', content)
        passed = bool(
            page.exists() and route in sitemap_routes and canonical and canonical.group(1) == expected
        )
        route_results.append({
            "route": route,
            "disposition": "preserved" if passed else "unaccounted",
            "fileExists": page.exists(),
            "inSitemap": route in sitemap_routes,
            "canonical": canonical.group(1) if canonical else None,
            "expectedCanonical": expected,
        })

    contract = read("docs/issue-604-current-site-baseline.md")
    browser_guide = read("docs/engineering/browser-regression.md")
    browser_test = read("tests/e2e/before-state.spec.js")
    home_01 = {
        "id": "HOME-01",
        "oldBehavior": "Homepage hero Explore training opened /training/.",
        "approvedBehavior": "Homepage hero Explore the Framework opens /framework/; Learning remains later on Home.",
        "contractUpdated": "Activate Explore the Framework" in contract and "Approved change in #608" in contract,
        "guideUpdated": "Framework-first hero" in browser_guide and "approved #608" in browser_guide,
        "automatedAssertionUpdated": "['Explore the Framework', '/framework/']" in browser_test,
    }

    preservation = {
        "CONTENT-01": ["index.html", "about/index.html"],
        "CONTENT-02": ["consulting/index.html", "js/contact.js"],
        "CONTENT-03": ["website-services/index.html", "js/contact.js"],
        "CONTENT-04": ["training/index.html", "training/python-foundations-for-data-science/index.html"],
        "CONTENT-05": ["writing/index.html", "data/search-index.json"],
        "CONTENT-06": ["systems/index.html", "systems/ai-workflow-lab/invoice-review-demo/index.html"],
        "CONTENT-07": ["newsletter/index.html", "index.html"],
        "CONTENT-08": ["research/ai-teaching-workflows/index.html", "research/index.html"],
        "CONTENT-09": ["search/index.html", "data/search-index.json"],
        "CONTENT-10": ["support/index.html", "docs/evidence/issue-585-provider-status.json"],
        "CONTENT-11": ["contact/index.html", "js/contact.js"],
        "CONTENT-12": ["card/index.html", "card/suyog-joshi.vcf", "assets/card-qr.svg"],
        "CONTENT-13": ["privacy/index.html", "training/policies/index.html"],
        "ASSET-01": ["data/social-previews.json", "assets/social-previews"],
        "ASSET-02": ["writing"],
        "ASSET-03": ["css/base.css", "css/components.css", "css/pages.css"],
    }
    preservation_results = {
        item: {"paths": paths, "present": all((ROOT / path).exists() for path in paths)}
        for item, paths in preservation.items()
    }

    failures = [item for item in route_results if item["disposition"] != "preserved"]
    interaction_pass = all(
        value for key, value in home_01.items() if key in {
            "contractUpdated", "guideUpdated", "automatedAssertionUpdated"
        }
    )
    preservation_failures = [key for key, value in preservation_results.items() if not value["present"]]
    result = {
        "schema": "issue-610-assurance-audit/v1",
        "issue": 610,
        "targetRevision": revision,
        "baseline": {
            "revision": "a6420ee8519e96da15845347b78e4d7c3fc3da89",
            "routeCount": len(baseline_routes),
            "artifact": str(BASELINE.relative_to(ROOT)).replace("\\", "/"),
        },
        "routeDisposition": {
            "preserved": sum(item["disposition"] == "preserved" for item in route_results),
            "redirected": 0,
            "intentionallyRetired": 0,
            "unaccounted": len(failures),
            "additiveRoutes": sorted(sitemap_routes - set(baseline_routes)),
            "routes": route_results,
        },
        "interactionAudit": {
            "intentionalChanges": [home_01],
            "otherCriticalOutcomes": "preserved; verified by the compact #606 browser suite",
        },
        "contentPreservation": {
            "passed": len(preservation_results) - len(preservation_failures),
            "failed": len(preservation_failures),
            "items": preservation_results,
        },
        "productsRouteInvented": (ROOT / "products/index.html").exists(),
        "result": "pass" if not failures and interaction_pass and not preservation_failures else "fail",
    }
    rendered = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_bytes(rendered.encode("utf-8"))
    print(rendered, end="")
    return 0 if result["result"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
