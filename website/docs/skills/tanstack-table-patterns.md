---
title: Tanstack Table Patterns
description: Guides building production-grade tables with TanStack Table v8 in React, covering the meta object pattern, editable tables, dynamic column schemas, row validation, and shadcn DataTable integration.
---

# tanstack-table-patterns

## Why It Exists

This skill was added whole in dotfiles commit `7522ff1a` ("chore: tanstack table"), which landed all three files at once — `SKILL.md` (116 lines) plus the two reference docs `references/editable-tables.md` and `references/shadcn-integration.md` (609 lines total, 0% AI-attributed per the commit's trailer, i.e. authored directly rather than chat-generated). It was later swept into a broader "React, tables & state" cross-link pass in `54e5f48c` ("feat(skills): port 3 generic React/RQ skills from envmgr-ui, cross-link cluster"), which touched this skill alongside `nextjs-react-query-cache-coordination` and `react-query-cache-determinism` without materially changing its content. Beyond the terse commit subject, there's no further design narrative in the dotfiles history — the skill is presented as a settled architecture reference rather than a documented problem-solving journey.

## What It Does

The skill centers on TanStack Table's `meta` object as the core extensibility point: a `useReactTable({ meta: {...} })` field holding custom state and functions (like `editedRows`, `updateData`, `revertData`) that any cell, header, or footer component can read via `table.options.meta?.updateData(...)` without prop drilling, backed by a `declare module '@tanstack/table-core'` augmentation so the shape is type-checked. Column-level `meta` (e.g. `{ type: 'date', required: true, validate: ... }`) drives a generic `TableCell` component to render the right input type per column.

It documents the internal row-model execution order — `getCoreRowModel → getFilteredRowModel → getGroupedRowModel → getSortedRowModel → getExpandedRowModel → getPaginationRowModel → getRowModel` — as the exact sequence a server-side implementation must replicate (filter, then group, sort, expand, paginate last) to match client-side semantics. It also covers a specific pitfall: immutable data mutations during edits auto-reset pagination/expansion state, which the skill fixes with a `skipResetRef` flag pattern that suppresses `autoResetPageIndex`/`autoResetExpanded` during the update and re-enables them on the next effect tick. A final pattern shows connecting server-driven filter/sort state to column headers through `meta` rather than local component state, so the parent component's filter state feeds both the table and the API query key.

Two linked reference files carry the deeper material: `references/editable-tables.md` for edit/cancel/save flows, validation, and API integration, and `references/shadcn-integration.md` for the shadcn `DataTable` component, column headers, pagination, and row actions.

## How To Use It

Triggers on: "building production-grade tables with TanStack Table (v8) in React", "creating or reviewing data tables", "the meta object pattern", "editable tables", "dynamic column schemas", "row validation", "backend integration (SWR/React Query)", "virtualization", "infinite scrolling", "shadcn DataTable components", "server-side implementation".

```sh
skills add -g catesandrew/skills --skill skills/tanstack-table-patterns
```

```sh
npm install @catesworks/skill-tanstack-table-patterns
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Store shared cross-cell state/functions in `meta`, not component-local state, or every cell needs prop drilling.
- Always add the `declare module '@tanstack/table-core'` augmentation when extending `TableMeta` — otherwise `table.options.meta` loses type safety.
- Server-side row model implementations must replicate the exact pipeline order: filter → group → sort → expand → paginate.
- Guard pagination/expansion state during immutable edits with a `skipResetRef`-style flag, or TanStack silently resets `pageIndex`/`expanded` on every data mutation.
- For server-driven (not client-side) filtering/sorting, route state through `meta` and the parent's query key together — don't let the table own filter state independently of the API call.
- Column `meta.type` drives cell rendering — keep it declarative (`type`, `required`, `validate`, `validationMessage`) rather than embedding rendering logic in the column definition itself.

## Related Skills

- [data-table-builder](/docs/skills/data-table-builder) — a layered, URL-state-driven table architecture built on top of these same TanStack Table v8 patterns.
- [excel-like-table-navigation](/docs/skills/excel-like-table-navigation) — adds keyboard navigation on top of a table built with these patterns.
- [zustand-patterns](/docs/skills/zustand-patterns) — a related state-management pattern skill for coordinating table state outside `meta` when needed.

---

_Sourced from: skills/tanstack-table-patterns/SKILL.md, skills/tanstack-table-patterns/metadata.json, ~/.dotfiles git history (commits `7522ff1a`, `54e5f48c`)_
