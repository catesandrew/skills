---
name: nextjs-react-query-cache-coordination
description: Coordinate Next.js App Router caching layers with React Query to guarantee read-your-own-writes — covers Router Cache vs Data Cache, updateTag vs revalidateTag, hydration timestamp races, initialData vs placeholderData pitfalls, and monotonic cache timestamps. Use when a user saves data that then reverts on navigation, when a mutation's result doesn't survive a route change, or when debugging stale UI after a successful write. Trigger on "saved but reverted", "read your own writes", "stale after mutation", "revalidateTag", "updateTag", "HydrationBoundary", or "initialData stale".
---

# Next.js + React Query Cache Coordination

## Overview

Next.js App Router adds several caching layers that interact with React Query's
client cache. When any layer briefly serves stale state — or stamps stale state
with a fresh timestamp — you get **read-your-own-writes violations**: the user
saves, navigates, comes back, and sees the old value even though the backend has
the new one.

## The layers in play

1. **Next.js Router Cache** (client) — in-memory RSC payloads per route segment,
   reused on back/forward nav. Can serve stale RSC if not invalidated.
2. **Next.js Data Cache** (server) — `fetch()` responses tagged via
   `fetch(url, { next: { tags: ['record'] } })`, invalidated by tag.
3. **React Query cache** (client) — hydrated from the server via
   `<HydrationBoundary>`; merges by `dataUpdatedAt` timestamp.
4. **UI state** — form state (RHF) + memoized table rows can hold their own
   stale copy independent of all three caches.

A mutation is only correct once **every** layer that can serve the entity has
been coordinated.

## The most critical distinction: updateTag vs revalidateTag

| API | Available in | Semantics | Use for |
|-----|--------------|-----------|---------|
| `revalidateTag(tag)` | Route Handlers, Server Actions | SWR — may serve stale **once** while refreshing | background/non-critical refresh |
| `updateTag(tag)` | Server Actions only | immediate expiry | **post-mutation read-your-own-writes** |

For "save → must immediately see the new value," you need `updateTag` from a
**Server Action**. `revalidateTag`'s stale-once behavior is exactly the bug.

## Core lessons

1. **Client navigation still hits the network.** A `<Link>` click fetches the
   RSC payload (no document reload, but not "no network"). Assume navigation may
   re-hydrate from a server payload — design post-mutation correctness for it.

2. **Route Handler revalidation ≠ Router Cache invalidation.** Calling
   `revalidateTag` inside a `POST` route clears the *server* Data Cache but not
   the client Router Cache — the browser can still replay a stale RSC payload.
   Do tag invalidation from a **Server Action** (it also clears Router Cache), or
   pair the Route Handler with `router.refresh()` at the call site (current route
   only).

3. **Hydration is timestamp-driven.** React Query keeps whichever entry has the
   newer `dataUpdatedAt`. The deadly case: the server ships **stale data stamped
   as fresh**, overwriting a correct client cache. In DevTools, *old content +
   very recent `dataUpdatedAt`* = hydrated-stale. Fix server freshness first
   (`updateTag`), then harden client writes — monotonic client timestamps cannot
   protect you from the server lying about freshness.

4. **`initialData` is real cache data, not a placeholder.** With a non-zero
   `staleTime` it can become "fresh enough" to skip the refetch, locking in a
   stale seed. If you seed one query from another (detail from list), you **must**
   set `initialDataUpdatedAt` — or prefer `placeholderData`, which shows
   immediately and always refetches.

   ```tsx
   // ❌ locks in a possibly-stale seed
   useQuery({ queryKey: ['record', id], queryFn, initialData: fromList })
   // ✅ inherit the source timestamp
   useQuery({ queryKey: ['record', id], queryFn, initialData: fromList, initialDataUpdatedAt: listQuery.dataUpdatedAt })
   // ✅ best for correctness: placeholder always refetches
   useQuery({ queryKey: ['record', id], queryFn, placeholderData: fromList })
   ```

5. **When one mutation touches multiple caches, the write key is the MAX write
   time.** If you patch list + detail + summary with `Date.now()`, `now+1`,
   `now+2`, store `Math.max(...)` as "last write for this entity" — otherwise a
   later seed from the newest cache won't be recognized as post-write.

