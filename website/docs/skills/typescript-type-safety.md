---
title: Typescript Type Safety
description: Guides writing safer TypeScript using compiler flags and type patterns, covering optional versus required-but-undefined semantics, safe index access, exhaustive union matching, containing any, as const, and Array<T> versus T[].
---

# typescript-type-safety

## Why It Exists

This skill was added in dotfiles commit `b8b107b2` ("chore: add more tsx skills"), which landed it alongside `react-component-patterns` in a single 524-line, 0%-AI-attributed commit — `SKILL.md` at exactly 149 lines and `references/patterns.md` at 245 lines, both matching the current public repo's files line-for-line. The commit message itself is terse and gives no design narrative beyond grouping it with sibling TSX-adjacent skills; there's no further history to draw on.

## What It Does

The skill is organized as a set of six numbered rules, each pairing a compiler flag or type pattern with a concrete before/after code example. It opens with three compiler flags to enable (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`) and then works through: distinguishing optional (`?`) from required-but-possibly-`undefined` (`T | undefined`) parameters — the latter forces callers to explicitly acknowledge a value at every call site, which catches forgotten call sites during refactors; safe index access via `noUncheckedIndexedAccess` or a `SafeRecord<K, V | undefined>` alias, plus a `NonEmptyArray<T>` tuple type with a type-guard for arrays that must have a first element; exhaustive matching on discriminated unions using a `switch` with no `default` so the compiler flags missing cases, paired with a runtime `never`-typed fallback component for API responses that may include unknown variants; containment strategies for `any` (prefer `unknown`, minimize scope, explicit return types, avoid libraries with weak types like `lodash.get`); `as const` over type assertions for extracting literal unions from const arrays/objects, plus making function parameters `ReadonlyArray<T>` so they accept both mutable and `as const` inputs; and `Array<T>` over `T[]` to avoid `T[]`'s operator-precedence bugs with unions and `keyof` (e.g. `string | number[]` parses as `string | (number[])`, not `(string | number)[]`).

A linked `references/patterns.md` carries the full code examples and playground links for anyone who wants deeper detail than the SKILL.md's inline snippets.

## How To Use It

Triggers on: "writing or reviewing TypeScript code", "index signatures", "Record types", "exhaustive switch statements", "discriminated unions", "const assertions", "any containment", "optional vs undefined semantics", "array type syntax choices".

```sh
skills add -g catesandrew/skills --skill skills/typescript-type-safety
```

```sh
npm install @catesworks/skill-typescript-type-safety
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Use `T | undefined` (not `?`) when callers must always explicitly pass the argument — this is what catches stale call sites after a refactor.
- Enable `exactOptionalPropertyTypes` — without it, spreading `{ ...user, ...{ id: undefined } }` silently overwrites `id` via `Partial<T>`.
- Never use a plain `default:` branch on a discriminated-union `switch` — it silently swallows new variants; use no default for compile-time exhaustiveness, plus a `never`-typed fallback for runtime resilience against unknown API variants.
- Contain `any` at its smallest possible scope — it is bidirectionally assignable and spreads through every operation, including object spreads, and disables all prop type-checking if spread onto JSX props.
- Use `as const`, never `as SomeType`, to extract literal types — type assertions can lie to the compiler; `as const` cannot.
- Prefer `Array<T>` / `ReadonlyArray<T>` over `T[]` / `readonly T[]` — the bracket syntax has real operator-precedence bugs with unions and `keyof` that require extra parentheses to avoid.

## Related Skills

- [zod-repair](/docs/skills/zod-repair) — a related TypeScript-safety skill focused specifically on Zod schema refactors and the `z.output<typeof schema>` type-alignment checks that these same containment principles inform.
- [zustand-patterns](/docs/skills/zustand-patterns) — applies these type-safety patterns (module augmentation, avoiding `any`) to Zustand store design.
- [tsdoc](/docs/skills/tsdoc) — documents the exported APIs whose type contracts this skill helps make safe.

---

_Sourced from: skills/typescript-type-safety/SKILL.md, skills/typescript-type-safety/metadata.json, ~/.dotfiles git history (commit `b8b107b2`)_
