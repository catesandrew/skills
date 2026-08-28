---
name: chrome-audit-performance
description: Use when you need client-side performance metrics from a running page via Chrome DevTools MCP — captures navigation timing, Core Web Vitals (FCP, LCP), and largest resource contributors.
tools: ["mcp/chrome"]
---

# chrome-audit-performance

Use the Performance API to snapshot load and rendering metrics for a URL. Gives a fast baseline without the overhead of a full Lighthouse run.

**Requires:** Chrome DevTools MCP server running and connected.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:url}` | Page URL to audit | `http://localhost:4200`, `https://app.example.com/login` |
| `${input:filePath}` | Screenshot save path (optional) | `/tmp/perf-login.png` |

If `filePath` is omitted, auto-name: `./tmp/perf-<sanitized-host>.png`

**sanitize(x):** lowercase; keep `a–z 0–9 - _`; replace other chars with `-`.

## Procedure

### 1. Navigate
```json
mcp__chrome__navigate_page: { "url": "${input:url}" }
```
Wait for `load` event or ~3s.

### 2. Collect metrics
```js
(() => {
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const paint = Object.fromEntries(
    performance.getEntriesByType('paint').map(e => [e.name, Math.round(e.startTime)])
  );
  const lcp = performance.getEntriesByType('largest-contentful-paint').slice(-1)[0];
  const resources = performance.getEntriesByType('resource')
    .sort((a, b) => b.transferSize - a.transferSize)
    .slice(0, 10)
    .map(e => ({
      name: e.name.split('/').slice(-2).join('/'),
      transferSize: e.transferSize,
      duration: Math.round(e.duration),
      protocol: e.nextHopProtocol,
    }));

  return {
    ttfb: Math.round(nav.responseStart - nav.requestStart),
    domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    load: Math.round(nav.loadEventEnd - nav.startTime),
    transferSize: nav.transferSize,
    protocol: nav.nextHopProtocol,
    firstPaint: paint['first-paint'],
    fcp: paint['first-contentful-paint'],
    lcp: lcp ? Math.round(lcp.startTime) : null,
    lcpElement: lcp?.element?.tagName || null,
    resources,
  };
})()
```

### 3. Screenshot (optional)
Resolve `filePath` to absolute path, create parent dirs, call `mcp__chrome__take_screenshot`.

## Output Format

### 🧭 URL
`${input:url}` — measured at `<timestamp>`

### ⏱ Navigation Timing
- TTFB: `<ms>` | DCL: `<ms>` | Load: `<ms>`
- Transfer size: `<KB>` | Protocol: `<http/2 or http/1.1>`

### 🎨 Core Web Vitals
| Metric | Value | Rating |
|--------|-------|--------|
| FP | `<ms>` | |
| FCP | `<ms>` | Good <1.8s / Needs improvement <3s / Poor |
| LCP | `<ms>` | Good <2.5s / Needs improvement <4s / Poor |
| LCP element | `<tag>` | |

### 📦 Heaviest resources (top 10)
| transferSize | duration (ms) | protocol | name |
|---|---|---|---|

### 🖼 Screenshot
Saved: `<absolute path>` (if captured)

## Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| FCP | < 1.8s | 1.8–3s | > 3s |
| LCP | < 2.5s | 2.5–4s | > 4s |
| TTFB | < 800ms | 800ms–1.8s | > 1.8s |
| INP | < 200ms | 200–500ms | > 500ms |

## Notes
- LCP and INP require user interaction or sufficient load time to register — run on a real page load, not a cached instant load.
- For INP, use `PerformanceObserver` with `event` type during an interaction, as it won't appear in `getEntriesByType`.
- These are synthetic metrics (no network throttling). For real-world estimates, run Lighthouse with throttling or use field data (CrUX).
- `transferSize = 0` = served from cache; this does not affect FCP/LCP timing but skews size totals.

## Common Mistakes
- **Measuring a cached page** — hard-reload (`Ctrl+Shift+R`) before measuring cold-load performance.
- **Missing LCP** — LCP only finalizes after `load` event; ensure you wait long enough.
- **Confusing load with DCL** — DCL fires when HTML is parsed (before images/CSS), load fires when everything is downloaded.
