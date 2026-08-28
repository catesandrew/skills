---
name: excel-like-table-navigation
description: Excel-like keyboard navigation for React tables — roving tabindex, a cell-registration system, arrow/Tab/Enter/Esc handling, and a two-layer core-hook + adapter design. Use when adding keyboard navigation to a data grid, wiring cell-to-cell focus movement, building inline-editable table cells, or making a table fully keyboard operable. Trigger on "keyboard navigation", "roving tabindex", "grid navigation", "arrow key table", "editable cell focus", or "accessible data grid".
---

# Excel-like Table Keyboard Navigation

## Overview

A reusable keyboard-navigation system for React tables: Excel-like movement
(Arrow keys, Tab, Enter/Esc) with roving focus and edit-mode toggling. It is
table-agnostic — it needs only row order, column order, and a cell registry — so
it drops onto TanStack Table, a hand-rolled table, or any grid that can attach
refs and a keydown handler.

## Architecture

Two layers. Use the adapter unless you need the raw primitive.

- **Core hook (`useTableKeyboardNav`)** — low-level: cell registration, roving
  tabindex, keydown handling, navigation math. Knows nothing about your data.
- **Adapter (`useTableNavAdapter`)** — high-level: derives row/column order from
  your table data, skips hidden columns, wires your existing `editingCell`
  state, and cuts boilerplate.

### Design principles

1. **Table-agnostic** — only needs row/column order + a cell registry.
2. **Decoupled from edit state** — `editingCell` logic is pluggable.
3. **UI-agnostic** — works with any table that provides cell refs.
4. **Registry-based** — cells register/unregister as they mount/unmount.
5. **Roving tabindex** — only the active cell is `tabIndex=0`; the rest are `-1`.

## Core hook API

```typescript
type CellCoord = { rowId: string; colId: string }
type CellMeta = { editable?: boolean; disabled?: boolean; isChildRow?: boolean }
type CellRegistration = { coord: CellCoord; element: HTMLElement | null; meta?: CellMeta }

type CellRegistry = {
  register: (cell: CellRegistration) => void
  unregister: (coord: CellCoord) => void
  getCell: (coord: CellCoord) => CellRegistration | undefined
  getAll: () => CellRegistration[]
}

type UseTableKeyboardNavOptions = {
  getRowOrder: () => string[]
  getColumnOrder: () => string[]
  isCellFocusable?: (cell: CellRegistration) => boolean
  onEnterEdit?: (coord: CellCoord) => void
  onExitEdit?: (coord: CellCoord) => void
  isEditingCell?: (coord: CellCoord) => boolean
  initialActiveCell?: CellCoord
}

type UseTableKeyboardNavResult = {
  onKeyDown: (e: React.KeyboardEvent) => void
  activeCell: CellCoord | null
  setActiveCell: (coord: CellCoord | null) => void
  registry: CellRegistry
  getCellProps: (coord: CellCoord, meta?: CellMeta) => {
    ref: (el: HTMLElement | null) => void
    tabIndex: number
    onFocus: () => void
    'data-cell'?: string
  }
}
```

### Usage (core hook)

```tsx
const nav = useTableKeyboardNav({
  getRowOrder: () => rowIds,
  getColumnOrder: () => columnIds,
  onEnterEdit: (coord) => setEditingCell(coord),
  onExitEdit: () => setEditingCell(null),
  isEditingCell: (c) => editingCell?.rowId === c.rowId && editingCell?.colId === c.colId,
  isCellFocusable: (cell) => !cell.meta?.disabled,
})

return (
  <div onKeyDown={nav.onKeyDown}>
    {rows.map((row) => (
      <tr key={row.id}>
        {columns.map((col) => (
          <td key={col.id} {...nav.getCellProps({ rowId: row.id, colId: col.id }, { editable: col.editable })}>
            <Cell />
          </td>
        ))}
      </tr>
    ))}
  </div>
)
```

### Usage (adapter, with TanStack Table)

```tsx
const [editingCell, setEditingCell] = useState<CellCoord | null>(null)

const nav = useTableNavAdapter({
  rows: table.getRowModel().rows.map((r) => ({ id: r.id, depth: r.depth })),
  columns: table.getAllColumns().map((c) => ({
    id: c.id,
    editable: c.columnDef.meta?.editable,
    hidden: !c.getIsVisible(),
  })),
  editingCell,
  setEditingCell,
  isRowDisabled: (rowId) => table.getRow(rowId).original.locked === true,
})

return (
  <div onKeyDown={nav.onKeyDown}>
    <table>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} {...nav.getCellProps(row.id, cell.column.id, { editable: cell.column.columnDef.meta?.editable })}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
```

