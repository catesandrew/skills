---
name: graph-react-deps
description: Use when you need a Mermaid component dependency graph for a Next.js or React page — traces JSX usage, render props, and compound components recursively from a page entry point.
---

# graph-react-deps

Build a directed component usage graph from a React/Next.js page file. Produces a Mermaid flowchart you can paste directly into docs or a wiki. Fast mode — prioritizes coverage over readability; for a cleaner graph use `graph-react-render-tree`.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:startFile}` | Absolute path to the page entry file | `/repo/src/app/dashboard/page.tsx` |
| `${input:tsconfigFile}` | Absolute path to tsconfig (for path alias resolution) | `/repo/tsconfig.base.json` |
| `${input:repoRoot}` | Absolute path to repo root (optional) | `/repo` |
| `${input:depthLimit}` | Max recursion depth (optional, default: 4) | `3` |
| `${input:stopPackages}` | Comma-separated import prefixes to stop at (optional) | `@repo/ui,next/,react/` |

## Traversal Rules

1. **Parse** the start file and resolve all imports:
   - Relative imports (`./`, `../`)
   - TypeScript path aliases from `${input:tsconfigFile}` `paths` field
2. **Identify React components** in the file:
   - JSX tags in the returned tree
   - Components passed as props (render props, `as`, `component`)
   - Components imported and re-exported then used
3. **Recursively traverse** into each local component file (depth limit: `${input:depthLimit}`).
4. **Stop traversal when:**
   - Import matches a prefix in `${input:stopPackages}`
   - Import resolves to `node_modules`
   - Framework internals: `next/*`, `react/*`, `react-dom/*`
   - Depth limit reached
   - Import is type-only (`import type`)
5. **Label nodes** by component name (PascalCase); use filename if no named export.
6. **Barrel files** (`index.ts`): resolve through to the actual definition file.
7. **Primitive HTML tags** (`div`, `span`, etc.): ignore.

## Output

### 1. Mermaid flowchart
```
flowchart TD
  A["page.tsx"] --> B["ComponentA"]
  B --> C["ComponentB"]
  C --> D["@repo/ui/Button (external)"]
```

Use `["..."]` label syntax for special characters in names.

### 2. Legend
Explain conventions used (e.g., external packages shown as terminals, depth limit applied).

### 3. Unresolved imports
List any imports that could not be resolved, with their paths and the reason (missing file, opaque barrel, external package not in stoplist).

## Notes
- Path aliases must be resolved using `compilerOptions.paths` from `${input:tsconfigFile}`. If `paths` uses `/*` suffix, strip it and match the prefix.
- Monorepos: if `${input:repoRoot}` is provided, resolve workspace package imports relative to it.
- If a component is used in multiple files, it still appears as one node in the graph.

## Common Mistakes
- **Not providing tsconfig** — relative imports work fine, but `@/components/…` aliases will fail to resolve.
- **Depth too high** — a depth of 6+ generates unwieldy graphs; start with 3–4 and increase if needed.
- **Not stopping at design system packages** — add them to `${input:stopPackages}` to keep the graph focused on app-layer components.
