# Workflow: Back Button (Standard Style)

**Use this whenever a BE Eng HTML page needs a back button.**

---

## Trigger phrases
"add a back button", "add back button", "back button", "navigation back", "link back to main page"

---

## Standard back button — always use this exact style

Matches the APF visualizer (`Ch3_APF.html`) and index page. Do **not** use `<button onclick="history.back()">` — always use `<a href="index.html">` with the SVG chevron below.

### CSS (paste into `<style>`)

```css
/* ─── back button ─────────────────────────────────────────────── */
.back-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 13px; font-weight: 500; color: #444;
  text-decoration: none;
  background: #f0f0f0; border: 1px solid #ddd; border-radius: 999px;
  padding: 5px 13px 5px 10px; margin-bottom: 10px;
  transition: background 0.15s, color 0.15s; line-height: 1;
}
.back-btn:hover { background: #e4e4e4; color: #1a1a1a; }
.back-btn svg { display: block; }
```

### HTML (place directly before `<h1>`)

```html
<a class="back-btn" href="index.html">
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4L6 8l4 4"/></svg>
  Materials Science 101
</a>
```

### Notes
- Link always goes to `index.html` (the Materials Science 101 hub page)
- The label "Materials Science 101" is fixed — do not change it per-page
- Place the `<a>` tag directly above `<h1>` in `<body>`, with no extra wrapper div needed
