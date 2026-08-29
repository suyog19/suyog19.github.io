"""Generate compact and social Software Signal assets from the canonical mark.

The committed SVGs in ``assets/brand`` are copied unchanged from the canonical
``suyog19/software-signal/brand`` masters. Pillow renders the canonical path
coordinates at high resolution before downsampling and composing the required
platform canvases.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "assets" / "brand"
MARK = BRAND_DIR / "software-signal-mark-website.svg"
WARM_WHITE = "#F7F6F3"
TEAL = "#1F5A5A"
NEAR_BLACK = "#111111"
ARTICLE_SOCIAL_SOURCES = {
    "ai-ml-data-science-explained-simply": "image1.webp",
    "how-i-used-two-ais-to-build-a-software-engineering-system": "ai-dev-orchestrator_how_I_built_it.png",
    "how-modern-llm-systems-really-work": "cover2.png",
    "understanding-the-ai-ecosystem": "ai_ecosystem.png",
    "using-multiple-ai-agents-as-a-software-engineering-team": "06-cover.png",
}


def cubic(start: tuple[float, float], control_1: tuple[float, float], control_2: tuple[float, float], end: tuple[float, float], steps: int = 30) -> list[tuple[float, float]]:
    points = []
    for index in range(1, steps + 1):
        t = index / steps
        inverse = 1 - t
        points.append((
            inverse**3 * start[0] + 3 * inverse**2 * t * control_1[0] + 3 * inverse * t**2 * control_2[0] + t**3 * end[0],
            inverse**3 * start[1] + 3 * inverse**2 * t * control_1[1] + 3 * inverse * t**2 * control_2[1] + t**3 * end[1],
        ))
    return points


def round_line(draw: ImageDraw.ImageDraw, points: list[tuple[float, float]], fill: str, width: int) -> None:
    draw.line(points, fill=fill, width=width)
    radius = width / 2
    for x, y in points:
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def render_mark(size: int) -> Image.Image:
    scale = 4
    canvas = Image.new("RGBA", (320 * scale, 320 * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    path: list[tuple[float, float]] = [(260, 48), (110, 48)]
    path += cubic((110, 48), (59, 48), (34, 77), (34, 114))
    path += cubic((34, 114), (34, 152), (63, 178), (108, 178))
    path.append((180, 178))
    path += cubic((180, 178), (206, 178), (223, 192), (223, 213))
    path += cubic((223, 213), (223, 235), (205, 252), (175, 252))
    path.append((34, 252))
    scaled_path = [(x * scale, y * scale) for x, y in path]
    round_line(draw, scaled_path, TEAL, 58 * scale)
    round_line(draw, [(24 * scale, 170 * scale), (274 * scale, 170 * scale)], "#C56A4A", 20 * scale)
    draw.ellipse(((149 - 34) * scale, (170 - 34) * scale, (149 + 34) * scale, (170 + 34) * scale), fill="#C56A4A")
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def main() -> None:
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    mark = render_mark(512)
    icon = Image.new("RGBA", (512, 512), WARM_WHITE)
    icon_mark = mark.resize((416, 416), Image.Resampling.LANCZOS)
    icon.alpha_composite(icon_mark, (48, 48))
    icon.save(BRAND_DIR / "software-signal-icon-512.png", optimize=True)

    touch = icon.resize((180, 180), Image.Resampling.LANCZOS)
    touch.convert("RGB").save(ROOT / "apple-touch-icon.png", optimize=True)

    ico_frames = [icon.resize((size, size), Image.Resampling.LANCZOS) for size in (16, 32, 48)]
    ico_frames[-1].save(
        ROOT / "favicon.ico",
        format="ICO",
        append_images=ico_frames[:-1],
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    social = Image.new("RGB", (1200, 630), WARM_WHITE)
    social_mark = mark.resize((292, 292), Image.Resampling.LANCZOS)
    social.paste(social_mark, (72, 169), social_mark)
    draw = ImageDraw.Draw(social)
    draw.text((420, 218), "Software Signal", font=font(SERIF, 70), fill=TEAL)
    draw.text((424, 310), "BY SUYOG JOSHI", font=font(SANS_BOLD, 22), fill=NEAR_BLACK)
    draw.text((424, 365), "Move fast. Engineer reliably.", font=font(SANS, 28), fill=NEAR_BLACK)
    draw.line((424, 418, 760, 418), fill=TEAL, width=3)
    social.save(BRAND_DIR / "software-signal-social-default.png", optimize=True)

    article_social_dir = BRAND_DIR / "article-social"
    article_social_dir.mkdir(parents=True, exist_ok=True)
    for slug, filename in ARTICLE_SOCIAL_SOURCES.items():
        source_path = ROOT / "writing" / slug / filename
        with Image.open(source_path) as source:
            preview = ImageOps.pad(
                source.convert("RGB"),
                (1200, 630),
                method=Image.Resampling.LANCZOS,
                color=WARM_WHITE,
                centering=(0.5, 0.5),
            )
        preview.save(article_social_dir / f"{slug}.png", optimize=True)

    print("Generated favicon.ico, apple-touch-icon.png, compact icon, default social card, and article fallbacks.")


if __name__ == "__main__":
    main()
