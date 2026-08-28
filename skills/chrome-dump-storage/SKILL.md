---
name: chrome-dump-storage
description: Use when you need to inspect browser storage state (localStorage, sessionStorage, cookies) after running a flow via Chrome DevTools MCP — useful for debugging authentication, feature flags, and persisted state.
tools: ["mcp/chrome"]
---

# chrome-dump-storage

Read and summarize browser storage (localStorage, sessionStorage, optionally cookies) for the current page. Automatically redacts sensitive values. Best for debugging persistence issues, stale tokens, or unexpected state after a flow.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:keysFilter}` | Regex filter for storage keys (optional, default: all) | `auth.*`, `user_`, `feature_.*` |
| `${input:includeCookies}` | Include cookie names? `y` or `n` (default: `n`) | `y` |
| `${input:filePath}` | Screenshot save path (optional) | `/tmp/storage-after-login.png` |

If `filePath` is omitted and a screenshot is requested, auto-name: `./tmp/storage-<YYYYMMDD-HHMMSS>.png`

## Procedure

### 1. Read localStorage
```js
(() => {
  const filter = new RegExp('${input:keysFilter}' || '.*');
  const REDACT_KEYS = /token|secret|password|passwd|auth|credential|api[_-]?key/i;
  const result = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!filter.test(key)) continue;
    const raw = localStorage.getItem(key);
    result[key] = REDACT_KEYS.test(key) ? '[REDACTED]' : (raw?.length > 200 ? raw.slice(0, 200) + '…' : raw);
  }
  return { count: Object.keys(result).length, items: result };
})()
```

### 2. Read sessionStorage
```js
(() => {
  const filter = new RegExp('${input:keysFilter}' || '.*');
  const REDACT_KEYS = /token|secret|password|passwd|auth|credential|api[_-]?key/i;
  const result = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (!filter.test(key)) continue;
    const raw = sessionStorage.getItem(key);
    result[key] = REDACT_KEYS.test(key) ? '[REDACTED]' : (raw?.length > 200 ? raw.slice(0, 200) + '…' : raw);
  }
  return { count: Object.keys(result).length, items: result };
})()
```

### 3. Read cookies (if requested)
If `${input:includeCookies}` is `y`:
```js
(() => {
  // Return cookie names only — never values
  return document.cookie.split(';')
    .map(c => c.trim().split('=')[0])
    .filter(Boolean);
})()
```

### 4. Screenshot (optional)
Resolve `filePath` to absolute path, create parent dirs, call `mcp__chrome__take_screenshot`.

## Output Format

### 🗃 localStorage (`<N>` keys matched)
| key | value (truncated, sensitive redacted) |
|-----|---------------------------------------|

### 🗃 sessionStorage (`<N>` keys matched)
| key | value (truncated, sensitive redacted) |
|-----|---------------------------------------|

### 🍪 Cookie names (values always hidden)
`name1, name2, name3, ...`

### 📊 Notable observations
- Stale timestamps or expired tokens
- Unusually large values (potential performance issue)
- Duplicate keys across localStorage/sessionStorage
- Unexpected keys that shouldn't be present

### 🖼 Screenshot
Saved: `<absolute path>` (if captured)

## Security Notes
- **Values are never printed for keys matching:** `token`, `secret`, `password`, `passwd`, `auth`, `credential`, `api-key`.
- **Cookie values are never shown** — names only.
- Add more patterns to the `REDACT_KEYS` regex as needed for your app's conventions.

## Common Mistakes
- **Storage is origin-scoped** — if the app loads in an iframe on a different origin, you can't read its storage from the parent.
- **sessionStorage is tab-scoped** — opening in a new tab gives an empty sessionStorage even for the same URL.
- **JSON-stringified values** — many apps store objects as JSON strings; parse them to inspect nested structure.
