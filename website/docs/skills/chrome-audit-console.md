---
title: Chrome Audit Console
description: Instruments a page's console via Chrome DevTools MCP, runs a reproduction flow, and collects and summarizes runtime errors and warnings — React warnings, failed network calls, and unhandled rejections.
---

# chrome-audit-console

## Why It Exists

`chrome-audit-console` traces to `44d082a3` ("chore: add skills for prompts"), the commit that converted a batch of Codex CLI custom prompts into portable Agent Skills. That commit deleted `home/.codex/prompts/console-errors-audit.prompt.md` while adding `agent-skills/chrome-audit-console/SKILL.md` — a direct name match. It was relocated to `agent-skills/skills/chrome-audit-console/` in `856e34fa`, migrated to the external `cw` marketplace in `df4241d4`, and imported into this public repo via the bulk `13fbfbc` commit.

## What It Does

The skill installs a console interceptor (an injected script that monkeypatches `console.error`/`console.warn` to push each call into a `window.__consoleFeed` array, capturing timestamp, type, a best-effort stringified message, and a truncated stack trace) *before* driving the given reproduction steps through the Chrome DevTools MCP server. After running the repro and waiting a configurable duration (default 4000ms), it reads `window.__consoleFeed` back out, groups entries by type, deduplicates by message text (message + count), and highlights entries carrying stack traces.

It ships a small pattern-matching table for triage: `Warning: Each child in a list should have a unique "key"` → missing `key` prop; `Can't perform a React state update on an unmounted component` → missing `useEffect` cleanup; `A component is changing an uncontrolled input` → a value prop flipping from undefined to defined; `Failed to fetch`/`net::ERR_*` → blocked or down network request; unhandled `TypeError: Cannot read property...` rejections → missing null checks on async data.

Output is structured as the repro steps used, an "⚠️ Console Summary" (error/warning/total counts plus a deduplicated top-messages table with type/count/has-stack columns), a "🔍 Notable findings" section calling out React warnings, failed requests, deprecations, and unhandled rejections specifically, an optional screenshot, and a raw first-20-entries feed for reference.

## How To Use It

Triggers on: "capture and categorize console warnings and errors during a reproduction window via Chrome DevTools MCP — useful for diagnosing runtime errors, React warnings, and failed network calls".

```sh
skills add -g catesandrew/skills --skill skills/chrome-audit-console
```

```sh
npm install @catesworks/skill-chrome-audit-console
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Requires a running, connected Chrome DevTools MCP server.
- The interceptor must be injected *before* the reproduction steps run — errors that fire on initial page load are missed if injection happens after navigation.
- The interceptor is cleared on page navigation — if the repro itself navigates to a new page, it must be re-injected on that page before continuing.
- The default 4000ms wait after repro may be too short for debounced saves or delayed API calls; the skill calls this out explicitly as a common source of missed async errors.
- Only `console.error` and `console.warn` are intercepted — `console.log`/`info`/`debug` calls are not captured by this mechanism.

## Related Skills

- [chrome-audit-css](/docs/skills/chrome-audit-css) — same Chrome DevTools MCP dependency and `44d082a3` origin commit, for cascade debugging instead of console capture.
- [chrome-audit-bundles](/docs/skills/chrome-audit-bundles) — same MCP dependency and origin commit, for bundle/caching audits instead of console errors.
- [audit-react-component](/docs/skills/audit-react-component) — a static counterpart that catches the same class of React issues (stale closures, missing cleanup) via source review rather than live console capture.

---

_Sourced from: skills/chrome-audit-console/SKILL.md, skills/chrome-audit-console/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