6. **Keep backend query keys shaped like the backend response.** Don't write
   client-only derived fields (e.g. a live-computed status) into `['record', id]`
   — a refetch wipes them and you can't tell derived from authoritative. Put
   derived data under its own key (`['record-status', id]`).

7. **Watch form/effect loops.** Never call `reset()` in an effect that depends on
   `watch()` output (reset → watch changes → effect → reset …). Read the value
   through a ref instead. And if form values are correct in logs but a table cell
   shows old data, the cell is reading a memoized `row.original` — read the
   controlled value (`getValues(...)`) instead.

8. **Prefetch to offset strict invalidation.** `updateTag` gives correctness but
   the next navigation truly misses the cache. Prefetch the likely next route
   (`list → detail`, `detail → list`) on mutation success, deduped through a ref
   so you don't prefetch every render.

## Coordinated mutation (the shape)

```tsx
export function useUpdateRecord() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data) => updateRecordAction(data), // Server Action → updateTag inside
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['record', vars.id] })
      const previous = {
        detail: queryClient.getQueryData(['record', vars.id]),
        list: queryClient.getQueryData(['records']),
      }
      return { previous }
    },
    onSuccess: (data, vars) => {
      const now = Date.now()
      queryClient.setQueryData(['record', vars.id], (old) => mergeDeep(old, { ...data, updatedAt: now }))
      queryClient.setQueryData(['records'], (old) =>
        old?.map((r) => (r.id === vars.id ? mergeDeep(r, { ...data, updatedAt: now + 1 }) : r)),
      )
      writeKey.set(vars.id, now + 1) // max across touched caches
      router.prefetch('/records')
    },
    onError: (_e, vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['record', vars.id], ctx.previous.detail)
        queryClient.setQueryData(['records'], ctx.previous.list)
      }
    },
  })
}
```

Centralize the server side so no call site forgets a tag:

```ts
'use server'
import { unstable_updateTag as updateTag } from 'next/cache'

export async function revalidateAndInvalidate({ tags }: { tags: string[] }) {
  for (const tag of tags) updateTag(tag) // Next Data Cache: immediate expiry
}
```

## Triage: "I saved but the UI reverted"

Answer in order:

1. **Network tab on the bad navigation** — no GET? → Router Cache / hydration /
   seeded cache. GET with correct response? → UI state (form / memoized row).
2. **DevTools `dataUpdatedAt`** — old data + recent timestamp → hydrated stale.
   old data + old timestamp → refetch not firing (check `staleTime`,
   `refetchOnMount`).
3. **Invalidation path** — Server Action with `updateTag`? `revalidateTag` will
   serve stale once.
4. **`initialData`** — present without `initialDataUpdatedAt`? seed may be stale.
5. **Cell renderer** — reading `row.original` (memoized) or the controlled value?

Quick confirmation mitigation: temporarily set `refetchOnMount: 'always'` to
prove the hydration branch, then fix the real layer.

## Checklists

**Every mutation affecting list/detail:**
- [ ] Invalidate via Server Action + `updateTag` (not `revalidateTag`)
- [ ] Centralize through one helper
- [ ] Patch RQ caches with monotonic `updatedAt`; write key = max touched
- [ ] Don't write derived fields into backend keys
- [ ] Prefetch the next likely route
- [ ] Test fast nav: save → list → back to detail

**Every query using `initialData`:**
- [ ] Set `initialDataUpdatedAt` (or switch to `placeholderData`)
- [ ] Re-check `staleTime` assumptions
- [ ] Guard cross-query seeding with the write key / timestamps

## The golden rule

The server is the source of truth. Use `updateTag` (Server Action) for immediate
expiry whenever the user must read their own writes; treat monotonic client
timestamps as protection against client races only.

## Related skills

- `react-query-patterns` — general TanStack Query v5 correctness.
- `react-query-cache-determinism` — deterministic client cache **updates** per
  CRUD operation (deep merge, optimistic delete). Pairs with the mutation shape above.
