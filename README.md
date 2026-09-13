# TopHat.fun — The Grand Cabinet of Curiosities

A magical, science-filled website with an AI-powered content agent.

## Structure

```
tophat.fun/
├── index.html          # Main site
├── css/
│   └── style.css       # Dark elegant theme with glassmorphism
├── js/
│   ├── main.js         # UI, card rendering, particles, scroll effects
│   └── ai-agent.js     # CurioBot AI agent (auto-updates content)
├── data/
│   ├── tricks.json     # Magic tricks
│   ├── science.json    # Science experiments
│   ├── facts.json      # Fun facts
│   ├── puzzles.json    # Puzzles & riddles
│   ├── history.json    # History of Magic timeline
│   └── illusions.json  # Illusion Plans Library metadata
├── splats/               # Gaussian splat gallery (self-contained SuperSplat pages)
│   ├── splat_van.html        # The Van — self-contained page, scene embedded as base64 (~25MB)
│   ├── splat_building.html   # The Building — self-contained page (~21MB)
│   ├── splat_construction.html # Construction Site — self-contained page (~26MB)
│   ├── splat_gourd.html      # The Gourd — self-contained page (~8MB)
│   ├── splat_aloe.html       # Aloe Vera — self-contained page (~11MB)
│   ├── splat_haircut.html    # The Haircut — self-contained page (~10MB)
│   └── splat_zombie.html     # Zombie — self-contained page (~5MB)
└── IllusionPlans/      # PDF files for download
```

## Sections

1. **Hero** — Elegant entrance with floating cards and particle background
2. **Magic Tricks** — Close-up, stage, and mentalism tricks
3. **Science Experiments** — Hands-on experiments with safety info
4. **Fun Facts** — Daily fact + curated collection
5. **Puzzles & Riddles** — Daily riddle + collection
6. **History of Magic** — Timeline from 200 BCE to present
7. **Illusion Plans Library** — Browse and download 19 magic books and illusion blueprints
8. **Splat Gallery** — Interactive gaussian splat scene (WebGPU), lazy-loaded on demand
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
