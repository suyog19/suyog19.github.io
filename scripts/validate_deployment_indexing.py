"""Validate crawler boundaries on deployed production and non-production hosts."""

from __future__ import annotations

import argparse
import sys
import time
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


NON_PRODUCTION_ORIGINS = (
    "https://dev.suyogjoshi.com",
    "https://suyogjoshi-dev.pages.dev",
)
PRODUCTION_ORIGIN = "https://suyogjoshi.com"
REPRESENTATIVE_ROUTES = (
    "/",
    "/writing/",
    "/writing/why-reviewing-ai-generated-work-is-a-different-skill/",
    "/systems/",
    "/training/",
    "/training/python-foundations-for-data-science/",
)
ACCESS_RESTRICTED_STATUSES = frozenset({401, 403})


@dataclass(frozen=True)
class Response:
    status: int
    final_url: str
    x_robots_tag: str | None


def fetch(url: str, timeout: float) -> Response:
    request = Request(url, headers={"User-Agent": "deployment-indexing-validator/1.0"})
    try:
        with urlopen(request, timeout=timeout) as response:
            response.read(1)
            return Response(response.status, response.geturl(), response.headers.get("X-Robots-Tag"))
    except HTTPError as error:
        return Response(error.code, error.geturl(), error.headers.get("X-Robots-Tag"))


def robots_tokens(value: str | None) -> set[str]:
    return {token.strip().lower() for token in (value or "").split(",") if token.strip()}


def validate_non_production(origin: str, route: str, response: Response) -> list[str]:
    label = urljoin(origin + "/", route.lstrip("/"))
    if response.status in ACCESS_RESTRICTED_STATUSES:
        return []
    tokens = robots_tokens(response.x_robots_tag)
    errors: list[str] = []
    if response.status < 200 or response.status >= 400:
        errors.append(f"{label}: expected a successful or access-restricted response, got {response.status}")
    if urlparse(response.final_url).netloc != urlparse(origin).netloc:
        errors.append(f"{label}: unexpectedly redirected to a different host: {response.final_url}")
    if not {"noindex", "nofollow"}.issubset(tokens):
        errors.append(f"{label}: public non-production response lacks X-Robots-Tag: noindex, nofollow")
    return errors


def validate_production(origin: str, route: str, response: Response) -> list[str]:
    label = urljoin(origin + "/", route.lstrip("/"))
    errors: list[str] = []
    if response.status < 200 or response.status >= 400:
        errors.append(f"{label}: expected a successful production response, got {response.status}")
    if urlparse(response.final_url).netloc != urlparse(origin).netloc:
        errors.append(f"{label}: unexpectedly redirected to a different host: {response.final_url}")
    if response.x_robots_tag is not None:
        errors.append(f"{label}: production must not emit X-Robots-Tag (got {response.x_robots_tag!r})")
    return errors


def validate_once(non_production: list[str], production: str, routes: list[str], timeout: float) -> list[str]:
    errors: list[str] = []
    for origin in non_production:
        for route in routes:
            url = urljoin(origin.rstrip("/") + "/", route.lstrip("/"))
            try:
                errors.extend(validate_non_production(origin, route, fetch(url, timeout)))
            except (OSError, URLError) as exc:
                errors.append(f"{url}: request failed: {exc}")
    for route in routes:
        url = urljoin(production.rstrip("/") + "/", route.lstrip("/"))
        try:
            errors.extend(validate_production(production, route, fetch(url, timeout)))
        except (OSError, URLError) as exc:
            errors.append(f"{url}: request failed: {exc}")
    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--non-production-origin", action="append", dest="non_production")
    parser.add_argument("--production-origin", default=PRODUCTION_ORIGIN)
    parser.add_argument("--route", action="append", dest="routes")
    parser.add_argument("--timeout", type=float, default=15)
    parser.add_argument("--attempts", type=int, default=1)
    parser.add_argument("--retry-delay", type=float, default=15)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.attempts < 1:
        print("--attempts must be at least 1", file=sys.stderr)
        return 2
    non_production = args.non_production or list(NON_PRODUCTION_ORIGINS)
    routes = args.routes or list(REPRESENTATIVE_ROUTES)
    errors: list[str] = []
    for attempt in range(1, args.attempts + 1):
        errors = validate_once(non_production, args.production_origin, routes, args.timeout)
        if not errors:
            checked = len(routes) * (len(non_production) + 1)
            print(f"Validated indexing boundaries for {checked} deployed route responses.")
            return 0
        if attempt < args.attempts:
            print(f"Attempt {attempt}/{args.attempts} failed; waiting for deployment convergence.", file=sys.stderr)
            time.sleep(args.retry_delay)
    print("Deployment indexing validation failed:", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
