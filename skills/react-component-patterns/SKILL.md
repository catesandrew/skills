---
name: react-component-patterns
description: Guide for designing better React component APIs and structure. Use when writing or reviewing React components — especially for conditional rendering of multiple states, boolean prop flags, component composition, early returns, discriminated union props, or avoiding impossible states in component APIs.
---

# react-component-patterns

Design better React component APIs using composition, early returns, and discriminated unions instead of conditional rendering and boolean flags.

## Rule 1: Early Returns Over Conditional Rendering

When a component has multiple mutually exclusive states (loading, empty, error, data), use early returns — not inline conditionals in JSX.

### The Problem

Inline conditionals for different states create cognitive load and hide bugs:

```tsx
// BAD — hard to read, easy to introduce bugs
export function ShoppingList() {
  const { data, isPending } = useQuery(/* ... */)

  return (
    <Card>
      <CardHeading>Welcome</CardHeading>
      <CardContent>
        {data?.assignee ? <UserInfo {...data.assignee} /> : null}
        {isPending ? <Skeleton /> : null}
        {!data && !isPending ? <EmptyScreen /> : null}
        {data ? data.content.map(item => (
          <ShoppingItem key={item.id} {...item} />
        )) : null}
      </CardContent>
    </Card>
  )
}
```

### The Fix: Extract Layout + Early Returns

1. Extract shared UI into a layout component
2. Use early returns for each state

```tsx
// GOOD — each state is clear, easy to extend, better type inference
function Layout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <Card>
      <CardHeading>Welcome {title}</CardHeading>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function ShoppingList() {
  const { data, isPending } = useQuery(/* ... */)

  if (isPending) {
    return <Layout><Skeleton /></Layout>
  }

  if (!data) {
    return <Layout><EmptyScreen /></Layout>
  }

  // TypeScript knows data is defined here — no optional chaining needed
  return (
    <Layout title={data.title}>
      {data.assignee ? <UserInfo {...data.assignee} /> : null}
      {data.content.map(item => <ShoppingItem key={item.id} {...item} />)}
    </Layout>
  )
}
```

**Benefits:**
- **Reduced cognitive load** — each `if` block = one user-visible state
- **Easy to extend** — add error handling as another `if` block
- **Better type inference** — TypeScript narrows after each guard
- **Layout duplication is fine** — it helps when states diverge slightly (e.g. different titles)

### When inline conditionals are fine

Simple optional additions within a single state (e.g. optionally showing a user avatar) are fine as inline conditionals. The anti-pattern is using them for mutually exclusive states.

## Rule 2: Discriminated Unions Over Boolean Flags

Boolean props create impossible states and resist safe extension.

### The Problem

```tsx
// BAD — what does formatMetric(100, true, true) mean?
function formatMetric(value: number, isPercent: boolean, isCurrency: boolean)

// BAD — isPrimary AND isSecondary?
<Button isPrimary isSecondary />
```

Two booleans = 4 states, but only 3 are valid. Each new boolean doubles the state space. The compiler can't catch impossible combinations.

### The Fix: Use a variant/discriminator

```tsx
// GOOD — exactly 3 states, exhaustive matching catches missing cases
type MetricVariant = 'standard' | 'percent' | 'currency'

function formatMetric(value: number, variant: MetricVariant = 'standard'): string {
  switch (variant) {
    case 'percent': return `${value * 100}%`
    case 'currency': return formatCurrency(value)
    case 'standard': return String(value)
  }
}

// GOOD — one prop, clear intent
<Button variant="primary" />
```

### Why this matters

- **The first boolean invites more** — developers extend existing patterns rather than refactoring
- **Exhaustive matching** — the compiler tells you where to update when adding a variant
- **No impossible states** — a metric can't be both percent and currency
- **Readable call sites** — `variant="percent"` vs `true, false`
- **Type safety** — boolean args are easy to swap accidentally; named variants aren't

### Guideline

Resist adding the **first** boolean flag. If you start with a discriminated union, future developers will extend the union. If you start with a boolean, they'll add another boolean.
