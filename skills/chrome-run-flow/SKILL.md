---
name: chrome-run-flow
description: Use when you need to execute a sequence of user interactions (click, type, select, check) and capture the resulting UI state via Chrome DevTools MCP — useful for validating micro-flows and capturing end states.
tools: ["mcp/chrome"]
---

# chrome-run-flow

Execute an ordered sequence of actions on the current page and capture a screenshot of the final state. Best for quickly validating a UI flow without writing a full Playwright test.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:actionsJSON}` | JSON array of actions to perform | See action schema below |
| `${input:stabilizeMs}` | Wait ms after last action (optional, default: 500) | `1000` |
| `${input:filePath}` | Screenshot save path (optional) | `/tmp/flow-after-submit.png` |

If `filePath` is omitted, auto-name: `./tmp/flow-<sanitized-first-selector>.png`

**sanitize(x):** lowercase; keep `a–z 0–9 - _`; replace other chars with `-`.

## Action Schema

```json
[
  { "type": "click",    "selector": "#add-user" },
  { "type": "type",     "selector": "#email-input",   "text": "user@example.com" },
  { "type": "clear",    "selector": "#search-box" },
  { "type": "select",   "selector": "#role-dropdown", "value": "admin" },
  { "type": "check",    "selector": "#agree-terms" },
  { "type": "uncheck",  "selector": "#newsletter" },
  { "type": "focus",    "selector": "#first-name" },
  { "type": "key",      "key": "Enter" },
  { "type": "wait",     "ms": 1000 },
  { "type": "navigate", "url": "http://localhost:4200/settings" }
]
```

## Procedure

### 1. Parse actions
Parse `${input:actionsJSON}` as a JSON array.

### 2. Execute each action in order
For each action:

| type | MCP call |
|------|----------|
| `click` | `mcp__chrome__click` with `{ selector }` |
| `type` | `mcp__chrome__type_text` with `{ selector, text }` |
| `clear` | evaluate: `document.querySelector(selector).value = ''` |
| `select` | `mcp__chrome__select_option` (or evaluate: `el.value = value; el.dispatchEvent(new Event('change'))`) |
| `check` | evaluate: `el.checked = true; el.dispatchEvent(new Event('change'))` |
| `uncheck` | evaluate: `el.checked = false; el.dispatchEvent(new Event('change'))` |
| `focus` | evaluate: `document.querySelector(selector).focus()` |
| `key` | `mcp__chrome__press_key` with `{ key }` |
| `wait` | wait `ms` milliseconds |
| `navigate` | `mcp__chrome__navigate_page` with `{ url }` |

If an action's selector is not found: log `SKIPPED: selector not found` and continue.

### 3. Stabilize
Wait `${input:stabilizeMs}` ms for animations/transitions to settle.

### 4. Screenshot
Resolve `filePath` to absolute path, create parent dirs, call `mcp__chrome__take_screenshot`.

## Output Format

### 🧭 Actions performed
| # | type | selector/key | status | notes |
|---|------|-------------|--------|-------|
| 1 | click | `#add-user` | ✅ success | |
| 2 | type | `#email-input` | ✅ success | |
| 3 | click | `#missing-btn` | ⏭ skipped | selector not found |

### 🖼 Final state screenshot
Saved: `<absolute path>`

### ⚠️ Notes
- Any non-interactable elements (disabled, hidden, zero-size)
- Actions that required fallback approaches
- Unexpected state changes observed

## Common Mistakes
- **Acting on hidden/disabled elements** — check that the element is visible and enabled before the action step.
- **Not waiting after async actions** — clicks that trigger API calls need a `{ "type": "wait", "ms": 2000 }` step after.
- **Type without clearing first** — if the field has pre-filled text, add a `clear` action before `type`.
- **Select with display text vs value** — `value` in the action schema is the `<option value="…">` attribute, not the visible label.
