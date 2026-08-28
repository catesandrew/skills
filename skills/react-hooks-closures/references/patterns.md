# Stale Closure Patterns — Detailed Reference

## Table of Contents

- [The Photo Analogy (Full)](#the-photo-analogy-full)
- [Stale Closure in useCallback](#stale-closure-in-usecallback)
- [Stale Closure in React.memo](#stale-closure-in-reactmemo)
- [The Latest Ref Pattern](#the-latest-ref-pattern)
- [useEffectEvent](#useeffectevent)
- [Common Mistakes Checklist](#common-mistakes-checklist)

---

## The Photo Analogy (Full)

Closures in JavaScript capture their surrounding scope at creation time. In React, think of each function creation as **taking a photo**:

- **Foreground**: the function body (what it does)
- **Background**: every variable from the outer scope the function references (props, state, locals)

The photo is immutable — it shows exactly what existed when it was taken. Calling the function = looking at the photo and executing what's on it.

**Re-rendering** = taking a new photo. The old function is discarded, a new one is created with fresh values in the background. This is why closures "just work" most of the time in React — every render gets a fresh snapshot.

**Memoization** (`useCallback`, `useMemo`) = telling React "keep the old photo unless these specific things changed." If dependencies are correct, you get a new photo when needed. If dependencies are wrong (or empty), you keep a stale photo.

**Refs** = photoshop. A ref is a mutable container (`{ current: value }`). The ref object itself never changes (referentially stable), but `.current` can be mutated. When a function reads `ref.current`, it always gets the latest value — even from an old photo — because it's reading a mutable reference, not a captured snapshot.

## Stale Closure in useCallback

```tsx
function App() {
  const [count, increment] = useReducer((prev) => prev + 1, 1)

  // STALE: empty deps = photo taken once, count frozen at 1
  const logCount = useCallback(() => {
    console.log(count)
  }, [])

  return (
    <div>
      <div>count is {count}</div>
      <button onClick={increment}>increment</button>
      <button onClick={logCount}>log</button> {/* always logs 1 */}
    </div>
  )
}
```

**Fix**: include `count` in the dependency array: `[count]`.

## Stale Closure in React.memo

This is the most dangerous pattern because the linter cannot catch it:

```tsx
function User({ name }) {
  const [count, increment] = useReducer((prev) => prev + 1, 1)

  // logUser closes over both name AND count
  const logUser = () => console.log(name, count)

  return (
    <div>
      <button onClick={increment}>increment</button>
      <FastComponent value={count} onChange={logUser} />
    </div>
  )
}

// DANGEROUS: only compares value, ignores onChange
const FastComponent = React.memo(
  SlowComponent,
  (prev, next) => prev.value === next.value
)
```

If `name` changes but `count` doesn't, `FastComponent` keeps the old `logUser` that has a stale `name`. This can go undetected for weeks because it only manifests when specific prop change sequences occur.

**Fix**: either include all callback-relevant props in the comparison, or restructure so callbacks don't close over unstable values.

## The Latest Ref Pattern

Store a callback in a ref and update it on every render. The effect reads from the ref instead of closing over the callback directly:

```tsx
function useDebouncedState(callback, delay) {
  const [value, setValue] = useState('')

  // Step 1: store callback in a ref
  const ref = useRef(callback)

  // Step 2: keep ref.current up to date
  useLayoutEffect(() => {
    ref.current = callback
  }, [callback])

  // Step 3: use ref.current in the effect
  useEffect(() => {
    const id = setTimeout(() => {
      if (value) ref.current(value)
    }, delay)
    return () => clearTimeout(id)
  }, [value, delay]) // callback safely excluded

  return [value, setValue]
}
```

**Why `useLayoutEffect` for the update?** It runs synchronously after render but before effects, ensuring `ref.current` is always up-to-date before any effect reads it.

**When to use**: custom hooks and library APIs where forcing consumers to memoize callbacks is bad DX.

## useEffectEvent

React's official escape hatch (experimental, React 19+). Creates a stable function that always reads the latest props/state:

```tsx
function useDebouncedState(callback, delay) {
  const [value, setValue] = useState('')

  // Stable reference, always reads latest callback
  const onTimeout = useEffectEvent(callback)

  useEffect(() => {
    const id = setTimeout(() => {
      if (value) onTimeout(value)
    }, delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return [value, setValue]
}
```

Key properties of `useEffectEvent`:
- Returns a stable function (no dependency array needed)
- Always sees the latest props and state (no stale closures)
- Cannot be called during rendering — only from effects and event handlers
- The linter knows to exclude event functions from dependency arrays

**Status**: experimental as of React 19. Verify availability before using. Use the latest ref pattern as a fallback.

## Common Mistakes Checklist

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Empty deps with state/props used inside | Value never updates | Add missing deps |
| Object/array literal in dep array | Effect runs every render | Use primitive values or `useMemo` |
| Excluding callback from `React.memo` comparison | Intermittent stale data in callbacks | Include all props that callbacks close over |
| Ignoring `exhaustive-deps` lint warnings | Stale values in effects/callbacks | Set rule to error, fix all violations |
| Inline function prop to memoized child | Child re-renders despite `React.memo` | `useCallback` at call site, or latest ref in child |
| Storing callback in ref without `useLayoutEffect` | Possible stale callback in concurrent mode | Use `useLayoutEffect` to sync ref updates |
