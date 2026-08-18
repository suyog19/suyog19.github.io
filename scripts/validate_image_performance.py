"""Validate public image references, dimensions, loading policy, and social fallbacks."""

from __future__ import annotations

import json
import re
import struct
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree


ROOT = Path(__file__).parents[1]
RASTER_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
SOCIAL_KEYS = {
    "og:image",
    "og:image:width",
    "og:image:height",
    "og:image:alt",
    "twitter:card",
    "twitter:image",
    "twitter:image:alt",
    "robots",
}
SOCIAL_PREVIEW_PREFIX = "https://suyogjoshi.com/assets/social-previews/"
SOCIAL_PREVIEW_MANIFEST = json.loads((ROOT / "data" / "social-previews.json").read_text(encoding="utf-8"))
SOCIAL_PREVIEW_BY_PAGE = {entry["page"]: entry for entry in SOCIAL_PREVIEW_MANIFEST["entries"]}


class ImageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.images: list[dict[str, str | None]] = []
        self.social: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "img":
            self.images.append(values)
        elif tag == "meta":
            key = values.get("property") or values.get("name")
            if key in SOCIAL_KEYS and values.get("content"):
                self.social[str(key)] = str(values["content"])


def webp_dimensions(data: bytes) -> tuple[int, int]:
    if data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise ValueError("invalid WebP header")
    chunk = data[12:16]
    payload = data[20:]
    if chunk == b"VP8X":
        return 1 + int.from_bytes(payload[4:7], "little"), 1 + int.from_bytes(payload[7:10], "little")
    if chunk == b"VP8L" and payload[:1] == b"/":
        bits = int.from_bytes(payload[1:5], "little")
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if chunk == b"VP8 " and payload[3:6] == b"\x9d\x01\x2a":
        return int.from_bytes(payload[6:8], "little") & 0x3FFF, int.from_bytes(payload[8:10], "little") & 0x3FFF
    raise ValueError("unsupported WebP encoding")


def image_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    suffix = path.suffix.lower()
    if suffix == ".png" and data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    if suffix == ".gif" and data[:3] == b"GIF":
        return struct.unpack("<HH", data[6:10])
    if suffix == ".webp":
        return webp_dimensions(data)
    if suffix in {".jpg", ".jpeg"}:
        index = 2
        while index + 9 < len(data):
            if data[index] != 0xFF:
                index += 1
                continue
            marker = data[index + 1]
            length = int.from_bytes(data[index + 2:index + 4], "big")
            if marker in range(0xC0, 0xC4):
                return int.from_bytes(data[index + 5:index + 7], "big"), int.from_bytes(data[index + 7:index + 9], "big")
            index += 2 + length
    if suffix == ".svg":
        root = ElementTree.fromstring(data)
        width = re.match(r"[0-9]+", root.attrib.get("width", ""))
        height = re.match(r"[0-9]+", root.attrib.get("height", ""))
        if width and height:
            return int(width.group()), int(height.group())
    raise ValueError("unsupported image format or missing intrinsic dimensions")


def local_image(page: Path, src: str) -> Path | None:
    if src.startswith(("data:", "http://", "https://", "//")):
        return None
    if src.startswith("/"):
        return ROOT / src.lstrip("/")
    return (page.parent / src).resolve()


