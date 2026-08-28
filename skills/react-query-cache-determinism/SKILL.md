---
name: react-query-cache-determinism
description: Deterministic React Query cache updates for CRUD mutations — cancel-in-flight, update all related caches, correct merge semantics (deep-merge for patch, replace for create), optimistic status for async jobs, rollback on error, and invalidate-only-on-error. Use when a mutation causes UI flicker, when list and detail views disagree after a write, when a patch response corrupts nested data, or when an async delete/job needs instant feedback. Trigger on "UI flicker", "stale after mutation", "optimistic update", "deep merge cache", "setQueryData", "cancelQueries", or "cache rollback".
---

# React Query Cache Determinism

## Overview

Patterns for updating React Query caches on mutation so the UI is immediate,
consistent across views, and correct — instead of "invalidate and hope the
refetch stabilizes." They solve four recurring failures:

1. **Flicker/regression** — UI updates, an in-flight refetch lands, UI reverts,
   then updates again. Cause: a racing query overwrites your mutation.
2. **Views disagree** — list, detail, and drilldown read different query keys;
   only some were updated.
3. **Patch corruption** — shallow-merging a partial backend response drops nested
   data or writes an array where an object was expected.
4. **No feedback on async jobs** — delete/deploy return "job started", the UI
   waits for final state, the user sees nothing happen.

## Core principle: make cache updates deterministic

Every mutation hook follows the same discipline:

1. **Cancel in-flight queries** (`cancelQueries` in `onMutate`) so no fetch lands
   after your write.
2. **Update ALL related caches** — if an entity appears in `['record', id]`,
   `['records']` (list), and `['recordsByGroup']` (map), patch all three.
3. **Use correct merge semantics** — deep-merge for patch, replace for create.
4. **Minimize invalidation** — only on error or missing data, never on a
   successful write that already produced the correct cache.
5. **Add optimistic signals** for async jobs (`DELETING`, `RUNNING`) and let the
   backend remain source of truth.

Keep a small map of "which caches hold this entity" and touch all of them in
every mutation — the single most common bug is updating one and forgetting the
others.

## Pattern 1 — Patch (deep merge)

Backend returns a **partial** object that should merge into existing data.

```tsx
onMutate: async (vars) => {
  await queryClient.cancelQueries({ queryKey: ['record', vars.id] })
  await queryClient.cancelQueries({ queryKey: ['records'] })
  return {
    prev: {
      detail: queryClient.getQueryData(['record', vars.id]),
      list: queryClient.getQueryData(['records']),
    },
  }
},
onSuccess: (data, vars) => {
  if (!data) return // fall through to invalidation below
  queryClient.setQueryData(['record', vars.id], (old) => (old ? mergeDeep(old, data) : data))
  queryClient.setQueryData(['records'], (old) =>
    old?.map((r) => (r.id === vars.id ? mergeDeep(r, data) : r)),
  )
},
onError: (_e, vars, ctx) => {
  queryClient.setQueryData(['record', vars.id], ctx?.prev.detail)
  queryClient.setQueryData(['records'], ctx?.prev.list)
},
onSettled: (data, _e, vars) => {
  if (!data) queryClient.invalidateQueries({ queryKey: ['record', vars.id] }) // only if server gave nothing
},
```

`mergeDeep` preserves nested fields the patch omitted; guard against
null/undefined even if types say it can't happen.

## Pattern 2 — Create (replace, never merge)

Backend returns a **complete** new object. Merging it into a stale cache entry
produces Frankenstein state.

```tsx
// ❌ mergeDeep(old, data)  — mixes a new entity with unrelated cached data
queryClient.setQueryData(['record', id], data) // ✅ replace
queryClient.setQueryData(['records'], (old) => {
  const exists = old?.some((r) => r.id === id)
  return exists ? old!.map((r) => (r.id === id ? data : r)) : [...(old ?? []), data]
})
```

## Pattern 3 — Delete / async job (optimistic status, don't remove)

The backend returns job metadata, not final state. Signal "in progress"
immediately, but **do not remove the row** — the job may fail, and the backend
decides when it's actually gone.

