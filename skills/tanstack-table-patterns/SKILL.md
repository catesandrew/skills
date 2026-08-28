---
name: tanstack-table-patterns
description: Guide for building production-grade tables with TanStack Table (v8) in React. Use when creating or reviewing data tables — covering the meta object pattern, editable tables, dynamic column schemas, row validation, backend integration (SWR/React Query), virtualization, infinite scrolling, shadcn DataTable components, and server-side implementation.
---

# tanstack-table-patterns

Architecture and patterns for TanStack Table v8: meta-driven state, editable rows, validation, API integration, virtualization, and shadcn integration.

## Core Architecture: The Meta Pattern

TanStack Table's `meta` field on `useReactTable` is the key extensibility point. Use it to store custom state and functions accessible from any cell, header, or footer component without prop drilling:

```tsx
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  meta: {
    editedRows,
    setEditedRows,
    validRows,
    updateData: (rowIndex, columnId, value, isValid) => { /* ... */ },
    revertData: (rowIndex, revert) => { /* ... */ },
  },
})
```

Access from any cell component via `table.options.meta?.updateData(...)`.

To extend the TypeScript types, declare a module augmentation:

```ts
declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    editedRows: Record<string, boolean>
    setEditedRows: Dispatch<SetStateAction<Record<string, boolean>>>
    updateData: (rowIndex: number, columnId: string, value: string, isValid: boolean) => void
    revertData: (rowIndex: number, revert: boolean) => void
  }
}
```

## Column Meta for Dynamic Cell Types

Store UI hints in column `meta` to drive dynamic cell rendering:

```tsx
columnHelper.accessor('dateOfBirth', {
  header: 'Date Of Birth',
  cell: TableCell,
  meta: {
    type: 'date',
    required: true,
    validate: (value: string) => new Date(value) <= new Date(),
    validationMessage: 'Date cannot be in the future',
  },
})
```

The `TableCell` component reads `column.columnDef.meta?.type` to render `<input>`, `<select>`, or `<span>` accordingly.

## Row Model Pipeline (Server-Side Critical)

Internal execution order when all features are enabled:

```
getCoreRowModel → getFilteredRowModel → getGroupedRowModel → getSortedRowModel → getExpandedRowModel → getPaginationRowModel → getRowModel
```

**Replicate this order on the server**: filter first, then group, sort, expand, paginate last.

## Preventing State Resets During Edits

When mutating data immutably, TanStack auto-resets pagination/expansion. Suppress with a ref flag:

```tsx
const skipResetRef = useRef(false)

const updateData = (newData) => {
  skipResetRef.current = true
  setData(newData)
}

useEffect(() => { skipResetRef.current = false })

useReactTable({
  autoResetPageIndex: !skipResetRef.current,
  autoResetExpanded: !skipResetRef.current,
})
```

## Backend Filter/Sort via Meta

For server-driven tables (not client-side filtering), use meta to store filter/sort state and connect it to API queries:

```tsx
// Generic helper for connecting filters to column headers
const getTableExtraDataModel = (table, name) => ({
  value: table.options.meta?.getExtraData()[name],
  onChange: (value) => table.options.meta?.updateExtraData(name, value),
})

// In column definition header
header: ({ table }) => {
  const { value, onChange } = getTableExtraDataModel(table, 'id')
  return <Input value={value} onChange={onChange} />
}
```

The parent component holds filter state and passes it to both the table (via meta) and the API query (via query key).

## Detailed References

- **Editable tables**: edit/cancel/save patterns, validation, API integration — see [references/editable-tables.md](references/editable-tables.md)
- **shadcn integration**: DataTable component, column headers, pagination, row actions — see [references/shadcn-integration.md](references/shadcn-integration.md)
