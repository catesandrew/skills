---
name: chrome-inspect-a11y
description: Use when you need a live accessibility snapshot of a running page or specific element via Chrome DevTools MCP — checks roles, names, relationships, keyboard focus, and contrast.
tools: ["mcp/chrome"]
---

# chrome-inspect-a11y

DOM snapshot + targeted evaluation to produce a focused accessibility report for a page or element. Use for live runtime a11y checks (for static source-code review, use `audit-a11y-code`).

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:scope}` | Target scope | `page` or a selector like `#save-button`, `.modal` |
| `${input:filePath}` | Screenshot save path (optional) | `/tmp/a11y-modal.png` |

If `filePath` is omitted, auto-name: `./tmp/a11y-<sanitized-scope>.png`

**sanitize(x):** lowercase; keep `a–z 0–9 - _`; replace other chars with `-`.

## Procedure

### 1. Snapshot
```json
mcp__chrome__take_snapshot: { "includeAccessibility": true, "includeAttributes": true, "includeFrames": true }
```

### 2. Resolve target
- If `${input:scope}` is a selector: find uid for the element.
- If `page`: work at the document root.

### 3. Collect a11y data via `mcp__chrome__evaluate_script`

**Role, name, relationships:**
```js
(() => {
  const el = /* resolved element or document.body */;
  return {
    role: el.getAttribute('role') || el.tagName.toLowerCase(),
    ariaLabel: el.getAttribute('aria-label'),
    labelledby: el.getAttribute('aria-labelledby'),
    describedby: el.getAttribute('aria-describedby'),
    ariaModal: el.getAttribute('aria-modal'),
    ariaRequired: el.getAttribute('aria-required'),
    ariaExpanded: el.getAttribute('aria-expanded'),
    ariaDisabled: el.getAttribute('aria-disabled'),
    tabIndex: el.tabIndex,
    focusable: el.matches('a,button,input,select,textarea,[tabindex]'),
  };
})()
```

**Contrast check (text elements):**
```js
(() => {
  const s = getComputedStyle(element);
  return { color: s.color, background: s.backgroundColor, fontSize: s.fontSize };
})()
```
Flag if color vs background contrast appears below 4.5:1 (WCAG AA for normal text) or 3:1 (large text ≥18pt / 14pt bold). This is a best-effort approximation from computed values.

**Dialog/modal check (when scope is a dialog):**
```js
(() => ({
  role: element.getAttribute('role'),
  ariaModal: element.getAttribute('aria-modal'),
  labelledby: element.getAttribute('aria-labelledby'),
  labelText: document.getElementById(element.getAttribute('aria-labelledby'))?.textContent?.trim(),
}))()
```

### 4. Keyboard checks (static inference)
- Is the element naturally focusable? (`a`, `button`, `input`, `select`, `textarea`)
- If not, does it have `tabindex="0"`?
- Does it have `tabindex="-1"` (programmatically focusable only)?
- Note any missing keyboard attributes.

### 5. Screenshot to `filePath`
Resolve to absolute path, create parent dirs, call `mcp__chrome__take_screenshot`.

## Output Format

### ♿ Accessibility Summary
- Scope: `${input:scope}`
- role / name / labelledby / describedby / aria-modal / focusable / tabIndex

### ⚠️ Issues
Bullet list — missing label, dialog lacks aria-modal, insufficient contrast, non-focusable interactive element, etc.
Include WCAG criterion reference where applicable (e.g., WCAG 2.1 SC 1.4.3, 4.1.2).

### ✅ Passes
Elements/attributes that are correctly implemented.

### 🖼 Screenshot
Saved: `<absolute path>`

## WCAG Quick Reference

| Check | Threshold |
|-------|-----------|
| Normal text contrast | ≥ 4.5:1 |
| Large text (≥18pt or 14pt bold) | ≥ 3:1 |
| Focus visible | Must be visible |
| Interactive element | Must have accessible name |
| Dialog | Needs `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Required field | `aria-required="true"` + visible indicator |

## Common Mistakes
- **Not using `includeFrames: true`** — misses elements in iframes (Storybook, embedded widgets).
- **Checking wrapper instead of native control** — role/tabIndex on the wrapper may differ from the inner `<input>`.
- **Contrast approximation only** — computed color values may not account for opacity layering; use a dedicated contrast tool for final verification.
