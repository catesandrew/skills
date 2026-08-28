---
name: nuqs-url-state
description: Implement type-safe URL state management with nuqs for Next.js applications. Use when adding shareable/bookmarkable state to components, managing filters/search/pagination in URLs, or replacing useState with URL-backed state. Trigger on mentions of "nuqs", "URL state", "query params", "shareable links", "bookmark state", or when discussing replacing local state with URL state.
---

# nuqs URL State Management

This skill guides you through implementing type-safe, shareable URL state management using nuqs in Next.js applications.

## What is nuqs?

`nuqs` (Next.js URL Search Params State) is a library that:
- Makes URL query parameters **strongly typed**
- Keeps state **shareable** (copy URL = copy state)
- Makes state **reload-safe** (refresh page = keep state)
- Works on both **client and server**
- Provides **type-safe parsers** for common patterns

## When to Use This

Use nuqs when you need:
- Filters, search, sorting, or pagination that survives page refresh
- Shareable links that capture current view state
- Bookmarkable application states
- URL-backed state instead of `useState`
- Server and client components to share the same state definition

## Core Concepts

### 1. Parsers Define the Contract

Parsers are the single source of truth for what query params exist and their types:

```ts
import { parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs'

// Each parser defines: name, type, default value
const searchParams = {
  q: parseAsString.withDefault(''),           // ?q=hello
  page: parseAsInteger.withDefault(1),        // ?page=2
  status: parseAsArrayOf(parseAsString),      // ?status=active&status=pending
}
```

### 2. Client Usage with Hooks

```tsx
'use client'

import { useQueryState, useQueryStates } from 'nuqs'

function SearchComponent() {
  // Single param
  const [search, setSearch] = useQueryState('q', parseAsString)
  
  // Multiple params
  const [{ page, status }, setParams] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    status: parseAsArrayOf(parseAsString)
  })
  
  return (
    <div>
      <input 
        value={search ?? ''} 
        onChange={(e) => setSearch(e.target.value)} 
      />
      <button onClick={() => setParams({ page: 1, status: ['active'] })}>
        Filter
      </button>
    </div>
  )
}
```

### 3. Server Usage with Cache

```ts
// searchParams.ts
import { createSearchParamsCache } from 'nuqs/server'
import { parseAsString, parseAsInteger } from 'nuqs'

export const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1)
})
```

```tsx
// page.tsx (Server Component)
import { searchParamsCache } from './searchParams'

export default function Page({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const { q, page } = searchParamsCache.parse(searchParams)
  
  // Use parsed, typed values
  const results = await fetchResults(q, page)
  
  return <div>...</div>
}
```

## Implementation Guide

### Step 1: Define Parser Registry

Create a file that defines all your URL parameters:

**Location**: `<ComponentPath>/searchParams.ts`

```ts
import { parseAsString, parseAsInteger, parseAsArrayOf, parseAsStringEnum } from 'nuqs'
import { createSearchParamsCache } from 'nuqs/server'

// Define all parsers
export const myComponentSearchParams = {
  // Text search
  q: parseAsString.withDefault(''),
  
  // Pagination (1-indexed in URL, easier for users)
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  
  // Enum values
  sortBy: parseAsStringEnum(['name', 'date', 'price']).withDefault('name'),
  sortOrder: parseAsStringEnum(['asc', 'desc']).withDefault('asc'),
  
  // Arrays (for multi-select filters)
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString),
  
  // Boolean flags
  showArchived: parseAsBoolean.withDefault(false)
}

// Server-side cache
export const myComponentSearchParamsCache = createSearchParamsCache(myComponentSearchParams)

// Type export for components
export type MyComponentSearchParams = typeof myComponentSearchParams
```

### Step 2: Use in Client Components

