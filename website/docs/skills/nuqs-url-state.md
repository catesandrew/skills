---
title: Nuqs Url State
description: Guides implementation of type-safe, shareable URL state management in Next.js applications using nuqs, covering parser registries, client and server usage, serializers, and migrating away from useState.
---

# nuqs-url-state

## Why It Exists

This skill's dotfiles history is thin. It was added whole in a single commit, `5839e0b3` ("chore: nuqs url state", 2026-04-24), which introduced the full 534-line `SKILL.md` in one shot with no prior smaller version and no distinguishing rationale in the commit message beyond the addition itself. No earlier or incremental commits reference it. It was later removed from dotfiles in `df4241d4` (2026-08-29) when `agent-skills` was pointed at the external `catesandrew/skills` marketplace this repo now is.

## What It Does

The skill is a comprehensive implementation guide for `nuqs` (Next.js URL Search Params State) — a library for making query-string state strongly typed, shareable via URL, reload-safe, and usable on both server and client. It walks through the full workflow: defining a parser registry as the single source of truth for param names/types/defaults (`parseAsString`, `parseAsInteger`, `parseAsArrayOf`, `parseAsStringEnum`, etc.), consuming it client-side with `useQueryState`/`useQueryStates`, and consuming the same registry server-side via `createSearchParamsCache().parse(searchParams)` so client and server never disagree about shape.

It documents common patterns end to end — pagination, sorting (with toggle-direction logic), multi-select filters, debounced search input, custom parsers (e.g. a date-range parser via `createParser`), coordinated updates (search resets filters and page; filter change resets page), and `createSerializer` for building shareable/bookmarkable links and `<Link>` hrefs. A "Best Practices" section prescribes co-locating the parser registry next to the component that owns it, semantic param names (`q`/`page` over `search`/`p`), always providing `.withDefault()` to avoid null checks, exporting parser-derived types, and keeping server/client parser definitions identical. It closes with a migration-from-`useState` before/after comparison, a troubleshooting section (hydration mismatches, state not updating, server-component usage errors), and an implementation checklist.

## How To Use It

Triggers on: "nuqs", "URL state", "query params", "shareable links", "bookmark state", replacing local state with URL state.

```sh
skills add -g catesandrew/skills --skill skills/nuqs-url-state
```

```sh
npm install @catesworks/skill-nuqs-url-state
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Parsers are the contract — define each param's name, type, and default exactly once, and reuse that registry on both client and server.
- Every parser should carry `.withDefault()` (or an explicit null-handling plan); skipping it forces null checks everywhere downstream.
- Hydration mismatches come from the server rendering with parser defaults while the client already has different URL params — parse `searchParams` through `createSearchParamsCache` on the server rather than trusting defaults.
- `useQueryState`/`useQueryStates` are client hooks only — server components must go through `createSearchParamsCache().parse()`.
- `shallow: true` suppresses server-component re-renders on param change — remove it if the update needs to actually re-run server data fetching.
- Coordinate dependent state explicitly: changing search should reset filters and page; changing a filter should reset page — this doesn't happen automatically.
- Co-locate the parser registry file with the component that owns it (e.g. `ProductList/searchParams.ts`) rather than a single global registry.

## Related Skills

- [data-table-builder](/docs/skills/data-table-builder) — table filters/sort/pagination commonly backed by nuqs URL state.

---

_Sourced from: skills/nuqs-url-state/SKILL.md, skills/nuqs-url-state/metadata.json, ~/.dotfiles git history (commits `5839e0b3`, `df4241d4`)_
