# shadcn DataTable Integration

## Table of Contents

- [Project Structure](#project-structure)
- [Generic DataTable Component](#generic-datatable-component)
- [Column Definitions](#column-definitions)
- [Features](#features)
- [Reusable Components](#reusable-components)

---

## Project Structure

Separate concerns into three files:

```
app/payments/
├── columns.tsx    — column definitions (client component)
├── data-table.tsx — DataTable component (client component)
└── page.tsx       — data fetching + rendering (server component)
```

## Generic DataTable Component

Accept typed columns and data — works with any data shape:

```tsx
"use client"

import {
  ColumnDef, flexRender, getCoreRowModel,
  getPaginationRowModel, getSortedRowModel, getFilteredRowModel,
  useReactTable, SortingState, ColumnFiltersState, VisibilityState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data, columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

## Column Definitions

### Cell formatting

```tsx
{
  accessorKey: "amount",
  header: () => <div className="text-right">Amount</div>,
  cell: ({ row }) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
    }).format(parseFloat(row.getValue("amount")))
    return <div className="text-right font-medium">{formatted}</div>
  },
}
```

### Row actions (dropdown menu)

```tsx
{
  id: "actions",
  cell: ({ row }) => {
    const payment = row.original
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View details</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}
```

### Row selection (checkbox column)

```tsx
{
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
    />
  ),
  enableSorting: false,
  enableHiding: false,
}
```

### Sortable header

```tsx
{
  accessorKey: "email",
  header: ({ column }) => (
    <Button variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      Email <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ),
}
```

## Features

### Filtering

Add filter input above the table:

```tsx
<Input
  placeholder="Filter emails..."
  value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
  onChange={(e) => table.getColumn("email")?.setFilterValue(e.target.value)}
  className="max-w-sm"
/>
```

### Column visibility toggle

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Columns</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {table.getAllColumns().filter(col => col.getCanHide()).map(col => (
      <DropdownMenuCheckboxItem key={col.id} className="capitalize"
        checked={col.getIsVisible()}
        onCheckedChange={(value) => col.toggleVisibility(!!value)}>
        {col.id}
      </DropdownMenuCheckboxItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

## Reusable Components

Extract these as shared components in your project:

- **`DataTableColumnHeader`** — sortable/hideable header with dropdown (asc, desc, hide)
- **`DataTablePagination`** — page size selector, page navigation, selected row count
- **`DataTableViewOptions`** — column visibility toggle dropdown

These accept `table` or `column` as generic props and work with any data type.