```tsx
'use client'

import { useQueryState, useQueryStates } from 'nuqs'
import { myComponentSearchParams } from './searchParams'

export function MyComponent() {
  // Single state
  const [search, setSearch] = useQueryState('q', myComponentSearchParams.q)
  
  // Multiple states
  const [filters, setFilters] = useQueryStates({
    categories: myComponentSearchParams.categories,
    tags: myComponentSearchParams.tags
  })
  
  // Update single param
  const handleSearch = (value: string) => {
    setSearch(value)
  }
  
  // Update multiple params atomically
  const handleFilterChange = () => {
    setFilters({
      categories: ['electronics'],
      tags: ['new', 'sale']
    })
  }
  
  return (
    <div>
      <input value={search ?? ''} onChange={(e) => handleSearch(e.target.value)} />
      <button onClick={handleFilterChange}>Apply Filters</button>
    </div>
  )
}
```

### Step 3: Use in Server Components

```tsx
// page.tsx
import { myComponentSearchParamsCache } from './searchParams'

interface PageProps {
  searchParams: Record<string, string | string[]>
}

export default function Page({ searchParams }: PageProps) {
  // Parse and validate
  const { q, page, categories } = myComponentSearchParamsCache.parse(searchParams)
  
  // All values are now typed and have defaults
  const results = await fetchData({
    search: q,
    page,
    categories
  })
  
  return <div>Found {results.length} items for "{q}"</div>
}
```

### Step 4: Build Links with Serializers

```ts
import { createSerializer } from 'nuqs'
import { myComponentSearchParams } from './searchParams'

const serialize = createSerializer(myComponentSearchParams)

// Build URL with new params
const url = serialize('/products', {
  q: 'laptop',
  page: 2,
  categories: ['electronics', 'computers']
})
// Result: /products?q=laptop&page=2&categories=electronics&categories=computers

// Use in Link components
<Link href={serialize('/products', { q: 'laptop' })}>
  Search Laptops
</Link>
```

## Common Patterns

### Pagination State

```ts
export const paginationParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20)
}

// Usage
const [{ page, perPage }, setPagination] = useQueryStates(paginationParams)

const handlePageChange = (newPage: number) => {
  setPagination({ page: newPage })
}
```

### Sorting State

```ts
export const sortParams = {
  sortBy: parseAsStringEnum(['name', 'date', 'price']).withDefault('name'),
  sortOrder: parseAsStringEnum(['asc', 'desc']).withDefault('asc')
}

// Usage
const [{ sortBy, sortOrder }, setSort] = useQueryStates(sortParams)

const toggleSort = (column: string) => {
  setSort({
    sortBy: column,
    sortOrder: sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc'
  })
}
```

### Filter State

```ts
export const filterParams = {
  status: parseAsArrayOf(parseAsString),
  category: parseAsString,
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger
}

// Usage
const [filters, setFilters] = useQueryStates(filterParams)

const clearFilters = () => {
  setFilters({
    status: null,
    category: null,
    minPrice: null,
    maxPrice: null
  })
}
```

### Search with Debouncing

```tsx
import { useQueryState } from 'nuqs'
import { useDebouncedCallback } from 'use-debounce'

function SearchInput() {
  const [search, setSearch] = useQueryState('q', parseAsString)
  
  const debouncedSearch = useDebouncedCallback(
    (value: string) => setSearch(value),
    300
  )
  
  return (
    <input
      defaultValue={search ?? ''}
      onChange={(e) => debouncedSearch(e.target.value)}
    />
  )
}
```

## Advanced Patterns

### Custom Parsers

Create reusable parsers for domain-specific types:

```ts
import { createParser } from 'nuqs'

// Date range parser
const dateRangeParser = createParser({
  parse: (value: string) => {
    const [start, end] = value.split(',')
    return { start: new Date(start), end: new Date(end) }
  },
  serialize: (value: { start: Date; end: Date }) => {
    return `${value.start.toISOString()},${value.end.toISOString()}`
  }
})

// Usage
const [dateRange, setDateRange] = useQueryState('dates', dateRangeParser)
```

### Coordinated State Updates

Reset related params when one changes:

