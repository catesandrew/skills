---
title: Chrome Audit Performance
description: Uses the Performance API via Chrome DevTools MCP to snapshot navigation timing, Core Web Vitals (FCP, LCP), and the largest resource contributors as a fast alternative to a full Lighthouse run.
---

# chrome-audit-performance

## Why It Exists

Like its siblings, this skill began life as a Codex/VS Code prompt, `performance-snapshot.prompt.md`, added in the bulk baseline commit `c0ba2ee2` ("prompts", 2025-12-03), described there as collecting "client-side performance metrics and largest resource contributors." It was converted to Claude Skill format in `44d082a3` ("chore: add skills for prompts") and moved to `agent-skills/skills/chrome-audit-performance/` in `856e34fa`. A later commit, `29619062` ("feat(skills): add frontend quality workflows"), touched the broader skills tree and references this skill as part of a frontend-quality pipeline, but does not change its content in a way that reveals distinct rationale. It was ultimately dropped from dotfiles in `df4241d4` when the whole `chrome-*` family was migrated to the external `catesandrew/skills` marketplace. No unique backstory beyond "fast baseline without full Lighthouse overhead" — that's stated plainly in the SKILL.md itself.

## What It Does

The skill navigates to a URL with `mcp__chrome__navigate_page` and waits for the `load` event (or roughly 3 seconds), then runs a single `evaluate_script` call that pulls from three Performance API surfaces at once: `performance.getEntriesByType('navigation')` for TTFB/DCL/load timings and transfer size/protocol, `performance.getEntriesByType('paint')` for First Paint and First Contentful Paint, and `performance.getEntriesByType('largest-contentful-paint')` for LCP time and the LCP element's tag name. It also sorts `performance.getEntriesByType('resource')` by transfer size and keeps the top 10 heaviest resources.

The report renders navigation timing (TTFB, DCL, Load, transfer size, protocol), a Core Web Vitals table with FP/FCP/LCP values, and the top-10 heaviest resources — plus an optional screenshot. A fixed thresholds table classifies FCP, LCP, TTFB, and INP into Good/Needs Improvement/Poor bands per the standard web-vitals cutoffs (e.g., LCP < 2.5s good, 2.5–4s needs improvement, > 4s poor).

It's explicit about what it is *not*: these are synthetic, unthrottled metrics, not field data, so results should not be treated as equivalent to a throttled Lighthouse run or real-world CrUX data. It also notes that INP requires a `PerformanceObserver` on the `event` type during an actual interaction — it won't show up via `getEntriesByType`, so this skill only reports it as unavailable/null unless a caller separately wires that observer in.

## How To Use It

Triggers on: "client-side performance metrics from a running page via Chrome DevTools MCP", "navigation timing, Core Web Vitals (FCP, LCP), and largest resource contributors", wanting a fast baseline without the overhead of a full Lighthouse run.

```sh
skills add -g catesandrew/skills --skill skills/chrome-audit-performance
```

```sh
npm install @catesworks/skill-chrome-audit-performance
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires a running, connected Chrome DevTools MCP server.
- Measuring a cached page gives misleading cold-load numbers — hard-reload (`Ctrl+Shift+R`) before measuring.
- LCP only finalizes after the `load` event fires, so cutting the wait short can under-report it as missing.
- Don't conflate DCL (HTML parsed) with Load (everything downloaded) — they measure different milestones.
- These are synthetic, unthrottled metrics — for real-world estimates, run Lighthouse with throttling or use field data (CrUX) instead.
- `transferSize = 0` means cache-served; it doesn't affect FCP/LCP timing but will skew size totals if misread as "missing."

## Related Skills

- [chrome-audit-network](/docs/skills/chrome-audit-network) — shares the same Performance API foundation, focused on per-request breakdown rather than page-level vitals.
- [chrome-audit-bundles](/docs/skills/chrome-audit-bundles) — complements the heaviest-resources table with deeper bundle composition analysis.
- [chrome-audit-css](/docs/skills/chrome-audit-css) — another audit-family sibling useful for tracing render-blocking CSS contributing to poor LCP/FCP.

---

_Sourced from: skills/chrome-audit-performance/SKILL.md, skills/chrome-audit-performance/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
