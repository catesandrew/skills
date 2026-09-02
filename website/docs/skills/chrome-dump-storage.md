---
title: Chrome Dump Storage
description: Reads and summarizes browser storage state (localStorage, sessionStorage, and optionally cookie names) via Chrome DevTools MCP, automatically redacting sensitive values for debugging.
---

# chrome-dump-storage

## Why It Exists

This skill originated as `tab-state-dump.prompt.md`, a Codex/VS Code prompt added in the bulk baseline commit `c0ba2ee2` ("prompts", 2025-12-03), described there as "dump storage state (localStorage/sessionStorage/cookies) for debugging flows." It was converted into Claude Skill format in `44d082a3` ("chore: add skills for prompts"), relocated to `agent-skills/skills/chrome-dump-storage/` in `856e34fa`, and removed from dotfiles in `df4241d4` when the whole `chrome-*` family was migrated out to the external `catesandrew/skills` marketplace. The rename from "tab-state-dump" to "chrome-dump-storage" happened somewhere in that conversion but no commit message explains it — it's a naming cleanup, not a functional change worth speculating about further.

## What It Does

The skill runs two nearly-identical `evaluate_script` passes, one over `localStorage` and one over `sessionStorage`: it builds a regex from an optional `keysFilter` input, iterates every key, skips keys that don't match the filter, and for matching keys checks the key name against a `REDACT_KEYS` pattern (`token|secret|password|passwd|auth|credential|api[_-]?key`, case-insensitive). Matching keys get their value replaced with `[REDACTED]`; everything else is truncated to 200 characters with an ellipsis if longer. If cookies are requested, a third script extracts only cookie *names* (never values) by splitting `document.cookie` on `;` and `=`.

The report renders three sections — localStorage table, sessionStorage table, and a flat comma-separated list of cookie names — each keyed/valued (value column always redaction-aware), plus a "Notable observations" section calling out stale timestamps or expired tokens, unusually large values, duplicate keys across the two storage types, or unexpected keys that shouldn't be present. An optional screenshot can be captured and auto-named with a timestamp if no path is given.

The skill is explicit that this redaction is a floor, not a guarantee: it tells the user to extend the `REDACT_KEYS` regex with app-specific conventions, and separately warns that many apps store JSON-stringified objects as string values that need parsing to actually inspect their nested structure.

## How To Use It

Triggers on: "inspect browser storage state (localStorage, sessionStorage, cookies) after running a flow via Chrome DevTools MCP", debugging authentication, feature flags, or persisted state, diagnosing stale tokens or unexpected state after a flow.

```sh
skills add -g catesandrew/skills --skill skills/chrome-dump-storage
```

```sh
npm install @catesworks/skill-chrome-dump-storage
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Values are never printed for keys matching `token`, `secret`, `password`, `passwd`, `auth`, `credential`, or `api-key` — this is a hardcoded security invariant of the skill, not optional behavior.
- Cookie *values* are never shown under any circumstances — only cookie names.
- The `REDACT_KEYS` pattern should be extended per-app; it doesn't know your app's custom sensitive-key naming conventions out of the box.
- Storage is origin-scoped — if the target app renders inside an iframe on a different origin, its storage is unreadable from the parent frame.
- `sessionStorage` is tab-scoped — opening the same URL in a new tab yields an empty sessionStorage even though it's "the same page."
- Long values are truncated to 200 characters; many apps store JSON-stringified objects, so truncated output may need to be parsed/re-fetched to inspect nested structure.

## Related Skills

- [chrome-audit-network](/docs/skills/chrome-audit-network) — complements storage inspection when debugging auth flows that also involve API calls.
- [chrome-inspect-a11y](/docs/skills/chrome-inspect-a11y) — another live-page-state inspection skill in the same Chrome DevTools MCP family.

---

_Sourced from: skills/chrome-dump-storage/SKILL.md, skills/chrome-dump-storage/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
