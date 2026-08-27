"""Keep the hand-authored public header and footer consistent at every depth."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {".git", "node_modules", "playwright-report", "test-results"}


def root_prefix(page: Path) -> str:
    relative = page.relative_to(ROOT)
    depth = len(relative.parts) - 1
    return "../" * depth


def current_section(page: Path) -> str:
    relative = page.relative_to(ROOT)
    if len(relative.parts) == 1:
        return "software-signal"
    section = relative.parts[0]
    return {
        "framework": "software-signal",
        "research": "software-signal",
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
      <a href="{prefix or './'}" class="brand-lockup">
        <span class="brand-mark" aria-hidden="true">SS</span>
        <span class="brand-text">
          <span class="brand-primary">Software Signal</span>
          <span class="brand-founder">by Suyog Joshi</span>
        </span>
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
        updated = re.sub(
            r'(css/(?:base|components)\.css)(?:\?v=\d+)?',
            r'\1?v=607',
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
