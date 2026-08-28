---
name: zod-repair
description: Use when the user wants staged Zod schemas refactored safely, wants regression tests for init cycles, map/record behavior, union drift, or parse breakage, or wants schema cleanup without changing public contracts.
---

# Zod Repair Skill

Refactor staged Zod schemas conservatively and add focused tests that prove the refactor did not introduce circular-import regressions, map/record regressions, union drift, or basic parse breakage.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:packageDir}` | Package root to operate in | `packages/api` |
| `${input:schemaDir}` | Directory containing Zod schema files | `src/zod` |
| `${input:testDir}` | Directory for Zod regression tests | `src/__tests__/zod` |

## When to Use

Use this skill when:
- The user wants staged Zod schemas refactored safely
- The task calls for regression tests around schema initialization and parsing
- The user wants map, record, union, or lazy-schema cleanup without changing public API contracts

## Expected Workspace Shape

- Package root at `${input:packageDir}` (e.g. `packages/api`)
- Schemas under `${input:schemaDir}` (e.g. `src/zod/**`)
- Tests under `${input:testDir}` (e.g. `src/__tests__/zod/**`)

Prefer the staged diff to choose targets. If the diff is unclear, inspect `${input:schemaDir}`.

## Workflow

1. Inspect target schema files from the staged diff or `${input:schemaDir}`.
2. Refactor schema code conservatively following the rules below.
3. Add or refresh targeted tests in `${input:testDir}` for each changed schema file.
4. Add one package-level smoke test that imports all schema modules and fails on import-time throw.
5. Run targeted tests and report results with changed files, commands, and remaining risks.

## Refactor Rules

- Remove unnecessary `z.lazy` wrappers when recursion is not real.
- Keep `z.lazy` only for true recursive references.
- Convert `z.object({}).catchall(valueSchema)` to `z.record(valueSchema)` when the schema is semantically a key-to-value map.
- Preserve exported schema names and public API compatibility.
- Preserve endpoint shape contracts unless the user explicitly asks to change them.
- Avoid barrel-import cycles inside Zod modules; prefer direct imports.
- If a cycle exists, extract shared leaf schemas into separate files and import those directly.
- Keep existing `ToZod` casts when required by generated code, but call out the risk when they can hide type mismatches.

## Test Requirements Per Changed Schema File

Create or replace `${input:testDir}/<schemaBaseName>.test.ts` for each changed file.

Include:
- `imports + smoke` — the schema imports without error and is defined
- `type alignment` — `expectTypeOf<z.output<typeof schema>>()`; add a note comment when the schema uses `as unknown as ToZod<...>`
- `golden path parse` with a minimal valid payload
- `required fields missing fails` when the schema has required fields
- For `z.record` or map schemas: one valid one-key parse and one invalid value-type parse
- For union schemas: one valid parse per branch and one invalid parse that matches no branch

## Global Circular and Init Smoke Test

Add one package-level smoke test under `${input:testDir}` that imports all schema modules in `${input:schemaDir}` (directly or through an index) and asserts that import-time evaluation does not throw.

This test catches circular-import and initialization regressions at the package level.

## Golden Path Fallback Policy

- First try a real minimal sample payload.
- If the schema is too complex for a compact fixture, fall back to `schema.partial().parse({})`.
- Use the fallback only when needed and add a short comment explaining why.

## Client or Proxy Test Adjustments

If schema changes affect existing client or proxy tests:
- Pass required path params that the schema now enforces.
- Expect merged headers, including `Content-Type` where applicable.

## Output Contract

Return:
- changed files
- for each file: what changed and why
- commands run and whether each passed or failed
- remaining risks
- exact reasons for any tests not run

## Quality Bar

- Favor reversible refactors over large rewrites.
- Preserve public contracts unless explicitly directed otherwise.
- Add the smallest test set that proves init safety, parse behavior, and type alignment.

## Common Mistakes

- **Removing `z.lazy` from a truly recursive schema** — check that no schema in the import chain references itself before removing `lazy`; false removal causes runtime init errors.
- **Using `z.record()` when key shape matters** — `z.record` accepts any string key; if the API only accepts specific keys, keep `z.object` or add `z.record(z.enum([...]))`.
- **Breaking the smoke test by adding a new schema file without importing it** — always update the import in the package-level smoke test when adding a schema module.
- **Forgetting to update `ToZod` casts after shape changes** — casts using `as unknown as ToZod<T>` silently drift; note every cast in the output so the caller can verify alignment.
- **Hardcoding paths instead of using input variables** — if adapting this skill to a new workspace, update `${input:packageDir}`, `${input:schemaDir}`, and `${input:testDir}` rather than editing paths inline.
