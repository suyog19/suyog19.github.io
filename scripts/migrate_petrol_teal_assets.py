"""Synchronize raster identity assets with the approved Petrol Teal palette."""

from __future__ import annotations

import colorsys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PETROL_TEAL = (31, 90, 90)


def recolor_foundation(path: Path) -> None:
    with Image.open(path) as source:
        image = source.convert("RGB")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue = pixels[x, y]
            hue, saturation, _ = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
            is_brand_red = saturation > 0.18 and (hue < 0.08 or hue > 0.96)
            is_legacy_teal = saturation > 0.18 and 0.42 < hue < 0.58
            if is_brand_red or is_legacy_teal:
                pixels[x, y] = PETROL_TEAL
    image.save(path, format="PNG", optimize=True, compress_level=9)


def generate_favicon() -> None:
    font_path = Path(r"C:\Windows\Fonts\arialbd.ttf")
    for size in (16, 32, 48):
        image = Image.new("RGB", (size, size), PETROL_TEAL)
        draw = ImageDraw.Draw(image)
        font = ImageFont.truetype(str(font_path), max(7, round(size * 0.42)))
        box = draw.textbbox((0, 0), "SS", font=font)
        x = (size - (box[2] - box[0])) / 2
        y = (size - (box[3] - box[1])) / 2 - box[1]
        draw.text((x, y), "SS", fill="white", font=font)
        if size == 16:
            images = [image]
        else:
            images.append(image)
    images[-1].save(ROOT / "favicon.ico", format="ICO", append_images=images[:-1], sizes=[(16, 16), (32, 32), (48, 48)])


def main() -> None:
    source_dir = ROOT / "assets" / "social-previews" / "source"
    for filename in ("core-foundation.png", "learning-foundation.png"):
        recolor_foundation(source_dir / filename)
        print(f"Migrated {filename}")
    generate_favicon()
    print("Generated favicon.ico")


if __name__ == "__main__":
    main()
