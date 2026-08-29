"""Keep the hand-authored public header and footer consistent at every depth."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {".git", "node_modules", "playwright-report", "test-results"}
ARTICLE_SOCIAL_FALLBACKS = {
    "writing/ai-ml-data-science-explained-simply/index.html": "ai-ml-data-science-explained-simply",
    "writing/how-i-used-two-ais-to-build-a-software-engineering-system/index.html": "how-i-used-two-ais-to-build-a-software-engineering-system",
    "writing/how-modern-llm-systems-really-work/index.html": "how-modern-llm-systems-really-work",
    "writing/understanding-the-ai-ecosystem/index.html": "understanding-the-ai-ecosystem",
    "writing/using-multiple-ai-agents-as-a-software-engineering-team/index.html": "using-multiple-ai-agents-as-a-software-engineering-team",
}


def root_prefix(page: Path) -> str:
    relative = page.relative_to(ROOT)
    if relative.as_posix() == "404.html":
        return "/"
    depth = len(relative.parts) - 1
    return "../" * depth


def current_section(page: Path) -> str:
    relative = page.relative_to(ROOT)
    if len(relative.parts) == 1:
        return "software-signal"
    section = relative.parts[0]
    return {
        "framework": "",
        "research": "",
        "training": "learning",
        "consulting": "consulting",
        "website-services": "website-services",
        "writing": "writing",
        "about": "about",
        "newsletter": "subscribe",
        "support": "support",
    }.get(section, "")


def current_attr(key: str, current: str) -> str:
    return ' aria-current="page"' if key == current else ""


def header(prefix: str, current: str) -> str:
    destinations = [
        ("software-signal", "", "Software Signal", ""),
        ("consulting", "consulting/", "Consulting", ""),
        ("learning", "training/", "Learning", ""),
        ("website-services", "website-services/", "Website Services", ""),
        ("writing", "writing/", "Writing", ""),
        ("about", "about/", "About", ""),
        ("subscribe", "newsletter/", "Subscribe", " nav-link--cta"),
    ]
    items = "\n".join(
        f'          <li><a href="{prefix}{path}" class="nav-link{extra}"'
        f'{current_attr(key, current)}>{label}</a></li>'
        for key, path, label, extra in destinations
    )
    return f'''<header class="site-header">
    <div class="container header-inner">
      <a href="{prefix or './'}" class="brand-lockup" aria-label="Software Signal by Suyog Joshi — Home">
        <picture class="brand-picture">
          <source media="(max-width: 480px)" srcset="{prefix}assets/brand/software-signal-mark-website.svg">
          <img class="brand-logo" src="{prefix}assets/brand/software-signal-logo-website.svg" width="1200" height="320" alt="">
        </picture>
      </a>
      <nav class="nav" id="nav" aria-label="Primary navigation">
        <ul class="nav-list">
{items}
        </ul>
      </nav>
      <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false" aria-controls="nav">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>'''


def update_head_identity(source: str, prefix: str, relative_page: str) -> str:
    updated = source
    if prefix == "/":
        updated = re.sub(
            r'href="(?:\.\./)*((?:favicon\.(?:svg|ico))|apple-touch-icon\.png)"',
            r'href="/\1"',
            updated,
        )
    if 'rel="apple-touch-icon"' not in updated:
        icon_pattern = r'(<link rel="icon" type="image/x-icon" href="[^"]+">)'
        replacement = rf'\1<link rel="apple-touch-icon" sizes="180x180" href="{prefix}apple-touch-icon.png">'
        updated, count = re.subn(icon_pattern, replacement, updated, count=1)
        if not count:
            icon_pattern = r'(<link rel="icon" type="image/svg\+xml" href="[^"]+">)'
            updated, count = re.subn(icon_pattern, replacement, updated, count=1)
        if not count:
            icon_block = (
                f'<link rel="icon" type="image/svg+xml" href="{prefix}favicon.svg">'
                f'<link rel="icon" type="image/x-icon" href="{prefix}favicon.ico">'
                f'<link rel="apple-touch-icon" sizes="180x180" href="{prefix}apple-touch-icon.png">'
            )
            updated, count = re.subn(r'</head>', icon_block + '</head>', updated, count=1)
        if not count:
            raise RuntimeError("Shared public page has no document head")

    structured_image = re.search(r'"image"\s*:\s*"(https://suyogjoshi\.com/[^"]+)"', updated)
    default_image = "https://suyogjoshi.com/assets/brand/software-signal-social-default.png"
    article_slug = ARTICLE_SOCIAL_FALLBACKS.get(relative_page)
    if article_slug and default_image in updated:
        article_image = f"https://suyogjoshi.com/assets/brand/article-social/{article_slug}.png"
        title_match = re.search(r'<meta property="og:title" content="([^"]+)"', updated)
        specific_alt = f"{title_match.group(1) if title_match else 'Software Signal article'} cover image."
        updated = updated.replace(default_image, article_image)
        updated = updated.replace(
            "Software Signal by Suyog Joshi — move fast, engineer reliably.",
            specific_alt,
        )
        if not re.search(r'"image"\s*:', updated):
            updated, image_count = re.subn(
                r'("author"\s*:)',
                f'"image":  "{article_image}",\n        \\1',
                updated,
                count=1,
            )
            if not image_count:
                raise RuntimeError(f"Article fallback has no structured-data author marker: {relative_page}")

    if structured_image and default_image in updated:
        title_match = re.search(r'<meta property="og:title" content="([^"]+)"', updated)
        specific_alt = f"{title_match.group(1) if title_match else 'Software Signal article'} cover image."
        updated = updated.replace(default_image, structured_image.group(1))
        updated = updated.replace(
            "Software Signal by Suyog Joshi — move fast, engineer reliably.",
            specific_alt,
        )

    has_social_image = '<meta property="og:image"' in updated
    is_noindex = bool(re.search(r'<meta name="robots" content="[^"]*noindex', updated, re.IGNORECASE))
    if has_social_image and not is_noindex:
        updated = re.sub(
            r'<meta name="twitter:card" content="[^"]*"\s*/?>',
            '<meta name="twitter:card" content="summary_large_image">',
            updated,
            count=1,
        )
    if has_social_image or is_noindex:
        return updated

    image_url = structured_image.group(1) if structured_image else default_image
    if structured_image:
        title_match = re.search(r'<meta property="og:title" content="([^"]+)"', updated)
        image_alt = f"{title_match.group(1) if title_match else 'Software Signal article'} cover image."
    else:
        image_alt = "Software Signal by Suyog Joshi — move fast, engineer reliably."
    open_graph = (
        f'<meta property="og:image" content="{image_url}">'
        '<meta property="og:image:width" content="1200">'
        '<meta property="og:image:height" content="630">'
        f'<meta property="og:image:alt" content="{image_alt}">'
    )
    updated, og_count = re.subn(
        r'(<meta property="og:url"[^>]*>)',
        rf'\1{open_graph}',
        updated,
        count=1,
    )
    if not og_count:
        raise RuntimeError("Indexable shared public page has no Open Graph URL")

    if '<meta name="twitter:card"' in updated:
        updated = re.sub(
            r'<meta name="twitter:card" content="[^"]*"\s*/?>',
            '<meta name="twitter:card" content="summary_large_image">',
            updated,
            count=1,
        )
        twitter_image = (
            f'<meta name="twitter:image" content="{image_url}">'
            f'<meta name="twitter:image:alt" content="{image_alt}">'
        )
        updated = re.sub(
            r'(<meta name="twitter:card"[^>]*>)',
            rf'\1{twitter_image}',
            updated,
            count=1,
        )
    else:
        twitter = (
            '<meta name="twitter:card" content="summary_large_image">'
            f'<meta name="twitter:image" content="{image_url}">'
            f'<meta name="twitter:image:alt" content="{image_alt}">'
        )
        updated = updated.replace(open_graph, open_graph + twitter, 1)
    return updated


def footer(prefix: str, current: str) -> str:
    links = [
        ("framework/", "Framework"), ("research/", "Research"),
        ("consulting/", "Consulting"), ("training/", "Learning"),
        ("website-services/", "Website Services"), ("writing/", "Writing"),
        ("systems/", "Systems"), ("newsletter/", "Subscribe"),
        ("contact/", "Contact"), ("support/", "Support"), ("privacy/", "Privacy"),
    ]
    nav = "\n".join(
        f'          <a href="{prefix}{path}"{current_attr(path.rstrip("/"), current)}>{label}</a>'
        for path, label in links
    )
    return f'''<footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-top">
        <div class="footer-brand">Software Signal
          <small>A professional body of work founded and practiced by Suyog Joshi.</small>
        </div>
        <nav class="footer-nav" aria-label="Footer navigation">
{nav}
        </nav>
      </div>
      <div class="footer-bottom">
        <div class="footer-social">
          <a href="https://www.linkedin.com/in/suyog-joshi" rel="me noopener noreferrer">LinkedIn</a>
          <a href="https://medium.com/@suyog19" rel="me noopener noreferrer">Medium</a>
          <a href="https://github.com/suyog19" rel="me noopener noreferrer">GitHub</a>
        </div>
        <p class="footer-copy">&copy; 2026 Suyog Joshi</p>
      </div>
    </div>
  </footer>'''


def main() -> None:
    changed = 0
    for page in ROOT.rglob("*.html"):
        if EXCLUDED_PARTS.intersection(page.parts):
            continue
        with page.open("r", encoding="utf-8", newline="") as handle:
            source = handle.read()
        if '<nav class="nav" id="nav" aria-label="Primary navigation">' not in source:
            continue
        prefix = root_prefix(page)
        updated, header_count = re.subn(
            r'<header class="site-header".*?</header>',
            header(prefix, current_section(page)),
            source,
            count=1,
            flags=re.DOTALL,
        )
        if not header_count:
            raise RuntimeError(f"Public navigation has no shared header: {page}")
        if '<footer class="site-footer"' in updated:
            updated, footer_count = re.subn(
                r'<footer class="site-footer".*?</footer>',
                footer(prefix, current_section(page)),
                updated,
                count=1,
                flags=re.DOTALL,
            )
            if not footer_count:
                raise RuntimeError(f"Shared footer could not be replaced: {page}")
        updated = update_head_identity(updated, prefix, page.relative_to(ROOT).as_posix())
        updated = re.sub(
            r'(css/(?:base|components)\.css)(?:\?v=\d+)?',
            r'\1?v=680',
            updated,
        )
        if page.relative_to(ROOT).parts[0] == "training" and "learning-subnav" in updated:
            learning_href = f'{prefix}my-learning/'
            subnav_match = re.search(r'<nav class="learning-subnav".*?</nav>', updated, re.DOTALL)
            if subnav_match and '>My Learning</a>' not in subnav_match.group(0):
                revised_subnav = subnav_match.group(0).replace(
                    '</div>', f'<a href="{learning_href}">My Learning</a></div>', 1
                )
                updated = updated[:subnav_match.start()] + revised_subnav + updated[subnav_match.end():]
        if updated != source:
            with page.open("w", encoding="utf-8", newline="") as handle:
                handle.write(updated)
            changed += 1
    print(f"Updated shared public shell in {changed} HTML files.")


if __name__ == "__main__":
    main()
