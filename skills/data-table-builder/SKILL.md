---
name: data-table-builder
description: Build React/Next.js data tables following the typed URL-state architecture with nuqs, useDataTable, column factories, and external cell components. Use when the user wants to create a new data table, refactor an existing table to follow architectural patterns, or add search/filtering/pagination to tables. Trigger on mentions of "table", "data table", "useDataTable", "nuqs", "column factory", "faceted filters", "table search", or when discussing React Table / TanStack Table implementations.
---

# Data Table Builder

This skill guides you through building data tables following a layered, type-safe architecture that separates URL state from table state, keeps column definitions declarative, and externalizes complex cell behavior.

## Architecture Principles

**Keep URL Contract Separate From Table Contract**
The parser registry defines the URL contract. The table shell defines the React Table contract. Never mix the two.

**Keep Reset Semantics In One Place**
Reset behavior belongs in the URL-state hook, not scattered across button handlers.

**Keep Factories Declarative**
Factories should describe columns, not own runtime state.

**Keep Behavioral Cells External**
Behavior belongs in TSX components, not inline column lambdas.

**Prefer Stable Table Identity**
Use stable row ids and turn off destructive auto-reset behavior when row data changes frequently.

## When to Use This Skill

Use this skill when you need to:
- Create a new data table with search, filters, sorting, and pagination
- Refactor an existing table to follow the typed URL-state architecture
- Add faceted filters or search to an existing table
- Build hierarchical/expandable tables with proper state management
- Ensure tables have type-safe, shareable, reload-safe URL state

## Layer-by-Layer Implementation

Follow these layers in order. Each layer builds on the previous one.

### Layer 1: Define Filter Fields

Filter fields are the single source of truth for what filters exist and how they behave.

**Location**: `<ComponentPath>/<tableName>FilterFields.tsx`

**What to define**:
```tsx
import type { DataTableFilterField } from '@/components/data-table'

export const myTableFilterFields: DataTableFilterField<MyRowType>[] = [
  {
    id: 'status',           // column id in React Table
    label: 'Status',        // Display label
    value: 'status',        // URL query param key
    options: [              // If present, becomes faceted filter (array parser)
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]
  },
  {
    id: 'owner',
    label: 'Owner',
    value: 'deploymentOwner'  // URL param can differ from column id
  },
  {
    id: 'search',
    label: 'Search',
    value: 'q'                // Text search - no options means string parser
  }
]
```

**Rules**:
- Filters with `options` → faceted filters → array parsers
- Filters without `options` → text filters → string parsers
- The `value` field is the URL query parameter name
- The `id` field is the React Table column id

**Checklist**:
- [ ] Created `*FilterFields.tsx` file
- [ ] Defined all text search filters
- [ ] Defined all faceted filters with options
- [ ] Matched filter IDs to column IDs
- [ ] Used semantic URL param names (e.g., `q` for search)

---

### Layer 2: Define Typed Search Param Registry

The parser registry is the typed URL contract. It defines what params exist and their types.

**Location**: `<ComponentPath>/<tableName>SearchParams.ts`

**What to define**:
```ts
import { createSearchParamsCache, parseAsString } from 'nuqs/server'
import { 
  pageIndexParser, 
  pageSizeParser,
  buildFilterParsers,
  getColumnsSortParser 
} from '@/lib/searchparams'
import { myTableFilterFields } from './myTableFilterFields'

// Define the parser registry
export const myTableSearchParams = {
  page: pageIndexParser,           // Zero-indexed internally, one-indexed in URL
  per_page: pageSizeParser,        // Default page size
  sort: getColumnsSortParser([     // Typed sort parser
    'columnId1',
    'columnId2'
  ]),
  ...buildFilterParsers(myTableFilterFields)  // Auto-generates parsers from filter fields
}

// Server-side cache
export const myTableSearchParamsCache = createSearchParamsCache(myTableSearchParams)

// Type export
export type MyTableSearchParams = typeof myTableSearchParams
```

**Why this matters**:
- `nuqs` makes URL state strongly typed, shareable, and reload-safe
- Parser registry is reused by client hooks, server components, and link serializers
- `buildFilterParsers()` automatically creates the correct parser type (string vs array) based on filter field definitions

