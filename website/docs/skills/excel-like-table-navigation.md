---
title: Excel-like Table Navigation
description: Implements Excel-like keyboard navigation for React tables using a roving tabindex, a cell-registration system, arrow/Tab/Enter/Escape handling, and a two-layer core-hook plus adapter design.
---

# excel-like-table-navigation

## Why It Exists

This skill was added in dotfiles commit `54e5f48c` ("feat(skills): port 3 generic React/RQ skills from envmgr-ui, cross-link cluster"), whose full commit message explains the origin directly: it reconciles `agent-skills` with copies living in an internal `envmgr-ui` codebase that had "drifted toward repo-specific (`@ad-infrastructure`/Tron/podzilla) context." Of 9 overlapping skills found there, 3 were judged genuinely portable and distilled down to house style — roughly 200 lines, domain stripped to a neutral record/list-detail example — and `excel-like-table-navigation` was one of them, alongside `nextjs-react-query-cache-coordination` and `react-query-cache-determinism`. The same commit cross-linked it into a "React, tables & state" README section and into `data-table-builder`, establishing it as part of a deliberate table/state skill cluster rather than a standalone addition.

## What It Does

The skill implements a reusable, table-agnostic keyboard-navigation system built as two layers: a low-level core hook (`useTableKeyboardNav`) that only knows about cell registration, roving tabindex, keydown handling, and navigation math — nothing about the caller's data — and a high-level adapter (`useTableNavAdapter`) that derives row/column order from actual table data, skips hidden columns, and wires existing `editingCell` state to cut boilerplate. Because the core hook needs only row order, column order, and a cell registry, it drops onto TanStack Table, a hand-rolled table, or any grid that can attach refs and a keydown handler.

Navigation follows fixed rules: Arrow Up/Down moves one row same column, Arrow Left/Right moves one column same row, Tab/Shift+Tab moves columns and wraps to the next/previous row at the boundary, Enter calls `onEnterEdit` on an editable cell, and Escape calls `onExitEdit` while editing. Exactly one cell carries `tabIndex=0` at any time (the roving-tabindex ARIA grid pattern) so the whole table is a single tab stop, with arrow keys moving focus within it; an `onFocus` handler keeps mouse clicks in sync with the active cell, since `tabIndex=-1` on inactive cells would otherwise block click-to-focus. Cells register on mount and unregister on unmount into a `Map`-backed registry so navigation only ever targets live DOM nodes rather than a stale coordinate map, and the navigation algorithm recursively skips non-focusable cells (disabled, hidden-column, disabled-row) in the requested direction until it finds a focusable one or runs off the end.

The skill also documents accessibility requirements (visible `:focus-visible` ring, optional ARIA `role: 'gridcell'`/`aria-readonly`/`aria-colindex`), performance characteristics (one delegated `onKeyDown` at the table root rather than N per-cell listeners, O(1) `Map` lookups), and a debugging checklist for the four most common failure modes (arrows doing nothing, Enter not entering edit mode, click not focusing, Tab leaving immediately).

## How To Use It

Triggers on: "adding keyboard navigation to a data grid", "wiring cell-to-cell focus movement", "building inline-editable table cells", "making a table fully keyboard operable", "keyboard navigation", "roving tabindex", "grid navigation", "arrow key table", "editable cell focus", "accessible data grid".

```sh
skills add -g catesandrew/skills --skill skills/excel-like-table-navigation
```

```sh
npm install @catesworks/skill-excel-like-table-navigation
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Use the adapter unless the raw primitive is specifically needed — the core hook is intentionally low-level and data-agnostic.
- While a cell is editing, keydown must not trigger navigation — the input owns keystrokes, so the table handler must early-return when `isEditingCell` is true.
- `onFocus` from `getCellProps` must be attached to the focusable element, or click-to-focus silently breaks because `tabIndex=-1` blocks it by default.
- Escape must always exit edit mode — never trap keyboard users inside a cell.
- Navigation math must skip non-focusable cells (disabled, hidden columns, disabled rows) and return `null` at a boundary so Tab can fall through to native page behavior.
- With virtualization, ensure the focused cell stays within the rendered window before calling `.focus()` on it, or focus silently fails.
- Read-only "action" cells should keep the handler on the `<td>` (where `getCellProps` lives), not the inner button, so navigation and activation share one focus target.

## Related Skills

- [data-table-builder](/docs/skills/data-table-builder) — the table architecture this keyboard-navigation layer sits on top of.
- [tanstack-table-patterns](/docs/skills/tanstack-table-patterns) — underlying TanStack Table structure this skill is table-agnostic with respect to but commonly pairs with.
- [react-component-patterns](/docs/skills/react-component-patterns) — the core-hook + adapter split used here is a worked example of that composition-first API design approach.

---

_Sourced from: skills/excel-like-table-navigation/SKILL.md, skills/excel-like-table-navigation/metadata.json, ~/.dotfiles git history (commit `54e5f48c`)_
