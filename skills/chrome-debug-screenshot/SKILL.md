---
name: chrome-debug-screenshot
description: Use when Chrome DevTools MCP screenshot calls are failing or producing unexpected results — systematically diagnoses path, uid, frame, and clip parameter issues.
tools: ["mcp/chrome"]
---

# chrome-debug-screenshot

Systematic diagnosis for Chrome MCP screenshot failures. Tries multiple parameter combinations in order and reports which works, so you can use the correct approach going forward.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:selector}` | CSS selector of the element to screenshot | `#submit-button`, `.modal-container` |
| `${input:filePath}` | Preferred output path | `/tmp/debug-screenshot.png` |

## Procedure

Work through these steps in order. Stop at the first success and report the winning approach.

### Step 1: Plain full-page screenshot (baseline)
```json
mcp__chrome__take_screenshot: { "path": "/tmp/mcp-plain-test.png" }
```
Record: success or error message.

### Step 2: DOM snapshot with frames
```json
mcp__chrome__take_snapshot: { "includeAccessibility": true, "includeAttributes": true, "includeFrames": true }
```
Find first node matching `${input:selector}`. Extract:
- `uid` — the node's unique identifier
- `frameId` — if the node is inside an iframe

### Step 3: Scroll & verify element rect
```js
(() => {
  element.scrollIntoView({ block: 'center', inline: 'center' });
  const r = element.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
})()
```
If `width <= 0 || height <= 0`: element is not visible — note "non-visible" and skip clip attempts.

### Step 4: Element screenshot attempts (try in order)

**Attempt A** — `path` + `clipToElementBounds`:
```json
{ "uid": "<uid>", "clipToElementBounds": true, "path": "${input:filePath}" }
```

**Attempt B** — `filePath` + `clipToElement`:
```json
{ "uid": "<uid>", "clipToElement": true, "filePath": "${input:filePath}" }
```

**Attempt C** — `uid` only, no clip:
```json
{ "uid": "<uid>", "path": "${input:filePath}" }
```

**Attempt D** — full page with absolute path:
```json
{ "path": "${input:filePath}" }
```

### Step 5: Report
Document which attempt succeeded and the full path written.

## Output Format

| Step | Result | Error / Notes |
|------|--------|---------------|
| Plain screenshot | ✅ / ❌ | |
| Snapshot + uid | `<uid>` `<frameId?>` | |
| Element rect | `{w, h}` | visible? |
| Attempt A | ✅ / ❌ | |
| Attempt B | ✅ / ❌ | |
| Attempt C | ✅ / ❌ | |
| Attempt D | ✅ / ❌ | |

### Conclusion
**Most likely cause:** `<explain>`
**Working approach:** `<parameter combination that succeeded>`
**Fix for future use:** `<recommendation>`

## Common Root Causes

| Symptom | Likely cause |
|---------|-------------|
| All attempts fail | MCP server not running / no active Chrome tab |
| Plain works, element fails | Element inside iframe — need `frameId` |
| Returns wrong element | Multiple matches — refine selector |
| Element rect is 0×0 | Element is hidden (`display:none`, `visibility:hidden`, or outside viewport) |
| Path write error | Directory doesn't exist — create with `fs.mkdirSync` first |
| `path` works but `filePath` doesn't | Chrome MCP version uses `path` parameter, not `filePath` |

## Notes
- Chrome MCP versions differ on whether the screenshot parameter is called `path` or `filePath` — this skill tests both.
- Elements inside Storybook's preview iframe require `includeFrames: true` in the snapshot to be discovered.
- If `uid` is found but screenshot of it fails, the element may be in a cross-origin iframe (cannot screenshot).
