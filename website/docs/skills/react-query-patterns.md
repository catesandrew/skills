---
title: React Query Patterns
description: Guides writing correct, performant TanStack React Query v5 code, covering query key design, mutation and cache invalidation patterns, render optimizations, TypeScript type safety, and treating server state as cache.
---

# react-query-patterns

## Why It Exists

This skill was first added in dotfiles commit `541fabb4` ("chore: react query skill"), which introduced a 158-line `SKILL.md` plus three reference files — `query-keys.md`, `render-performance.md`, and `typescript.md` — in one shot. About four months later, dotfiles commit `54e5f48c` ("feat(skills): port 3 generic React/RQ skills from envmgr-ui, cross-link cluster") revisited it with a small, targeted 11-line addition: that commit's real purpose was porting three other skills (including `react-query-cache-determinism`) out of a client codebase called `envmgr-ui`, and while distilling them it went back and cross-linked this skill to point at the newly-ported ones, adding a "Related skills" section rather than changing this skill's own content. So this skill itself is an original, generic authoring effort — the envmgr-ui-origin story belongs to its sibling `react-query-cache-determinism`, not to this skill.

## What It Does

The skill establishes a mental model — "server state is not client state" — warning against copying `useQuery` data into `useState` (which loses background sync), with an explicit, narrow exception for form initial values using `staleTime: Infinity`. From there it lays out eight numbered rules with before/after code. Query keys must contain every variable the `queryFn` reads, since React Query refetches declaratively when the key changes (never imperative `refetch(params)`); keys should be structured generic-to-specific (`['todos', 'list', {filters}]` vs `['todos', 'detail', id]`) to enable fuzzy invalidation at any level. Query key factories built with `queryOptions` (v5) should colocate keys with query functions for type-safe keys, a `DataTag` for typed `getQueryData`, and reuse across `useQuery`/`prefetchQuery`/`useSuspenseQuery`.

For render performance, it prescribes `select` for data transformations so components only re-render on the selected slice changing, and recommends tuning `staleTime` per-query or globally instead of disabling `refetchOnWindowFocus`/`refetchOnMount`. It requires wrapping every query in a custom hook to colocate key/queryFn/options and keep fetch logic out of components. On mutations, it favors `invalidateQueries` over direct `setQueryData` after a write (since direct updates are fragile against sorted/filtered lists) and draws a hard line between `useMutation` callbacks (logic — cache invalidation, always fires) and `mutate()`-call-site callbacks (UI — redirects/toasts, skipped if the component unmounts). Three linked reference docs go deeper: `query-keys.md` for key factories, invalidation strategy, and `mutate` vs `mutateAsync`; `render-performance.md` for `select`, structural sharing, tracked queries, and `notifyOnChangeProps`; and `typescript.md` for `queryOptions`, inference, and zod-based validation.

## How To Use It

Triggers on: writing or reviewing React Query code, "query key design", "mutations and cache invalidation", "render optimizations" (`select`, structural sharing, tracked queries), "TypeScript type safety" (`queryOptions`, zod validation), "data transformations", "staleTime tuning", or the mental model of treating server state as cache.

```sh
skills add -g catesandrew/skills --skill skills/react-query-patterns
```

```sh
npm install @catesworks/skill-react-query-patterns
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Never copy `useQuery` data into `useState` — the one sanctioned exception is form initial values, and only with `staleTime: Infinity`.
- Every variable the `queryFn` reads must be part of the query key; drive refetches by changing the key, not by calling `refetch(params)`.
- Structure query keys generic-to-specific so `invalidateQueries` can target broad or narrow scopes as needed.
- Colocate query keys and query functions via `queryOptions` key factories — never define them separately.
- Prefer tuning `staleTime` over disabling `refetchOnWindowFocus`/`refetchOnMount`.
- Every query must live in a custom hook; no raw fetch logic inline in components.
- Prefer `invalidateQueries` over `setQueryData` after mutations, since direct cache writes are fragile against sorted/filtered lists.
- Keep cache-affecting logic in `useMutation` callbacks (always fires) and keep UI side effects (navigation, toasts) in `mutate()`-call-site callbacks (skipped on unmount) — don't mix the two.

## Related Skills

- [react-query-cache-determinism](/docs/skills/react-query-cache-determinism) — deterministic cache **updates** for CRUD mutations (cancel-in-flight, deep-merge vs replace, optimistic status, invalidate-only-on-error); go here when a mutation flickers or list/detail views disagree.
- [nextjs-react-query-cache-coordination](/docs/skills/nextjs-react-query-cache-coordination) — for when these caches cross the Next.js App Router boundary (Router Cache vs Data Cache, `updateTag` vs `revalidateTag`, hydration races).

---

_Sourced from: skills/react-query-patterns/SKILL.md, skills/react-query-patterns/metadata.json, ~/.dotfiles git history (commits `541fabb4`, `54e5f48c`)_
