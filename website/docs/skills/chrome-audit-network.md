---
title: Chrome Audit Network
description: Captures and summarizes network activity for a page or user flow via Chrome DevTools MCP, identifying slow requests, large payloads, and API call patterns grouped by initiator type.
---

# chrome-audit-network

## Why It Exists

This skill traces back to a Codex/VS Code prompt file, `capture-network-flow.prompt.md`, first added in the large baseline commit `c0ba2ee2` ("prompts", 2025-12-03) as an `agent`-mode Copilot prompt for capturing `performance.getEntriesByType('resource')` timings. It was converted into Claude Skill format in `44d082a3` ("chore: add skills for prompts") alongside the rest of the chrome-* family, then relocated to `agent-skills/skills/chrome-audit-network/` in `856e34fa`. It was later removed from dotfiles entirely in `df4241d4`, which split all `chrome-*` skills out to the external `catesandrew/skills` marketplace (this repo) to avoid drift between two sources of truth. There is no distinguishing rationale beyond "diagnose slow page loads" in any of these commits — the origin story is generic but the prompt→skill lineage is concrete and verifiable.

## What It Does

The skill navigates Chrome to a given URL via `mcp__chrome__navigate_page`, then clears any existing resource timings with `performance.clearResourceTimings()` so stale entries from a prior navigation don't pollute results. It waits a configurable duration (default 5000ms) for network activity to settle, then evaluates a script that maps `performance.getEntriesByType('resource')` into a compact record per request: name, `initiatorType`, `transferSize`, `encodedBodySize`, `decodedBodySize`, rounded `duration`, and `nextHopProtocol`.

From there it applies an optional regex filter against resource names, groups counts by `initiatorType` (fetch, xmlhttprequest, script, img, css, font, other), and produces two ranked tables: the top 10 slowest requests by duration and the top 10 heaviest by transfer size. It can optionally resolve a screenshot path (auto-named `./tmp/network-<sanitized-host>.png` if omitted) and capture the page state via `mcp__chrome__take_screenshot`.

The output format is a fixed Markdown report: a URL/timestamp header, a summary block, the two ranked tables, an optional screenshot reference, and a raw filtered table. It explicitly calls out that `transferSize = 0` usually means the resource was served from cache rather than missing, and notes that headers/status codes aren't available from Performance entries — for those, targeted `fetch()` calls via `mcp__chrome__evaluate_script` are needed instead.

## How To Use It

Triggers on: "capture and summarize network activity for a page or user flow via Chrome DevTools MCP", "identify slow requests, large payloads, and API call patterns", diagnosing slow page loads, unexpected API calls, or payload size issues.

```sh
skills add -g catesandrew/skills --skill skills/chrome-audit-network
```

```sh
npm install @catesworks/skill-chrome-audit-network
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires a running, connected Chrome DevTools MCP server — nothing works without it.
- Always clear resource timings before triggering the action being measured; otherwise entries from a previous navigation bleed into the summary.
- Too short a `duration` will miss lazy-loaded resources and deferred API calls — default is 5000ms but SPA flows may need more.
- `transferSize = 0` must be treated as "served from cache," not "request failed" or "missing."
- Headers and HTTP status codes are not exposed by the Performance API — use `evaluate_script` with `fetch()` for those.
- For SPA route changes, navigate to the route first, then clear timings before triggering the specific in-app action to measure.

## Related Skills

- [chrome-audit-performance](/docs/skills/chrome-audit-performance) — same Performance API foundation, focused on Core Web Vitals instead of per-request breakdown.
- [chrome-audit-bundles](/docs/skills/chrome-audit-bundles) — complementary bundle-size analysis for the JS/CSS assets this skill also surfaces by transfer size.
- [chrome-audit-console](/docs/skills/chrome-audit-console) — pairs well for a full page-health audit alongside network timing.

---

_Sourced from: skills/chrome-audit-network/SKILL.md, skills/chrome-audit-network/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