```tsx
onMutate: async (vars) => {
  await queryClient.cancelQueries({ queryKey: ['record', vars.id] })
  const prev = queryClient.getQueryData(['record', vars.id])
  const optimistic = { status: 'DELETING', action: 'DELETE' }
  queryClient.setQueryData(['record', vars.id], (old) => (old ? mergeDeep(old, optimistic) : old))
  return { prev }
},
onError: (_e, vars, ctx) => queryClient.setQueryData(['record', vars.id], ctx?.prev),
// no onSuccess removal — a background refetch removes it once the backend confirms
```

Removing on success is the trap: if the job fails the entity still exists, and
you've already deleted it from the UI.

## Pattern 4 — Selective optimistic (partial targets)

When a job affects only some children (deploy 2 of 10 services, archive 3 of 20
rows), mark **only** the targeted ids — not the whole parent — so the UI shows
exactly what's in flight.

```tsx
const patch = { status: 'RUNNING', children: Object.fromEntries(targetIds.map((id) => [id, { status: 'RUNNING' }])) }
queryClient.setQueryData(['record', parentId], (old) => (old ? mergeDeep(old, patch) : old))
```

## The deep-merge utility

Two options carry all the weight. Get them wrong and you lose data.

```ts
interface MergeDeepOptions {
  allowUndefinedOverrides?: boolean // default FALSE
  mergeArrays?: boolean             // default FALSE
}
```

- **`allowUndefinedOverrides: false`** — a patch response often has `undefined`
  for fields it didn't touch. Letting `undefined` win wipes real data:
  `mergeDeep({ image: 'v1' }, { image: undefined })` must stay `{ image: 'v1' }`.
- **`mergeArrays: false`** — arrays represent complete state, not additive data.
  `mergeDeep({ tags: ['a','b'] }, { tags: ['c'] })` must be `['c']`, not
  `['a','b','c']`. Concatenation is almost never what a patch means.

## Invalidation strategy

The progression every team lands on:

- ~~Invalidate everything in `onSettled`~~ → excessive refetch, flicker, races.
- **Invalidate only on error, or when the server returned no data.** A successful
  write already produced the correct cache — re-fetching just causes flicker.

| Outcome | Action |
|---------|--------|
| success **with** data | patch caches, **no** invalidation |
| success **without** data | invalidate the affected key(s) to refetch |
| error | roll back, then invalidate to recover authoritative state |

## Testing

Each mutation hook should cover: all related caches patched on success; correct
merge semantics (deep vs replace); optimistic values present for async ops;
full rollback on error with no partial writes; invalidation only when expected;
edge cases (null response, empty cache, partial targets).

```tsx
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
queryClient.setQueryData(['record', 'r1'], oldRecord)
queryClient.setQueryData(['records'], [oldRecord])
// render hook with a QueryClientProvider wrapper, mutate, await isSuccess,
// then assert every related cache entry matches the expected merged shape.
```

## Common pitfalls

- ❌ **Shallow-merge a patch** (`{ ...old, ...patch }`) — drops nested fields.
  Use `mergeDeep`.
- ❌ **Skip `cancelQueries`** — an in-flight fetch lands after `setQueryData` and
  overwrites your update.
- ❌ **Update one cache** — list and detail then disagree. Touch all related keys.
- ❌ **Invalidate on success** — redundant refetch + flicker.
- ❌ **Merge on create** — Frankenstein state from mixing entities. Replace.
- ❌ **Remove on delete-started** — the job may fail. Set optimistic status;
  let the backend/refetch confirm removal.

## Debugging checklist

- [ ] DevTools: are **all** related caches updating?
- [ ] Is `cancelQueries` running in `onMutate`?
- [ ] `mergeDeep` (not shallow) for patches?
- [ ] Any invalidation firing on success (causing extra fetch)?
- [ ] Does rollback trigger on error with previous state intact?
- [ ] Async op: is the optimistic status set immediately?
- [ ] Any in-flight query landing after the mutation?

## Golden rules

Cancel before mutating · update every related cache · deep-merge patches,
replace creates · optimistic signal for async, never premature removal ·
invalidate only on error · trust the backend as source of truth.

## Related skills

- `react-query-patterns` — general TanStack Query v5 correctness (keys, `select`, `queryOptions`).
- `nextjs-react-query-cache-coordination` — when these caches also cross the
  Next.js App Router boundary (Router Cache, `updateTag`, hydration races).
