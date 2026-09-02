---
title: Chrome Diff Screenshot
description: Captures a targeted element or full-page screenshot via Chrome DevTools MCP and compares it against a saved baseline for visual regression testing, reporting a mismatch percentage or pass/fail status.
---

# chrome-diff-screenshot

## Why It Exists

This skill traces to `visual-regression-check.prompt.md`, a Codex/VS Code prompt added in the bulk baseline commit `c0ba2ee2` ("prompts", 2025-12-03) and already described as "capture a screenshot and save to disk for comparison against a baseline image." It was converted into Claude Skill format in `44d082a3` ("chore: add skills for prompts") together with the rest of the chrome-* family, relocated to `agent-skills/skills/chrome-diff-screenshot/` in `856e34fa`, and later removed from dotfiles in `df4241d4` when all `chrome-*` skills were split out to the external `catesandrew/skills` marketplace. There's no distinguishing rationale beyond the generic goal of visual regression testing after UI changes — the prompt-to-skill lineage is the concrete finding here, not a unique narrative.

## What It Does

The skill resolves a target — either a CSS selector (snapshotting the DOM, finding the element's `uid`, scrolling it into view, and verifying it's actually visible via its bounding rect) or the full page if no selector is given. It resolves the output path to an absolute path, creates parent directories if needed, and calls `mcp__chrome__take_screenshot`. If a filename isn't supplied, it auto-generates one from the sanitized selector or "page."

If the environment supports image diffing, it computes a pixel mismatch percentage between the new screenshot and a supplied baseline path and flags a failure if the mismatch exceeds a threshold. If diff tooling isn't available inline, it falls back to printing ready-to-run shell commands for three common tools: `npx pixelmatch` (Node.js), `npx resemblejs compare`, and ImageMagick's `magick compare` (with its exit-code semantics: 0=identical, 1=different, 2=error) — the skill hands you next steps rather than silently failing.

The report is structured around target, new screenshot path, baseline path, and a diff result (mismatch percentage plus PASS/FAIL/UNKNOWN status). A threshold guide table gives recommended tolerances by use case, ranging from 0–0.05% for pixel-perfect UI (icons, exact positioning) up to 2–5% for smoke tests only, with component-level and page-level layout bands in between.

## How To Use It

Triggers on: "capture a screenshot for visual regression comparison via Chrome DevTools MCP", "saves current state alongside a baseline for diffing with pixelmatch or similar tools", verifying no unintended visual regressions after UI changes.

```sh
skills add -g catesandrew/skills --skill skills/chrome-diff-screenshot
```

```sh
npm install @catesworks/skill-chrome-diff-screenshot
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires a running, connected Chrome DevTools MCP server.
- Viewport size must match between baseline and current capture — use `mcp__chrome__resize_page` to force a consistent size before capturing, or the diff is meaningless.
- Dynamic content (timestamps, avatars, animations) will always differ — mask or exclude those regions rather than treating the diff as a real regression.
- Retina/HiDPI screenshots can be 2× the CSS pixel dimensions — baseline and current must share the same device pixel ratio.
- On the very first run there is no baseline yet; only flag mismatches on subsequent runs, not the baseline-creation run itself.
- Choose the mismatch threshold to match the use case — pixel-perfect UI needs ~0.05%, page-level layout can tolerate up to ~2%.

## Related Skills

- [chrome-debug-screenshot](/docs/skills/chrome-debug-screenshot) — troubleshoots the underlying screenshot call this skill depends on when captures fail or look wrong.
- [chrome-inspect-element](/docs/skills/chrome-inspect-element) — same snapshot → resolve-uid → screenshot pipeline, used for element inspection instead of regression diffing.

---

_Sourced from: skills/chrome-diff-screenshot/SKILL.md, skills/chrome-diff-screenshot/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
