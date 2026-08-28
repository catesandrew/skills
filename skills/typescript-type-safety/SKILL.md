---
name: typescript-type-safety
description: Guide for writing safer TypeScript using compiler flags, type patterns, and anti-pattern avoidance. Use when writing or reviewing TypeScript code — especially for index signatures, Record types, exhaustive switch statements, discriminated unions, const assertions, any containment, optional vs undefined semantics, or array type syntax choices.
---

# typescript-type-safety

Patterns and compiler flags for maximizing TypeScript's type safety. Covers index access safety, exhaustive matching, `any` containment, `as const`, optional vs undefined, and array syntax.

## Compiler Flags to Enable

| Flag | What it does |
|------|-------------|
| `noUncheckedIndexedAccess` | Index access on `Record`/arrays returns `T \| undefined` instead of `T` |
| `exactOptionalPropertyTypes` | Prevents passing `undefined` to optional properties — distinguishes "missing" from "undefined" |
| `noImplicitReturns` | Catches missing return branches in switch statements |

## Rules

### 1. Optional vs required-but-undefined

These are NOT the same:

```ts
// Optional — can be omitted entirely
declare function canFetch(networkMode?: NetworkMode): boolean

// Required — must be passed, but value can be undefined
declare function canFetch(networkMode: NetworkMode | undefined): boolean
```

Use `T | undefined` (not `?`) when callers should always explicitly pass the argument. This catches forgotten call sites during refactoring.

For React props: `{ networkMode: NetworkMode | undefined }` forces `<Component networkMode={...} />` — omitting the prop is an error.

Enable `exactOptionalPropertyTypes` to prevent `Partial<T>` from allowing explicit `undefined` assignments, which can silently overwrite values via spread:

```ts
// With exactOptionalPropertyTypes OFF — dangerous
const merged = { ...user, ...{ id: undefined } } // id is now undefined!
```

### 2. Safe index access

`Record<string, T>` claims access always returns `T` — a lie at runtime. Enable `noUncheckedIndexedAccess`, or use:

```ts
type SafeRecord<K extends string | number | symbol, V> = Record<K, V | undefined>
```

For arrays, use `NonEmptyArray` when the first element must exist:

```ts
type NonEmptyArray<T> = [T, ...Array<T>]

const isNonEmpty = <T,>(arr: Array<T>): arr is NonEmptyArray<T> =>
  arr.length > 0
```

### 3. Exhaustive matching with never

Use discriminated unions + switch without a default. The compiler catches missing cases:

```ts
type Shape = { kind: 'circle'; radius: number } | { kind: 'rect'; w: number; h: number }

const render = (shape: Shape): string => {
  switch (shape.kind) {
    case 'circle': return `Circle r=${shape.radius}`
    case 'rect': return `Rect ${shape.w}x${shape.h}`
    // No default — compiler errors if a new variant is added
  }
}
```

For runtime safety (e.g. API responses may include unknown variants), add a `never` guard that still renders something:

```tsx
const Fallback = ({ shape }: { shape: never }) => <div>Unknown</div>

// In default branch:
default: return <Fallback shape={props} />
```

This gives compile-time exhaustiveness AND runtime resilience. Do NOT use a plain `default:` — it silently swallows new variants.

### 4. Contain `any` — it leaks

`any` is bidirectionally assignable and spreads through every operation:

```ts
const x: any = 5
const y = x + 1        // y is any
const z = { ...x, a: 1 } // z is any — even as const won't help
```

Spreading `any` onto JSX props disables all prop type checking silently.

**Containment strategies:**
- Use `unknown` instead — forces narrowing before use
- Keep `any` in the smallest possible scope
- Add explicit return types to util functions that touch `any`
- Avoid libraries with weak types (e.g. `lodash.get` returns `any`)
- Track type coverage — if it drops on a PR, investigate

### 5. Use `as const`, not type assertions

`as const` infers literal types, readonly arrays/tuples, and readonly objects. Unlike `as SomeType`, it doesn't lie to the compiler:

```ts
// BAD — hides errors if 'primary' is removed from Variant
const props = { variant: 'primary' } as Props

// GOOD — infers { readonly variant: 'primary' }, catches changes
const props = { variant: 'primary' } as const
```

**Extract types from const objects/arrays:**

```ts
const options = [
  { id: 'primary', label: 'Primary' },
  { id: 'secondary', label: 'Secondary' },
] as const

type Variant = (typeof options)[number]['id'] // 'primary' | 'secondary'
```

**Make function params `readonly`** — accepts both mutable and `as const` inputs:

```ts
// GOOD — works with both Array<string> and readonly ['a', 'b']
function first(items: ReadonlyArray<string>): string
```

### 6. Prefer `Array<T>` over `T[]`

`T[]` has operator precedence bugs with unions and `keyof`:

```ts
string | number[]    // string OR number[] — not (string | number)[]
keyof TObject[]      // keyof of TObject[] — not (keyof TObject)[]
```

Both require parentheses to fix: `(string | number)[]`, `(keyof TObject)[]`. `Array<T>` avoids this entirely. Also better for readability (`ReadonlyArray<T>` vs `readonly T[]`).

## Detailed Reference

For full code examples and playground links, see [references/patterns.md](references/patterns.md).