**Checklist**:
- [ ] Created `*SearchParams.ts` file
- [ ] Added page parser with `pageIndexParser`
- [ ] Added per-page parser with `pageSizeParser`
- [ ] Added sort parser with sortable column IDs
- [ ] Used `buildFilterParsers()` from filter fields
- [ ] Created search params cache for server-side use
- [ ] Exported type for the parser registry

---

### Layer 3: Create URL-State Hook

The URL-state hook bridges `nuqs` and React Table state. It owns all reset semantics.

**Location**: `<ComponentPath>/use<TableName>Filters.ts`

**What to define**:
```ts
import { useQueryState, useQueryStates } from 'nuqs'
import { myTableSearchParams } from './myTableSearchParams'
import { useMemo, useCallback } from 'react'

export function useMyTableFilters() {
  // Pagination
  const [page, setPage] = useQueryState('page', myTableSearchParams.page)
  const [perPage, setPerPage] = useQueryState('per_page', myTableSearchParams.per_page)
  
  // Sorting
  const [sort, setSort] = useQueryState('sort', myTableSearchParams.sort)
  
  // Search
  const [searchQuery, setSearchQuery] = useQueryState('q', myTableSearchParams.q)
  
  // Faceted filters
  const [status, setStatus] = useQueryState('status', myTableSearchParams.status)
  const [owner, setOwner] = useQueryState('deploymentOwner', myTableSearchParams.deploymentOwner)
  
  // React Table state shape
  const pagination = useMemo(() => ({
    pageIndex: page ?? 0,
    pageSize: perPage ?? 10
  }), [page, perPage])
  
  const sorting = useMemo(() => sort ?? [], [sort])
  
  const columnFilters = useMemo(() => {
    const filters = []
    if (status?.length) filters.push({ id: 'status', value: status })
    if (owner) filters.push({ id: 'owner', value: owner })
    return filters
  }, [status, owner])
  
  // Reset semantics - consistent across all actions
  const handleSearchChange = useCallback((value: string | null) => {
    setSearchQuery(value)
    setSort(null)           // Clear sorting
    setStatus(null)         // Clear relevant filters
    setPage(0)              // Reset to first page
  }, [setSearchQuery, setSort, setStatus, setPage])
  
  const handleFilterChange = useCallback((filterId: string, value: any) => {
    // Update the specific filter
    if (filterId === 'status') setStatus(value)
    if (filterId === 'owner') setOwner(value)
    
    setSort(null)    // Clear sorting
    setPage(0)       // Reset to first page
  }, [setStatus, setOwner, setSort, setPage])
  
  const handleSortChange = useCallback((newSort: any) => {
    setSort(newSort)
    setPage(0)       // Reset to first page
  }, [setSort, setPage])
  
  const handlePaginationChange = useCallback((newPagination: any) => {
    setPage(newPagination.pageIndex)
    setPerPage(newPagination.pageSize)
  }, [setPage, setPerPage])
  
  const resetFilters = useCallback(() => {
    setSearchQuery(null)
    setStatus(null)
    setOwner(null)
    setSort(null)
    setPage(0)
  }, [setSearchQuery, setStatus, setOwner, setSort, setPage])
  
  const isAnyFilterActive = Boolean(searchQuery || status?.length || owner)
  
  return {
    // State
    pagination,
    sorting,
    columnFilters,
    searchQuery,
    isAnyFilterActive,
    
    // Setters with reset semantics
    onSearchChange: handleSearchChange,
    onFilterChange: handleFilterChange,
    onSortingChange: handleSortChange,
    onPaginationChange: handlePaginationChange,
    resetFilters
  }
}
```

**Reset Rules**:
- Search changes → clear sorting, clear filters, reset page
- Filter changes → clear sorting, reset page
- Sort changes → reset page
- Pagination changes → only update page/per-page

**Checklist**:
- [ ] Created `use*Filters.ts` hook
- [ ] Used `useQueryState` for all URL params
- [ ] Converted URL state to React Table state shapes
- [ ] Implemented consistent reset semantics
- [ ] Added `isAnyFilterActive` flag
- [ ] Exported all state and setters

