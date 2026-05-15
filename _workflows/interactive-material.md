# Workflow: Interactive Class Material (HTML Visualizer)

Use this workflow whenever Mark asks to build an interactive educational tool, visualizer, or exercise for the Materials Science and Engineering tutoring class.

---

## Steps

1. Clarify the topic, the specific concept to visualize, and any required input controls (sliders, dropdowns, click-to-step, etc.).
2. Read this file fully before writing any code.
3. Build a **single-file HTML** tool following the style rules below.
4. Save the file to `_outputs/` and create a Cowork artifact via `mcp__cowork__create_artifact`.
5. Verify: rotate the 3D view, test all controls, confirm labels are readable.

---

## Style Rules

### Fonts
| Role | Font | Weight |
|---|---|---|
| `h1`, `h3`, `.card h3` | IBM Plex Sans Thai Looped | 700, `text-transform: uppercase` |
| Body, UI labels, values | IBM Plex Sans Thai Looped | 300 (light) |
| Fallback | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | — |

Load via `@import` at the top of `<style>`:
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai+Looped:wght@300;400;500;700&display=swap');
```

Body defaults: `font-weight: 300; color: #1a1a1a; background: #fafafa; line-height: 1.5;`

---

### Colour Palette
| Token | Value | Used for |
|---|---|---|
| Page background | `#fafafa` | `body` |
| Canvas background | `linear-gradient(180deg, #ffffff 0%, #eef1f5 100%)` | `.canvas-wrap` |
| Card background | `#ffffff` | `.card` |
| Border | `#ddd` | cards, canvas wrap, inputs |
| Body text | `#1a1a1a` | default |
| Subtitle / meta text | `#666` | `.subtitle`, info labels |
| Faint label | `#aaa` | hint text, axis tick labels |
| **Direction** tab active bg | `#CCD9FF` | direction mode |
| **Direction** accent | `#1c3a8a` | arrows, dots, active text |
| **Plane** tab active bg | `#FFBFBF` | plane mode |
| **Plane** accent | `#802020` | polygon fill/stroke |
| Axis — x | `#cc4444` | x-axis arrow + indicator |
| Axis — y | `#44a046` | y-axis arrow + indicator |
| Axis — z | `#3a66c8` | z-axis arrow + indicator |

**Structural colours (topic-specific)** — define per tool, e.g. for APF: SC=yellow `#FFF299`, BCC=pink `#FFBFBF`, FCC=blue `#CCD9FF`, HCP=green `#BFF2BF`.

---

### Back button
Every tool must include a "← Materials Science 101" back button linking to `index.html`. Place it as the first element inside `.page-header`, before `<h1>`:
```html
<a class="back-btn" href="index.html">
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4L6 8l4 4"/></svg>
  Materials Science 101
</a>
```
CSS:
```css
.back-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 13px; font-weight: 500; color: #444;
  text-decoration: none; background: #f0f0f0; border: 1px solid #ddd;
  border-radius: 999px; padding: 5px 13px 5px 10px; margin-bottom: 10px;
  transition: background 0.15s, color 0.15s; line-height: 1;
}
.back-btn:hover { background: #e4e4e4; color: #1a1a1a; }
```

---

### Layout
```css
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
  gap: 16px;
}
@media (max-width: 720px) { .layout { grid-template-columns: 1fr; } }
```

Cards: `border: 1px solid #ddd; border-radius: 8px; background: #fff; padding: 16px;`

---

### Canvas / 3D Renderer

**Canvas wrap:**
```css
.canvas-wrap {
  background: linear-gradient(180deg, #ffffff 0%, #eef1f5 100%);
  border: 1px solid #ddd; border-radius: 8px;
  position: relative; overflow: hidden;
  aspect-ratio: 1.1 / 1; min-height: 320px;
}
canvas { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; }
```

**Mobile layout** (sticky viewer, scrollable controls below):
```css
@media (max-width: 720px) {
  body { padding: 0; overflow-x: hidden; }
  .page-header { padding: 10px 14px 8px; }   /* 8px bottom = gap between tabs and canvas */
  h1 { font-size: 21px; margin-bottom: 2px; }
  .subtitle { display: none; }
  .tabs { padding: 0; margin-bottom: 0; }
  .tab { padding: 7px 14px; font-size: 13px; }
  .layout { display: flex; flex-direction: column; gap: 0; }
  .canvas-wrap {
    position: sticky; top: 0; z-index: 10;
    border-radius: 0; border-left: none; border-right: none; border-top: none;
    aspect-ratio: unset;
    height: 42dvh; height: 42vh;
    min-height: 200px;
  }
  .info { padding: 12px 14px 28px; gap: 10px; }
  .card { padding: 10px 12px; }
}
```
**Critical:** add `<meta name="viewport" content="width=device-width, initial-scale=1.0">` — without it, mobile browsers won't trigger the media query.

**Projection model** (orthographic, identical across all tools):
```javascript
// Euler rotation: rotY(yaw) → rotX(pitch)
let yaw = -0.55, pitch = 0.45, zoomF = 1.0;  // default isometric view
function scale() { return Math.min(W, H) * 0.46 * zoomF; }
function proj(pt) {
  const q = xform(pt), s = scale();
  return [W/2 + q[0]*s, H/2 - q[1]*s, q[2]];
}
```

**Unit cell drawing:**
- Main cell edges: `#666666`, `lineWidth 1.8`
- Ghost / adjacent cell edges: `#aaaaaa`, `lineWidth 1.2`
- Corner dots (main): fill `#888`, stroke `#666`, radius 3.5
- Corner dots (ghost): fill `#999`, stroke `#888`, radius 3.5

**Axis indicator** (bottom-left gizmo, 38px inset, L=22):
- Rotate direction vectors through rotation only — do NOT subtract CENTER:
  ```javascript
  let q = rotY(axis.p, yaw);
  q = rotX(q, pitch);
  ```

**View preset buttons** (bottom-right of canvas):
- Front: `{ yaw: 0, pitch: 0 }`
- Top: `{ yaw: 0, pitch: Math.PI/2 }`
- Iso (default): `{ yaw: -0.55, pitch: 0.45 }`
- No "Reset" button — the Iso button serves as the default restore.

**Resize pattern** (stable, no feedback loop):
```javascript
function resize() {
  DPR = window.devicePixelRatio || 1;
  const rect = cv.getBoundingClientRect();  // read, don't write
  W = Math.round(rect.width) || 600;
  H = Math.round(rect.height) || 0;
  if (H < 20) H = Math.round(W / 1.1);    // iframe fallback
  cv.width = Math.round(W * DPR);
  cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  redraw();
}
new ResizeObserver(resize).observe(cv);    // observe canvas, not wrap
resize();  // must be called AFTER all const declarations
```

---

### Architecture (single-file)
- Everything inline in one `.html` file: `<style>`, `<body>`, `<script>`
- No external libraries (Canvas 2D only — no Three.js unless explicitly requested)
- Painter's algorithm for depth: collect draw calls with depth, sort `b.depth - a.depth`, execute
- All `const` declarations must come BEFORE the `resize()` / `ResizeObserver` call to avoid Temporal Dead Zone errors

---

### Reference Files
| File | Purpose |
|---|---|
| `_outputs/Ch3_APF.html` | APF visualizer — reference for atom rendering, slider UI, structure tabs |
| `_outputs/Ch3._Miller_indices.html` | Miller indices — reference for direction/plane input, step animation, ghost cells, nav controls |
