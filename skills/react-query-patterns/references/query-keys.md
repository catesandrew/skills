# Query Keys, Mutations & Cache

## Table of Contents

- [Key Structure](#key-structure)
- [Key Factories](#key-factories)
- [Invalidation Strategies](#invalidation-strategies)
- [Mutation Patterns](#mutation-patterns)
- [Optimistic Updates](#optimistic-updates)

---

## Key Structure

Structure from most generic to most specific:

```
['todos']                              — all todo-related
['todos', 'list']                      — all lists
['todos', 'list', { filters: 'all' }] — specific filtered list
['todos', 'detail']                    — all details
['todos', 'detail', 1]                — specific detail
```

Rules:
- Never share keys between `useQuery` and `useInfiniteQuery` — different data structures
- Always use arrays (string keys are converted internally anyway)
- Colocate keys with their queries in feature directories, not in a global `queryKeys.ts`

## Key Factories

v5 pattern — combine key-only entries (for invalidation) with full `queryOptions` entries (for queries):

```ts
import { queryOptions } from '@tanstack/react-query'

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

Usage:

```ts
// Query
useQuery(todoQueries.list('done'))

// Prefetch
queryClient.prefetchQuery(todoQueries.detail(5))

// Invalidate all lists
queryClient.invalidateQueries({ queryKey: todoQueries.lists() })

// Remove everything todo-related
queryClient.removeQueries({ queryKey: todoQueries.all() })

// Type-safe getQueryData (via DataTag)
const todo = queryClient.getQueryData(todoQueries.detail(5).queryKey)
//    ^? Todo | undefined — no manual generic needed
```

## Invalidation Strategies

After a mutation that updates a todo:

**Option 1: Invalidate lists, update detail directly**
```ts
onSuccess: (newTodo) => {
  queryClient.setQueryData(todoQueries.detail(newTodo.id).queryKey, newTodo)
  queryClient.invalidateQueries({ queryKey: todoQueries.lists() })
}
```

**Option 2: Update current list, invalidate others**
```ts
onSuccess: (newTodo) => {
  queryClient.setQueryData(todoQueries.detail(newTodo.id).queryKey, newTodo)
  queryClient.setQueryData(
    todoQueries.list(currentFilters).queryKey,
    (old) => old?.map(t => t.id === newTodo.id ? newTodo : t)
  )
  queryClient.invalidateQueries({
    queryKey: todoQueries.lists(),
    refetchType: 'none', // mark stale but don't refetch
  })
}
```

**Option 3: Just invalidate everything** (simplest, recommended default)
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: todoQueries.all() })
}
```

## Mutation Patterns

### Return invalidation promise to stay in loading state

```ts
onSuccess: () => {
  return queryClient.invalidateQueries({ queryKey: ['posts'] })
  // mutation stays loading until queries refetch
}
```

Without `return`, mutation resolves immediately — queries refetch in background.

### Prefer `mutate` over `mutateAsync`

`mutate` handles errors internally. `mutateAsync` requires manual try/catch:

```ts
// GOOD — errors caught by React Query
mutation.mutate(data, {
  onSuccess: (result) => navigate(result.url),
})

// RISKY — unhandled promise rejection if you forget try/catch
const result = await mutation.mutateAsync(data)
```

Use `mutateAsync` only for: concurrent mutations you need to `Promise.all`, or dependent mutation chains.

### Single argument for variables

```ts
// BAD — multiple args not supported
mutation.mutate(title, body)

// GOOD — use an object
mutation.mutate({ title, body })
```

### Callback unmount behavior

`useMutation` callbacks always fire. `mutate()` callbacks don't fire if the component unmounts:

```ts
useMutation({
  mutationFn: updateTodo,
  onSuccess: () => {
    // ALWAYS runs — put invalidation here
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

// In component
mutation.mutate(data, {
  onSuccess: () => {
    // ONLY runs if component still mounted — put UI actions here
    toast.success('Updated!')
    navigate('/todos')
  },
})
```

## Optimistic Updates

Use sparingly — only when instant feedback is critical (toggle buttons, likes). Not recommended for:
- Forms that close/redirect on submit (hard to undo)
- Complex data structures (sorted lists, computed positions)
- Cases where the server response differs from the optimistic value

For most mutations, disabling the button + showing a loading state is sufficient UX.
