---
name: react-use-state
description: Guide for correct useState and useReducer usage in React. Use when writing or reviewing state management code — especially for derived state, initializing state from props, functional updaters, one-time initializations, choosing between useState and useReducer, or when syncing state with useEffect (which is usually wrong).
---

# react-use-state

Avoid common useState pitfalls. Covers derived state, props-to-state patterns, functional updaters, one-time initialization, and when to use useReducer instead.

## Rules

### 1. Don't store derived state

If a value can be computed from existing state or props, it's not state:

```tsx
// BAD — categories can desync from data
const [data, setData] = useState(null)
const [categories, setCategories] = useState([])

useEffect(() => {
  if (data) setCategories(computeCategories(data))
}, [data])

// GOOD — single source of truth, always consistent
const [data, setData] = useState(null)
const categories = data ? computeCategories(data) : []
```

**Rule**: if a state setter is only called synchronously inside an effect, eliminate that state. Use `useMemo` only if you've measured the computation is expensive.

### 2. Props to state: use keys, not effects

`useState` initial values are only used on mount — re-renders discard them. Never sync props to state with an effect:

```tsx
// BAD — syncs on prop value change, not on entity change
function DetailView({ initialEmail }) {
  const [email, setEmail] = useState(initialEmail)
  useEffect(() => setEmail(initialEmail), [initialEmail]) // anti-pattern
}
```

Three correct approaches:

| Pattern | When to use |
|---------|-------------|
| **Key prop** (best default) | `<DetailView key={id} initialEmail={email} />` — remounts on entity change |
| **Lift state up** | Parent owns draft state, child is fully controlled |
| **Conditional render** | Component unmounts/remounts naturally (modals, tabs) |

### 3. Use functional updaters for state-dependent updates

```tsx
// BAD — both calls see the same count, only increments by 1
setCount(count + 1)
setCount(count + 1)

// GOOD — each updater sees the result of the previous one
setCount(prev => prev + 1)
setCount(prev => prev + 1)
```

Also reduces `useCallback` dependencies:

```tsx
// Avoids depending on count — stable callback
const increment = useCallback(
  () => setCount(prev => prev + incrementBy),
  [incrementBy] // no count dependency needed
)
```

### 4. Use lazy initializers for expensive setup

```tsx
// BAD — runs every render, result discarded after first
const [value, setValue] = useState(expensiveComputation(props))

// GOOD — function only called on mount
const [value, setValue] = useState(() => expensiveComputation(props))
```

### 5. Use useState (not useMemo) for one-time initialization

`useMemo` has no semantic guarantee — React may discard cached values. For truly stable references, use `useState` with a lazy initializer and ignore the setter:

```tsx
// BAD — React may recalculate this
const resource = useMemo(() => new Resource(), [])

// GOOD — guaranteed stable for component lifetime
const [resource] = useState(() => new Resource())
```

### 6. Know when to use useReducer

| Pattern | Use |
|---------|-----|
| Independent fields | Separate `useState` calls |
| Fields that update together | Single `useState` with object |
| Multiple actions update different parts of state | `useReducer` |
| Boolean toggle | `useReducer(prev => !prev, true)` |

For detailed useReducer patterns (event-driven actions, passing props to reducers), see [references/use-reducer-patterns.md](references/use-reducer-patterns.md).

## TypeScript Tip

Use the convenience overload for nullable initial state:

```tsx
// Instead of: useState<number | null>(null)
const [age, setAge] = useState<number>() // type is number | undefined
```
