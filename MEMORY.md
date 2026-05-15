# BE Eng Memory

## Contacts
_Populate as we work._

## Key Decisions
_Populate as we work._

---

## Session — 2026-05-12

### APF Visualizer (Ch3_APF.html)
- **What was built:** Single-file interactive HTML tool for teaching Atomic Packing Factor (APF) — covers SC, BCC, FCC, HCP structures.
- **Features:** 3D canvas renderer (custom 2D projection, no Three.js), drag-to-rotate, zoom, atom-size slider, close-packed direction toggles, MathML derivations, tetrahedron toggle for HCP c/a derivation.
- **File location:** `_Claude OS/BE Eng/_outputs/Ch3_APF.html`
- **Color scheme:** SC = yellow `#FFF299`, BCC = pink `#FFBFBF`, FCC = blue `#CCD9FF`, HCP = green `#BFF2BF`; close-packed direction line = `#ff2d2d`; tetrahedron = `#1697c4`.
- **Font:** IBM Plex Sans Thai Looped (Google Fonts), 300 weight body, 700 weight headings.
- **What was tried and removed:** A "Unit Cell Definition" interactive page (BCC 2×2×2 tiling demo with 3 unit cell options) was added then removed at Mark's request. Can be rebuilt as a separate file if needed.
- **Architecture:** Pure single-file HTML — all CSS, HTML, JS in one file. No external dependencies except Google Fonts. Works by opening directly in a browser.