---

### Layer 4: Create Table Shell Component

The table shell orchestrates data, columns, and state. It should not own low-level table logic.

**⚠️ IMPORTANT**: If your table is hierarchical (parent-child rows), you MUST configure hierarchy settings in this layer. See Layer 7 for the complete required configuration including `paginateExpandedRows: false` and `autoResetAll: false`.

**Location**: `<ComponentPath>/<TableName>.tsx`

**What to define**:
```tsx
import { useDataTable } from '@/hooks/use-data-table'
import { DataTable } from '@/components/data-table'
import { DataTableToolbar } from '@/components/data-table/toolbar'
import { getMyTableColumns } from '@/components/TableColumns/MyTableColumns'
import { useMyTableFilters } from './useMyTableFilters'
import { useMemo } from 'react'

interface MyTableProps {
  data: MyRowType[]
  rowCount: number
  // ... other props
}

export function MyTable({ data, rowCount }: MyTableProps) {
  // URL state
  const {
    pagination,
    sorting,
    columnFilters,
    searchQuery,
    isAnyFilterActive,
    onSearchChange,
    onSortingChange,
    onPaginationChange,
    resetFilters
  } = useMyTableFilters()
  
  // Prepare columns
  const columns = useMemo(
    () => getMyTableColumns({
      // Pass injected dependencies
      onAction: handleAction,
      userMode: 'edit'
    }),
    [handleAction]
  )
  
  // Call useDataTable with controlled state
  const table = useDataTable({
    data,
    columns,
    rowCount,
    
    // Initial state (declarative baseline)
    initialState: {
      columnVisibility: {
        _hidden: false  // Example: bootstrap hidden columns
      }
    },
    
    // Controlled state from URL
    value: {
      globalFilter: searchQuery ?? '',
      pagination,
      sorting,
      columnFilters
    },
    
    // Controlled state handlers
    onGlobalFilterChange: onSearchChange,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange: (updater) => {
      // Translate React Table filter updates to URL state
      const newFilters = typeof updater === 'function' 
        ? updater(columnFilters) 
        : updater
      newFilters.forEach(filter => {
        onFilterChange(filter.id, filter.value)
      })
    },
    
    // Stable row identity
    getRowId: (row) => row.id,  // Use stable ID
    
    // Manual control flags
    manualPagination: true,   // Server-side pagination
    manualSorting: true,      // Server-side sorting
    manualFiltering: true,    // Server-side filtering
    manualGlobalFiltering: false,  // Client applies globalFilterFn
    
    // Custom global filter if needed
    globalFilterFn: myCustomGlobalFilter,
    
    // Prevent auto-reset on data changes
    autoResetAll: false
  })
  
  return (
    <div>
      <DataTableToolbar
        table={table}
        filterFields={myTableFilterFields}
        isAnyFilterActive={isAnyFilterActive}
        onResetFilters={resetFilters}
      />
      <DataTable table={table} />
    </div>
  )
}
```

**Critical Options**:
- `getRowId`: Always provide stable row identity
- `autoResetAll: false`: Prevent state reset on data changes
- `value`: Controlled state from URL
- `initialState`: Declarative baseline state
- Manual flags: Set based on whether server/client handles the operation

**Checklist**:
- [ ] Created table shell component
- [ ] Called URL-state hook
- [ ] Memoized columns with `useMemo`
- [ ] Passed controlled state to `useDataTable`
- [ ] Defined `getRowId` with stable identity
- [ ] Set `autoResetAll: false` if data updates frequently
- [ ] Chose correct manual flags (pagination/sorting/filtering)
- [ ] Rendered `DataTable` and `DataTableToolbar`

---

### Layer 5: Create Column Factory

Column factories keep column definitions separate from table shells and reusable across contexts.

**Location**: `<ComponentPath>/TableColumns/<TableName>Columns.tsx`

