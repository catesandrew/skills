---
title: Tsdoc
description: Adds inline TSDoc to staged TypeScript code with deeper documentation for exported APIs, concise comments for non-trivial internal helpers, and no intended runtime behavior changes.
---

# tsdoc

## Why It Exists

This skill has a clear two-step lineage. It was first added in dotfiles commit `d7b9529f` ("chore: add tsdoc skill") as a standalone Codex skill at `home/.codex/skills/tsdoc/SKILL.md` — 89 lines, with its own `agents/openai.yaml`, meaning it originated as an OpenAI Codex CLI skill rather than a Claude Code one. It was carried into the shared `agent-skills/skills/tsdoc` location by `d13234c8` ("chore: add ado, tsdoc, cm skills"), landing at the identical 89 lines that match the current public repo's `skills/tsdoc/SKILL.md` line-for-line — so the content itself was untouched across the move, only the path and cross-agent packaging changed.

## What It Does

Given a staged TypeScript diff, the skill identifies the affected files and reads the surrounding code — call sites, invariants, symbol intent — before writing anything, then inserts TSDoc blocks directly above declarations at two distinct depths. Exported functions, types, interfaces, and consts get the full treatment: purpose, parameter semantics and constraints, options-object field defaults, optional-parameter fallback behavior, union-variant behavior, return shape and invariants, error/failure paths, and at least one `@example`. Internal helpers get only a short purpose line, key parameters, and any non-obvious behavior — and trivial, non-reused helpers are skipped entirely rather than padded with boilerplate comments.

It uses the standard TSDoc tag set (`@param`, `@returns`, `@throws`, `@deprecated`, `@defaultValue`, `@remarks`, `@example`, `@see`) and prefers `{@link TypeName}` cross-references over prose restatement of a symbol's name. The skill edits files in place — it does not produce standalone prose documentation unless explicitly asked to — and is explicit that it must not change runtime behavior, only add comments.

## How To Use It

Triggers on: "document staged TypeScript code", "TSDoc added inline to existing files", "different documentation depth for exported vs internal APIs", "expert-level API docs without runtime changes".

```sh
skills add -g catesandrew/skills --skill skills/tsdoc
```

```sh
npm install @catesworks/skill-tsdoc
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Do not change runtime behavior — only insert or edit TSDoc comments.
- Keep exported API docs thorough; keep internal helper docs concise. Skip trivial, non-reused helpers entirely.
- Document behavior visible at the API boundary, not implementation trivia — don't restate obvious code.
- Call out failure modes and invariants when they matter to callers; inspect adjacent call sites first if behavior is unclear from the code alone.
- Use `{@link TypeName}` / `{@link Module.Member}` when referencing other symbols rather than plain-text names.
- ASCII only — no Unicode punctuation or bullets.
- Preserve existing formatting conventions in the file being documented.

## Related Skills

- [swagger](/docs/skills/swagger) — layers this same TSDoc engine onto Next.js route handlers in its `combined` mode.
- [typescript-type-safety](/docs/skills/typescript-type-safety) — a related TypeScript-authoring skill covering the type-level patterns this skill's documentation often needs to describe accurately.

---

_Sourced from: skills/tsdoc/SKILL.md, skills/tsdoc/metadata.json, ~/.dotfiles git history (commits `d7b9529f`, `d13234c8`)_