## Behavior rules

### Navigation keys

| Key | Behavior |
|-----|----------|
| **Arrow Up/Down** | Move one row up/down, same column |
| **Arrow Left/Right** | Move one column left/right, same row |
| **Tab** | Next column; wrap to next row at end |
| **Shift+Tab** | Previous column; wrap to previous row at start |
| **Enter** | If cell editable, call `onEnterEdit` |
| **Escape** | If editing, call `onExitEdit` |

Navigation skips cells where `isCellFocusable` is false, `disabled` meta is set,
hidden columns, and disabled rows — searching onward in the same direction until
it finds a focusable cell or runs off the end.

### Roving tabindex

Exactly one cell is `tabIndex=0` (the active cell); all others are `-1`. This
gives the table a **single tab stop** — arrow keys move within, Tab exits to the
next focusable element on the page (the ARIA
[grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)). On `onFocus`,
update the active cell so mouse clicks and programmatic focus stay in sync
(without `onFocus`, `tabIndex=-1` would block click-to-focus).

### Edit mode

Enter on an editable cell → `onEnterEdit(coord)` → component sets `editingCell` →
cell renders its input. Escape → `onExitEdit` → clears it. **While editing,
keydown must not trigger navigation** — the input owns the keystrokes; the table
handler should early-return when `isEditingCell` is true.

## Cell registration

Cells register on mount and unregister on unmount, so navigation only ever
targets live DOM:

```tsx
const cellRef = (el: HTMLElement | null) => {
  if (el) registry.register({ coord: { rowId, colId }, element: el, meta: { editable, disabled } })
}
useEffect(() => () => registry.unregister({ rowId, colId }), [rowId, colId])
```

Navigation queries `registry.getCell(coord)?.element?.focus()`. Registration
matters because tables are dynamic (rows/columns change, cells render
conditionally) — a static coordinate map would point at unmounted nodes.

## Navigation algorithm

```typescript
function findNextCell(current, direction, rowOrder, columnOrder, registry): CellCoord | null {
  const next = calculateNextCoord(current, direction, rowOrder, columnOrder)
  if (!next) return null
  const cell = registry.getCell(next)
  if (cell && isCellFocusable(cell)) return next
  return findNextCell(next, direction, rowOrder, columnOrder, registry) // keep skipping
}
```

Arrow keys step index ±1 within row/column order; Tab/Shift+Tab step columns and
wrap across rows. Both skip non-focusable cells and return `null` at the
boundary (letting Tab fall through to native behavior).

## Editable-cell patterns

```tsx
// Input cell — Enter saves (via blur), Escape cancels
function EditableCell({ isEditing, value, onSave, onCancel }) {
  if (!isEditing) return <span>{value}</span>
  return (
    <input
      autoFocus
      defaultValue={value}
      onBlur={(e) => onSave(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') onCancel()
      }}
    />
  )
}
```

Read-only "action" cells stay focusable but map Enter to the action instead of
edit mode — put the handler on the `<td>` (where `getCellProps` lives), not the
inner button, so navigation and activation share one focus target.

## Accessibility

- Roving tabindex = one tab stop, arrows within (ARIA grid pattern).
- Visible focus ring: `td:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: -2px; }`.
- Optional ARIA on `getCellProps`: `role: 'gridcell'`, `aria-readonly`,
  `aria-disabled`, `aria-colindex`, `aria-rowindex`.
- Escape must always exit edit mode; never trap keyboard users in a cell.

## Performance

- One `onKeyDown` at the table root (event delegation) — not N listeners.
  Scales flat as the table grows.
- Registry is a `Map`: O(1) lookups; stores only coords, refs (already in
  memory), and small meta. 50–500 cells is trivial.
- Focus is browser-native (`.focus()`). With virtualization, ensure the focused
  cell stays within the rendered window before focusing it.

## Debugging checklist

- **Arrows do nothing** → `onKeyDown` attached to the container? cells
  registered (`registry.getAll().length`)? `getRowOrder`/`getColumnOrder`
  correct? cells actually focusable?
- **Enter won't edit** → `onEnterEdit` provided? cell `meta.editable`? not
  already editing?
- **Click won't focus** → `onFocus` from `getCellProps` attached to the
  focusable element (needed because `tabIndex=-1`).
- **Tab leaves immediately** → no cell is `tabIndex=0`, or all cells
  non-focusable.

## Related skills

- `data-table-builder`, `tanstack-table-patterns` — table structure this layers onto.
- `react-component-patterns` — the core-hook + adapter split is composition-first API design.
