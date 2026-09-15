#!/usr/bin/env python3
"""Generate one full page per section from index.html.

Each section of index.html gets its own standalone page (magic.html, science.html,
...) with the same nav, theme, particles and content as the main site. The main
page keeps a preview of every section; these pages hold the complete content.

Usage:  python3 tools/generate-pages.py
Writes the generated pages into the repo root next to index.html. Re-run it any
time you edit index.html (nav, sections, theme) and want the full pages refreshed.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"

# section key -> generated page filename (the AI section has id="ai-corner")
PAGES = {
    "magic": "magic.html",
    "science": "science.html",
    "facts": "facts.html",
    "puzzles": "puzzles.html",
    "history": "history.html",
    "illusions": "illusions.html",
    "splats": "splats.html",
    "ai": "ai.html",
}

NAV_LABELS = [
    ("magic", "Magic"),
    ("science", "Science"),
    ("facts", "Facts"),
    ("puzzles", "Puzzles"),
    ("history", "History"),
    ("illusions", "Illusions"),
    ("splats", "Splat Gallery"),
    ("ai", "AI Corner"),
]


def extract_sections(html):
    """Return {key: (tag, title, desc, full_section_html)} parsed from index.html."""
    out = {}
    pattern = re.compile(
        r'<section id="[^"]+" class="section[^"]*" data-section="([^"]+)">(.*?)</section>',
        re.S,
    )
    for m in pattern.finditer(html):
        key, body = m.group(1), m.group(2)
        tag = re.search(r'class="section-tag">([^<]+)<', body).group(1)
        title = re.search(r'<h2 class="section-title">([^<]+)</h2>', body).group(1)
        desc = re.search(r'<p class="section-desc">([^<]+)</p>', body).group(1)
        # Strip index-only "view all" links so regenerated full pages stay clean
        section_html = re.sub(r'\s*<a href="[^"]+\.html" class="btn btn-ghost view-all-btn">[^<]*</a>', '', m.group(0))
        out[key] = (tag, title, desc, section_html)
    return out


def nav_html(active_key):
    items = []
    for key, label in NAV_LABELS:
        cls = ' class="active"' if key == active_key else ""
        items.append(f'<li><a href="{PAGES[key]}" data-section="{key}"{cls}>{label}</a></li>')
    return f"""  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="index.html" class="nav-logo">
        {LOGO_SVG}
        <span class="logo-text">TopHat</span><span class="logo-dot">.fun</span>
      </a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-links" id="navLinks">
        {''.join(items)}
      </ul>
    </div>
  </nav>"""


def build_page(key, tag, title, desc, section_html, html):
    head = re.search(r"<head>.*?</head>", html, re.S).group(0)
    head = re.sub(r"<title>[^<]*</title>", f"<title>{title} — TopHat.fun</title>", head)
    head = re.sub(
        r'<meta name="description" content="[^"]*">',
        f'<meta name="description" content="{desc}">',
        head,
    )

    scripts = '  <script src="js/main.js"></script>\n'
    if key == "ai":
        # CurioBot only exists on the AI Corner page.
        scripts += '  <script src="js/ai-agent.js"></script>\n'
    if key == "illusions":
        # file:// fallback data lives inline in index.html; carry it over.
        m = re.search(r"<script>\s*// Inline illusion data.*?</script>", html, re.S)
        if m:
            scripts += m.group(0).rstrip() + "\n"

    hero = f"""  <section class="section-hero">
    <div class="section-hero-inner">
      <a href="index.html#hero" class="back-link">&larr; Back to Home</a>
      <span class="section-tag">{tag}</span>
      <h1 class="section-hero-title">{title}</h1>
      <p class="section-desc">{desc}</p>
    </div>
  </section>
"""

    footer = re.search(r"  <!-- Footer -->.*?</footer>", html, re.S).group(0)

    return f"""<!DOCTYPE html>
<html lang="en">
{head}
<body>
  <canvas id="particles"></canvas>

{nav_html(key)}

{hero}{section_html}

{footer}
  <button class="back-to-top" id="backToTop" aria-label="Back to top">\u2191</button>

{scripts}</body>
</html>
"""


def main():
    html = INDEX.read_text(encoding="utf-8")
    global LOGO_SVG
    LOGO_SVG = re.search(r'<svg class="logo-icon".*?</svg>', html, re.S).group(0)

    sections = extract_sections(html)
    missing = [k for k in PAGES if k not in sections]
    if missing:
        sys.exit(f"error: sections not found in index.html: {', '.join(missing)}")

    for key, filename in PAGES.items():
        tag, title, desc, section_html = sections[key]
        page = build_page(key, tag, title, desc, section_html, html)
        (ROOT / filename).write_text(page, encoding="utf-8")
        print(f"wrote {filename}  ({len(page):,} bytes)")


if __name__ == "__main__":
    main()
