---
title: Agent Browser
description: Provides a fast CLI for browser automation over Chrome/Chromium via CDP, using accessibility-tree snapshots and compact element references to navigate, click, fill forms, screenshot, and scrape.
---

# agent-browser

## Why It Exists

This skill has a dedicated, traceable origin: `7c0124d7` ("chore: add agent-browser") added the original `SKILL.md` directly, not as part of a generic bulk-add commit. A later commit, `b82451ff` ("chore(skills): restore agent-browser skill"), explicitly identifies the underlying tool as "the vercel-labs agent-browser skill" being wired into the global skill-restoration script — so the skill wraps a specific third-party CLI (Vercel Labs' `agent-browser`), not a bespoke in-house tool. A small follow-up, `7ded24f9` ("chore: add agent-browser skills"), tweaked the restore script further. The skill was later swept up in the wholesale `df4241d4` migration that moved dotfiles-local skills out to the external `cw` marketplace, and from there into this public `catesandrew/skills` repo via the bulk `13fbfbc` import.

## What It Does

`agent-browser` is a thin instructional wrapper around the `agent-browser` npm CLI, which drives real Chrome/Chromium over the Chrome DevTools Protocol (CDP). Rather than pixel-based automation, it works off accessibility-tree snapshots: `agent-browser snapshot -i` returns interactive elements tagged with compact refs like `@e1`, `@e2`, and subsequent commands (`click @e1`, `fill @e2 "text"`) target elements by those refs instead of brittle CSS selectors.

The core workflow encoded in the skill is: open a URL, snapshot to get refs, act on a ref, then re-snapshot — the skill is explicit that refs go stale after any DOM change, so a fresh `snapshot -i` is required after every interaction that might alter the page. Installation is a single `npm i -g agent-browser && agent-browser install` step.

Beyond the core loop, the skill exposes a set of specialized reference bundles fetched on demand via `agent-browser skills get <name>` rather than loaded up front — `core` (full command reference/templates), `electron` (desktop Electron apps like VS Code, Slack, Figma), `slack` (Slack workspace automation), `dogfood` (exploratory QA), `vercel-sandbox` (running inside Vercel Sandbox microVMs), and `agentcore` (AWS Bedrock AgentCore cloud browsers). This keeps the skill's always-loaded footprint small while making deep, scenario-specific guidance available only when needed.

## How To Use It

Triggers on: "navigating or interacting with web pages in the browser — opening URLs, clicking elements, filling forms, taking screenshots, scraping data, or automating any browser task".

```sh
skills add -g catesandrew/skills --skill skills/agent-browser
```

```sh
npm install @catesworks/skill-agent-browser
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires the `agent-browser` npm package to be installed globally, plus `agent-browser install` for its browser dependencies, before any command works.
- Always re-snapshot with `snapshot -i` after any interaction — element refs (`@e1`, `@e2`, ...) change when the DOM updates, and stale refs will fail or hit the wrong element.
- Specialized workflows (Electron, Slack, Vercel Sandbox, AgentCore) are not preloaded — fetch them explicitly with `agent-browser skills get <name>` only when that scenario applies.
- `allowed-tools` is scoped to `Bash(agent-browser:*)` and `Bash(npx agent-browser:*)` — the skill is designed to only ever shell out to the `agent-browser` binary, not arbitrary browser APIs.

## Related Skills

- [chrome-audit-console](/docs/skills/chrome-audit-console) — also drives a live browser via CDP, but through the Chrome DevTools MCP server rather than the `agent-browser` CLI, for console/error capture instead of interaction.

---

_Sourced from: skills/agent-browser/SKILL.md, skills/agent-browser/metadata.json, ~/.dotfiles git history (commit `7c0124d7`)_
