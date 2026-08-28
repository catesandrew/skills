---
name: chrome-inspect-element
description: Use when you need to deeply inspect a single DOM element via Chrome DevTools MCP — retrieve computed styles, layout box, accessibility properties, outerHTML, and save a screenshot.
tools: ["mcp/chrome"]
---

# chrome-inspect-element

Snapshot → resolve uid → evaluate styles/a11y/layout → screenshot. Use for diagnosing layout bugs, verifying accessibility, or understanding CSS inheritance for a specific element.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:selector}` | CSS selector for the target element | `#submit-btn`, `[data-testid="modal"]` |
| `${input:context}` | Context hint (optional) | `storybook`, `app shell`, `iframe` |
| `${input:filePath}` | Screenshot save path (optional) | `/tmp/inspect-submit.png` |

If `filePath` is omitted, auto-name: `./tmp/ie-<sanitized-selector>.png`

**sanitize(x):** lowercase; keep `a–z 0–9 - _`; replace other chars with `-`.

## Procedure

### 1. Snapshot the DOM
```json
mcp__chrome__take_snapshot: { "includeAccessibility": true, "includeAttributes": true, "includeFrames": true }
```
`includeFrames: true` is mandatory for Storybook preview iframes.

### 2. Resolve target `uid`
Find first **visible** node matching `${input:selector}`:
- Match against `id`, `attributes`, computed CSS path.
- If selector hits a wrapper custom element, prefer the inner native control (e.g. `input#…` inside `lib-text-input`).
- When context hints "storybook", prefer the node inside the canvas iframe.
- If multiple matches, pick the one with a layout box (not `display:none` or zero-sized).

### 3. Evaluate on `uid` (separate script calls)

**outerHTML:**
```js
(() => ({ outerHTML: element.outerHTML }))()
```

**Computed styles:**
```js
(() => {
  const s = getComputedStyle(element), p = k => s.getPropertyValue(k);
  return {
    display: p('display'), position: p('position'), boxSizing: p('box-sizing'),
    width: p('width'), height: p('height'),
    padding: [p('padding-top'),p('padding-right'),p('padding-bottom'),p('padding-left')].join(' '),
    margin:  [p('margin-top'), p('margin-right'), p('margin-bottom'), p('margin-left')].join(' '),
    border:  [p('border-top'),p('border-right'), p('border-bottom'),p('border-left')].join(' | '),
    font: `${p('font-weight')} ${p('font-size')}/${p('line-height')} ${p('font-family')}`,
    color: p('color'), background: p('background'),
    visibility: p('visibility'), opacity: p('opacity'),
  };
})()
```

**Layout box:**
```js
(() => { const r = element.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height }; })()
```

**A11y attributes:**
```js
(() => ({
  role: element.getAttribute('role'),
  ariaLabel: element.getAttribute('aria-label'),
  labelledby: element.getAttribute('aria-labelledby'),
  describedby: element.getAttribute('aria-describedby'),
  tabIndex: element.tabIndex,
}))()
```

### 4. Screenshot
Resolve to absolute path before calling:
```js
const path = require('path'), fs = require('fs');
const absPath = path.resolve(process.cwd(), filePath);
fs.mkdirSync(path.dirname(absPath), { recursive: true });
```
Call `mcp__chrome__take_screenshot` with `{ "filePath": absPath }`.

## Output Format

### 🎯 Target
- Selector: `${input:selector}` | uid: `<uid>` | Matched: `tag#id.class`

### 🧩 Structure
DOM trail (parent → child), key attributes (id, name, type, role, aria-*)

### 🎨 Styles
display / position / size (w×h) / padding / margin / border / font / color / background / opacity

### ♿ Accessibility
role / accessible name / labelled-by / described-by / tabIndex / focusability notes

### 🧱 HTML
```html
<!-- outerHTML (truncated if long) -->
```

### 📷 Screenshot
Saved: `<absolute path>`

### ⚠️ Observations & Fixes
Minimal fix diffs for any layout, contrast, a11y, or CSS issues found.

## Common Mistakes
- **Forgetting `includeFrames: true`** — elements inside Storybook canvas iframe won't be found without it.
- **Selecting the wrapper instead of native control** — always drill into the native element for accurate computed styles.
- **Using relative paths** — always resolve to absolute before passing to screenshot tools.
- **No match found** — list closest candidates by id/name and suggest alternatives like `input[name="…"]` or `[data-testid="…"]`.
