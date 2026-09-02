---
title: Chrome Debug Screenshot
description: Systematically diagnoses failing Chrome DevTools MCP screenshot calls by trying multiple path, uid, frame, and clip parameter combinations in order and reporting which one works.
---

# chrome-debug-screenshot

## Why It Exists

This skill originated as `diagnose-chrome-screenshot.prompt.md`, a Codex/VS Code prompt added in the large baseline commit `c0ba2ee2` ("prompts", 2025-12-03), already framed as diagnosing "Chrome MCP screenshot failures (path vs uid vs frame vs clip)." It was converted into Claude Skill format in `44d082a3` ("chore: add skills for prompts"), relocated to `agent-skills/skills/chrome-debug-screenshot/` in `856e34fa`, and later removed from dotfiles in `df4241d4` when the whole `chrome-*` family split out to the external `catesandrew/skills` marketplace to keep a single source of truth. The prompt's own description makes the motivation explicit — Chrome DevTools MCP screenshot parameters (`path` vs `filePath`, `uid`, `clipToElement` vs `clipToElementBounds`) have historically been inconsistent across MCP server versions, and this skill exists to systematically binary-search which combination actually works rather than guessing.

## What It Does

The skill works through a fixed, ordered sequence of attempts and stops at the first success. Step 1 is a plain full-page screenshot with no clipping, as a baseline sanity check that the MCP server and an active Chrome tab even work. Step 2 takes a DOM snapshot with `includeAccessibility`, `includeAttributes`, and `includeFrames` all enabled, then finds the first node matching the target selector and extracts its `uid` (and `frameId` if it's inside an iframe). Step 3 scrolls the element into view and reads its bounding rect — if width or height is zero, the element is flagged non-visible and clip attempts are skipped entirely.

Step 4 tries four specific element-screenshot parameter combinations in order: (A) `uid` + `clipToElementBounds` + `path`, (B) `uid` + `clipToElement` + `filePath`, (C) `uid` + `path` with no clip, and (D) full-page with an absolute `path`. This directly encodes the fact that different Chrome DevTools MCP server versions have used different parameter names (`path` vs `filePath`) and different clip flags (`clipToElement` vs `clipToElementBounds`), so rather than assuming one API shape, the skill probes all of them.

The final output is a results table (one row per step, ✅/❌ plus notes) followed by a conclusion section naming the most likely root cause, the specific working parameter combination, and a recommendation for future use. A companion root-cause table maps common symptoms to causes — e.g., "all attempts fail" → MCP server not running; "plain works, element fails" → element inside an iframe needing `frameId`; "rect is 0×0" → element hidden via `display:none`/`visibility:hidden`/off-viewport.

## How To Use It

Triggers on: "Chrome DevTools MCP screenshot calls are failing or producing unexpected results", diagnosing path/uid/frame/clip parameter issues, screenshot attempts silently returning wrong or empty results.

```sh
skills add -g catesandrew/skills --skill skills/chrome-debug-screenshot
```

```sh
npm install @catesworks/skill-chrome-debug-screenshot
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires a running, connected Chrome DevTools MCP server; if every attempt fails, that (or a missing active tab) is the most likely cause, not a parameter mistake.
- Always try steps in the documented order and stop at first success — don't skip straight to a guessed combination.
- If the element's bounding rect is 0×0, clip-based attempts are pointless (the element is hidden) — skip straight to noting "non-visible."
- Chrome MCP server versions disagree on whether the screenshot parameter is named `path` or `filePath` — this skill exists specifically to test both rather than assume one.
- A `uid` found but failing to screenshot may indicate a cross-origin iframe, which cannot be screenshotted at all.
- Elements inside a Storybook preview iframe require `includeFrames: true` on the snapshot call to be discoverable in the first place.

## Related Skills

- [chrome-inspect-element](/docs/skills/chrome-inspect-element) — shares the snapshot → resolve-uid → screenshot pipeline, but for full element inspection rather than screenshot troubleshooting.
- [chrome-diff-screenshot](/docs/skills/chrome-diff-screenshot) — the downstream consumer that actually needs a reliably-working screenshot capture path.
- [chrome-inspect-a11y](/docs/skills/chrome-inspect-a11y) — same `includeFrames`-aware snapshot approach applied to accessibility checks instead of screenshot debugging.

---

_Sourced from: skills/chrome-debug-screenshot/SKILL.md, skills/chrome-debug-screenshot/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
