---
name: react-ref-callbacks
description: Guide for using callback refs instead of useRef + useEffect for DOM node interactions. Use when writing code that needs to focus, scroll, measure, or observe DOM nodes after render — especially with conditionally rendered elements. Covers React 19 ref cleanup functions, ResizeObserver in refs, and when to prefer ref callbacks over useEffect.
---

# react-ref-callbacks

Prefer callback refs over `useRef` + `useEffect` for DOM node side effects. Callback refs are tied to the node's lifecycle (not the parent's), work with conditionally rendered elements, and produce less code.

## The Problem with useRef + useEffect

```tsx
const ref = useRef(null)

useEffect(() => {
  // ref.current is null if the node isn't rendered yet
  ref.current?.scrollIntoView({ behavior: 'smooth' })
}, [])

return <Form ref={ref} />
```

If the target element is conditionally rendered (e.g. behind a toggle), `ref.current` is still `null` when the effect runs. The effect is bound to the **parent's** lifecycle, not the **node's**.

## Callback Refs

A ref prop accepts a function that React calls with the DOM node after render:

```tsx
<input ref={(node) => { node?.scrollIntoView({ behavior: 'smooth' }) }} />
```

This runs when the node actually appears in the DOM — solving the conditional rendering problem.

### Stability: Extract, Don't useCallback

React re-runs inline callback refs on every render. For one-time operations, **extract the function outside the component** rather than wrapping in `useCallback`:

```tsx
// BEST — stable, no hooks needed, clear intent
function scrollIntoView(node) {
  node?.scrollIntoView({ behavior: 'smooth' })
}

function MyComponent() {
  return <div ref={scrollIntoView}>Content</div>
}
```

Avoid `useCallback` for callback refs — it creates a false dependency where removing the memoization breaks behavior, which conflicts with the React Compiler's assumption that `useCallback` is a performance optimization only.

### When Inline is Fine

Inline callback refs work when repeated execution is harmless. `setState` with the same primitive value bails out of re-rendering:

```tsx
function MeasureExample() {
  const [height, setHeight] = useState(0)

  return (
    <>
      <h1 ref={(node) => {
        if (node) setHeight(node.getBoundingClientRect().height)
      }}>Hello</h1>
      <p>Height: {Math.round(height)}px</p>
    </>
  )
}
```

**Caveat**: storing a new object (e.g. the full `DOMRect`) in state causes infinite re-renders — always extract primitive values.

## React 19: Cleanup Functions

In React 19+, callback refs can return a cleanup function (like effects):

```tsx
function MeasureExample() {
  const [height, setHeight] = useState(0)

  return (
    <h1 ref={(node) => {
      const observer = new ResizeObserver(([entry]) => {
        setHeight(entry.contentRect.height)
      })
      observer.observe(node)
      return () => observer.disconnect() // cleanup on unmount
    }}>Hello</h1>
  )
}
```

When a cleanup is returned, React no longer calls the ref with `null` on unmount — the cleanup replaces that behavior.

## Decision Guide

| Scenario | Use |
|----------|-----|
| Side effect needs the DOM node | Callback ref |
| Node is conditionally rendered | Callback ref |
| Side effect doesn't need a node (e.g. `document.title`) | `useEffect` |
| Async operations (data fetching) | Neither — use a data fetching library |
| Can extract function outside component | Extracted callback ref (best) |
| Need cleanup (observer, listener) | Callback ref with cleanup (React 19+) |
