---
title: Nextjs React Query Cache Coordination
description: Coordinates Next.js App Router caching layers with React Query to guarantee read-your-own-writes, covering Router Cache versus Data Cache, updateTag versus revalidateTag, and hydration timestamp races.
---

# nextjs-react-query-cache-coordination

## Why It Exists

This skill traces to dotfiles commit `54e5f48c` ("feat(skills): port 3 generic React/RQ skills from envmgr-ui, cross-link cluster", 2026-08-01). It started life as a repo-specific skill inside an `envmgr-ui` project, but that copy had drifted toward domain-coupled context (`@ad-infrastructure`, `Tron`, `podzilla` references throughout). The commit distilled it down to the portable ~200-line version seen today — domain stripped to a neutral "record" list/detail example — alongside two sibling skills (`excel-like-table-navigation`, `react-query-cache-determinism`) ported from the same source. The same commit cross-linked it into a "React Query + tables" cluster and logged the classification in a `SKILLS-AUDIT-2026-08.md` file. It was later removed from dotfiles entirely in `df4241d4` (2026-08-29), which redirected all `react-*` skills to the external `catesandrew/skills` marketplace this repo now is.

## What It Does

The skill documents the four caching layers that can each independently serve stale data after a mutation in a Next.js App Router + React Query app: the client-side Router Cache (in-memory RSC payloads reused on back/forward nav), the server-side Data Cache (`fetch()` responses tagged and invalidated by tag), the React Query client cache (hydrated via `<HydrationBoundary>`, merged by `dataUpdatedAt`), and ordinary UI state (form state, memoized table rows). Its central teaching point is the distinction between `revalidateTag` (SWR semantics — may serve stale once) and `updateTag` (immediate expiry, Server-Action-only) — for "save, then immediately see the new value," only `updateTag` from a Server Action is correct.

Beyond that core distinction, it encodes eight numbered "core lessons": client navigation still hits the network; Route Handler revalidation does not clear the Router Cache; hydration is timestamp-driven so a server can stamp stale data as artificially fresh; `initialData` is real cache data (not a placeholder) and needs `initialDataUpdatedAt` or should be replaced with `placeholderData`; a mutation touching multiple caches should record the *max* write timestamp across them; derived/client-only fields shouldn't be written into backend-shaped query keys; effects that both `watch()` and `reset()` a form loop forever; and prefetching the likely next route offsets the staleness that strict `updateTag` invalidation otherwise introduces.

It ships a concrete "coordinated mutation" `useMutation` shape (optimistic update + rollback + monotonic timestamp patch + prefetch) and a five-step triage flowchart for the specific complaint "I saved but the UI reverted" — network tab, `dataUpdatedAt` inspection, invalidation path, `initialData` presence, and cell-renderer source — plus two mutation/query checklists.

## How To Use It

Triggers on: "saved but reverted", "read your own writes", "stale after mutation", "revalidateTag", "updateTag", "HydrationBoundary", "initialData stale".

```sh
skills add -g catesandrew/skills --skill skills/nextjs-react-query-cache-coordination
```

```sh
npm install @catesworks/skill-nextjs-react-query-cache-coordination
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- `revalidateTag` is SWR (may serve stale once) — never use it where read-your-own-writes correctness is required; use `updateTag` from a Server Action instead.
- Calling `revalidateTag` from a Route Handler clears the server Data Cache but **not** the client Router Cache; do invalidation from a Server Action, or pair the Route Handler with `router.refresh()`.
- `initialData` is real, sticky cache data — without `initialDataUpdatedAt` a stale cross-query seed can look "fresh enough" to skip refetch.
- When one mutation patches multiple caches (list + detail + summary), the recorded write timestamp for the entity must be the `Math.max` across all of them.
- Never write client-derived fields into a backend-shaped query key — put derived data under its own key so a refetch can't silently wipe it.
- Never call `reset()` inside an effect that depends on `watch()` output — it creates an infinite reset loop.
- A table cell showing stale data after a form shows the correct value is usually a memoized `row.original` read, not a cache bug — read the controlled value instead.

## Related Skills

- [react-query-patterns](/docs/skills/react-query-patterns) — general TanStack Query v5 correctness; this skill's cluster-mate per `54e5f48c`.
- [react-query-cache-determinism](/docs/skills/react-query-cache-determinism) — deterministic client cache updates per CRUD operation (deep merge, optimistic delete); pairs directly with the mutation shape documented here.

---

_Sourced from: skills/nextjs-react-query-cache-coordination/SKILL.md, skills/nextjs-react-query-cache-coordination/metadata.json, ~/.dotfiles git history (commits `54e5f48c`, `df4241d4`)_