**What to define**:
```tsx
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { ExpanderCell } from '@/components/TableCells/ExpanderCell'
import { MyActionCell } from '@/components/TableCells/MyActionCell'

interface GetMyTableColumnsOptions {
  onAction?: (row: MyRowType, action: string) => void
  userMode?: 'view' | 'edit'
  // Other injected dependencies
}

export function getMyTableColumns(
  options: GetMyTableColumnsOptions = {}
): ColumnDef<MyRowType>[] {
  const { onAction, userMode = 'view' } = options
  const columnHelper = createColumnHelper<MyRowType>()
  
  return [
    // Expander column (for hierarchical tables)
    columnHelper.display({
      id: 'expander',
      header: '',
      cell: ({ row }) => <ExpanderCell row={row} />,
      size: 40
    }),
    
    // Data columns
    columnHelper.accessor('name', {
      id: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const name = row.getValue('name') as string
        return <div className="font-medium">{name}</div>
      }
    }),
    
    columnHelper.accessor('status', {
      id: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return <StatusBadge status={status} />
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
    }),
    
    // Action column with external cell component
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <MyActionCell 
          row={row} 
          onAction={onAction}
          mode={userMode}
        />
      )
    })
  ]
}
```

**Factory Responsibilities**:
- Accept injected dependencies (callbacks, config, mode)
- Return typed `ColumnDef<T>[]`
- Use `DataTableColumnHeader` for sortable headers
- Delegate cell rendering to external components when complex
- Keep declarative - no hooks, no local state

**Checklist**:
- [ ] Created column factory function
- [ ] Accepts options object for dependencies
- [ ] Created typed `columnHelper`
- [ ] Used `DataTableColumnHeader` for headers
- [ ] Delegated complex cells to external components
- [ ] Defined `filterFn` for custom filtering logic
- [ ] Kept factory declarative (no hooks/state)

---

### Layer 6: Create External Cell Components

Complex cells should be external TSX files, not inline lambdas.

**Location**: `<ComponentPath>/TableCells/<CellName>Cell.tsx`

**When to externalize**:
- Cell uses hooks
- Cell manages interaction (clicks, expansion, selection)
- Cell talks to providers or context
- Cell needs reuse across tables
- Cell has meaningful local logic

**Example**:
```tsx
import { type Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface MyActionCellProps {
  row: Row<MyRowType>
  onAction?: (row: MyRowType, action: string) => void
  mode: 'view' | 'edit'
}

export function MyActionCell({ row, onAction, mode }: MyActionCellProps) {
  const { toast } = useToast()
  
  const handleDelete = useCallback(() => {
    onAction?.(row.original, 'delete')
    toast({ title: 'Item deleted' })
  }, [row.original, onAction, toast])
  
  if (mode === 'view') return null
  
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  )
}
```

**Common external cells**:
- Expander cells (hierarchy expansion)
- Selection cells (checkbox with propagation)
- Action cells (buttons, menus, dialogs)
- Badge/tooltip cells (interactive display)
- Link cells (navigation with context)

**Checklist**:
- [ ] Created external TSX file for complex cells
- [ ] Typed cell props with `Row<T>` from React Table
- [ ] Used hooks appropriately
- [ ] Handled callbacks and events
- [ ] Made cell reusable across tables

---

### Layer 7: Handle Row Identity and Hierarchy

**Flat Tables**:
```tsx
getRowId: (row) => row.id  // Use stable unique identifier
```

**Hierarchical Tables - CRITICAL CONFIGURATION**:

Hierarchical tables require ALL of the following. Missing any of these will break expansion or pagination:

```tsx
// 1. REQUIRED: Composed row IDs for parent-child relationships
getRowId: (row, index, parent) => {
  return parent ? `${parent.id}.${row.id}` : row.id
}

// 2. REQUIRED: Enable hierarchy traversal
getSubRows: (row) => row.children

// 3. REQUIRED: Expansion model (memoized to prevent recreating on every render)
getExpandedRowModel: useMemo(() => getExpandedRowModel(), [])

// 4. OPTIONAL: Control which rows can expand
getRowCanExpand: (row) => Boolean(row.original.children?.length)

// 5. CRITICAL: Prevent pagination from breaking expansion state
paginateExpandedRows: false

// 6. CRITICAL: Prevent data updates from collapsing expanded rows
autoResetAll: false
autoResetExpanded: false  // Extra safety for expansion state
```

