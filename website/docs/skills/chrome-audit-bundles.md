---
title: Chrome Audit Bundles
description: Uses Chrome DevTools MCP to collect and sort resource timing data for a page, identifying oversized JavaScript/CSS bundles, missing cache headers, and protocol inefficiencies.
---

# chrome-audit-bundles

## Why It Exists

`chrome-audit-bundles` traces to `44d082a3` ("chore: add skills for prompts"), the commit that converted a batch of Codex CLI custom prompts into portable Agent Skills. That commit deleted `home/.codex/prompts/bundle-inspect.prompt.md` while adding `agent-skills/chrome-audit-bundles/SKILL.md` — a direct name match with no ambiguity. It was relocated to `agent-skills/skills/chrome-audit-bundles/` in `856e34fa`, migrated to the external `cw` marketplace in `df4241d4`, and imported into this public repo via the bulk `13fbfbc` commit.

## What It Does

This skill drives the Chrome DevTools MCP server to navigate to a URL, wait for load, then pull `performance.getEntriesByType('resource')` in-page via `mcp__chrome__navigate_page` and an injected script, filtering to JS/CSS/font/image assets by regex (default `.*\.(js|css|woff2|png|jpg|webp)$`) and sorting by `transferSize` descending. For each resource it captures transfer size, encoded/decoded body size, duration, next-hop protocol, and a derived `cached` flag (`transferSize === 0 && encodedBodySize > 0`).

It then flags three categories of suspects: resources with nonzero transfer size on repeat loads despite hashed filenames (should be long-lived-cacheable but aren't), text assets over 10KB where `transferSize ≈ encodedBodySize` (no compression applied), and connections still on HTTP/1.1 instead of HTTP/2. A fixed size-threshold table (warning/critical) covers single JS chunks (250KB/500KB), total JS (500KB/1MB), single CSS (50KB/100KB), and font files (100KB/200KB), all measured against compressed `transferSize` since decoded size runs 3-5x larger.

Output is a "📦 Heavy resources" table (top N, default 20), a "⚠️ Suspect caching / compression issues" list, a "💡 Recommendations" section (chunks to split/lazy-load, assets to convert to WebP, Cache-Control suggestions), and an optional screenshot saved to an auto-named or user-specified path. The skill explicitly warns that auditing only a cold cache is misleading — it recommends loading the page twice to see both download and cached behavior.

## How To Use It

Triggers on: "identify oversized JavaScript/CSS bundles and caching issues via Chrome DevTools MCP — surfaces heavy assets, missing cache headers, and protocol inefficiencies".

```sh
skills add -g catesandrew/skills --skill skills/chrome-audit-bundles
```

```sh
npm install @catesworks/skill-chrome-audit-bundles
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires a running, connected Chrome DevTools MCP server — this is a hard precondition, not optional.
- `transferSize = 0` with `encodedBodySize > 0` means "served from cache" and is explicitly called out as good, not a defect to flag.
- Report both `transferSize` and `decodedBodySize` — the skill warns against conflating them, since one is network cost and the other is browser-side memory cost.
- Hashed filenames (e.g. `main.a3f8b2.js`) are expected to carry `Cache-Control: max-age=31536000, immutable`; non-hashed files (e.g. `index.html`) are expected to have short/no-cache headers — the audit checks for exactly this pairing.
- Size thresholds in the reference table are against compressed size only — do not apply them to `decodedBodySize`.
- This skill covers network-level bundle/caching signals only; deeper module-level bundle composition needs source-map-explorer or webpack-bundle-analyzer on the actual build output.

## Related Skills

- [chrome-audit-console](/docs/skills/chrome-audit-console) — same Chrome DevTools MCP dependency and same `44d082a3` origin commit, focused on console errors/warnings instead of network/bundle weight.
- [chrome-audit-css](/docs/skills/chrome-audit-css) — same MCP dependency and origin commit, focused on cascade/specificity rather than transfer size.

---

_Sourced from: skills/chrome-audit-bundles/SKILL.md, skills/chrome-audit-bundles/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
