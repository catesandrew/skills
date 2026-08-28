---
name: audit-react-component
description: Use when you need a thorough review of a React component for hooks correctness, render performance, memoization, controlled vs uncontrolled inputs, and React 19 compatibility.
---

# audit-react-component

Rigorous, reusable review for React components (React 18+/19 compatible). Flags correctness, performance, and render stability issues with actionable fixes.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:files}` | Component file path(s) to audit | `src/components/UserForm.tsx` |
| `${input:context}` | Component purpose, usage notes, or known issues (optional) | `Form used in checkout flow, receives cart as prop` |

## Tasks

### 1. Understand intent
- Summarize what the component does and how it is used.
- Note any assumptions or missing context from `${input:context}`.

### 2. Rules of Hooks
- Hooks called only at the top level — never in conditionals, loops, or nested functions.
- Consistent hook call order across all renders.
- Custom hooks: named with `use` prefix, not returning JSX.
- `useEffect` / `useLayoutEffect` used appropriately (layout reads → `useLayoutEffect`, everything else → `useEffect`).

### 3. State and effects

**Dependency arrays:**
- No missing deps (stale closures where a value is used but not listed).
- No over-broad deps (objects/arrays created inline that cause effects to re-run every render).
- No unnecessary deps (values that never change, like `setState` functions from `useState`).

**Memory leaks — confirm cleanup for:**
- `setInterval` / `setTimeout` → `clearInterval` / `clearTimeout`
- Event listeners (`addEventListener`) → `removeEventListener`
- Subscriptions (RxJS, EventEmitter, WebSocket) → unsubscribe/close
- AbortController for fetch → `abort()` on cleanup

**Effect intent:**
- Does each effect do one thing?
- Should any effects be moved to event handlers instead?

### 4. Rendering and performance
- What triggers a re-render? List all parent props and local state.
- Are any expensive computations done inline in render? → Move to `useMemo`.
- Are any functions created inline and passed to memoized children? → Move to `useCallback`.
- Are there unnecessary state updates that cause cascading renders?
- Layout thrashing: alternating DOM reads/writes without batching.

### 5. Memoization correctness
- `React.memo`: is the component re-rendering despite memoization? Check if props are referentially stable.
- `useMemo`: is the result actually used in a way that justifies the memoization cost?
- `useCallback`: is the callback passed to a dependency array, a memoized child, or an event listener? If not, it's premature optimization.
- Ensure memoized values don't capture stale state/props in their dependency arrays.

### 6. Controlled vs uncontrolled
- Controlled: `value` prop + `onChange` handler — both must be present.
- Uncontrolled: `defaultValue` for initial value — do not supply `value`.
- Mixed: component must not switch between controlled and uncontrolled across renders (causes React warning and undefined behavior).
- `key` prop to reset uncontrolled state when the logical entity changes.

### 7. Props and API surface
- Are all props necessary? Can any be derived from others?
- Prop stability: are objects/arrays/functions passed as props stable between renders at the call site?
- Prop drilling: if props pass through 3+ components unchanged, consider context or composition.
- Are required props actually marked required (PropTypes or TypeScript non-optional)?

### 8. React 18+/19 specifics
- **Strict Mode double-invocation:** effects run twice in development. Ensure all effects are idempotent or cleaned up.
- **`use` hook:** only usable at the top level; wraps Promises and Context. Must be inside a Suspense boundary.
- **Server Components (if applicable):** no hooks, no browser APIs, no event handlers.
- **Transitions (`useTransition`, `startTransition`):** expensive state updates should be wrapped to keep UI responsive.
- **Concurrent safety:** no side effects in the render function body (no mutations, no subscriptions).

### 9. Testing suggestions
- Unit test for each hook's behavior (custom hooks with `renderHook`).
- Test that cleanup functions fire (mock timers, spy on `removeEventListener`).
- Render count test using `vi.fn()` or a ref counter to assert memoization works.
- Controlled input: test that value + onChange work together without controlled/uncontrolled warnings.

## Output Format

### ✅ Summary
One paragraph: overall health, top 3 risks.

### 🧠 Hooks & Effects
Issues or confirmation of correctness; include file:line references.

### ⚡ Performance & Renders
Unnecessary renders, memoization opportunities, expensive computations.

### 🎛 Controlled vs Uncontrolled
Issues and exact fixes.

### 🧩 Props & API
Stability issues, prop drilling candidates, missing defaults.

### 🔄 React 18+/19 Compatibility
Strict Mode issues, concurrent safety, `use` hook usage.

### 🧪 Tests to add
Concrete, minimal test ideas tied to findings.

### 🔧 Suggested fixes
Ordered list: highest-impact changes first.

## Common Mistakes
- **Empty dependency array with a value used inside** — `[]` means "run once", but if the effect references state/props, it will use stale values.
- **Object/array in dep array** — `useEffect(() => {}, [{ id }])` re-runs every render because `{}` is a new reference each time. Use the primitive: `[id]`.
- **Forgetting cleanup for subscriptions** — leads to "Can't perform state update on unmounted component" warnings and memory leaks.
- **`React.memo` with non-primitive props** — wrapping in memo is pointless if the parent always creates new object/function references.
