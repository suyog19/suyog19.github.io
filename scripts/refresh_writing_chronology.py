"""Advance the public writing catalogue clock and rebuild derived surfaces."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import date
from pathlib import Path


ROOT = Path(__file__).parents[1]
CATALOGUE = ROOT / "data" / "writing-works.json"


def main() -> int:
    payload = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    payload["asOf"] = date.today().isoformat()
    CATALOGUE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    subprocess.run([sys.executable, "scripts/generate_public_discovery.py"], cwd=ROOT, check=True)
    subprocess.run([sys.executable, "scripts/generate_sitemap.py"], cwd=ROOT, check=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
