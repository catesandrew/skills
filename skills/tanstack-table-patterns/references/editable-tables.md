# Editable Table Patterns

## Table of Contents

- [Edit/Save/Cancel Architecture](#editsavecancel-architecture)
- [Dynamic Cell Component](#dynamic-cell-component)
- [Validation System](#validation-system)
- [API Integration with SWR/React Query](#api-integration)
- [Virtualization and Infinite Scroll](#virtualization-and-infinite-scroll)

---

## Edit/Save/Cancel Architecture

### State structure

```tsx
const [data, setData] = useState<Student[]>([...defaultData])
const [originalData, setOriginalData] = useState<Student[]>([...defaultData])
const [editedRows, setEditedRows] = useState<Record<string, boolean>>({})
```

- `data` — current (potentially modified) state
- `originalData` — snapshot for cancel/revert
- `editedRows` — `{ [rowId]: true }` tracks which rows are in edit mode

### Meta functions

```tsx
meta: {
  editedRows,
  setEditedRows,
  revertData: (rowIndex: number, revert: boolean) => {
    if (revert) {
      setData(old => old.map((row, i) => i === rowIndex ? originalData[i] : row))
    } else {
      setOriginalData(old => old.map((row, i) => i === rowIndex ? data[i] : row))
    }
  },
  updateData: (rowIndex: number, columnId: string, value: string) => {
    setData(old => old.map((row, i) =>
      i === rowIndex ? { ...old[i], [columnId]: value } : row
    ))
  },
}
```

### EditCell component (action column)

Use `columnHelper.display()` for non-data action columns:

```tsx
columnHelper.display({ id: 'edit', cell: EditCell })

const EditCell = ({ row, table }) => {
  const meta = table.options.meta
  const setEditedRows = (e) => {
    const elName = e.currentTarget.name
    meta?.setEditedRows(old => ({ ...old, [row.id]: !old[row.id] }))
    if (elName !== 'edit') {
      meta?.revertData(row.index, elName === 'cancel')
    }
  }

  return meta?.editedRows[row.id] ? (
    <>
      <button onClick={setEditedRows} name="cancel">X</button>
      <button onClick={setEditedRows} name="done">✔</button>
    </>
  ) : (
    <button onClick={setEditedRows} name="edit">✐</button>
  )
}
```

## Dynamic Cell Component

Renders different input types based on column meta:

```tsx
const TableCell = ({ getValue, row, column, table }) => {
  const initialValue = getValue()
  const columnMeta = column.columnDef.meta
  const tableMeta = table.options.meta
  const [value, setValue] = useState(initialValue)

  useEffect(() => { setValue(initialValue) }, [initialValue])

  const onBlur = () => {
    tableMeta?.updateData(row.index, column.id, value)
  }

  // Read-only mode
  if (!tableMeta?.editedRows[row.id]) {
    return <span>{value}</span>
  }

  // Edit mode — render based on column type
  if (columnMeta?.type === 'select') {
    return (
      <select onChange={e => {
        setValue(e.target.value)
        tableMeta?.updateData(row.index, column.id, e.target.value)
      }} value={initialValue} required={columnMeta?.required}>
        {columnMeta?.options?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={onBlur}
      type={columnMeta?.type || 'text'}
      required={columnMeta?.required}
      pattern={columnMeta?.pattern}
    />
  )
}
```

## Validation System

### Field-level: HTML5 + custom callbacks

Column meta supports `required`, `pattern`, and custom `validate` callbacks:

```tsx
meta: {
  type: 'date',
  required: true,
  validate: (value: string) => new Date(value) <= new Date(),
  validationMessage: 'Date cannot be in the future',
}
```

In TableCell, use `setCustomValidity()` to trigger `:invalid` CSS pseudo-class:

```tsx
const displayValidationMessage = (e) => {
  if (columnMeta?.validate) {
    const isValid = columnMeta.validate(e.target.value)
    e.target.setCustomValidity(isValid ? '' : columnMeta.validationMessage)
    setValidationMessage(isValid ? '' : columnMeta.validationMessage)
  } else if (e.target.validity.valid) {
    setValidationMessage('')
  } else {
    setValidationMessage(e.target.validationMessage)
  }
}
```

### Row-level: disable save on invalid

Track validity per row in meta:

```tsx
// State shape: { rowIndex: { columnId: isValid } }
const [validRows, setValidRows] = useState({})

// In updateData, also update validity
setValidRows(old => ({
  ...old,
  [rowIndex]: { ...old[rowIndex], [columnId]: isValid },
}))

// In EditCell, check if save should be disabled
const validRow = meta?.validRows[row.id]
const disableSubmit = validRow
  ? Object.values(validRow).some(v => !v)
  : false
```

## API Integration

### Hook pattern (SWR example)

Encapsulate all CRUD operations in a single hook:

```tsx
export default function useStudents() {
  const { data, isValidating } = useSWR(url, getRequest)

  const addRow = async (postData) => {
    await fetch(url, { method: 'POST', body: JSON.stringify(postData) })
    mutate(url) // trigger refetch
  }

  const updateRow = async (id, postData) => {
    await fetch(`${url}/${id}`, { method: 'PUT', body: JSON.stringify(postData) })
    mutate(url)
  }

  const deleteRow = async (id) => {
    await fetch(`${url}/${id}`, { method: 'DELETE' })
    mutate(url)
  }

  return { data: data ?? [], isValidating, addRow, updateRow, deleteRow }
}
```

### Key changes vs local-only state

- Server becomes source of truth — remove `originalData` local state
- Sync via `useEffect` watching `isValidating`:
  ```tsx
  useEffect(() => {
    if (isValidating) return
    setData([...originalData])
  }, [isValidating])
  ```
- `revertData` only reverts local `data` — server data is untouched
- `mutate(url)` after writes triggers automatic refetch/sync

## Virtualization and Infinite Scroll

### Row virtualization

Use `@tanstack/react-virtual` with padding technique to simulate full height:

```tsx
const { virtualItems, totalSize } = useVirtual({
  parentRef,
  size: getRowModel().rows.length,
  estimateSize: useCallback(() => estimatedRowSize, [estimatedRowSize]),
})

const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
const paddingBottom = virtualItems.length > 0
  ? totalSize - virtualItems[virtualItems.length - 1].end
  : 0

// Wrap rows in a div with paddingTop/paddingBottom
// Iterate virtualItems instead of real rows
// Access real row: getRowModel().rows[virtualRow.index]
```

### Infinite scroll

Combine `react-bottom-scroll-listener` (or similar) with virtualization:

```tsx
const handleBottom = () => {
  if (!isLoadingMore) onBottom?.()
}

const parentRef = useBottomScrollListener(handleBottom, {
  offset: bottomOffset,
})
```

Pair with React Query's `useInfiniteQuery` for backend pagination:

```tsx
const { data, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery(
  ['items'],
  ({ pageParam = 0 }) => api.getItems({ offset: pageParam * 100 }),
  { getNextPageParam: (lastPage, pages) => lastPage.hasMore ? pages.length : undefined }
)

const items = data?.pages.flatMap(page => page.items) ?? []
```