**Why each setting matters**:

- **`getRowId` with parent composition**: Without this, React Table can't distinguish parent row "1" from child row "1", causing state corruption
- **`getSubRows`**: Tells React Table where to find child rows in your data structure
- **`getExpandedRowModel`**: Enables the expansion feature; without this, expand/collapse won't work
- **`paginateExpandedRows: false`**: Prevents expanded children from getting cut off when moving between pages (server paginates parents, client shows all children)
- **`autoResetAll: false`**: When data refreshes (e.g., polling, updates), prevents React Table from collapsing all expanded rows
- **`autoResetExpanded: false`**: Additional protection specifically for expansion state

**Complete hierarchical table example**:
```tsx
const table = useDataTable({
  data,
  columns,
  rowCount,
  
  // Controlled state
  value: {
    pagination,
    sorting,
    columnFilters,
    globalFilter: searchQuery ?? ''
  },
  
  // Hierarchy configuration - ALL REQUIRED
  getRowId: (row, index, parent) => parent ? `${parent.id}.${row.id}` : row.id,
  getSubRows: (row) => row.children,
  getExpandedRowModel: useMemo(() => getExpandedRowModel(), []),
  getRowCanExpand: (row) => Boolean(row.original.children?.length),
  
  // CRITICAL: Prevent state loss
  paginateExpandedRows: false,
  autoResetAll: false,
  autoResetExpanded: false,
  
  // Manual flags (common for hierarchical tables)
  manualPagination: true,   // Server paginates parent rows
  manualSorting: true,      // Server sorts parent rows
  manualFiltering: true     // Server filters parent rows
  // Note: expansion is always client-side
})
```

**Checklist**:
- [ ] Defined `getRowId` with parent-aware composition
- [ ] Added `getSubRows` pointing to children property
- [ ] Added memoized `getExpandedRowModel()`
- [ ] Set `paginateExpandedRows: false` (CRITICAL)
- [ ] Set `autoResetAll: false` (CRITICAL)
- [ ] Set `autoResetExpanded: false` (extra safety)
- [ ] Added expander column to column factory
- [ ] Documented that server handles pagination, client handles expansion

---

## Page-Level Parser Aggregation (Multi-Table Pages)

When a page owns multiple tables, compose multiple parser registries into one page-level registry.

**Example**:
```ts
// editDeploymentSearchParams.ts
import { catalogServicesSearchParams } from './CatalogServicesTable/catalogServicesTableSearchParams'
import { manifestServicesSearchParams } from './ManifestServicesTable/manifestServicesTableSearchParams'

export const editDeploymentSearchParams = {
  ...catalogServicesSearchParams,
  ...manifestServicesSearchParams
}

export const editDeploymentSearchParamsCache = createSearchParamsCache(
  editDeploymentSearchParams
)
```

This allows a single page URL to strongly type multiple independent tables.

---

## Implementation Workflow

Follow this sequence for every table:

1. **Define filter fields** → `*FilterFields.tsx`
2. **Define search params** → `*SearchParams.ts`
3. **Create URL-state hook** → `use*Filters.ts`
4. **Create table shell** → `*Table.tsx`
5. **Create column factory** → `TableColumns/*Columns.tsx`
6. **Externalize complex cells** → `TableCells/*Cell.tsx`
7. **Verify row identity** → Stable `getRowId`

---

## Verification Checklist

After implementing a table, verify these architectural properties:

**URL State**:
- [ ] All table state is in URL (shareable, reload-safe)
- [ ] Parser registry defines types, not string manipulation
- [ ] Reset semantics are in one place (URL-state hook)

**Separation of Concerns**:
- [ ] URL contract (parsers) separate from table contract (useDataTable)
- [ ] Column factory is declarative, no runtime state
- [ ] Complex cells are external TSX components
- [ ] Table shell orchestrates, doesn't own logic

