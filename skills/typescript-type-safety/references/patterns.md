# TypeScript Type Safety Patterns — Detailed Reference

## Table of Contents

- [Optional vs Undefined](#optional-vs-undefined)
- [Safe Index Access](#safe-index-access)
- [Exhaustive Matching](#exhaustive-matching)
- [Any Containment](#any-containment)
- [Const Assertions](#const-assertions)
- [Array Type Syntax](#array-type-syntax)

---

## Optional vs Undefined

### The difference

```ts
// Optional — callers can omit entirely
declare function canFetch(networkMode?: NetworkMode): boolean
canFetch()          // valid
canFetch(undefined) // valid
canFetch('online')  // valid

// Required but potentially undefined — callers must be explicit
declare function canFetch(networkMode: NetworkMode | undefined): boolean
canFetch()          // ERROR — argument required
canFetch(undefined) // valid
canFetch('online')  // valid
```

### React props

```tsx
// Optional — <Component /> is valid (prop omitted)
function Component({ networkMode }: { networkMode?: NetworkMode })

// Required — <Component /> is ERROR, must pass networkMode
function Component({ networkMode }: { networkMode: NetworkMode | undefined })
```

### exactOptionalPropertyTypes and Partial

Without the flag, `Partial<T>` allows explicit `undefined` — dangerous with spreads:

```ts
type User = { id: number; name: string }
const user: User = { id: 23, name: 'TkDodo' }

// Without exactOptionalPropertyTypes — no error, id is now undefined!
const broken = { ...user, ...({ id: undefined } as Partial<User>) }
broken.id.toFixed() // runtime crash
```

With `exactOptionalPropertyTypes` enabled, the explicit `undefined` assignment is caught at compile time.

## Safe Index Access

### The problem

```ts
const index: Record<string, Widget> = { w1: { id: 'w1', title: 'Foo' } }
index['nonexistent'].title.toUpperCase() // no TS error, runtime crash
```

### SafeRecord

```ts
type SafeRecord<K extends string | number | symbol, V> = Record<K, V | undefined>
```

Caveat: `Object.values(safeRecord)` returns `(V | undefined)[]` even though values can't actually be undefined. Use `noUncheckedIndexedAccess` flag instead for arrays/records without this drawback.

### NonEmptyArray

```ts
type NonEmptyArray<T> = [T, ...Array<T>]

const isNonEmpty = <T,>(arr: Array<T>): arr is NonEmptyArray<T> =>
  arr.length > 0

// Forces callers to verify non-emptiness
function first(list: NonEmptyArray<string>) {
  return list[0].toUpperCase() // safe — list[0] is always string
}

const items: string[] = ['a', 'b']
// first(items)  // ERROR
if (isNonEmpty(items)) {
  first(items)   // OK — narrowed
}
```

## Exhaustive Matching

### Tagged unions + switch (no default)

```ts
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number }

const area = (shape: Shape): number => {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2
    case 'rectangle': return shape.width * shape.height
    // Adding a new Shape variant → compiler error here
  }
}
```

**Do NOT destructure the discriminator** — TypeScript can't narrow after destructuring:

```ts
// BAD — TypeScript can't narrow shape after destructuring kind
const area = ({ kind, ...shape }: Shape) => { ... }

// GOOD — access shape.kind in the switch
const area = (shape: Shape) => { switch (shape.kind) { ... } }
```

### Never guard for runtime safety

When input comes from external sources (APIs, JS code), add a default with `never`:

```tsx
const Fallback = ({ shape }: { shape: never }) => <div>Unknown shape</div>

const ShapeComponent = (props: Shape): JSX.Element => {
  switch (props.kind) {
    case 'circle': return <Circle radius={props.radius} />
    case 'rectangle': return <Rectangle width={props.width} height={props.height} />
    default: return <Fallback shape={props} />
    // Compile-time: errors if a known variant is unhandled
    // Runtime: gracefully renders fallback for unknown variants
  }
}
```

## Any Containment

### How any spreads

```ts
const x: any = 5
const y = x + 1              // any
const z = { ...x, a: 1 }     // any (even with as const)

// JSX: spreading any disables ALL prop checking
<button onClick="wrong" {...returnsAny()} />  // no error!
```

### When any appears

- Calling untyped JavaScript from TypeScript
- Libraries with weak types (`lodash.get`, etc.)
- Util functions without explicit return types that touch `any`
- `JSON.parse()` returns `any`

### Containment

1. **Use `unknown` instead** — forces narrowing:
   ```ts
   if (typeof top === 'string') { /* top is string here */ }
   ```
2. **Explicit return types** on functions that touch `any`
3. **Smallest possible scope** — assign to typed variable immediately
4. **Track type-coverage** — alert on decreases

## Const Assertions

### What `as const` does

- Strings/numbers infer as literal types (not widened)
- Arrays become readonly tuples with known length
- Objects become deeply readonly

### Type extraction from const data

```ts
const options = [
  { id: 'primary', label: 'Primary' },
  { id: 'secondary', label: 'Secondary' },
] as const

// Extract union type from the data
type Variant = (typeof options)[number]['id']  // 'primary' | 'secondary'
```

### Enforce readonly with a guard type

```ts
type EnsureReadonlyArray<T> = T extends Array<any>
  ? never  // mutable array → never (forgot as const)
  : T extends ReadonlyArray<any>
  ? T
  : never

type ExtractValue<
  T extends ReadonlyArray<any>,
  K extends keyof T[number]
> = EnsureReadonlyArray<T>[number][K]

type Variant = ExtractValue<typeof options, 'id'>
// If you forget `as const`, Variant is `never` — caught immediately
```

### Prefer readonly params

```ts
// GOOD — accepts both mutable and readonly inputs
function first(items: ReadonlyArray<string>): string

// BAD — rejects readonly/as const inputs
function first(items: Array<string>): string
```

Library authors: make all function inputs `readonly`.

## Array Type Syntax

### Union precedence bug

```ts
string | number[]      // string OR number[] — NOT (string | number)[]
(string | number)[]    // correct with parens
Array<string | number> // correct without parens
```

### keyof precedence bug

```ts
keyof TObject[]        // keyof of TObject[] — nonsensical
(keyof TObject)[]      // correct with parens
Array<keyof TObject>   // correct without parens
```

### readonly inconsistency

```ts
readonly string[]      // works but splits readonly from []
ReadonlyArray<string>  // cleaner — single unit
```

`Array<T>` is strictly better: no precedence issues, consistent `ReadonlyArray<T>`, reads left-to-right ("Array of strings" not "strings array").
