# Render Performance

## Table of Contents

- [Select for Partial Subscriptions](#select-for-partial-subscriptions)
- [Data Transformation Options](#data-transformation-options)
- [Structural Sharing](#structural-sharing)
- [Tracked Queries](#tracked-queries)
- [staleTime and gcTime](#staletime-and-gctime)

---

## Select for Partial Subscriptions

The `select` option creates derived subscriptions — components only re-render when the selected value changes:

```ts
// Base hook
export const useTodos = (select) =>
  useQuery({ queryKey: ['todos'], queryFn: fetchTodos, select })

// Derived hooks — each only re-renders for its own slice
export const useTodosCount = () => useTodos((data) => data.length)
export const useTodo = (id) => useTodos((data) => data.find(t => t.id === id))
```

`useTodosCount` won't re-render if a todo name changes — only if the count changes.

### Stability matters

Inline `select` functions run on every render. For expensive transforms, stabilize:

```ts
// GOOD — stable function reference, only runs when data changes
const transformNames = (data) => data.map(t => t.name.toUpperCase())
useQuery({ queryKey: ['todos'], queryFn: fetchTodos, select: transformNames })

// ALSO GOOD — useCallback
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: useCallback((data) => data.map(t => t.name.toUpperCase()), []),
})
```

## Data Transformation Options

| Where | Pros | Cons |
|-------|------|------|
| Backend | Zero frontend work | Not always possible |
| In `queryFn` | Colocated with fetch, simple | Runs every fetch, transforms cached data |
| In custom hook (`useMemo`) | Flexible | Runs every render unless memoized |
| `select` option | Best optimization, partial subscriptions | Structural sharing runs twice |

**Recommendation**: Use `select` when you need partial subscriptions or per-component transformations. Use `queryFn` transforms when the shape should be globally different from the API response.

## Structural Sharing

React Query preserves referential identity of unchanged parts across refetches. If only todo #1 changes, todo #2 keeps the same reference:

```json
// Before refetch:
[{ "id": 1, "status": "active" }, { "id": 2, "status": "todo" }]

// After refetch (todo 1 changed):
[{ "id": 1, "status": "done" },  { "id": 2, "status": "todo" }]
//  ^ new reference                ^ same reference as before
```

This makes `select` subscriptions work — `useTodo(2)` won't re-render because its object didn't change.

Structural sharing runs twice when using `select`: once on raw data, once on selected result.

Disable with `structuralSharing: false` if working with non-JSON data or very large datasets.

## Tracked Queries

Set `notifyOnChangeProps: 'tracked'` to auto-track which fields a component uses. Only re-renders when those fields change:

```tsx
// Global opt-in
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { notifyOnChangeProps: 'tracked' },
  },
})
```

Component that only uses `data` won't re-render for `isFetching` transitions.

**Limitations:**
- Rest destructuring (`const { isLoading, ...rest } = useQuery(...)`) tracks ALL fields
- Fields accessed only in effects (not during render) won't be tracked
- Once a field is tracked, it stays tracked for the observer's lifetime

## staleTime and gcTime

```
staleTime (default: 0)     — how long until data is "stale" and eligible for background refetch
gcTime (default: 5 minutes) — how long inactive (no observers) cache entries survive
```

**Key insight**: While data is fresh, it's served from cache only — no network requests regardless of `refetchOnMount` or `refetchOnWindowFocus`.

Set `staleTime` per feature based on how often the data changes:

```ts
// Global default: 20 seconds (deduplicates rapid mounts)
defaultOptions: { queries: { staleTime: 1000 * 20 } }

// Static config data: 5 minutes
queryClient.setQueryDefaults(['config'], { staleTime: 1000 * 60 * 5 })

// Form initial values: never refetch
useQuery({ queryKey: ['user', id], queryFn: fetchUser, staleTime: Infinity })
```

### The "double fetch" problem

When components mount conditionally (child mounts after parent has data), you may see two requests for the same key — because the second mount triggers a `refetchOnMount` and staleTime is 0.

**Fix**: set `staleTime` to a reasonable value (20s+), not by disabling refetch flags.