**State Management**:
- [ ] Stable row identity with `getRowId`
- [ ] Controlled state passed to `useDataTable`
- [ ] Correct manual flags (pagination/sorting/filtering)
- [ ] `autoResetAll: false` if data updates frequently

**Type Safety**:
- [ ] Filter fields typed to row shape
- [ ] Column helper typed to row shape
- [ ] Cell components typed with `Row<T>`
- [ ] Search params registry exports types

---

## Common Patterns

### Server-Side vs Client-Side Operations

**Server-side** (API handles):
```tsx
manualPagination: true
manualSorting: true
manualFiltering: true
```

**Client-side** (React Table handles):
```tsx
manualPagination: false
manualSorting: false
manualFiltering: false
```

**Hybrid** (server data, client search):
```tsx
manualPagination: true      // Server paginates
manualSorting: true          // Server sorts
manualFiltering: true        // Server filters
manualGlobalFiltering: false // Client applies globalFilterFn
globalFilterFn: myCustomFilter
```

### Custom Global Filter

```tsx
function useMyGlobalFilter() {
  return useCallback((row: Row<MyRowType>, columnId: string, filterValue: string) => {
    const searchableFields = [
      row.original.name,
      row.original.description,
      row.original.tags?.join(' ')
    ]
    const searchString = searchableFields.join(' ').toLowerCase()
    return searchString.includes(filterValue.toLowerCase())
  }, [])
}
```

### Facet Options from Data

```tsx
const statusOptions = useMemo(() => {
  const statuses = new Set(data.map(item => item.status))
  return Array.from(statuses).map(status => ({
    label: status,
    value: status
  }))
}, [data])
```

---

## Examples

### Simple Flat Table

```
1. Filter fields: status (faceted), search (text)
2. Search params: page, per_page, sort, status, q
3. URL hook: useUsersFilters
4. Table shell: UsersTable
5. Columns: getUsersColumns
6. Cells: UserActionsCell
7. Row ID: row => row.userId
```

### Hierarchical Table

```
1. Filter fields: category (faceted), search (text)
2. Search params: page, per_page, sort, category, q
3. URL hook: useCatalogFilters
4. Table shell: CatalogTable with hierarchy config
5. Columns: getCatalogColumns (with expander column)
6. Cells: ExpanderCell, CatalogActionsCell
7. Hierarchy setup (ALL REQUIRED):
   - getRowId: (row, index, parent) => parent ? `${parent.id}.${row.id}` : row.id
   - getSubRows: row => row.children
   - getExpandedRowModel: useMemo(() => getExpandedRowModel(), [])
   - paginateExpandedRows: false (CRITICAL)
   - autoResetAll: false (CRITICAL)
   - autoResetExpanded: false
```

---

## File Organization

```
<TablePath>/
├── <TableName>.tsx                    # Table shell
├── <tableName>FilterFields.tsx        # Filter field definitions
├── <tableName>SearchParams.ts         # Parser registry
├── use<TableName>Filters.ts           # URL-state hook
│
TableColumns/
├── <TableName>Columns.tsx             # Column factory
│
TableCells/
├── <CellName>Cell.tsx                 # External cell components
```

---

## Key Takeaways

1. **URL is the source of truth** - All table state lives in typed URL params
2. **Layers stay separate** - URL contract ≠ table contract ≠ column definitions
3. **Factories are declarative** - Columns describe structure, not behavior
4. **Cells are external** - Hooks and interaction logic belong in TSX components
5. **Identity is stable** - Use `getRowId` and avoid auto-reset
6. **Reset is centralized** - URL-state hook owns all reset semantics

By following this architecture, you get tables that are:
- Type-safe end-to-end
- Shareable via URL
- Reload-safe
- Maintainable and testable
- Properly separated by concern

## Related skills

- `tanstack-table-patterns` — the underlying TanStack Table v8 patterns (meta
  object, editable cells, dynamic columns, virtualization).
- `nuqs-url-state` — the URL-state layer this architecture builds on.
- `excel-like-table-navigation` — add Excel-like keyboard navigation (roving
  tabindex, arrow/Tab/Enter/Esc, inline edit) on top of the table.
