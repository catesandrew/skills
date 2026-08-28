---
name: chrome-diff-screenshot
description: Use when you need to capture a screenshot for visual regression comparison via Chrome DevTools MCP — saves current state alongside a baseline for diffing with pixelmatch or similar tools.
tools: ["mcp/chrome"]
---

# chrome-diff-screenshot

Capture a targeted screenshot (element or full page) and persist it alongside a baseline for visual diffing. Use after UI changes to verify no unintended visual regressions.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:selector}` | CSS selector to screenshot (optional, omit for full page) | `#main-content`, `.dashboard-widget` |
| `${input:baseline}` | Path to baseline image for comparison | `./baselines/main-content.png` |
| `${input:filePath}` | Output screenshot path (optional) | `/tmp/vr-main-content-current.png` |

If `filePath` is omitted, auto-name: `./tmp/vr-<sanitized-selector-or-page>.png`

**sanitize(x):** lowercase; keep `a–z 0–9 - _`; replace other chars with `-`.

## Procedure

### 1. Resolve target
If `${input:selector}` is provided:
- Snapshot the DOM to find the element uid.
- Scroll into view: `element.scrollIntoView({ block: 'center', inline: 'center' })`.
- Get bounding rect to verify element is visible.

If no selector: capture full page.

### 2. Screenshot
Resolve `filePath` to absolute path, create parent dirs:
```js
const path = require('path'), fs = require('fs');
const absPath = path.resolve(process.cwd(), filePath);
fs.mkdirSync(path.dirname(absPath), { recursive: true });
```
Call `mcp__chrome__take_screenshot` with `{ "filePath": absPath }`.

### 3. Compare with baseline
If this environment supports image diffing:
- Compute pixel mismatch percentage between `${input:baseline}` and saved screenshot.
- Flag if mismatch exceeds threshold (recommended: 0.1% for pixel-perfect, 1% for layout changes).

If diff tooling is not available, provide instructions (see below).

## Output Format

### 🎯 Target
`${input:selector}` or `page`

### 🖼 New screenshot
Saved: `<absolute path>`

### 📏 Baseline
`${input:baseline}`

### ✅ Diff result
- Mismatch: `<percentage>%` or `not computed — use external tool`
- Status: PASS / FAIL / UNKNOWN

### 🔧 Run a local diff
If not auto-computed, run one of these:

**pixelmatch (Node.js):**
```bash
npx pixelmatch <baseline> <current> diff.png 1920 1080 --threshold 0.1
```

**Resemble.js (CLI):**
```bash
npx resemblejs compare <baseline> <current> --output diff.png
```

**ImageMagick:**
```bash
magick compare -metric AE -fuzz 5% <baseline> <current> diff.png
echo "exit code $? means: 0=identical, 1=different, 2=error"
```

## Threshold Guide

| Use case | Recommended threshold |
|----------|-----------------------|
| Pixel-perfect UI (icons, exact positioning) | 0% – 0.05% |
| Component-level (fonts, spacing) | 0.1% – 0.5% |
| Page-level layout (acceptable anti-aliasing) | 0.5% – 2% |
| Smoke test only | 2% – 5% |

## Common Mistakes
- **Different viewport sizes** — ensure browser window size matches when baseline was captured. Use `mcp__chrome__resize_page` to set a consistent size before capturing.
- **Dynamic content** — timestamps, avatars, animations will always differ. Mask or exclude dynamic regions.
- **Retina/HiDPI** — screenshots may be 2× the CSS dimensions. Baseline and current must use the same device pixel ratio.
- **Baseline not yet created** — first run creates the baseline; only flag on subsequent runs.