```ts
function useCoordinatedFilters() {
  const [search, setSearch] = useQueryState('q', parseAsString)
  const [page, setPage] = useQueryState('page', parseAsInteger)
  const [filters, setFilters] = useQueryStates({
    category: parseAsString,
    status: parseAsArrayOf(parseAsString)
  })
  
  // Search resets filters and page
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
    setFilters({ category: null, status: null })
  }, [setSearch, setPage, setFilters])
  
  // Filter change resets page
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
    setPage(1)
  }, [setFilters, setPage])
  
  return {
    search,
    page,
    filters,
    handleSearchChange,
    handleFilterChange
  }
}
```

### Shallow Routing

Prevent full page re-renders:

```tsx
const [search, setSearch] = useQueryState('q', {
  ...parseAsString,
  shallow: true  // Don't trigger server component re-render
})
```

## Best Practices

### 1. Co-locate Parser Definitions

Keep parser registry with the component that uses it:

```
components/
  ProductList/
    ProductList.tsx
    searchParams.ts      # Parser registry here
    useProductFilters.ts # Hook using the parsers
```

### 2. Use Semantic Param Names

```ts
// Good
{ q: '', page: 1, sortBy: 'name' }

// Bad
{ search: '', p: 1, sort: 'name' }
```

### 3. Provide Defaults

Always provide defaults to avoid null checks:

```ts
// Good
parseAsString.withDefault('')
parseAsInteger.withDefault(1)

// Requires null checks everywhere
parseAsString  // Can be null
```

### 4. Type Exports

Export types for use in other components:

```ts
export type SearchParams = ReturnType<typeof searchParamsCache.parse>
```

### 5. Server + Client Symmetry

Use the same parser registry on both server and client:

```ts
// searchParams.ts - shared
export const searchParams = { ... }

// client.tsx
import { searchParams } from './searchParams'
useQueryState('q', searchParams.q)

// page.tsx (server)
import { searchParamsCache } from './searchParams'
searchParamsCache.parse(searchParams)
```

## Migration from useState

### Before (useState)

```tsx
function ProductList() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ category: '', status: [] })
  
  // State lost on refresh
  // Can't share via URL
  // Not bookmarkable
}
```

### After (nuqs)

```tsx
function ProductList() {
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [filters, setFilters] = useQueryStates({
    category: parseAsString.withDefault(''),
    status: parseAsArrayOf(parseAsString).withDefault([])
  })
  
  // State survives refresh
  // Shareable via URL
  // Bookmarkable
}
```

## Troubleshooting

### Issue: "Hydration mismatch"

**Cause**: Server renders with default values, client has different URL params.

**Solution**: Use `createSearchParamsCache` on server to parse searchParams:

```tsx
// Server component
const { q } = searchParamsCache.parse(searchParams)
```

### Issue: "State not updating"

**Cause**: Not using parser correctly or shallow routing prevents re-render.

**Solution**: 
- Verify parser is passed to hook
- Remove `shallow: true` if you need re-renders
- Check that `NuqsAdapter` is in layout

### Issue: "Can't use in Server Component"

**Cause**: `useQueryState` is a client hook.

**Solution**: Use `createSearchParamsCache` for server components.

## Checklist

After implementation, verify:

- [ ] Parser registry defined with all params
- [ ] All parsers have `.withDefault()` or handle null
- [ ] Server components use `searchParamsCache.parse()`
- [ ] Client components use `useQueryState` / `useQueryStates`
- [ ] Link building uses `createSerializer`
- [ ] Param names are semantic and concise
- [ ] Reset logic is coordinated (search clears filters, etc.)
- [ ] State survives page refresh
- [ ] URLs are shareable and bookmarkable

## Key Takeaways

1. **Parsers are the contract** - Define once, use everywhere
2. **Always use defaults** - Avoid null checks and undefined states
3. **Server + Client** - Use same parsers on both sides
4. **Coordinate updates** - Reset dependent state (page on filter change)
5. **Type-safe** - Let TypeScript catch param name typos

By using nuqs, you get URL state that is:
- Type-safe
- Shareable
- Bookmarkable
- Reload-safe
- Server and client compatible
