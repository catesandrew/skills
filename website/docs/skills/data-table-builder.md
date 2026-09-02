---
title: Data Table Builder
description: Guides building React/Next.js data tables on a layered, type-safe architecture that separates URL state (via nuqs) from table state, keeps columns declarative through factories, and externalizes cell behavior.
---

# data-table-builder

## Why It Exists

This skill was added in dotfiles commit `0afc07d4` ("feat(skills): add data-table-builder skill for React/Next.js tables"), whose full message is unusually detailed for this catalog: it describes a 7-layer implementation architecture (filter fields → search-param registry → URL-state hook → table shell → column factory → external cells → row identity/hierarchy) and explicitly reports eval results — "83.3% assertion pass rate vs 22.2% baseline" across 3 test cases (simple table, refactor, hierarchical table), with the eval files checked in alongside it. About a month later, `54e5f48c` ("feat(skills): port 3 generic React/RQ skills from envmgr-ui, cross-link cluster") revisited it — not to change the skill's content meaningfully (only 8 lines touched) but to cross-link it into a broader "React, tables & state" skill family alongside the newly-generalized `excel-like-table-navigation`, `nextjs-react-query-cache-coordination`, and `react-query-cache-determinism`, distilled down from repo-specific origins in an internal `envmgr-ui` codebase.

## What It Does

The skill walks through building a data table as seven ordered, separable layers, each with its own file location convention and checklist. Filter fields (`*FilterFields.tsx`) are the single source of truth for what filters exist — fields with `options` become faceted array-parser filters, fields without become plain string-parser text filters. A typed search-param registry (`*SearchParams.ts`) built on `nuqs` defines the URL contract using `pageIndexParser`, `pageSizeParser`, `getColumnsSortParser`, and an auto-generating `buildFilterParsers()` helper, plus a server-side `createSearchParamsCache`. A URL-state hook (`use*Filters.ts`) bridges `nuqs` and React Table state and — critically — owns *all* reset semantics in one place: search changes clear sorting/filters/page, filter changes clear sorting/page, sort changes reset page, pagination changes only touch page/per-page.

The table shell component (`*Table.tsx`) calls `useDataTable` with controlled `value` state from the URL hook, a stable `getRowId`, and explicit manual flags for whether pagination/sorting/filtering happen server-side or client-side. Column factories (`TableColumns/*Columns.tsx`) stay purely declarative — no hooks, no local state — while any cell with real behavior (hooks, interaction, context, reuse) gets externalized into its own `TableCells/*Cell.tsx` component. A dedicated, heavily-emphasized section covers hierarchical (parent-child) tables, which require six specific settings together — composed `getRowId`, `getSubRows`, memoized `getExpandedRowModel`, and critically `paginateExpandedRows: false` plus `autoResetAll: false` — because missing any one of them silently breaks expansion state or pagination.

## How To Use It

Triggers on: "the user wants to create a new data table", "refactor an existing table to follow architectural patterns", "add search/filtering/pagination to tables", "table", "data table", "useDataTable", "nuqs", "column factory", "faceted filters", "table search", React Table / TanStack Table implementations.

```sh
skills add -g catesandrew/skills --skill skills/data-table-builder
```

```sh
npm install @catesworks/skill-data-table-builder
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- URL contract (parser registry) and table contract (`useDataTable`) must stay strictly separate — never mixed.
- Reset semantics belong only in the URL-state hook, never scattered across individual button handlers.
- Column factories must remain declarative: no hooks, no runtime state.
- Any cell using hooks, interaction, context, or needing reuse across tables must be an external TSX component, not an inline lambda.
- Always provide a stable `getRowId`; for hierarchical tables it must be parent-composed (``parent ? `${parent.id}.${row.id}` : row.id``).
- Hierarchical tables require ALL of: `getSubRows`, memoized `getExpandedRowModel()`, `paginateExpandedRows: false`, `autoResetAll: false`, and `autoResetExpanded: false` — omitting any one breaks expansion or pagination.
- Set `autoResetAll: false` whenever the underlying data updates frequently (e.g. polling), or React Table will silently reset state on every refresh.

## Related Skills

- [excel-like-table-navigation](/docs/skills/excel-like-table-navigation) — adds Excel-like keyboard navigation on top of the table this skill builds.
- [tanstack-table-patterns](/docs/skills/tanstack-table-patterns) — the underlying TanStack Table v8 patterns this architecture is built on.
- [nuqs-url-state](/docs/skills/nuqs-url-state) — the URL-state layer this skill's Layer 2/3 build on.

---

_Sourced from: skills/data-table-builder/SKILL.md, skills/data-table-builder/metadata.json, ~/.dotfiles git history (commits `0afc07d4`, `54e5f48c`)_
