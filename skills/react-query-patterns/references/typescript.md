# TypeScript Patterns

## Table of Contents

- [Don't Use Angle Brackets on useQuery](#dont-use-angle-brackets-on-usequery)
- [Type the queryFn, Not the Hook](#type-the-queryfn-not-the-hook)
- [queryOptions and DataTag](#queryoptions-and-datatag)
- [Zod Schema Validation](#zod-schema-validation)
- [End-to-End Type Safety](#end-to-end-type-safety)

---

## Don't Use Angle Brackets on useQuery

```ts
// BAD — manual generic, falls back to defaults for the other 3 generics
const query = useQuery<Todo>({ queryKey: ['todos', id], queryFn: fetchTodo })

// GOOD — types flow from queryFn return type
const query = useQuery({ queryKey: ['todos', id], queryFn: () => fetchTodo(id) })
```

If the input to `useQuery` is sufficiently typed, you never need angle brackets.

## Type the queryFn, Not the Hook

```ts
// Type the fetch function return value
const fetchTodo = async (id: number): Promise<Todo> => {
  const response = await axios.get(`/todos/${id}`)
  return response.data
}

// useQuery infers everything from queryFn
const query = useQuery({
  queryKey: ['todos', id],
  queryFn: () => fetchTodo(id),
})
query.data // ^? Todo | undefined
```

### The Golden Rule of Generics

> A generic must appear at least twice to be useful.

`axios.get<Todo>()` has a "return-only" generic — it's a type assertion in disguise. Prefer explicit return types on your fetch functions instead.

## queryOptions and DataTag

The `queryOptions` helper (v5) catches typos and tags keys with their return type:

```ts
const todosQuery = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  stallTime: 5000, // TypeScript ERROR: did you mean 'staleTime'?
})

// DataTag: getQueryData knows the type from the key
const todos = queryClient.getQueryData(todosQuery.queryKey)
//    ^? Todo[] | undefined — no manual generic needed
```

Without `queryOptions`, extracting query options to a constant loses excess property checking (TypeScript won't catch `stallTime` typo).

## Zod Schema Validation

Replace type assertions with runtime validation for true type safety:

```ts
import { z } from 'zod'

const todoSchema = z.object({
  id: z.number(),
  name: z.string(),
  done: z.boolean(),
})

const fetchTodo = async (id: number) => {
  const response = await axios.get(`/todos/${id}`)
  return todoSchema.parse(response.data) // throws on invalid shape
}
```

Benefits:
- `parse` throws a descriptive Error → React Query goes into error state (which you handle anyway)
- Type is inferred from schema — no separate type definition needed
- No type assertions, no lies to the compiler

Tradeoffs:
- Design schemas resiliently (optional fields as `.nullable().optional()`)
- Parsing has runtime overhead — apply to critical boundaries, not everywhere

## End-to-End Type Safety

For full-stack type safety (no schema drift), use:
- **tRPC**: API router defines types that flow to React Query hooks automatically
- **zodios**: REST API client with zod schemas that infer types

Both build on React Query and eliminate the "trusted boundary" problem where frontend types diverge from actual API responses.