def validate_html(path: Path) -> list[str]:
    errors: list[str] = []
    parser = ImageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    high_priority = 0
    for position, image in enumerate(parser.images):
        label = f"{path.relative_to(ROOT).as_posix()} img[{position + 1}]"
        src = image.get("src")
        if not src:
            errors.append(f"{label}: missing src")
            continue
        if "alt" not in image:
            errors.append(f"{label}: missing alt attribute")
        asset = local_image(path, src)
        if asset is None:
            continue
        if not asset.is_file():
            errors.append(f"{label}: missing image reference {src!r}")
            continue
        try:
            actual_width, actual_height = image_dimensions(asset)
        except (ValueError, ElementTree.ParseError) as exc:
            errors.append(f"{label}: cannot read intrinsic dimensions for {src!r}: {exc}")
            continue
        width, height = image.get("width"), image.get("height")
        if width != str(actual_width) or height != str(actual_height):
            errors.append(
                f"{label}: width/height must match {actual_width}x{actual_height}, found {width}x{height}"
            )
        loading = image.get("loading")
        if loading not in {"eager", "lazy"}:
            errors.append(f"{label}: loading must be eager or lazy")
        if image.get("decoding") != "async":
            errors.append(f"{label}: decoding must be async")
        if image.get("fetchpriority") == "high":
            high_priority += 1
            if loading != "eager":
                errors.append(f"{label}: high-priority image must load eagerly")
        elif loading == "eager":
            errors.append(f"{label}: eager image must declare fetchpriority=high")
        if asset.suffix.lower() == ".png":
            errors.append(f"{label}: content PNG should use its WebP display alternative")

    relative = path.relative_to(ROOT)
    is_article = len(relative.parts) == 3 and relative.parts[0] == "writing" and relative.name == "index.html"
    if parser.images:
        expected_high = 1 if is_article else 0
        if high_priority != expected_high:
            errors.append(
                f"{relative.as_posix()}: expected {expected_high} high-priority image, found {high_priority}"
            )
        if is_article and parser.images[0].get("loading") != "eager":
            errors.append(f"{relative.as_posix()}: primary article image must load eagerly")
        for position, image in enumerate(parser.images[1:] if is_article else parser.images, start=2 if is_article else 1):
            if image.get("loading") != "lazy":
                errors.append(f"{relative.as_posix()} img[{position}]: below-fold image must load lazily")

    image_meta = {key: parser.social[key] for key in ("og:image", "twitter:image") if key in parser.social}
    if image_meta:
        if set(image_meta) != {"og:image", "twitter:image"}:
            errors.append(f"{relative.as_posix()}: social image metadata must include matching Open Graph and Twitter images")
        elif image_meta["og:image"] != image_meta["twitter:image"]:
            errors.append(f"{relative.as_posix()}: Open Graph and Twitter image URLs must match")
        for key, url in image_meta.items():
            parsed = urlparse(url)
            asset = ROOT / parsed.path.lstrip("/")
            if parsed.netloc != "suyogjoshi.com" or not asset.is_file():
                errors.append(f"{relative.as_posix()}: {key} does not resolve to a production-compatible local asset")
            elif asset.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
                errors.append(f"{relative.as_posix()}: {key} must retain a PNG or JPEG social-crawler fallback")

    page_key = relative.as_posix()
    entry = SOCIAL_PREVIEW_BY_PAGE.get(page_key)
    preview_url = parser.social.get("og:image", "")
    if entry:
        expected_url = f"{SOCIAL_PREVIEW_PREFIX}{entry['filename']}"
        expected = {
            "og:image": expected_url,
            "og:image:width": str(SOCIAL_PREVIEW_MANIFEST["dimensions"]["width"]),
            "og:image:height": str(SOCIAL_PREVIEW_MANIFEST["dimensions"]["height"]),
            "og:image:alt": entry["alt"],
            "twitter:card": "summary_large_image",
            "twitter:image": expected_url,
            "twitter:image:alt": entry["alt"],
        }
        for key, value in expected.items():
            if parser.social.get(key) != value:
                errors.append(f"{page_key}: {key} must be {value!r}")
        if "noindex" in parser.social.get("robots", "").lower():
            errors.append(f"{page_key}: approved public social preview cannot be attached to a noindex page")
        asset = ROOT / "assets" / "social-previews" / entry["filename"]
        if asset.is_file():
            actual = image_dimensions(asset)
            declared = (
                SOCIAL_PREVIEW_MANIFEST["dimensions"]["width"],
                SOCIAL_PREVIEW_MANIFEST["dimensions"]["height"],
            )
            if actual != declared:
                errors.append(f"{page_key}: social preview must be {declared[0]}x{declared[1]}, found {actual[0]}x{actual[1]}")
    elif preview_url.startswith(SOCIAL_PREVIEW_PREFIX):
        errors.append(f"{page_key}: social preview is not registered in data/social-previews.json")
    return errors


def validate_social_preview_manifest() -> list[str]:
    errors: list[str] = []
    pages = [entry["page"] for entry in SOCIAL_PREVIEW_MANIFEST["entries"]]
    filenames = [entry["filename"] for entry in SOCIAL_PREVIEW_MANIFEST["entries"]]
    if len(pages) != len(set(pages)):
        errors.append("data/social-previews.json: duplicate page entries")
    if len(filenames) != len(set(filenames)):
        errors.append("data/social-previews.json: duplicate preview filenames")
    if set(entry["variant"] for entry in SOCIAL_PREVIEW_MANIFEST["entries"]) - {"core", "learning"}:
        errors.append("data/social-previews.json: variants must be core or learning")
    output_assets = {path.name for path in (ROOT / "assets" / "social-previews").glob("*.png")}
    if output_assets != set(filenames):
        errors.append("assets/social-previews: output PNG set must exactly match the manifest")
    return errors


def validate_dynamic_demo() -> list[str]:
    path = ROOT / "js/invoice-review-demo.js"
    source = path.read_text(encoding="utf-8")
    required = (
        "handwritten-vendor-bill.webp",
        'width="1086"',
        'height="1448"',
        'loading="lazy"',
        'decoding="async"',
        "Synthetic scanned vendor cash bill",
    )
    return [f"js/invoice-review-demo.js: missing dynamic image contract {value!r}" for value in required if value not in source]


def main() -> int:
    errors: list[str] = []
    pages = sorted(ROOT.rglob("*.html"))
    for page in pages:
        errors.extend(validate_html(page))
    errors.extend(validate_social_preview_manifest())
    errors.extend(validate_dynamic_demo())
    if errors:
        print("Image performance validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    total_images = sum(image_count(page) for page in pages)
    print(f"Validated {total_images} static images plus the dynamic invoice preview: references, dimensions, loading, decoding, priority, alt, and social fallbacks.")
    return 0


def image_count(path: Path) -> int:
    parser = ImageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return len(parser.images)


if __name__ == "__main__":
    raise SystemExit(main())
