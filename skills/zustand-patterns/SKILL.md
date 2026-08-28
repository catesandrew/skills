---
name: zustand-patterns
description: Guide for writing well-structured Zustand stores in React. Use when creating or reviewing Zustand stores — covering store organization, selectors, action patterns, combining stores with React Query or other hooks, and using React Context for scoped/reusable stores instead of global singletons.
---

# zustand-patterns

Best practices for Zustand store design: selectors, actions, scoping, and the Context pattern for reusable stores.

## Store Organization

### 1. Only export custom hooks, never the store

Keep the store private. Export atomic selector hooks so consumers can't accidentally subscribe to the entire store:

```ts
// NOT exported — prevents full-store subscriptions
const useBearStore = create((set) => ({
  bears: 0,
  fish: 0,
  actions: {
    increasePopulation: (by) =>
      set((state) => ({ bears: state.bears + by })),
    eatFish: () => set((state) => ({ fish: state.fish - 1 })),
  },
}))

// Exported — consumers don't write selectors
export const useBears = () => useBearStore((state) => state.bears)
export const useFish = () => useBearStore((state) => state.fish)
export const useBearActions = () => useBearStore((state) => state.actions)
```

**Why**: `const { bears } = useBearStore()` subscribes to everything — the component re-renders when *any* field changes, not just `bears`.

### 2. Use atomic selectors

Zustand uses strict equality (`===`) to decide if a subscriber should re-render. Selectors that return new objects/arrays always trigger re-renders:

```ts
// BAD — new object every time, equivalent to no selector at all
const { bears, fish } = useBearStore((state) => ({
  bears: state.bears,
  fish: state.fish,
}))

// GOOD — two atomic hooks, each only re-renders when its value changes
const bears = useBears()
const fish = useFish()
```

If you must return an object, pass `shallow` as the equality function — but prefer separate hooks.

### 3. Separate actions from state

Actions are static functions that never change. Group them under an `actions` namespace so a single selector can expose all actions without causing re-renders:

```ts
const useStore = create((set) => ({
  count: 0,
  actions: {
    increment: () => set((s) => ({ count: s.count + 1 })),
    reset: () => set({ count: 0 }),
  },
}))

export const useCount = () => useStore((s) => s.count)
export const useCountActions = () => useStore((s) => s.actions)
```

Destructuring from `useCountActions()` is safe — the `actions` object is referentially stable.

### 4. Model actions as events, not setters

Keep business logic in the store, not in components:

```ts
// BAD — logic in the component
dispatch({ type: 'set', value: count + 1 })

// GOOD — logic in the store
actions: {
  increment: () => set((s) => ({ count: s.count + 1 })),
}
```

Avoid actions with "set" in their name — if the store just assigns values, you don't need a store.

### 5. Keep stores small

Unlike Redux, Zustand encourages multiple small stores per feature. Combine them with custom hooks:

```ts
// Combine Zustand with React Query
export const useFilteredTodos = () => {
  const filters = useAppliedFilters() // from Zustand store
  return useQuery({
    queryKey: ['todos', filters],
    queryFn: () => getTodos(filters),
  })
}
```

## Context Pattern: Scoped Stores

Global stores have three problems: can't initialize from props, hard to test (need mocking/reset), and can't reuse across multiple instances. Fix all three by sharing the **store instance** (not values) via React Context.

### Setup

```tsx
import { createStore, useStore } from 'zustand'

const BearStoreContext = React.createContext(null)

const BearStoreProvider = ({ children, initialBears }) => {
  // useState ensures store is created once (not useMemo — no semantic guarantee)
  const [store] = React.useState(() =>
    createStore((set) => ({
      bears: initialBears,
      actions: {
        increasePopulation: (by) =>
          set((state) => ({ bears: state.bears + by })),
      },
    }))
  )

  return (
    <BearStoreContext.Provider value={store}>
      {children}
    </BearStoreContext.Provider>
  )
}
```

### Consumer hook

```tsx
const useBearStore = (selector) => {
  const store = React.useContext(BearStoreContext)
  if (!store) {
    throw new Error('Missing BearStoreProvider')
  }
  return useStore(store, selector)
}

export const useBears = () => useBearStore((state) => state.bears)
```

### Key differences from global stores

| | Global (`create`) | Context (`createStore` + Provider) |
|---|---|---|
| Initialize from props | Requires `useEffect` sync | Direct — pass to `createStore` |
| Testing | Mock/reset between tests | Isolated per render — no cleanup |
| Multiple instances | Shared state (broken) | Each Provider has its own store |
| Boilerplate | Minimal | Provider + Context + consumer hook |

### When to use which

- **Global store**: truly app-wide singletons (auth, theme, feature flags)
- **Context store**: route-scoped state, reusable components, anything needing prop initialization or test isolation
