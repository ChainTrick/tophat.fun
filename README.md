# TopHat.fun — The Grand Cabinet of Curiosities

A magical, science-filled website with an AI-powered content agent.

## Structure

```
tophat.fun/
├── index.html          # Main site — previews of every section, links to full pages
├── magic.html ... ai.html  # One full page per section (GENERATED — see below)
├── css/
│   └── style.css       # Dark elegant theme with glassmorphism
├── js/
│   ├── main.js         # UI, card rendering, particles, scroll effects
│   └── ai-agent.js     # CurioBot AI agent (auto-updates content)
├── tools/
│   └── generate-pages.py  # Regenerates the per-section pages from index.html
├── data/
│   ├── tricks.json     # Magic tricks
│   ├── science.json    # Science experiments
│   ├── facts.json      # Fun facts
│   ├── puzzles.json    # Puzzles & riddles
│   ├── history.json    # History of Magic timeline
│   └── illusions.json  # Illusion Plans Library metadata
├── *.pdf               # Illusion Plans — 17 PDFs, AT THE PAGE ROOT
└── splat_*.html        # Gaussian splat gallery — 7 pages, AT THE PAGE ROOT
```

### Section full pages (generated)

`index.html` is the hub: it shows a **preview** of every section (first three cards /
timeline entries per list, plus each section's "View all" button), and both the nav menu
and those buttons link to a standalone page per category — `magic.html`, `science.html`,
`facts.html`, `puzzles.html`, `history.html`, `illusions.html`, `splats.html`, `ai.html`.
Each full page carries the same nav, theme, and complete content.

The pages are generated from `index.html` by `tools/generate-pages.py`:

```sh
python3 tools/generate-pages.py   # re-run after editing index.html sections/nav
```

Preview limits live in `js/main.js` (`PREVIEW_LIMIT`, applied only when the body has
`data-preview="true"`, which is set on `index.html`). The generated pages are committed —
static hosts serve them as-is.

### Asset paths are root-relative (important)

The published site has **no** `IllusionPlans/` or `splats/` directories: the PDFs and
the splat pages sit next to `index.html`, and `js/main.js` links to them by bare
filename (`encodeURIComponent(item.filename)` and `scene + '.html'`). PDF filenames
contain spaces and `Great-Tricks.pdf` contains uppercase, so they must be referenced
with `encodeURIComponent`, never hard-coded.

Any deploy that mirrors this repo must therefore upload the PDFs and `splat_*.html`
files to the web root. Moving them into subdirectories — or uploading them to a
different branch than the one Pages serves — breaks every download and every splat
with a 404. Verify after deploying:

```sh
curl -o /dev/null -w '%{http_code}\n' https://SITE/Advanced-illusion-projects-by-tim-clothier.pdf
curl -o /dev/null -w '%{http_code}\n' https://SITE/splat_van.html
```

Both must return `200`.
```

## Sections

1. **Hero** — Elegant entrance with floating cards and particle background
2. **Magic Tricks** — Close-up, stage, and mentalism tricks
3. **Science Experiments** — Hands-on experiments with safety info
4. **Fun Facts** — Daily fact + curated collection
5. **Puzzles & Riddles** — Daily riddle + collection
6. **History of Magic** — Timeline from 200 BCE to present
7. **Illusion Plans Library** — Browse and download 19 magic books and illusion blueprints
8. **Splat Gallery** — Interactive gaussian splat scenes (WebGPU), lazy-loaded on demand
9. **AI Corner** — CurioBot status dashboard with live logs

## CurioBot AI Agent

CurioBot is the built-in AI agent that:
- Fetches new facts from public APIs daily
- Tracks indexed facts and tricks in localStorage
- Refreshes the "Fact of the Day" automatically
- Shows a live activity log in the AI Corner section
- Simulates ongoing monitoring activity

## Design

- **Theme**: Dark elegant magician's stage
- **Colors**: Deep navy (#0a0a1a) with electric sky blue (#3b82f6) accents
- **Typography**: Playfair Display (headings) + Inter (body) + JetBrains Mono (code)
- **Effects**: Glassmorphism cards, floating particles, scroll reveals
- **Responsive**: Mobile-first with hamburger nav

## Usage

Open `index.html` in any browser. No build step or dependencies needed.

For hosting: upload all files to GitHub Pages, Netlify, cloudflare Pages, or any static host.

## Adding Content

Edit the JSON files in `data/` to add new tricks, experiments, facts, puzzles, or history entries. The site auto-renders from these files.
