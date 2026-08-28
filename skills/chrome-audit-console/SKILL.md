---
name: chrome-audit-console
description: Use when you need to capture and categorize console warnings and errors during a reproduction window via Chrome DevTools MCP — useful for diagnosing runtime errors, React warnings, and failed network calls.
tools: ["mcp/chrome"]
---

# chrome-audit-console

Instrument the page console, follow reproduction steps, collect errors/warnings, and summarize. Best for understanding what goes wrong during a specific user flow.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:repro}` | Steps to reproduce the scenario | `navigate to /settings, click Save` |
| `${input:duration}` | Wait duration in ms after repro (optional, default: 4000) | `6000` |
| `${input:filePath}` | Screenshot save path (optional) | `/tmp/console-settings-save.png` |

If `filePath` is omitted, auto-name: `./tmp/console-<YYYYMMDD-HHMMSS>.png`

## Procedure

### 1. Inject console interceptor
```js
(() => {
  window.__consoleFeed = [];
  const push = (type, args) => window.__consoleFeed.push({
    t: Date.now(),
    type,
    msg: Array.from(args).map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
      catch { return String(a); }
    }).join(' '),
    stack: (new Error()).stack?.split('\n').slice(2, 5).join(' | ') || null,
  });
  ['error', 'warn'].forEach(k => {
    const orig = console[k];
    console[k] = function(...a) { try { push(k, a) } catch(_) {}; return orig.apply(this, a); };
  });
  return 'interceptor installed';
})()
```

### 2. Reproduce
Follow steps: `${input:repro}`
Wait `${input:duration}` ms.

### 3. Collect logs
```js
(() => ({ feed: window.__consoleFeed || [], count: (window.__consoleFeed || []).length }))()
```

### 4. Analyze
- Group by type (`error` / `warn`).
- Deduplicate by message text → show message + count.
- Highlight entries with stack traces.
- Look for patterns: React key warnings, unhandled promise rejections, 4xx/5xx fetch errors, deprecation notices.

### 5. Screenshot (optional)
Resolve `filePath` to absolute path, create parent dirs, call `mcp__chrome__take_screenshot`.

## Output Format

### 🧪 Repro
`${input:repro}`

### ⚠️ Console Summary
- Errors: N | Warnings: N | Total: N

**Top messages (deduplicated):**
| type | count | message (truncated) | has stack? |
|------|-------|---------------------|------------|

### 🔍 Notable findings
- React warnings (missing keys, hook violations, controlled/uncontrolled switches)
- Failed network requests
- Deprecation notices
- Unhandled promise rejections

### 🖼 Screenshot
Saved: `<absolute path>` (if captured)

### 📋 Raw feed (first 20 entries)
`timestamp | type | message`

## Common Patterns & Fixes

| Message pattern | Likely cause |
|----------------|--------------|
| `Warning: Each child in a list should have a unique "key"` | Missing `key` prop on list items |
| `Warning: Can't perform a React state update on an unmounted component` | useEffect cleanup missing |
| `Warning: A component is changing an uncontrolled input` | Switching from undefined to a defined value prop |
| `Failed to fetch` / `net::ERR_*` | Network request blocked or server down |
| `Unhandled Rejection (TypeError: Cannot read property...)` | Missing null check on async data |

## Common Mistakes
- **Not injecting interceptor before repro** — errors that fire on page load will be missed if you inject after navigating.
- **Too short a duration** — async operations (debounced saves, delayed API calls) may fire after the window closes.
- **Interceptor cleared on navigation** — if repro involves a page navigation, re-inject after the new page loads.
