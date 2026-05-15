# CLAUDE.md — BE Eng Workstation

## Identity
This workstation is for preparing teaching materials for a Materials Science and Engineering tutoring class. Route here when Mark needs to build educational content, interactive tools, visualizers, exercises, or any deliverable intended for university-level materials engineering students. Does not handle BJC business development work, ML research, or general correspondence.

---

## Resources
| Resource | Read when... |
|---|---|
| `_workflows/index.md` | Read at the start of every BE Eng session — lists all available workflows and their trigger phrases |
| `_workflows/ui-play-pause-buttons.md` | Building animation step controls (Prev / Play / Next buttons) |
| `_workflows/ui-view-icon-buttons.md` | Building 3D orbital viewer view-toggle buttons (square SVG icon style) |
| `_workflows/ui-back-button.md` | Adding a back-to-index button to any BE Eng HTML page |
| `_workflows/ui-orbit-convention.md` | **Always read when building any 3D viewer** — axis orientation, rotation order, default angles, axis HUD spec |

---

## Workflow
1. Clarify the topic or unit to be covered and the target student level.
2. Identify whether the deliverable is a visual tool, written material, exercise set, or slide deck.
3. Draft or build the content; save all non-.md outputs to `_outputs/`.
4. Review for accuracy, clarity, and alignment with the course level before sharing.
5. Whenever a new HTML subpage is created or added to `_outputs/`, always update `_outputs/index.html` to include a card for that page. Also update the `materials-science-home` Cowork artifact to reflect the new card.

---

## APF Visualizer — Project Context

### What this is
Interactive educational tool for **Atomic Packing Factor (APF)** — a single-file HTML app (`apf_visualizer.html`) mixing Thai and English content, intended for university materials engineering students.

Structures covered: SC, BCC, FCC, HCP.

Features: 3D canvas renderer (custom 2D Canvas + projection math), close-packed direction overlays, MathML derivations, atom-size slider, tetrahedron toggle (HCP).

### Dev server
Served via `python3 -m http.server` from this folder (`claude/`). Config lives in `../.claude/launch.json` — use `preview_start` to run it, not Bash.

### Style Rules

**Fonts**
| Role | Font | Weight |
|---|---|---|
| `h1`, `.h2`, `.card h3` | PSL Kittithada Pro → IBM Plex Sans Thai Looped fallback | 700, uppercase |
| Body, UI | IBM Plex Sans Thai Looped → system sans fallback | 300 (light) |

IBM Plex is loaded from Google Fonts (`@import` at top of `<style>`). PSL Kittithada Pro is a local font — no CDN.

**Colour Palette**
| Token | Value | Used for |
|---|---|---|
| Background | `#fafafa` | page |
| Canvas bg | `linear-gradient(180deg, #ffffff, #eef1f5)` | canvas wrap |
| Text | `#1a1a1a` | body |
| Subtle text | `#666` | subtitles |
| Tab — SC active | `#FFF299` | yellow |
| Tab — BCC active | `#FFBFBF` | pink |
| Tab — FCC active | `#CCD9FF` | blue |
| Tab — HCP active | `#BFF2BF` | green |
| Accent (CPD line) | `#ff2d2d` | close-packed direction |
| Accent (tetra) | `#1697c4` | HCP tetrahedron |

**Layout**
Two-column grid (`1.4fr / 1fr`), collapses to single column at `max-width: 760px`. Tabs are flex-wrapped with `gap: 6px`.

### Architecture (single-file)
All code lives in `apf_visualizer.html`:
- `<style>` — all CSS
- `<body>` — markup (tabs, canvas, info panel, controls)
- `<script>` — state, geometry data (`STRUCTURES`, `CPD`, `DERIVS`), renderer (`draw`), UI handlers

Key global state: `current` (structure), `cpdIndex`, `atomScale`, `showCPD`, `showCell`, `showTetra`, `yaw`, `pitch`, `zoom`.

### Possible Next Steps
- More structures: diamond cubic, NaCl, CsCl, fluorite, zinc blende
- Export PNG button (`canvas.toDataURL`)
- Side-by-side structure comparison
- Quiz mode (identify CPD, compute APF)
- Thai ↔ English toggle (translation dictionary)
- Linear-density / planar-density widgets
- Upgrade renderer to Three.js + OrbitControls
