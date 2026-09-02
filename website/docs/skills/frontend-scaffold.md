---
title: Frontend Scaffold
description: Generates or wires frontend plumbing — feature flags, environment variables, API endpoint clients, or logging — into an existing project by detecting and matching its existing conventions first.
---

# frontend-scaffold

## Why It Exists

Introduced alongside `frontend-quality-loop` in commit `29619062` ("feat(skills): add frontend quality workflows", 2026-06-15). The commit message frames both skills as one deliberate split: "make frontend review and plumbing tasks portable across Claude, Codex, and Gemini while keeping grading separate from generation." This skill is the generation half — it exists specifically so that scaffolding work (flags, env vars, API clients, logging) doesn't get bundled into, or graded by, the same pass that reviews code quality.

## What It Does

Before generating anything, the skill runs a mandatory detection step: grep for existing flag usage (LaunchDarkly, `unleash`, a local `flags.ts`, env-based gates), read `.env.example`/`.env.*` and the framework's env convention (`NEXT_PUBLIC_*`, Vite `VITE_*`, Angular `environment.ts`), find the existing data layer (fetch wrapper, axios instance, react-query hooks, generated OpenAPI client), and find the current logger (sawdust, pino, winston, console wrapper). It states what it found in one line before generating, or proposes a minimal idiomatic pattern if none exists.

It then handles four task types selected via `${input:task}`: **feature-flag** (register a flag using the existing accessor, default off unless specified, de-gate rather than delete when removing), **env-var** (add to `.env.example` with a placeholder, wire into a typed-env schema if one exists, respect the `NEXT_PUBLIC_`/`VITE_` public/private boundary, never commit a real secret), **api-endpoint** (generate a typed client function/hook matching the project's existing fetch/axios instance, error handling, and auth/tenant headers — including a react-query hook with a stable query key if that pattern is in use), and **logging** (wire the existing logger, matching level and structured-field conventions, redacting secrets/PII, never introducing a second logging library).

Output is a fixed three-part report: conventions found, changes made (with file:line), and a reminder to run `frontend-quality-loop` on the new code plus any manual follow-up (setting a real secret in the vault, enabling the flag, regenerating OpenAPI types).

## How To Use It

Triggers on: generating or wiring frontend plumbing — feature flags, environment variables, API endpoint clients, or logging setup — into an existing project, following the project's detected conventions rather than judging code quality.

```sh
skills add -g catesandrew/skills --skill skills/frontend-scaffold
```

```sh
npm install @catesworks/skill-frontend-scaffold
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Never generate blind — detect the project's existing pattern for flags/env/API/logging before writing anything.
- Never commit a real secret — env scaffolding adds placeholders only; the real value lives in a vault/CI secret.
- Never cross the public/private env boundary — exposing a server secret via `NEXT_PUBLIC_`/`VITE_` leaks it to the client bundle.
- Never introduce a second logging or flag library when one already exists — reuse it.
- `${input:remove}=true` de-gates a feature flag (keeps the enabled-path code) rather than deleting the feature, unless explicitly asked to delete.
- This skill generates; it does not grade — quality assessment is out of scope and belongs to `frontend-quality-loop`.

## Related Skills

- [frontend-quality-loop](/docs/skills/frontend-quality-loop) — run after scaffolding to grade the newly generated code; the two skills are a deliberate generate/grade pair.

---

_Sourced from: skills/frontend-scaffold/SKILL.md, skills/frontend-scaffold/metadata.json, ~/.dotfiles git history (commit `29619062`)_
