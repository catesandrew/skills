---
name: chrome-audit-network
description: Use when you need to capture and summarize network activity for a page or user flow via Chrome DevTools MCP — identifies slow requests, large payloads, and API call patterns.
tools: ["mcp/chrome"]
---

# chrome-audit-network

Navigate to a URL, collect Performance Resource Timing entries, filter/summarize, and optionally screenshot. Best for diagnosing slow page loads, unexpected API calls, or payload size issues.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:url}` | Page URL to audit | `http://localhost:4200`, `https://app.example.com/dashboard` |
| `${input:filter}` | Regex filter for resource names (optional) | `.*(api\|graphql).*`, `.*\.(js\|css)$` |
| `${input:duration}` | Wait duration in ms (optional, default: 5000) | `3000` |
| `${input:filePath}` | Screenshot save path (optional) | `/tmp/network-dashboard.png` |

If `filePath` is omitted, auto-name: `./tmp/network-<sanitized-host>.png`

**sanitize(x):** lowercase; keep `a–z 0–9 - _`; replace other chars with `-`.

## Procedure

### 1. Navigate
```json
mcp__chrome__navigate_page: { "url": "${input:url}" }
```

### 2. Clear existing timings
```js
performance.clearResourceTimings();
```

### 3. Wait for activity
Wait `${input:duration}` ms (or until network appears settled).

### 4. Collect resource entries
```js
(() => {
  return performance.getEntriesByType('resource').map(e => ({
    name: e.name,
    initiatorType: e.initiatorType,
    transferSize: e.transferSize,
    encodedBodySize: e.encodedBodySize,
    decodedBodySize: e.decodedBodySize,
    duration: Math.round(e.duration),
    protocol: e.nextHopProtocol,
  }));
})()
```

### 5. Filter & analyze
- Apply `${input:filter}` regex to `name` if provided.
- Group by `initiatorType` (fetch, xmlhttprequest, script, img, css, font, other).
- Sort by `duration` desc → top 10 slowest.
- Sort by `transferSize` desc → top 10 heaviest.

### 6. Screenshot (optional)
Resolve `filePath` to absolute path, create parent dirs, call `mcp__chrome__take_screenshot`.

## Output Format

### 🧭 URL
`${input:url}` — audited at `<timestamp>`

### 📊 Summary
- Total requests: N
- By initiatorType: `fetch: N, script: N, css: N, img: N, font: N, ...`
- Filter applied: `${input:filter}` or "none"

### 🐌 Slowest requests (top 10)
| duration (ms) | transferSize | initiatorType | name (truncated) |
|---|---|---|---|

### 📦 Heaviest by size (top 10)
| transferSize | encodedBodySize | protocol | name (truncated) |
|---|---|---|---|

### 🖼 Screenshot
Saved: `<absolute path>` (if captured)

### 📋 Raw table (filtered)
Compact table of all matched requests: `initiatorType | transferSize | duration | name`

## Notes
- `transferSize = 0` usually means served from cache (304 or disk cache).
- HTTP/1.1 connections with many requests → consider HTTP/2 or bundling.
- Headers and status codes are not available from Performance entries; for those, use targeted `fetch()` calls via `mcp__chrome__evaluate_script`.
- For SPA flows, navigate to the route first, then clear timings before triggering the specific action.

## Common Mistakes
- **Forgetting to clear timings first** — entries from previous navigations pollute results.
- **Too short a duration** — lazy-loaded resources and deferred API calls may not appear.
- **Treating transferSize=0 as missing** — it means cached, not absent.
