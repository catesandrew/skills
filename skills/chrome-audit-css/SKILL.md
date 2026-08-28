---
name: chrome-audit-css
description: Use when you need to audit CSS cascade for a specific element via Chrome DevTools MCP — reveals computed styles, matching rules, specificity conflicts, and overridden/dead declarations.
tools: ["mcp/chrome"]
---

# chrome-audit-css

Compare computed styles vs. authored rules for an element. Surface what wins the cascade, what's overridden, and what looks unused. Best for debugging visual regressions or unexpected style inheritance.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:selector}` | CSS selector for the target element | `.card-header`, `#nav-menu`, `[data-testid="price"]` |
| `${input:filePath}` | Screenshot save path (optional) | `/tmp/css-card-header.png` |

If `filePath` is omitted, auto-name: `./tmp/css-<sanitized-selector>.png`

**sanitize(x):** lowercase; keep `a–z 0–9 - _`; replace other chars with `-`.

## Procedure

### 1. Snapshot & resolve uid
```json
mcp__chrome__take_snapshot: { "includeAttributes": true, "includeFrames": true }
```
Locate first visible node matching `${input:selector}`.

### 2. Computed styles (curated set)
```js
(() => {
  const s = getComputedStyle(element), p = k => s.getPropertyValue(k);
  return {
    display: p('display'),
    position: p('position'),
    boxSizing: p('box-sizing'),
    width: p('width'), height: p('height'),
    padding: `${p('padding-top')} ${p('padding-right')} ${p('padding-bottom')} ${p('padding-left')}`,
    margin:  `${p('margin-top')} ${p('margin-right')} ${p('margin-bottom')} ${p('margin-left')}`,
    border: p('border'),
    color: p('color'),
    background: p('background-color'),
    fontSize: p('font-size'),
    fontWeight: p('font-weight'),
    lineHeight: p('line-height'),
    zIndex: p('z-index'),
    overflow: p('overflow'),
    flexbox: `${p('display')}|grow:${p('flex-grow')}|shrink:${p('flex-shrink')}|basis:${p('flex-basis')}`,
  };
})()
```

### 3. Matching authored rules
```js
(() => {
  const results = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules || [])) {
        if (rule.selectorText && element.matches(rule.selectorText)) {
          results.push({
            selector: rule.selectorText,
            source: sheet.href || 'inline',
            declarations: rule.style.cssText,
          });
        }
      }
    } catch (e) { /* cross-origin sheet, skip */ }
  }
  return results;
})()
```

### 4. Identify conflicts & overrides
For each CSS property set by multiple rules:
- Show cascade order (later index = higher priority in same-specificity competition).
- Note specificity differences (ID > class > element).
- Flag declarations that never win (overridden by all others) as likely dead rules.

### 5. Screenshot
Resolve `filePath` to absolute path, create parent dirs, call `mcp__chrome__take_screenshot`.

## Output Format

### 🎯 Target
`${input:selector}` → matched node: `tag#id.classes`

### 🎨 Computed styles
Key property → computed value table (display, position, size, spacing, color, font)

### 🧵 Matching rules (cascade order)
For each rule: source stylesheet URL | selector | declarations

### ⚠️ Conflicts & Overrides
| Property | Winning rule | Overridden rule(s) | Reason |
|---|---|---|---|

### 🚫 Dead declarations (never win)
Rules that are always overridden and can be safely removed.

### 🖼 Screenshot
Saved: `<absolute path>` (if captured)

## Specificity Quick Reference

| Selector type | Score |
|---------------|-------|
| `!important` | Overrides all |
| Inline `style=""` | (1,0,0,0) |
| `#id` | (0,1,0,0) |
| `.class`, `[attr]`, `:pseudo-class` | (0,0,1,0) |
| `element`, `::pseudo-element` | (0,0,0,1) |

Higher score = wins the cascade. Equal score = later in source order wins.

## Common Mistakes
- **Cross-origin stylesheets** — external CSS from a different origin throws SecurityError; those rules are skipped.
- **Shadow DOM** — `document.styleSheets` doesn't reach shadow roots; inspect the component host's shadow root separately.
- **Inline styles always win** — `style=""` beats any authored rule unless `!important` is used elsewhere.
