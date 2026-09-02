---
title: Chrome Inspect Element
description: Deeply inspects a single DOM element via Chrome DevTools MCP, retrieving computed styles, layout box, accessibility properties, and outerHTML, and saving a screenshot for diagnosing layout or CSS issues.
---

# chrome-inspect-element

## Why It Exists

This skill traces to `inspect-element.prompt.md`, a Codex/VS Code prompt added in the bulk baseline commit `c0ba2ee2` ("prompts", 2025-12-03) and already framed there as "inspect one DOM element via Chrome MCP: snapshot → resolve uid → evaluate → screenshot (saved to disk)." It was converted into Claude Skill format in `44d082a3` ("chore: add skills for prompts"), relocated to `agent-skills/skills/chrome-inspect-element/` in `856e34fa`, and later removed from dotfiles in `df4241d4` when the whole `chrome-*` family was split out to the external `catesandrew/skills` marketplace. The original prompt's example selector target (`#kinective-rest-api-url`) hints this was built against a real internal debugging session rather than written from scratch as generic tooling, but the commit history itself offers no further distinguishing rationale beyond that.

## What It Does

The skill takes a DOM snapshot with `includeAccessibility`, `includeAttributes`, and `includeFrames` enabled (the SKILL.md calls `includeFrames: true` "mandatory" for Storybook preview iframes), then resolves the target `uid` by matching the given CSS selector against id, attributes, and computed CSS path — preferring the first *visible* match (one with a non-zero layout box, not `display:none`). When a selector hits a wrapper custom element, it's instructed to drill into the inner native control instead (e.g., the actual `input` inside a `lib-text-input` wrapper), and when a `context` hint like "storybook" is given, it prefers the node inside the canvas iframe specifically.

From there it runs four separate `evaluate_script` calls against the resolved element: outerHTML; a computed-styles dump (display, position, box-sizing, width/height, padding/margin/border as four-value shorthand, a composed font string, color/background, visibility/opacity); the element's bounding rect (x/y/width/height); and accessibility attributes (role, aria-label, aria-labelledby, aria-describedby, tabIndex). It then resolves the screenshot path to an absolute path, creates parent directories, and calls `mcp__chrome__take_screenshot`.

The output is structured as Target (selector, uid, matched tag/id/class), Structure (DOM trail plus key attributes), Styles, Accessibility, an outerHTML code block (truncated if long), a screenshot reference, and an "Observations & Fixes" section proposing minimal fix diffs for any layout, contrast, a11y, or CSS issue found. If no element matches, the skill is instructed to list the closest candidates by id/name and suggest alternative selectors like `input[name="…"]` or `[data-testid="…"]` rather than failing silently.

## How To Use It

Triggers on: "deeply inspect a single DOM element via Chrome DevTools MCP", retrieving computed styles, layout box, accessibility properties, and outerHTML, diagnosing layout bugs, verifying accessibility, or understanding CSS inheritance for a specific element.

```sh
skills add -g catesandrew/skills --skill skills/chrome-inspect-element
```

```sh
npm install @catesworks/skill-chrome-inspect-element
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- `includeFrames: true` is mandatory on the snapshot call, or elements inside a Storybook canvas iframe simply won't be found.
- Always drill into the native control instead of a custom wrapper element — computed styles read from a wrapper are not representative of the real interactive element.
- Always resolve to an absolute path before passing it to any screenshot tool call — relative paths are a common failure mode.
- If a selector matches nothing, the skill must list closest candidates by id/name and suggest alternatives rather than just failing.
- When multiple elements match a selector, prefer the one with a real layout box (not `display:none` or zero-sized).

## Related Skills

- [chrome-debug-screenshot](/docs/skills/chrome-debug-screenshot) — the dedicated troubleshooting flow for when this skill's final screenshot step fails.
- [chrome-inspect-a11y](/docs/skills/chrome-inspect-a11y) — shares the snapshot → resolve-uid → evaluate pipeline, specialized for live accessibility checks.
- [chrome-diff-screenshot](/docs/skills/chrome-diff-screenshot) — reuses the same absolute-path screenshot resolution pattern for visual regression capture.

---

_Sourced from: skills/chrome-inspect-element/SKILL.md, skills/chrome-inspect-element/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
