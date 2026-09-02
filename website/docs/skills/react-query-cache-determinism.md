---
title: React Query Cache Determinism
description: Provides patterns for deterministic React Query cache updates on CRUD mutations, covering cancel-in-flight, updating all related caches, correct merge semantics, optimistic status for async jobs, error rollback, and invalidate-only-on-error.
---

# react-query-cache-determinism

## Why It Exists

This skill was created whole in dotfiles commit `54e5f48c` ("feat(skills): port 3 generic React/RQ skills from envmgr-ui, cross-link cluster"), and its provenance is unusually well-documented for this catalog. The commit message explains that it, along with `excel-like-table-navigation` and `nextjs-react-query-cache-coordination`, was distilled down from a real, repo-specific skill that had drifted toward client-engagement context (the message names `@ad-infrastructure`, `Tron`, and `podzilla` as the internal identifiers that were stripped) in an internal codebase called `envmgr-ui`. The commit reduced the original to roughly 200 lines, replaced the domain-specific example with a neutral "record / list+detail" example, and explicitly reconciled it against nine other overlapping skills that were judged to already be sufficiently generic. In short: this is not a skill invented in the abstract — it's a real CRUD-cache-bug pattern the author had already hardened against a production client codebase, generalized for public reuse. The same commit also cross-linked it into `react-query-patterns` and added a "React, tables & state" section to the dotfiles skills README, since the author judged that family of skills had previously been undocumented as a cluster.

## What It Does

The skill targets four recurring React Query mutation failures: UI flicker (a racing in-flight refetch overwrites a mutation's optimistic update), views disagreeing (list, detail, and grouped-map query keys hold the same entity but only some get updated), patch corruption (shallow-merging a partial backend response drops nested fields or overwrites structured data with the wrong shape), and silent async jobs (a delete/deploy endpoint returns "job started" with no immediate UI feedback). Its core discipline, applied to every mutation hook, is: cancel in-flight queries in `onMutate` before writing; update every query key that holds the affected entity, not just one; use deep-merge for partial ("patch") responses and full replacement for "create" responses; add an optimistic status signal (e.g. `DELETING`, `RUNNING`) for async jobs without removing the row, since the backend is the actual source of truth; and invalidate only on error or when the server returned no data — never on a successful write that already produced the correct cache.

It codifies four named mutation patterns with concrete `onMutate`/`onSuccess`/`onError`/`onSettled` code: Patch (deep merge across `['record', id]` and `['records']`), Create (replace, explicitly never merge, to avoid "Frankenstein state"), Delete/async job (set an optimistic status like `DELETING` and let a background refetch confirm actual removal — removing on success is called out as "the trap," since a failed job would leave a phantom-deleted UI), and Selective optimistic (mark only the specifically targeted child ids in flight, not the whole parent, for partial batch operations like "deploy 2 of 10 services"). It also specifies a `mergeDeep` utility contract with two options that default to `false` — `allowUndefinedOverrides` (an `undefined` field in a patch must never overwrite real cached data) and `mergeArrays` (arrays are treated as complete replacement state, not additive data) — plus a testing checklist and a compact "golden rules" summary.

## How To Use It

Triggers on: a mutation causing UI flicker, list and detail views disagreeing after a write, a patch response corrupting nested data, an async delete/job needing instant feedback, "UI flicker", "stale after mutation", "optimistic update", "deep merge cache", "setQueryData", "cancelQueries", or "cache rollback".

```sh
skills add -g catesandrew/skills --skill skills/react-query-cache-determinism
```

```sh
npm install @catesworks/skill-react-query-cache-determinism
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Always call `cancelQueries` in `onMutate` before writing to the cache — an in-flight fetch that lands afterward silently overwrites the mutation's update.
- Update every query key that holds the entity (detail, list, grouped map, etc.) — updating only one is called out as "the single most common bug."
- Use deep-merge for patch (partial) responses and full replacement for create responses — merging a "complete new object" into stale cached data produces Frankenstein state.
- `mergeDeep`'s `allowUndefinedOverrides` must default to `false` — an `undefined` field in a patch response must never wipe a real cached value.
- `mergeDeep`'s `mergeArrays` must default to `false` — arrays represent complete state, and concatenating is almost never the correct patch semantic.
- Never remove a row on a delete/async-job mutation's success — set an optimistic status (`DELETING`, `RUNNING`) instead, and let the backend/refetch confirm actual removal, since the job may still fail.
- Invalidate only on error, or when the server response contained no data — never after a successful write that already produced the correct cache (that's redundant refetch + flicker).
- Selective/partial optimistic updates must mark only the specifically targeted ids, not the entire parent entity.

## Related Skills

- [react-query-patterns](/docs/skills/react-query-patterns) — general TanStack Query v5 correctness (keys, `select`, `queryOptions`) that this skill builds cache-update discipline on top of.

---

_Sourced from: skills/react-query-cache-determinism/SKILL.md, skills/react-query-cache-determinism/metadata.json, ~/.dotfiles git history (commit `54e5f48c`)_
