---
title: Chrome Run Flow
description: Executes an ordered sequence of user interactions such as clicks, typing, selecting, and checking via Chrome DevTools MCP, then captures a screenshot of the resulting UI state.
---

# chrome-run-flow

## Why It Exists

This skill first appears in dotfiles commit `44d082a3` ("chore: add skills for prompts"), part of a large batch of Chrome DevTools MCP-based audit skills (`chrome-audit-bundles`, `chrome-audit-console`, `chrome-audit-css`, `chrome-inspect-a11y`, `ui-engineer`, and others) added in one sweep. It was relocated from a flat `agent-skills/<name>` layout into `agent-skills/skills/<name>` in `856e34fa` ("chore: agent-skills"). No commit message gives a distinct rationale for this specific skill over its siblings — it reads as one piece of a deliberate build-out of a Chrome DevTools MCP skill family covering audits, inspection, and now flow execution. It was later removed from dotfiles entirely in `df4241d4`, which redirected all `chrome-*` skills to the external `catesandrew/skills` marketplace (this repo) to avoid drift between the two copies.

## What It Does

Given a JSON array of actions and the current page (via a connected Chrome DevTools MCP server), the skill executes each action in order — `click`, `type`, `clear`, `select`, `check`, `uncheck`, `focus`, `key`, `wait`, `navigate` — mapping each to a specific MCP call (`mcp__chrome__click`, `mcp__chrome__type_text`, `mcp__chrome__press_key`, `mcp__chrome__navigate_page`) or a `document.querySelector` evaluate call for actions with no dedicated tool (clear, select, check/uncheck, focus). If a selector isn't found, it logs `SKIPPED: selector not found` and continues rather than aborting the whole flow.

After the action sequence completes, it waits a configurable stabilize delay (default 500ms) for animations/transitions to settle, then takes a screenshot of the final state — either to a caller-supplied path or an auto-generated one derived from sanitizing the first selector (lowercase, `a-z 0-9 - _` only, everything else becomes `-`).

Output is a fixed report format: a markdown table of each action with its status (success/skipped) and notes, the screenshot path, and a notes section calling out non-interactable elements, fallback approaches used, or unexpected state changes. It's explicitly positioned as a lighter-weight alternative to writing a full Playwright test when the goal is just validating that a micro-flow reaches the expected end state.

## How To Use It

Triggers on: "execute a sequence of user interactions (click, type, select, check) and capture the resulting UI state via Chrome DevTools MCP", validating micro-flows, capturing end states after a flow without writing a full Playwright test.

```sh
skills add -g catesandrew/skills --skill skills/chrome-run-flow
```

```sh
npm install @catesworks/skill-chrome-run-flow
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires a running, connected Chrome DevTools MCP server — this is a hard precondition, not optional.
- Selector not found is a soft failure: log `SKIPPED` and continue, never abort the sequence.
- `select` action's `value` refers to the `<option value="...">` attribute, not the visible label text.
- Actions that trigger async work (API calls) need an explicit `{ "type": "wait", "ms": ... }` step afterward — the skill does not infer async completion.
- If a field may have pre-filled text, add a `clear` action before `type`, since `type` does not clear first.
- Always verify visibility/enabled state before acting on an element; hidden or disabled elements should be flagged, not silently clicked.

## Related Skills

- [chrome-audit-console](/docs/skills/chrome-audit-console) — same Chrome DevTools MCP family, added in the same dotfiles commit sweep.
- [chrome-debug-screenshot](/docs/skills/chrome-debug-screenshot) — related screenshot-capture tooling from the same batch.

---

_Sourced from: skills/chrome-run-flow/SKILL.md, skills/chrome-run-flow/metadata.json, ~/.dotfiles git history (commits `44d082a3`, `856e34fa`, `df4241d4`)_
