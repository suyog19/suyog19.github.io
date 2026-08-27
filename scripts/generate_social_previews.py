"""Generate the static social-preview family for issue #392.

The generated foundations are committed source material. Text is composed here so
titles remain exact and future title changes do not require generative image text.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import os

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "social-previews"
SOURCE_DIR = ASSET_DIR / "source"
WIDTH, HEIGHT = 1200, 630
SAFE = 72
INK = "#171717"
MUTED = "#60646b"
BRAND_ACCENT = "#1f5a5a"


@dataclass(frozen=True)
class Preview:
    filename: str
    label: str
    title: str
    support: str = ""
    learning: bool = False
    series_art: bool = False


def previews() -> tuple[Preview, ...]:
    manifest = json.loads((ROOT / "data" / "social-previews.json").read_text(encoding="utf-8"))
    return tuple(
        Preview(
            filename=entry["filename"],
            label=entry["label"],
            title=entry["title"],
            support=entry.get("support", ""),
            learning=entry["variant"] == "learning",
            series_art=entry.get("seriesArt", False),
        )
        for entry in manifest["entries"]
    )


def first_font(candidates: tuple[str, ...]) -> str:
    for candidate in candidates:
        expanded = os.path.expandvars(candidate)
        if Path(expanded).exists():
            return expanded
    raise FileNotFoundError(f"No supported font found. Tried: {', '.join(candidates)}")


SERIF = first_font((
    r"C:\Windows\Fonts\georgia.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
))
SANS = first_font((
    r"C:\Windows\Fonts\arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
))
SANS_BOLD = first_font((
    r"C:\Windows\Fonts\arialbd.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
))


def wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if current and draw.textbbox((0, 0), trial, font=font)[2] > max_width:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def title_layout(draw: ImageDraw.ImageDraw, title: str, max_width: int, max_lines: int = 3):
    for size in range(82, 41, -2):
        font = ImageFont.truetype(SERIF, size)
        lines = wrap(draw, title, font, max_width)
        line_height = int(size * 1.08)
        if len(lines) <= max_lines and len(lines) * line_height <= 270:
            return font, lines, line_height
    raise ValueError(f"Title cannot fit safely: {title}")


def foundation(learning: bool) -> Image.Image:
    name = "learning-foundation.png" if learning else "core-foundation.png"
    with Image.open(SOURCE_DIR / name) as source:
        return ImageOps.fit(source.convert("RGB"), (WIDTH, HEIGHT), method=Image.Resampling.LANCZOS)


def add_series_art(canvas: Image.Image) -> None:
    source_path = ROOT / "writing" / "series" / "ai-assisted-software-engineering" / "series-cover.png"
    with Image.open(source_path) as source:
        art = ImageOps.fit(source.convert("RGB"), (320, HEIGHT), method=Image.Resampling.LANCZOS, centering=(0.60, 0.52))
    art = ImageEnhance.Brightness(art).enhance(0.72)
    canvas.paste(art, (880, 0))
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((820, 0, 960, HEIGHT), fill=(247, 244, 237, 238))
    canvas.paste(overlay, mask=overlay)


def render(preview: Preview) -> None:
    canvas = foundation(preview.learning)
    if preview.series_art:
        add_series_art(canvas)
    draw = ImageDraw.Draw(canvas)
    accent = BRAND_ACCENT
    text_width = 720 if preview.series_art else 850

    label_font = ImageFont.truetype(SANS_BOLD, 18)
    draw.rounded_rectangle((SAFE, 62, SAFE + 16, 78), radius=8, fill=accent)
    draw.text((SAFE + 28, 58), preview.label, font=label_font, fill=MUTED, spacing=2)

    title_font, title_lines, line_height = title_layout(draw, preview.title, text_width)
    title_y = 148
    for line in title_lines:
        draw.text((SAFE, title_y), line, font=title_font, fill=INK)
        title_y += line_height

    if preview.support:
        support_font = ImageFont.truetype(SANS, 25)
        support_lines = wrap(draw, preview.support, support_font, text_width)
        support_y = max(438, title_y + 18)
        for line in support_lines[:2]:
            draw.text((SAFE, support_y), line, font=support_font, fill=MUTED)
            support_y += 34

    identity_font = ImageFont.truetype(SANS_BOLD, 18)
    identity = "SJ  ·  SOFTWARE SIGNAL LEARNING" if preview.learning else "SJ  ·  SUYOGJOSHI.COM"
    draw.line((SAFE, HEIGHT - 74, SAFE + 42, HEIGHT - 74), fill=accent, width=3)
    draw.text((SAFE + 58, HEIGHT - 86), identity, font=identity_font, fill=INK)

    output = ASSET_DIR / preview.filename
    canvas.save(output, format="PNG", optimize=True, compress_level=9)


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    for preview in previews():
        render(preview)
        print(f"Generated {preview.filename}")


if __name__ == "__main__":
    main()
