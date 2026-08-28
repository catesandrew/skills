# useReducer Patterns

## Table of Contents

- [Event-Driven Reducers](#event-driven-reducers)
- [Passing Props to Reducers](#passing-props-to-reducers)
- [Common useReducer Recipes](#common-useReducer-recipes)

---

## Event-Driven Reducers

Model actions as events (what happened), not setters (what to change). This keeps logic in the reducer where it's testable and centralized:

```tsx
// GOOD — logic lives in the reducer, UI just dispatches events
const reducer = (state, action) => {
  switch (action) {
    case 'increment':
      return state + 1
    case 'decrement':
      return Math.max(0, state - 1) // lower bound logic here
  }
}

function Counter() {
  const [count, dispatch] = useReducer(reducer, 0)
  return <button onClick={() => dispatch('increment')}>+</button>
}
```

```tsx
// BAD — logic scattered in UI, reducer is just a setter
const reducer = (state, action) => {
  switch (action.type) {
    case 'set':
      return action.value
  }
}

// UI has to compute the new value
<button onClick={() => dispatch({ type: 'set', value: count + 1 })}>+</button>
```

**Guideline**: avoid actions with "set" in their name. If the reducer just assigns a value, you don't need a reducer.

## Passing Props to Reducers

Closure over props or server state by wrapping the reducer in a function. This avoids syncing external data into reducer state:

```tsx
const reducer = (amount) => (state, action) => {
  switch (action) {
    case 'increment':
      return state + amount
    case 'decrement':
      return state - amount
  }
}

function useCounterState() {
  const { data } = useQuery({ queryKey: ['amount'], queryFn: fetchAmount })
  return useReducer(reducer(data ?? 1), 0)
}
```

The reducer always sees the latest `amount` from the server without any effect-based syncing.

## Common useReducer Recipes

### Boolean toggle

```tsx
const [isOpen, toggleOpen] = useReducer(prev => !prev, false)

<button onClick={toggleOpen}>Toggle</button>
```

### Force re-render

```tsx
const forceUpdate = useReducer(s => s + 1, 0)[1]
```

Note: React 18+ provides `useSyncExternalStore` for external store subscriptions — prefer that over `forceUpdate` in libraries.

### Multi-step wizard

useReducer shines when different actions affect multiple parts of state with dependencies between them (e.g. resetting step 3 data when navigating back to step 2):

```tsx
const wizardReducer = (state, action) => {
  switch (action.type) {
    case 'next':
      return {
        ...state,
        currentStep: state.currentStep + 1,
      }
    case 'back':
      return {
        ...state,
        currentStep: state.currentStep - 1,
        // Clear data from steps ahead
        steps: state.steps.map((step, i) =>
          i > state.currentStep - 1 ? { ...step, data: null } : step
        ),
      }
    case 'updateStep':
      return {
        ...state,
        steps: state.steps.map((step, i) =>
          i === action.stepIndex ? { ...step, data: action.data } : step
        ),
      }
  }
}
```

### Redux style guide (applicable subset)

Follow these principles from the Redux style guide when using useReducer:

- **Do not mutate state** — always return new objects
- **Reducers must not have side effects** — no API calls, no logging, no random values
- **Model actions as events, not setters** — describe what happened, not what to change
