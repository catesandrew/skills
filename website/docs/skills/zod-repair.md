---
title: Zod Repair
description: Refactors staged Zod schemas conservatively while preserving public contracts, and adds regression tests covering initialization cycles, map/record behavior, union drift, and parse breakage.
---

# zod-repair

## Why It Exists

This skill traces to a clear two-step lineage, distinct from the pre-supplied candidate commit (`9dfa72e8` does not touch it). It was first added in dotfiles commit `171baaea` ("chore add zod schema skill") as a standalone Codex skill at `home/.codex/skills/zod-repair/SKILL.md` — 92 lines, with its own `agents/openai.yaml`. It was then carried into the shared `agent-skills/skills/zod-repair` location by `aa6eef69` ("chore: relocate skills"), which deleted the old `home/.codex/skills/zod-repair` path in the same commit and grew the file to 103 lines — matching the current public repo's `skills/zod-repair/SKILL.md` exactly. Neither commit message offers design rationale beyond the mechanical add-then-relocate; there's no deeper narrative to draw on here.

## What It Does

The skill operates on a staged diff of Zod schema files (defaulting to `${input:schemaDir}`, e.g. `src/zod/**`, under a package root `${input:packageDir}`) and applies a specific, conservative set of refactor rules rather than a general rewrite: remove `z.lazy` wrappers only where recursion isn't actually real (keeping them for true recursive references), convert `z.object({}).catchall(valueSchema)` to `z.record(valueSchema)` when the schema is semantically a key-to-value map, avoid barrel-import cycles inside Zod modules by extracting shared leaf schemas into their own files when a cycle exists, and preserve exported schema names and public API contracts unless the user explicitly asks to change them.

For every changed schema file, it creates or replaces a matching test file under `${input:testDir}` covering: an import/smoke check, a `z.output<typeof schema>` type-alignment assertion (with a note when `ToZod` casts are involved), a golden-path parse against a minimal valid payload, a required-fields-missing failure case, and — for `z.record`/map or union schemas specifically — one valid parse per key/branch plus one invalid parse that matches none. It also adds a single package-level smoke test that imports every schema module in `${input:schemaDir}` to catch circular-import and initialization regressions at the package level, and falls back to `schema.partial().parse({})` for the golden-path fixture only when a schema is too complex for a compact hand-written payload — with a comment explaining why. The final output is a structured report: changed files, what changed and why per file, commands run and pass/fail, and remaining risks.

## How To Use It

Triggers on: "staged Zod schemas refactored safely", "regression tests for init cycles, map/record behavior, union drift, or parse breakage", "schema cleanup without changing public contracts".

```sh
skills add -g catesandrew/skills --skill skills/zod-repair
```

```sh
npm install @catesworks/skill-zod-repair
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Only remove `z.lazy` after confirming no schema in the import chain is truly self-referential — false removal causes runtime init errors.
- Only convert to `z.record()` when key shape genuinely doesn't matter; if the API only accepts specific keys, keep `z.object` or use `z.record(z.enum([...]))`.
- Preserve exported schema names and endpoint shape contracts unless explicitly told to change them.
- Every new schema file added to `${input:schemaDir}` must also be added to the package-level circular/init smoke test import list, or that regression class goes uncaught.
- Note every `ToZod` cast (`as unknown as ToZod<T>`) in the output — they can silently drift from the underlying schema and need caller-side verification.
- Use the `schema.partial().parse({})` golden-path fallback only when a real minimal fixture isn't practical, and always comment why.
- Client/proxy tests touched by a schema change need required path params passed and merged headers (including `Content-Type`) expected.
- Favor reversible refactors over large rewrites; add the smallest test set that proves init safety, parse behavior, and type alignment.

## Related Skills

- [typescript-type-safety](/docs/skills/typescript-type-safety) — the type-containment and safety patterns this skill's `z.output<typeof schema>` alignment checks and `ToZod` cast warnings draw on.
- [swagger](/docs/skills/swagger) — often documents the same route handlers whose request/response validation these Zod schemas back.

---

_Sourced from: skills/zod-repair/SKILL.md, skills/zod-repair/metadata.json, ~/.dotfiles git history (commits `171baaea`, `aa6eef69`)_
