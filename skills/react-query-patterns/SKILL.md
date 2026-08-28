---
name: react-query-patterns
description: Guide for writing correct, performant TanStack React Query (v5) code. Use when writing or reviewing React Query code — covering query key design, mutations and cache invalidation, render optimizations (select, structural sharing, tracked queries), TypeScript type safety (queryOptions, zod validation), data transformations, staleTime tuning, and the mental model of treating server state as cache.
---

# react-query-patterns

Best practices for TanStack React Query v5: query keys, mutations, render performance, TypeScript, and the "server state as cache" mental model.

## Core Mental Model

**Server state is not client state.** React Query manages a cache of borrowed server data. Don't copy it into `useState` — you'll lose background updates. Don't treat the query cache as a local state manager.

```tsx
// BAD — copies server state into client state, loses sync
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
const [todos, setTodos] = useState(data) // stale copy

// GOOD — use data directly, always fresh
const { data: todos } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
```

Exception: form initial values. Copy once with `staleTime: Infinity` to prevent background updates overwriting user edits.

## Rules

### 1. Query keys are dependency arrays

Put every variable your `queryFn` uses into the query key. React Query refetches when the key changes — don't use `refetch()` with different params:

```tsx
// BAD — imperative refetch with params
const { refetch } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
<Filters onApply={() => refetch(???)} />

// GOOD — key drives the query declaratively
const [filters, setFilters] = useState()
const { data } = useQuery({
  queryKey: ['todos', filters],
  queryFn: () => fetchTodos(filters),
})
<Filters onApply={setFilters} />
```

### 2. Structure keys: generic → specific

```ts
['todos', 'list', { filters: 'all' }]
['todos', 'list', { filters: 'done' }]
['todos', 'detail', 1]
['todos', 'detail', 2]
```

Enables fuzzy invalidation: `invalidateQueries({ queryKey: ['todos'] })` hits everything, `['todos', 'list']` hits all lists.

### 3. Use query key factories with queryOptions (v5)

Colocate keys with query functions. Never separate them:

```ts
const todoQueries = {
  all: () => ['todos'],
  lists: () => [...todoQueries.all(), 'list'],
  list: (filters: string) =>
    queryOptions({
      queryKey: [...todoQueries.lists(), filters],
      queryFn: () => fetchTodos(filters),
    }),
  details: () => [...todoQueries.all(), 'detail'],
  detail: (id: number) =>
    queryOptions({
      queryKey: [...todoQueries.details(), id],
      queryFn: () => fetchTodo(id),
      staleTime: 5000,
    }),
}
```

`queryOptions` provides: type-safe keys (catches typos), `DataTag` for typed `getQueryData`, and reuse across `useQuery`/`prefetchQuery`/`useSuspenseQuery`.

### 4. Prefer `select` for data transformations

```tsx
// GOOD — only re-renders when count changes, not when todo names change
export const useTodosCount = () =>
  useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (data) => data.length,
  })
```

`select` enables partial subscriptions — components only re-render when the selected slice changes. Extract selector to a stable reference if expensive.

### 5. Customize staleTime, don't disable refetches

Don't turn off `refetchOnWindowFocus`/`refetchOnMount`. Instead, set `staleTime` to control how long data is "fresh" (no network request while fresh):

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 20 }, // 20 seconds globally
  },
})

// Per-feature override
queryClient.setQueryDefaults(todoQueries.all(), { staleTime: 1000 * 60 })
```

### 6. Always wrap queries in custom hooks

Colocate query key, query function, and options. Keep actual fetch logic out of components:

```tsx
export const useTodos = (filters: string) =>
  useQuery(todoQueries.list(filters))
```

### 7. Mutations: invalidate, don't set

Prefer `invalidateQueries` over `setQueryData` after mutations. Direct updates are fragile with sorted/filtered lists:

```tsx
const useUpdateTodo = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateTodo,
    onSuccess: () => {
      // Return the promise to keep mutation in loading state until refetch completes
      return queryClient.invalidateQueries({ queryKey: todoQueries.lists() })
    },
  })
}
```

### 8. Separate mutation callback concerns

- `useMutation` callbacks: logic (invalidation, cache updates) — always fires
- `mutate()` callbacks: UI (redirects, toasts) — skipped if component unmounts

```tsx
const useUpdateTodo = () =>
  useMutation({
    mutationFn: updateTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }), // always
  })

// In component:
updateTodo.mutate(data, {
  onSuccess: () => navigate('/todos'), // only if still mounted
})
```

## Detailed References

- **Query keys & mutations**: key factories, invalidation strategies, optimistic updates, `mutate` vs `mutateAsync` — see [references/query-keys.md](references/query-keys.md)
- **Render performance**: `select`, structural sharing, tracked queries, `notifyOnChangeProps`, status checks — see [references/render-performance.md](references/render-performance.md)
- **TypeScript**: `queryOptions`, inference vs angle brackets, zod validation, end-to-end type safety — see [references/typescript.md](references/typescript.md)

## Related skills

- `react-query-cache-determinism` — deterministic cache **updates** for CRUD
  mutations: cancel-in-flight, update all related caches, deep-merge vs replace,
  optimistic status, invalidate-only-on-error. Go here when a mutation flickers
  or list/detail views disagree.
- `nextjs-react-query-cache-coordination` — when these caches cross the Next.js
  App Router boundary: Router Cache vs Data Cache, `updateTag` vs
  `revalidateTag`, hydration timestamp races, `initialData` pitfalls. Go here for
  "saved but the UI reverted on navigation."
