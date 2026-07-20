"""Smoke-test stable static public routes through an actual HTTP server."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.request import urlopen
import os

ROOT = Path(__file__).parents[1]
os.chdir(ROOT)

with ThreadingHTTPServer(("127.0.0.1", 0), SimpleHTTPRequestHandler) as server:
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    for route in ("/privacy/", "/training/policies/privacy/"):
        with urlopen(base + route, timeout=5) as response:
            body = response.read().decode("utf-8")
            if response.status != 200 or "Privacy" not in body:
                raise SystemExit(f"Public route smoke check failed: {route}")
    server.shutdown()

privacy = (ROOT / "privacy" / "index.html").read_text(encoding="utf-8")
required = (
    'rel="canonical" href="https://suyogjoshi.com/privacy/"',
    "contact@suyogjoshi.com",
    "Version",
    "Effective",
    "Last updated",
    "G-PKL56GJ38H",
)
missing = [value for value in required if value not in privacy]
if missing:
    raise SystemExit("Privacy route is missing required content: " + ", ".join(missing))

print("Public route validation passed for /privacy/ and its training context page.")
