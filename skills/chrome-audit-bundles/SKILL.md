---
name: chrome-audit-bundles
description: Use when you need to identify oversized JavaScript/CSS bundles and caching issues via Chrome DevTools MCP — surfaces heavy assets, missing cache headers, and protocol inefficiencies.
tools: ["mcp/chrome"]
---

# chrome-audit-bundles

Navigate to a URL, collect resource timings, sort by transfer size, and flag assets with poor caching. Focus on JS, CSS, fonts, and other static assets.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:url}` | Page URL to audit | `http://localhost:4200`, `https://app.example.com` |
| `${input:filter}` | Regex filter for resource names (optional) | `.*\.(js\|css\|woff2)$` (default) |
| `${input:topN}` | Number of top resources to show (optional, default: 20) | `10` |
| `${input:filePath}` | Screenshot save path (optional) | `/tmp/bundles-app.png` |

If `filePath` is omitted, auto-name: `./tmp/bundles-<sanitized-host>.png`

**sanitize(x):** lowercase; keep `a–z 0–9 - _`; replace other chars with `-`.

## Procedure

### 1. Navigate
```json
mcp__chrome__navigate_page: { "url": "${input:url}" }
```
Wait for the page to fully load (listen for `load` event or wait ~3s).

### 2. Collect resource entries
```js
(() => {
  const filter = new RegExp('${input:filter}' || '.*\\.(js|css|woff2|png|jpg|webp)$');
  return performance.getEntriesByType('resource')
    .filter(e => filter.test(e.name))
    .map(e => ({
      name: e.name.split('/').slice(-2).join('/'),    // last two path segments
      fullUrl: e.name,
      transferSize: e.transferSize,
      encodedBodySize: e.encodedBodySize,
      decodedBodySize: e.decodedBodySize,
      duration: Math.round(e.duration),
      protocol: e.nextHopProtocol,
      cached: e.transferSize === 0 && e.encodedBodySize > 0,
    }))
    .sort((a, b) => b.transferSize - a.transferSize);
})()
```

### 3. Identify suspect caching
Flag resources where:
- `transferSize > 0` on repeated loads (not cached) for files with hashed names (likely should be long-lived).
- `transferSize ≈ encodedBodySize` (no compression) for text assets >10KB.
- `protocol` is `http/1.1` (missing HTTP/2 upgrade).

### 4. Size thresholds (reference)
| Asset type | Warning | Critical |
|------------|---------|----------|
| Single JS chunk | > 250 KB | > 500 KB |
| Total JS | > 500 KB | > 1 MB |
| Single CSS | > 50 KB | > 100 KB |
| Font file | > 100 KB | > 200 KB |

*Sizes are compressed (transferSize). Uncompressed (decodedBodySize) will be 3–5× larger.*

### 5. Screenshot (optional)
Resolve `filePath` to absolute path, create parent dirs, call `mcp__chrome__take_screenshot`.

## Output Format

### 📦 Heavy resources (top ${input:topN})
| transferSize | encodedBodySize | duration (ms) | protocol | name |
|---|---|---|---|---|

### ⚠️ Suspect caching / compression issues
- Resources likely missing long-lived cache headers
- Uncompressed text assets above threshold
- HTTP/1.1 connections that should be HTTP/2

### 💡 Recommendations
- Chunks to split or lazy-load
- Assets to compress or convert (e.g., images → WebP)
- Cache-Control suggestions

### 🖼 Screenshot
Saved: `<absolute path>` (if captured)

## Notes
- `transferSize = 0` with `encodedBodySize > 0` = served from cache. This is good.
- Hashed filenames (e.g., `main.a3f8b2.js`) should have `Cache-Control: max-age=31536000, immutable`.
- Non-hashed filenames (e.g., `index.html`) should have short or no-cache headers.
- For deeper bundle analysis, use source map explorer or webpack-bundle-analyzer on the build output.

## Common Mistakes
- **Auditing a cold cache** only — load the page twice; first load shows download sizes, second shows cached behaviour.
- **Confusing transferSize with decodedBodySize** — report both; transferSize is what the network sends, decodedBodySize is what the browser uses.
