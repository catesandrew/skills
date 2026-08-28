---
name: react-hooks-closures
description: Guide for writing correct React hooks code that avoids stale closures. Use when writing or reviewing useEffect, useMemo, useCallback, or React.memo code — especially when dealing with dependency arrays, memoization, callback stability, or when someone asks about stale closures, stale state, or the "latest ref" pattern.
---

# react-hooks-closures

Prevent stale closure bugs in React hooks code. Covers dependency arrays, memoization pitfalls, refs as escape hatches, and the latest ref pattern.

## Core Mental Model: The Photo Analogy

Every time React creates a function (via render, `useCallback`, `useMemo`, `useEffect`), it takes a **photo**. That photo captures everything the function closes over — props, state, local variables — frozen at creation time.

- **Re-render** = throw away old photo, take a new one (fresh values)
- **Memoization** (`useCallback(fn, [deps])`) = keep the old photo until deps change
- **Empty deps** (`useCallback(fn, [])`) = keep the first photo forever — everything in it becomes stale
- **Refs** = photoshop — mutate the photo in place so it always shows the latest value

## Rules

### 1. Never lie about dependencies

Set `react-hooks/exhaustive-deps` to **error**, not warn. Include every value the closure reads. The linter catches what humans miss.

```tsx
// BAD — stale closure: count is always 1
const logCount = useCallback(() => {
  console.log(count)
}, [])

// GOOD — fresh value whenever count changes
const logCount = useCallback(() => {
  console.log(count)
}, [count])
```

### 2. Don't exclude functions from React.memo comparisons

Custom `areEqual` functions that ignore callback props create stale closures the linter can't catch:

```tsx
// DANGEROUS — onChange becomes stale when only value changes
const Fast = React.memo(Slow, (prev, next) => prev.value === next.value)
```

If `onChange` closes over other state (e.g. `name`), it will see stale `name` until `value` also changes. This creates intermittent bugs that are hard to reproduce.

### 3. Use the latest ref pattern for stable callbacks in hooks

When a custom hook accepts a callback and uses it in an effect, avoid forcing consumers to memoize. Store the callback in a ref instead:

```tsx
function useDebouncedState(callback, delay) {
  const [value, setValue] = useState('')
  const callbackRef = useRef(callback)

  useLayoutEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const id = setTimeout(() => {
      if (value) callbackRef.current(value)
    }, delay)
    return () => clearTimeout(id)
  }, [value, delay]) // callback excluded safely via ref

  return [value, setValue]
}
```

**When to apply**: custom hooks and library code where consumers shouldn't need to wrap callbacks in `useCallback`.

### 4. useEffectEvent (experimental, React 19+)

React's built-in solution for the latest ref pattern. Declares a stable function that always reads the latest props/state without needing a dependency array entry:

```tsx
function useDebouncedState(callback, delay) {
  const [value, setValue] = useState('')
  const onTimeout = useEffectEvent(callback)

  useEffect(() => {
    const id = setTimeout(() => {
      if (value) onTimeout(value)
    }, delay)
    return () => clearTimeout(id)
  }, [value, delay]) // onTimeout excluded — it's an event function

  return [value, setValue]
}
```

**Status**: experimental — verify availability before using. Fall back to the latest ref pattern (rule 3) when unavailable.

## Decision Flowchart

```
Need a stable callback?
├─ In a component → useCallback with correct deps
├─ In a custom hook (consumer-facing) → latest ref pattern
├─ React 19+ with useEffectEvent available → useEffectEvent
└─ In React.memo areEqual → include ALL props that callbacks close over
```

## Detailed Reference

For full explanations, code examples, and the photo analogy walkthrough, see [references/patterns.md](references/patterns.md).
